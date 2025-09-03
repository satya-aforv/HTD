import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaSave, FaArrowLeft, FaUpload, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import { paymentAPI, PaymentFormData } from "../../../services/paymentAPI";
import htdAPI, { Candidate, Training } from "../../../services/htdAPI";

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
  trainingId?: string;
}

const PaymentForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<string>("");

  const initialPaymentState = useMemo(
    (): Payment => ({
      candidateId: "",
      amount: 0,
      type: "stipend",
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMode: "bank_transfer",
      transactionId: "",
      bankDetails: {
        accountName: "",
        accountNumber: "",
        bankName: "",
        ifscCode: "",
      },
      description: "",
      status: "pending",
      month: new Date().toLocaleString("default", { month: "long" }),
      year: new Date().getFullYear(),
      proofUrl: "",
      processor: "",
      relatedTraining: "",
      trainingId: "",
    }),
    []
  );

  const [payment, setPayment] = useState<Payment>(initialPaymentState);

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentTab, setCurrentTab] = useState<number>(0); // 0: Payment Details, 1: Bank Details, 2: Description & Proof
  const saveIntentRef = useRef(false);

  const tabs = useMemo(
    () => [
      { key: "payment", label: "Payment Details" },
      { key: "bank", label: "Bank Details" },
      { key: "proof", label: "Description & Proof" },
    ],
    []
  );

  const scrollToTop = useCallback(() => {
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // noop for non-browser envs
    }
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const validate = useCallback((data: Payment) => {
    const vErrors: Record<string, string> = {};
    // Required basics
    if (!data.candidateId) vErrors.candidateId = "Candidate is required";
    if (
      data.amount === null ||
      data.amount === undefined ||
      isNaN(Number(data.amount)) ||
      Number(data.amount) <= 0
    )
      vErrors.amount = "Amount must be greater than 0";
    if (!data.paymentDate) vErrors.paymentDate = "Payment date is required";
    if (!data.paymentMode) vErrors.paymentMode = "Payment mode is required";
    if (!data.type) vErrors.type = "Payment type is required";
    if (!data.month) vErrors.month = "Month is required";
    if (
      data.year === null ||
      data.year === undefined ||
      isNaN(Number(data.year))
    )
      vErrors.year = "Year is required";
    if (!data.status) vErrors.status = "Status is required";

    // Conditional validations
    if (data.paymentMode === "bank_transfer") {
      if (!data.bankDetails?.accountName)
        vErrors["bankDetails.accountName"] =
          "Account name is required for bank transfer";
      if (!data.bankDetails?.accountNumber)
        vErrors["bankDetails.accountNumber"] =
          "Account number is required for bank transfer";
      if (!data.bankDetails?.bankName)
        vErrors["bankDetails.bankName"] =
          "Bank name is required for bank transfer";
      if (!data.bankDetails?.ifscCode)
        vErrors["bankDetails.ifscCode"] =
          "IFSC code is required for bank transfer";
    }

    return vErrors;
  }, []);

  // Validate only fields relevant to a specific tab
  const validateForTab = useCallback(
    (tabIndex: number, data: Payment) => {
      const all = validate(data);
      const allowedKeysByTab: Record<number, string[]> = {
        0: [
          "candidateId",
          "type",
          "amount",
          "paymentDate",
          "paymentMode",
          "month",
          "year",
          "status",
        ],
        1: [
          "bankDetails.accountName",
          "bankDetails.accountNumber",
          "bankDetails.bankName",
          "bankDetails.ifscCode",
        ],
        2: [],
      };
      const allowed = new Set(allowedKeysByTab[tabIndex] || []);
      const filtered: Record<string, string> = {};
      Object.entries(all).forEach(([k, v]) => {
        if (allowed.size === 0 || allowed.has(k)) filtered[k] = v;
      });
      return filtered;
    },
    [validate]
  );

  const goNext = useCallback(() => {
    const v = validateForTab(currentTab, payment);
    setErrors((prev) => ({ ...prev, ...v }));
    if (Object.keys(v).length > 0) {
      toast.error("Please fix the highlighted errors");
      scrollToTop();
      return;
    }
    setCurrentTab((t) => Math.min(t + 1, tabs.length - 1));
  }, [currentTab, payment, tabs.length, validateForTab, scrollToTop]);

  const goBack = useCallback(() => {
    setCurrentTab((t) => Math.max(t - 1, 0));
  }, []);

  // Prevent Enter key from submitting the form; only Save button should submit
  const handleFormKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLFormElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        // On non-final tabs, treat Enter as Next for convenience
        if (currentTab !== tabs.length - 1) {
          goNext();
        }
      }
    },
    [currentTab, tabs.length, goNext]
  );

  const fetchPaymentDetails = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getPayment(id as string);
      const paymentData = response;

      // Helpers to safely extract ids from either string or populated object
      const getIdFromMaybeRef = (val: unknown): string => {
        if (typeof val === "string") return val;
        if (
          val &&
          typeof val === "object" &&
          typeof (val as Record<string, unknown>)["_id"] === "string"
        ) {
          return (val as Record<string, unknown>)["_id"] as string;
        }
        return "";
      };

      const pd = paymentData as unknown as Record<string, unknown>;

      const formattedPayment: Payment = {
        ...initialPaymentState,
        _id: paymentData._id,
        candidateId: getIdFromMaybeRef(pd["candidate"] ?? pd["candidateId"]),
        amount: paymentData.amount,
        type: paymentData.type,
        paymentDate: paymentData.paymentDate
          ? new Date(paymentData.paymentDate).toISOString().split("T")[0]
          : "",
        paymentMode: paymentData.paymentMode,
        transactionId: paymentData.transactionId,
        bankDetails: paymentData.bankDetails || initialPaymentState.bankDetails,
        description: paymentData.description,
        status: paymentData.status,
        processor:
          (typeof pd["processedBy"] === "string"
            ? (pd["processedBy"] as string)
            : paymentData.processor) || "",
        relatedTraining: getIdFromMaybeRef(
          paymentData.relatedTraining as unknown
        ),
        trainingId: getIdFromMaybeRef(paymentData.relatedTraining as unknown),
        month: paymentData.month,
        year: paymentData.year,
      };

      setPayment(formattedPayment);

      const resolvedCandidateId = getIdFromMaybeRef(
        pd["candidate"] ?? pd["candidateId"]
      );

      if (resolvedCandidateId) {
        const candidateId = resolvedCandidateId;
        setSelectedCandidate(candidateId);
        // proactively load trainings for this candidate for binding the relatedTraining field
        await fetchCandidateTrainings(candidateId);
      }

      // Ensure existing related training is present in dropdown even if not returned by list
      if (formattedPayment.relatedTraining) {
        try {
          const tr = await htdAPI.getTraining(formattedPayment.relatedTraining);
          setTrainings((prev) => {
            const already = prev.some((t) => t._id === tr._id);
            return already ? prev : [...prev, tr];
          });
        } catch {
          // ignore if fetch fails; select will still show None
        }
      }

      if (paymentData.proofUrl) {
        setPreviewUrl(paymentData.proofUrl);
      }
    } catch (error) {
      console.error("Error fetching payment details:", error);
      toast.error("Failed to fetch payment details");
      navigate("/htd/payments");
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
        console.error("Error fetching candidates:", error);
        toast.error("Failed to fetch candidates");
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
      const response = await htdAPI.getTrainings({
        sortField: "title",
        sortDirection: "asc",
      });
      const filteredTrainings = response.trainings.filter(
        (training: Training) => training.candidate?._id === candidateId
      );
      console.log(filteredTrainings, "filteredTrainings");
      setTrainings(filteredTrainings);
    } catch (error) {
      console.error("Error fetching candidate trainings:", error);
      setTrainings([]);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // When related training changes, also set trainingId to the selected id
    if (name === "relatedTraining") {
      setPayment((prev) => ({
        ...prev,
        relatedTraining: value,
        trainingId: value as string,
      }));
      clearFieldError(name);
      return;
    }

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setPayment((prev) => {
        const parentState = prev[parent as keyof typeof prev];
        return {
          ...prev,
          [parent]: {
            ...(typeof parentState === "object" && parentState !== null
              ? parentState
              : {}),
            [child]: value,
          },
        };
      });
      clearFieldError(name);
    } else {
      setPayment((prev) => ({
        ...prev,
        // coerce numeric fields
        [name]:
          name === "amount"
            ? Number(value)
            : name === "year"
            ? Number(value)
            : value,
      }));
      clearFieldError(name);
    }
  };

  const handleCandidateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const candidateId = e.target.value;
    setSelectedCandidate(candidateId);
    setPayment((prev) => ({
      ...prev,
      candidateId,
      relatedTraining: "",
      trainingId: "",
    }));
    clearFieldError("candidateId");
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
    setPreviewUrl("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Only allow submit if explicitly triggered by Save button
    if (!saveIntentRef.current) {
      // Treat accidental submit as Next on non-final tabs
      if (currentTab !== tabs.length - 1) {
        goNext();
      }
      return;
    }
    // Validate all on final submit
    const vErrors = validate(payment);
    setErrors(vErrors);
    if (Object.keys(vErrors).length > 0) {
      toast.error("Please fix the highlighted errors");
      scrollToTop();
      return;
    }

    try {
      setSubmitting(true);

      // Create a normalized payload
      const paymentData = {
        ...JSON.parse(JSON.stringify(payment)),
        type: payment.type
          ? String(payment.type).toLocaleLowerCase()
          : payment.type,
        status: payment.status
          ? String(payment.status).toLocaleLowerCase()
          : payment.status,
      };

      // Handle payment creation or update
      const response = isEditMode
        ? await paymentAPI.updatePayment(id as string, paymentData)
        : await paymentAPI.createPayment(paymentData);

      const paymentId = isEditMode ? id : response._id;

      // Handle file upload if a file is selected
      if (proofFile) {
        const formData = new FormData();
        formData.append("proof", proofFile);

        await paymentAPI.uploadProof(paymentId as string, formData);
      }

      toast.success(
        `Payment ${isEditMode ? "updated" : "created"} successfully`
      );
      navigate("/htd/payments");
    } catch (error) {
      console.error("Error saving payment:", error);
      toast.error(`Failed to ${isEditMode ? "update" : "create"} payment`);
    } finally {
      saveIntentRef.current = false;
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
            onClick={() => navigate("/htd/payments")}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditMode ? "Edit Payment" : "Create Payment"}
          </h1>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        onKeyDown={handleFormKeyDown}
        noValidate
        className="bg-white rounded-lg shadow-md p-6"
      >
        {/* Tabs header */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            {tabs.map((t, idx) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setCurrentTab(idx)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  currentTab === idx
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Top error summary (current tab only) */}
        {(() => {
          const currentErrors = validateForTab(currentTab, payment);
          return Object.keys(currentErrors).length > 0 ? (
            <div className="mb-6 border border-red-200 bg-red-50 text-red-700 rounded p-3">
              <div className="font-semibold mb-1">
                Please resolve the following:
              </div>
              <ul className="list-disc pl-5 text-sm space-y-0.5">
                {Object.entries(currentErrors).map(([field, message]) => (
                  <li key={field}>{message}</li>
                ))}
              </ul>
            </div>
          ) : null;
        })()}

        {/* Section: Payment Details */}
        <div
          className={`rounded-md border border-blue-200 bg-blue-50/40 p-4 mb-6 ${
            currentTab === 0 ? "block" : "hidden"
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              Payment Details
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Candidate Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Candidate *
              </label>
              <select
                name="candidateId"
                value={payment.candidateId}
                onChange={handleCandidateChange}
                className={`w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.candidateId ? "border-red-500" : "border-gray-300"
                }`}
                required
                disabled={isEditMode}
                aria-invalid={!!errors.candidateId}
              >
                <option value="">Select Candidate</option>
                {candidates.map((candidate) => (
                  <option key={candidate._id} value={candidate._id}>
                    {candidate.name} ({candidate.email})
                  </option>
                ))}
              </select>
              {errors.candidateId && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.candidateId}
                </p>
              )}
            </div>

            {/* Payment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Type *
              </label>
              <select
                name="type"
                value={payment.type}
                onChange={handleInputChange}
                className={`w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.type ? "border-red-500" : "border-gray-300"
                }`}
                required
                aria-invalid={!!errors.type}
              >
                <option value="stipend">Stipend</option>
                <option value="salary">Salary</option>
                <option value="bonus">Bonus</option>
                <option value="reimbursement">Reimbursement</option>
              </select>
              {errors.type && (
                <p className="mt-1 text-xs text-red-600">{errors.type}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount ($) *
              </label>
              <input
                type="number"
                name="amount"
                value={Number.isFinite(payment.amount) ? payment.amount : 0}
                onChange={handleInputChange}
                className={`w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.amount ? "border-red-500" : "border-gray-300"
                }`}
                required
                min="0"
                step="0.01"
                aria-invalid={!!errors.amount}
              />
              {errors.amount && (
                <p className="mt-1 text-xs text-red-600">{errors.amount}</p>
              )}
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                name="paymentDate"
                value={payment.paymentDate || ""}
                onChange={handleInputChange}
                className={`w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.paymentDate ? "border-red-500" : "border-gray-300"
                }`}
                required
                aria-invalid={!!errors.paymentDate}
              />
              {errors.paymentDate && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.paymentDate}
                </p>
              )}
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Mode *
              </label>
              <select
                name="paymentMode"
                value={payment.paymentMode}
                onChange={handleInputChange}
                className={`w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.paymentMode ? "border-red-500" : "border-gray-300"
                }`}
                required
                aria-invalid={!!errors.paymentMode}
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="check">Check</option>
                <option value="cash">Cash</option>
                <option value="paypal">PayPal</option>
                <option value="other">Other</option>
              </select>
              {errors.paymentMode && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.paymentMode}
                </p>
              )}
            </div>

            {/* Transaction ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction ID
              </label>
              <input
                type="text"
                name="transactionId"
                value={payment.transactionId || ""}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Transaction reference number"
              />
            </div>

            {/* Month */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month *
              </label>
              <select
                name="month"
                value={payment.month}
                onChange={handleInputChange}
                className={`w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.month ? "border-red-500" : "border-gray-300"
                }`}
                required
                aria-invalid={!!errors.month}
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
              {errors.month && (
                <p className="mt-1 text-xs text-red-600">{errors.month}</p>
              )}
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year *
              </label>
              <select
                name="year"
                value={
                  Number.isFinite(payment.year)
                    ? payment.year
                    : new Date().getFullYear()
                }
                onChange={handleInputChange}
                className={`w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.year ? "border-red-500" : "border-gray-300"
                }`}
                required
                aria-invalid={!!errors.year}
              >
                {Array.from(
                  { length: 5 },
                  (_, i) => new Date().getFullYear() - i
                ).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              {errors.year && (
                <p className="mt-1 text-xs text-red-600">{errors.year}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                name="status"
                value={payment.status}
                onChange={handleInputChange}
                className={`w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.status ? "border-red-500" : "border-gray-300"
                }`}
                required
                aria-invalid={!!errors.status}
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-xs text-red-600">{errors.status}</p>
              )}
            </div>

            {/* Related Training */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Related Training
              </label>
              <select
                name="relatedTraining"
                value={payment.relatedTraining || ""}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!selectedCandidate}
              >
                <option value="">None</option>
                {trainings.map((training: Training) => (
                  <option key={training._id} value={training._id}>
                    {training.title
                      ? `${training.title} (${training.status})`
                      : training.description
                      ? `${training.description} (${training.status})`
                      : `Training ID: ${training?.trainingId} (${training.status})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Processor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Processor
              </label>
              <input
                type="text"
                name="processor"
                value={payment.processor || ""}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Name of person processing the payment"
              />
            </div>
          </div>
        </div>

        {/* Section: Bank Details */}
        <div
          className={`rounded-md border border-amber-200 bg-amber-50/40 p-4 mb-6 ${
            currentTab === 1 ? "block" : "hidden"
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
              Bank Details
            </span>
            <span className="text-xs text-amber-700">
              Required if payment mode is Bank Transfer
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Name
              </label>
              <input
                type="text"
                name="bankDetails.accountName"
                value={payment.bankDetails?.accountName || ""}
                onChange={handleInputChange}
                className={`w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors["bankDetails.accountName"]
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                aria-invalid={!!errors["bankDetails.accountName"]}
              />
              {errors["bankDetails.accountName"] && (
                <p className="mt-1 text-xs text-red-600">
                  {errors["bankDetails.accountName"]}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                name="bankDetails.accountNumber"
                value={payment.bankDetails?.accountNumber || ""}
                onChange={handleInputChange}
                className={`w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors["bankDetails.accountNumber"]
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                aria-invalid={!!errors["bankDetails.accountNumber"]}
              />
              {errors["bankDetails.accountNumber"] && (
                <p className="mt-1 text-xs text-red-600">
                  {errors["bankDetails.accountNumber"]}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                name="bankDetails.bankName"
                value={payment.bankDetails?.bankName || ""}
                onChange={handleInputChange}
                className={`w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors["bankDetails.bankName"]
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                aria-invalid={!!errors["bankDetails.bankName"]}
              />
              {errors["bankDetails.bankName"] && (
                <p className="mt-1 text-xs text-red-600">
                  {errors["bankDetails.bankName"]}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IFSC Code
              </label>
              <input
                type="text"
                name="bankDetails.ifscCode"
                value={payment.bankDetails?.ifscCode || ""}
                onChange={handleInputChange}
                className={`w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors["bankDetails.ifscCode"]
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                aria-invalid={!!errors["bankDetails.ifscCode"]}
              />
              {errors["bankDetails.ifscCode"] && (
                <p className="mt-1 text-xs text-red-600">
                  {errors["bankDetails.ifscCode"]}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section: Description & Proof */}
        <div
          className={`rounded-md border border-green-200 bg-green-50/40 p-4 ${
            currentTab === 2 ? "block" : "hidden"
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
              Description & Proof
            </span>
          </div>
          {/* Description */}
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={payment.description || ""}
              onChange={handleInputChange}
              rows={3}
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional details about this payment"
            ></textarea>
          </div>

          {/* Payment Proof Upload */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Proof
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                <FaUpload className="mr-2" />
                {proofFile ? "Change File" : "Upload File"}
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
                {previewUrl.includes("data:image") ? (
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
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex justify-between">
          <div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate("/htd/payments");
              }}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
          <div className="flex gap-2">
            {currentTab > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goBack();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={submitting}
              >
                Back
              </button>
            )}
            {currentTab < tabs.length - 1 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goNext();
                }}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={submitting}
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                onClick={() => {
                  saveIntentRef.current = true;
                }}
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
                    <FaSave className="mr-2" /> {isEditMode ? "Update" : "Save"}{" "}
                    Payment
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;
