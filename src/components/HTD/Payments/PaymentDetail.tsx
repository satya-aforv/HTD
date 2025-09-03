import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaEdit,
  FaArrowLeft,
  FaCalendarAlt,
  FaUser,
  FaMoneyBillWave,
  FaFileAlt,
  FaFilePdf,
  FaPrint,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { paymentAPI, Payment } from "../../../services/paymentAPI";
import LoadingSpinner from "../../Common/LoadingSpinner";
import ErrorBoundary from "../../Common/ErrorBoundary";
import { format } from "date-fns";
import { getStatusBadge } from "../../Common/StatusBadge";

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), "MMMM d, yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const getPaymentTypeBadgeClass = (type: string) => {
  switch (type.toLowerCase()) {
    case "stipend":
      return "bg-purple-100 text-purple-800";
    case "salary":
      return "bg-blue-100 text-blue-800";
    case "bonus":
      return "bg-green-100 text-green-800";
    case "reimbursement":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [enablePrint, setEnablePrint] = useState(false);

  const handleGenerateReceipt = useCallback(async () => {
    if (!id) return;

    try {
      toast.loading("Generating payment receipt...");
      const blob = await paymentAPI.generateReceipt(id);

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `payment-receipt-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.dismiss();
      toast.success("Payment receipt generated successfully");
    } catch (error) {
      toast.dismiss();
      console.error("Error generating payment receipt:", error);
      toast.error("Failed to generate payment receipt");
    }
  }, [id]);

  const handlePrint = useCallback(() => {
    setEnablePrint(true);
    setTimeout(() => {
      window.print();
      // Reset after a short delay to ensure the print dialog has time to open
      setTimeout(() => setEnablePrint(false), 500);
    }, 100);
  }, []);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        setLoading(true);
        const paymentData = await paymentAPI.getPayment(id as string);
        setPayment(paymentData);
      } catch (error: unknown) {
        setError(
          error instanceof Error
            ? error
            : new Error("An unknown error occurred")
        );
      } finally {
        setLoading(false);
      }
    };
    fetchPayment();
  }, [id]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!payment) {
    return <div>No payment found</div>;
  }

  return (
    <ErrorBoundary>
      <div className={`p-6 print:p-0 ${enablePrint ? "print-mode" : ""}`}>
        <AnimatePresence>
          {!enablePrint && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-center mb-6 print:hidden"
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate("/htd/payments")}
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
                Payment to {payment.candidate?.name || "N/A"}
              </h2>
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <FaCalendarAlt />
                <span>Payment Date: {formatDate(payment.paymentDate)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <FaUser />
                <span>{payment.candidate.email || "N/A"}</span>
                {payment.candidate.phone ? (
                  <>
                    <span className="text-gray-400">|</span>
                    <span>{payment.candidate.phone || "N/A"}</span>
                  </>
                ) : (
                  "N/A"
                )}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentTypeBadgeClass(
                    payment.type
                  )}`}
                >
                  {payment.type}
                </span>
                {getStatusBadge(payment.status)}
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {formatCurrency(payment.amount)}
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
                  <div className="font-medium mb-4">{payment.type}</div>

                  {Object.keys(payment.bankDetails || {}).length > 0 ? (
                    <div className="space-y-4">
                      {payment.bankDetails?.accountName && (
                        <div>
                          <div className="text-sm text-gray-500">
                            Account Name
                          </div>
                          <div className="font-medium">
                            {payment.bankDetails?.accountName}
                          </div>
                        </div>
                      )}
                      {payment.bankDetails?.accountNumber && (
                        <div>
                          <div className="text-sm text-gray-500">
                            Account Number
                          </div>
                          <div className="font-medium">
                            {payment.bankDetails?.accountNumber}
                          </div>
                        </div>
                      )}
                      {payment.bankDetails?.bankName && (
                        <div>
                          <div className="text-sm text-gray-500">Bank Name</div>
                          <div className="font-medium">
                            {payment.bankDetails?.bankName}
                          </div>
                        </div>
                      )}
                      {payment.bankDetails?.ifscCode && (
                        <div>
                          <div className="text-sm text-gray-500">IFSC Code</div>
                          <div className="font-medium">
                            {payment.bankDetails?.ifscCode}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      No bank details provided
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Proof */}
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-700 mb-2">
                  Payment Proof
                </h4>
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
      </div>
    </ErrorBoundary>
  );
};

export default PaymentDetail;
