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
  FaPrint
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

const PaymentDetail: React.FC<PaymentDetailProps> = ({ enablePrint = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);



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

  const renderLoadingState = () => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LoadingSpinner size="lg" />
    </div>
  );

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
              <p>The requested payment could not be found or you don't have permission to view it.</p>
              {offline ? (
                <p>You are currently offline. Please check your internet connection and try again.</p>
              ) : (
                <p>An error occurred while fetching payment data. Please try again.</p>
              )}
              {retryCount.current < 3 && (
                <button
                  type="button"
                  onClick={() => {
                    retryCount.current++;
                    fetchPaymentData();
                  }}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Retry
                </button>
              )}
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => navigate('/htd/payments')}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Back to Payments
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );


  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getStatusBadgeClass = (status: string) => {
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
  };

  const getPaymentTypeBadgeClass = (type: string) => {
    switch (type.toLowerCase()) {
      case 'stipend':
        return 'bg-purple-100 text-purple-800';
      case 'salary':
        return 'bg-blue-100 text-blue-800';
      case 'bonus':
        return 'bg-green-100 text-green-800';
      case 'reimbursement':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleGenerateReceipt = async () => {
    try {
      toast.loading('Generating payment receipt...');
      const blob = await paymentAPI.generateReceipt(id as string);
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payment-receipt-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.dismiss();
      toast.success('Payment receipt generated successfully');
    } catch (error) {
      toast.dismiss();
      console.error('Error generating payment receipt:', error);
      toast.error('Failed to generate payment receipt');
    }
  };


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

      {/* Payment Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Payment to {payment.candidateId.name}
            </h2>
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <FaCalendarAlt />
              <span>Payment Date: {formatDate(payment.paymentDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <FaUser />
              <span>{payment.candidateId.email}</span>
              {payment.candidateId.phone && (
                <>
                  <span className="text-gray-400">|</span>
                  <span>{payment.candidateId.phone}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentTypeBadgeClass(payment.type)}`}>
                {payment.type}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(payment.status)}`}>
                {payment.status}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-800">
              ${payment.amount.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">
              {payment.month} {payment.year}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Payment Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
            <FaMoneyBillWave className="text-green-500" /> Payment Information
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Payment Type</div>
                <div className="font-medium">{payment.type}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Amount</div>
                <div className="font-medium">${payment.amount.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Payment Date</div>
                <div className="font-medium">{formatDate(payment.paymentDate)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Status</div>
                <div className="font-medium">{payment.status}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Payment Mode</div>
                <div className="font-medium">{payment.paymentMode.replace('_', ' ')}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Transaction ID</div>
                <div className="font-medium">{payment.transactionId || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Month/Year</div>
                <div className="font-medium">{payment.month} {payment.year}</div>
              </div>
              {payment.processor && (
                <div>
                  <div className="text-sm text-gray-500">Processed By</div>
                  <div className="font-medium">{payment.processor}</div>
                </div>
              )}
            </div>

            {payment.relatedTraining && (
              <div>
                <div className="text-sm text-gray-500">Related Training</div>
                <div className="font-medium">{payment.relatedTraining.description}</div>
              </div>
            )}

            {payment.description && (
              <div>
                <div className="text-sm text-gray-500">Description</div>
                <div className="font-medium">{payment.description}</div>
              </div>
            )}
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
            <FaFileAlt className="text-blue-500" /> Bank Details
          </h3>
          {payment.bankDetails && (payment.bankDetails.accountName || payment.bankDetails.accountNumber || payment.bankDetails.bankName || payment.bankDetails.ifscCode) ? (
                <div className="space-y-4">
                  {payment.bankDetails.accountName && (
                    <div>
                      <div className="text-sm text-gray-500">Account Name</div>
                      <div className="font-medium">{payment.bankDetails.accountName}</div>
                    </div>
                  )}
                  {payment.bankDetails.accountNumber && (
                    <div>
                      <div className="text-sm text-gray-500">Account Number</div>
                      <div className="font-medium">{payment.bankDetails.accountNumber}</div>
                    </div>
                  )}
                  {payment.bankDetails.bankName && (
                    <div>
                      <div className="text-sm text-gray-500">Bank Name</div>
                      <div className="font-medium">{payment.bankDetails.bankName}</div>
                    </div>
                  )}
                  {payment.bankDetails.ifscCode && (
                    <div>
                      <div className="text-sm text-gray-500">IFSC Code</div>
                      <div className="font-medium">{payment.bankDetails.ifscCode}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500">No bank details provided</div>
              )}

            {/* Payment Proof */}
            <div className="mt-6">
            <h4 className="text-md font-medium text-gray-700 mb-2">Payment Proof</h4>
            {payment.proofUrl ? (
              <div>
                <a
                  href={payment.proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  {payment.proofUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                    <img
                      src={payment.proofUrl}
                      alt="Payment proof"
                      className="h-32 object-contain border rounded-md hover:opacity-80 transition-opacity"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
                      <FaFileAlt /> View Document
                    </div>
                  )}
                </a>
              </div>
            ) : (
              <div className="text-gray-500">No payment proof uploaded</div>
            )}
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex justify-between text-sm text-gray-500">
          <div>Created: {formatDate(payment.createdAt)}</div>
          <div>Last Updated: {formatDate(payment.updatedAt)}</div>
        </div>
      </div>
    </div>
  );
};

// Add display name for better debugging
PaymentDetail.displayName = 'PaymentDetail';

export default React.memo(PaymentDetail);