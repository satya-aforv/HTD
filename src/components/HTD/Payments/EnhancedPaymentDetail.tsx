import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaEdit, 
  FaArrowLeft, 
  FaDownload, 
  FaCalendarAlt, 
  FaUser, 
  FaMoneyBillWave, 
  FaFileAlt, 
  FaExclamationTriangle,
  FaFilePdf,
  FaPrint,
  FaSyncAlt
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { paymentAPI, Payment } from '../../../services/paymentAPI';
import LoadingSpinner from '../../Common/LoadingSpinner';
import ErrorBoundary from '../../Common/ErrorBoundary';
import { format } from 'date-fns';

interface PaymentDetailProps {
  enablePrint?: boolean;
}

/**
 * Enhanced Payment Detail Component with robust error handling and offline support
 */
const EnhancedPaymentDetail: React.FC<PaymentDetailProps> = ({ enablePrint = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // State management
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [retryCount, setRetryCount] = useState<number>(0);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if an error is retryable
  const isRetryableError = useCallback((error: unknown): boolean => {
    if (!(error instanceof Error)) return false;
    
    // Network errors are retryable
    if (error.message.includes('Network request failed') || 
        error.message.includes('Failed to fetch')) {
      return true;
    }
    
    // Timeout errors are retryable
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return true;
    }
    
    // 5xx server errors are retryable
    if ('status' in error && 
        typeof (error as any).status === 'number' && 
        (error as any).status >= 500) {
      return true;
    }
    
    return false;
  }, []);

  // Format date with error handling
  const formatDate = useCallback((dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  }, []);

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }, []);

  // Fetch payment data with retry logic
  const fetchPayment = useCallback(async () => {
    if (!id) {
      setError('Invalid payment ID');
      setLoading(false);
      return;
    }

    // Clear any existing retry timer
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Check online status
      if (!navigator.onLine) {
        throw new Error('You are currently offline. Please check your internet connection.');
      }

      const data = await paymentAPI.getPayment(id);
      
      if (!data) {
        throw new Error('Payment not found');
      }
      
      setPayment(data);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error fetching payment details:', error);
      
      // Only show error toast for non-retryable errors
      if (!isRetryableError(error)) {
        toast.error(`Error: ${errorMessage}`);
      }
      
      // Handle retry logic for retryable errors
      if (isRetryableError(error) && retryCount < 3) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff with max 10s
        setRetryCount(prev => prev + 1);
        
        retryTimerRef.current = setTimeout(() => {
          fetchPayment();
        }, delay);
        
        setError(`Connection issue. Retrying in ${delay/1000} seconds... (${retryCount + 1}/3)`);
      } else {
        setError(`Failed to load payment details: ${errorMessage}`);
        if (retryCount >= 3) {
          toast.error('Maximum retry attempts reached. Please try again later.');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [id, retryCount, isRetryableError]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // If we were offline and there was an error, retry the request
      if (error?.includes('offline') || error?.includes('Connection issue')) {
        fetchPayment();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setError('You are currently offline. Please check your internet connection.');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial fetch
    fetchPayment();
    
    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, [fetchPayment]);

  // Handle print functionality
  const handlePrint = useCallback(() => {
    setIsPrinting(true);
    window.print();
  }, []);

  // Reset printing state after print dialog closes
  useEffect(() => {
    const handleAfterPrint = () => setIsPrinting(false);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  // Handle receipt generation
  const handleGenerateReceipt = useCallback(async () => {
    if (!id) return;
    
    try {
      toast.loading('Generating receipt...');
      const blob = await paymentAPI.generateReceipt(id);
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payment-receipt-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.dismiss();
      toast.success('Receipt generated successfully');
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast.dismiss();
      toast.error('Failed to generate receipt. Please try again.');
    }
  }, [id]);

  // Get status badge class based on payment status
  const getStatusBadgeClass = useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // Loading state
  const renderLoadingState = () => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LoadingSpinner size="lg" />
    </div>
  );

  // Error state
  const renderErrorState = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6"
    >
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <FaExclamationTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              {error || 'Payment not found'}
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error?.includes('offline') 
                ? 'You are currently offline. Please check your internet connection.'
                : 'The requested payment could not be loaded.'}
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => navigate('/htd/payments')}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Back to Payments
              </button>
              {(error?.includes('Connection issue') || error?.includes('offline')) && (
                <button
                  type="button"
                  onClick={() => {
                    setRetryCount(0);
                    fetchPayment();
                  }}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <FaSyncAlt className="animate-spin mr-2" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <FaSyncAlt className="mr-2" />
                      Retry Now
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Main render
  if (loading && !payment) return renderLoadingState();
  if (error || !payment) return renderErrorState();

  return (
    <ErrorBoundary>
      <div className={`p-6 print:p-0 ${isPrinting ? 'print-mode' : ''}`}>
        <AnimatePresence>
          {!enablePrint && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-center mb-6 print:hidden"
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/htd/payments')}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full transition-colors duration-200"
                  aria-label="Back to payments"
                >
                  <FaArrowLeft />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">
                  Payment Details
                </h1>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateReceipt}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center gap-2 transition-colors duration-200"
                  disabled={loading}
                >
                  <FaFilePdf /> Generate PDF
                </button>
                <button
                  onClick={handlePrint}
                  className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md flex items-center gap-2 transition-colors duration-200"
                  disabled={loading}
                >
                  <FaPrint /> Print
                </button>
                <button
                  onClick={() => navigate(`/htd/payments/${id}/edit`)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md flex items-center gap-2 transition-colors duration-200"
                  disabled={loading}
                >
                  <FaEdit /> Edit
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Payment Details Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Payment #{payment._id}
              </h2>
              <div className="flex items-center mt-2 text-gray-600">
                <FaCalendarAlt className="mr-2" />
                <span>{formatDate(payment.paymentDate)}</span>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(payment.status)}`}>
                {payment.status}
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Details</h3>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Amount</dt>
                  <dd className="font-medium">{formatCurrency(payment.amount)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Payment Method</dt>
                  <dd className="font-medium capitalize">{payment.paymentMode}</dd>
                </div>
                {payment.transactionId && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Transaction ID</dt>
                    <dd className="font-mono text-sm">{payment.transactionId}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Recipient</h3>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                  <FaUser />
                </div>
                <div>
                  <div className="font-medium">{payment.candidateId?.name || 'N/A'}</div>
                  <div className="text-sm text-gray-500">
                    {payment.candidateId?.email || ''}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {payment.description && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Notes</h3>
              <p className="text-gray-600">{payment.description}</p>
            </div>
          )}
        </div>

        {/* Bank Details */}
        {payment.bankDetails && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bank Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Account Holder</p>
                <p className="font-medium">{payment.bankDetails.accountName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Account Number</p>
                <p className="font-mono">{payment.bankDetails.accountNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bank Name</p>
                <p className="font-medium">{payment.bankDetails.bankName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">IFSC Code</p>
                <p className="font-mono">{payment.bankDetails.ifscCode}</p>
              </div>
            </div>
          </div>
        )}

        {/* Related Documents */}
        {payment.proofUrl && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Attachments</h3>
            <div className="flex items-center p-3 border border-gray-200 rounded-md">
              <div className="p-2 bg-blue-50 rounded-md text-blue-600 mr-3">
                <FaFileAlt className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  Payment Proof
                </p>
                <p className="text-sm text-gray-500">
                  {payment.proofUrl.split('/').pop()}
                </p>
              </div>
              <a
                href={payment.proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-4 flex-shrink-0 text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                View
              </a>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

// Add display name for better debugging
EnhancedPaymentDetail.displayName = 'EnhancedPaymentDetail';

export default React.memo(EnhancedPaymentDetail);
