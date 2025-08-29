import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSave, FaArrowLeft, FaUpload, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { paymentAPI, PaymentFormData } from '../../../services/paymentAPI';
import htdAPI, { Candidate, Training } from '../../../services/htdAPI';


interface Payment extends PaymentFormData {
  _id?: string;
  candidateId: string;
  amount: number;
  type: string;
  paymentDate: string;
  paymentMode: string;
  transactionId: string;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
  };
  description: string;
  status: string;
  proofUrl?: string;
  processor?: string;
  relatedTraining?: string;
  month: string;
  year: number;
}


const PaymentForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');
  
  const initialPaymentState = useMemo((): Payment => ({
    candidateId: '',
    amount: 0,
    type: 'stipend',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'bank_transfer',
    transactionId: '',
    bankDetails: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      ifscCode: ''
    },
    description: '',
    status: 'pending',
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear(),
    proofUrl: '',
    processor: '',
    relatedTraining: ''
  }), []);

  const [payment, setPayment] = useState<Payment>(initialPaymentState);
  
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const fetchPaymentDetails = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getPayment(id as string);
      const paymentData = response;

      const formattedPayment: Payment = {
        ...initialPaymentState,
        _id: paymentData._id,
        candidateId: typeof paymentData.candidateId === 'object' && paymentData.candidateId !== null ? paymentData.candidateId._id : paymentData.candidateId,
        amount: paymentData.amount,
        type: paymentData.type,
        paymentDate: paymentData.paymentDate ? new Date(paymentData.paymentDate).toISOString().split('T')[0] : '',
        paymentMode: paymentData.paymentMode,
        transactionId: paymentData.transactionId,
        bankDetails: paymentData.bankDetails || initialPaymentState.bankDetails,
        description: paymentData.description,
        status: paymentData.status,
        proofUrl: paymentData.proofUrl,
        processor: paymentData.processor,
        relatedTraining: typeof paymentData.relatedTraining === 'object' && paymentData.relatedTraining !== null ? paymentData.relatedTraining._id : paymentData.relatedTraining,
        month: paymentData.month,
        year: paymentData.year,
      };

      setPayment(formattedPayment);

      if (paymentData.candidateId) {
        const candidateId = typeof paymentData.candidateId === 'object' && paymentData.candidateId !== null ? paymentData.candidateId._id : paymentData.candidateId;
        setSelectedCandidate(candidateId);
      }

      if (paymentData.proofUrl) {
        setPreviewUrl(paymentData.proofUrl);
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      toast.error('Failed to fetch payment details');
      navigate('/htd/payments');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, initialPaymentState]);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await htdAPI.getCandidates({});
        setCandidates(response.candidates);
      } catch (error) {
        console.error('Error fetching candidates:', error);
        toast.error('Failed to fetch candidates');
      }
    };

    fetchCandidates();

    if (isEditMode) {
      fetchPaymentDetails();
    }
  }, [isEditMode, fetchPaymentDetails]);

  useEffect(() => {
    if (selectedCandidate) {
      fetchCandidateTrainings(selectedCandidate);
    } else {
      setTrainings([]);
    }
  }, [selectedCandidate]);


  const fetchCandidateTrainings = async (candidateId: string) => {
    try {
      const response = await htdAPI.getTrainings({ search: candidateId, sortField: 'title', sortDirection: 'asc' });
      setTrainings(response.trainings);
    } catch (error) {
      console.error('Error fetching candidate trainings:', error);
      setTrainings([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setPayment(prev => {
        const parentState = prev[parent as keyof typeof prev];
        return {
          ...prev,
          [parent]: {
            ...(typeof parentState === 'object' && parentState !== null ? parentState : {}),
            [child]: value,
          },
        };
      });
    } else {
      setPayment(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCandidateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const candidateId = e.target.value;
    setSelectedCandidate(candidateId);
    setPayment(prev => ({
      ...prev,
      candidateId,
      relatedTraining: ''
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProofFile(file);
      
      // Create a preview URL
      const fileReader = new FileReader();
      fileReader.onload = () => {
        if (fileReader.readyState === 2) {
          setPreviewUrl(fileReader.result as string);
        }
      };
      fileReader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setProofFile(null);
    setPreviewUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      // Create a copy of payment data without spreading
      const paymentData = JSON.parse(JSON.stringify(payment));
      
      // Handle payment creation or update
      const response = isEditMode
        ? await paymentAPI.updatePayment(id as string, paymentData)
        : await paymentAPI.createPayment(paymentData);
      
      const paymentId = isEditMode ? id : response._id;
      
      // Handle file upload if a file is selected
      if (proofFile) {
        const formData = new FormData();
        formData.append('proof', proofFile);
        
        await paymentAPI.uploadProof(paymentId as string, formData);
      }
      
      toast.success(`Payment ${isEditMode ? 'updated' : 'created'} successfully`);
      navigate('/htd/payments');
    } catch (error) {
      console.error('Error saving payment:', error);
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} payment`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/htd/payments')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditMode ? 'Edit Payment' : 'Create Payment'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Candidate Selection */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Candidate *</label>
            <select
              name="candidateId"
              value={payment.candidateId}
              onChange={handleCandidateChange}
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isEditMode}
            >
              <option value="">Select Candidate</option>
              {candidates.map((candidate) => (
                <option key={candidate._id} value={candidate._id}>
                  {candidate.name} ({candidate.email})
                </option>
              ))}
            </select>
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type *</label>
            <select
              name="type"
              value={payment.type}
              onChange={handleInputChange}
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="stipend">Stipend</option>
              <option value="salary">Salary</option>
              <option value="bonus">Bonus</option>
              <option value="reimbursement">Reimbursement</option>
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($) *</label>
            <input
              type="number"
              name="amount"
              value={payment.amount}
              onChange={handleInputChange}
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="0"
              step="0.01"
            />
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
            <input
              type="date"
              name="paymentDate"
              value={payment.paymentDate}
              onChange={handleInputChange}
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
            <select
              name="paymentMode"
              value={payment.paymentMode}
              onChange={handleInputChange}
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="check">Check</option>
              <option value="cash">Cash</option>
              <option value="paypal">PayPal</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Transaction ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
            <input
              type="text"
              name="transactionId"
              value={payment.transactionId}
              onChange={handleInputChange}
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Transaction reference number"
            />
          </div>

          {/* Month */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month *</label>
            <select
              name="month"
              value={payment.month}
              onChange={handleInputChange}
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="January">January</option>
              <option value="February">February</option>
              <option value="March">March</option>
              <option value="April">April</option>
              <option value="May">May</option>
              <option value="June">June</option>
              <option value="July">July</option>
              <option value="August">August</option>
              <option value="September">September</option>
              <option value="October">October</option>
              <option value="November">November</option>
              <option value="December">December</option>
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
            <select
              name="year"
              value={payment.year}
              onChange={handleInputChange}
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
            <select
              name="status"
              value={payment.status}
              onChange={handleInputChange}
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Related Training */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Related Training</label>
            <select
              name="relatedTraining"
              value={payment.relatedTraining || ''}
              onChange={handleInputChange}
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!selectedCandidate}
            >
              <option value="">None</option>
              {trainings.map((training) => (
                <option key={training._id} value={training._id}>
                  {training.description ? `${training.description} (${training.status})` : `Training ID: ${training._id} (${training.status})`}
                </option>
              ))}
            </select>
          </div>

          {/* Processor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Processor</label>
            <input
              type="text"
              name="processor"
              value={payment.processor || ''}
              onChange={handleInputChange}
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Name of person processing the payment"
            />
          </div>
        </div>

        {/* Bank Details */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
              <input
                type="text"
                name="bankDetails.accountName"
                value={payment.bankDetails?.accountName || ''}
                onChange={handleInputChange}
                className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
              <input
                type="text"
                name="bankDetails.accountNumber"
                value={payment.bankDetails?.accountNumber || ''}
                onChange={handleInputChange}
                className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
              <input
                type="text"
                name="bankDetails.bankName"
                value={payment.bankDetails?.bankName || ''}
                onChange={handleInputChange}
                className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
              <input
                type="text"
                name="bankDetails.ifscCode"
                value={payment.bankDetails?.ifscCode || ''}
                onChange={handleInputChange}
                className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={payment.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Additional details about this payment"
          ></textarea>
        </div>

        {/* Payment Proof Upload */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Proof</label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
              <FaUpload className="mr-2" />
              {proofFile ? 'Change File' : 'Upload File'}
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*,.pdf"
                className="hidden"
              />
            </label>
            {(proofFile || previewUrl) && (
              <button
                type="button"
                onClick={handleRemoveFile}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FaTrash className="mr-2" /> Remove
              </button>
            )}
          </div>
          {proofFile && (
            <div className="mt-2 text-sm text-gray-500">
              {proofFile.name} ({Math.round(proofFile.size / 1024)} KB)
            </div>
          )}
          {previewUrl && (
            <div className="mt-4">
              {previewUrl.includes('data:image') ? (
                <img
                  src={previewUrl}
                  alt="Payment proof"
                  className="h-32 object-contain border rounded-md"
                />
              ) : (
                <div className="p-4 border rounded-md bg-gray-50 text-gray-700">
                  Document preview not available
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/htd/payments')}
            className="mr-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <FaSave className="mr-2" /> {isEditMode ? 'Update' : 'Save'} Payment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;