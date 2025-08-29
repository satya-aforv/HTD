import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSpinner, FaPlus, FaSearch, FaFilter, FaFileDownload, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { htdAPI, Payment, Candidate } from '../../../services/htdAPI';
import { getErrorMessage } from '../../../lib/utils';

const DEFAULT_PAGE_SIZE = 10;

const PaymentsList: React.FC = () => {
  const navigate = useNavigate();
  
  // State management
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPayments, setTotalPayments] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('');
  
  // Sort states
  const [sortField, setSortField] = useState<keyof Payment>('paymentDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(totalPayments / pageSize) || 1;
  }, [totalPayments, pageSize]);
  
  // Format date for display
  const formatDate = useCallback((dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  }, []);

  // Get badge class for payment type
  const getPaymentTypeBadgeClass = useCallback((type: string): string => {
    switch (type) {
      case 'registration':
        return 'bg-blue-100 text-blue-800';
      case 'tuition':
        return 'bg-green-100 text-green-800';
      case 'certification':
        return 'bg-purple-100 text-purple-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // Get badge class for status
  const getStatusBadgeClass = useCallback((status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // Get candidate name safely
  const getCandidateName = useCallback((candidateId: Candidate | string): string => {
    if (!candidateId) return 'N/A';
    if (typeof candidateId === 'string') return 'Unknown Candidate';
    return candidateId.name || 'N/A';
  }, []);

  // Get candidate email safely
  const getCandidateEmail = useCallback((candidateId: Candidate | string): string => {
    if (!candidateId) return '';
    if (typeof candidateId === 'string') return '';
    return candidateId.email || '';
  }, []);

  const fetchPayments = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await htdAPI.getPayments({
        page: currentPage,
        limit: pageSize,
        search: searchTerm.trim(),
        type: filterType,
        status: filterStatus,
        month: filterMonth,
        year: filterYear ? Number(filterYear) : undefined,
        sortBy: sortField,
        sortDirection,
      });

      if (response?.payments) {
        setPayments(response.payments);
        setTotalPayments(response.totalCount || 0);
        const calculatedTotalPages = Math.ceil((response.totalCount || 0) / pageSize);
        if (currentPage > calculatedTotalPages && calculatedTotalPages > 0) {
          setCurrentPage(calculatedTotalPages);
        }
      } else {
        setPayments([]);
        setTotalPayments(0);
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Failed to fetch payments');
      console.error('Error fetching payments:', error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sortField, sortDirection, searchTerm, filterType, filterStatus, filterMonth, filterYear]);

  // Handle search
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPayments();
  }, [fetchPayments]);

  // Handle filter apply
  const handleFilterApply = useCallback(() => {
    setCurrentPage(1);
    setShowFilters(false);
    fetchPayments();
  }, [fetchPayments]);

  // Handle filter reset
  const handleFilterReset = useCallback(() => {
    setSearchTerm('');
    setFilterType('');
    setFilterStatus('');
    setFilterMonth('');
    setFilterYear('');
    setCurrentPage(1);
  }, []);

  // Handle sort
  const handleSort = useCallback((field: keyof Payment) => {
    setSortField(field);
    setSortDirection(
      sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
    );
    setCurrentPage(1);
  }, [sortField, sortDirection]);

  const handleDeletePayment = useCallback(async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) {
      return;
    }

    try {
      await htdAPI.deletePayment(id);
      toast.success('Payment deleted successfully');
      await fetchPayments(); // Refetch to update the list
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Failed to delete payment');
      console.error('Error deleting payment:', error);
      toast.error(errorMessage);
    }
  }, [fetchPayments]);

  const handleExportPayments = useCallback(async () => {
    try {
      setLoading(true);
      const blob = await htdAPI.exportPayments({
        search: searchTerm.trim(),
        type: filterType,
        status: filterStatus,
        month: filterMonth,
        year: filterYear ? Number(filterYear) : undefined,
        sortBy: sortField,
        sortDirection,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payments-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        link.remove();
      }, 100);

      toast.success('Export started successfully');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Failed to export payments');
      console.error('Error exporting payments:', error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterType, filterStatus, filterMonth, filterYear, sortField, sortDirection]);

  // Use effect to fetch payments on mount and when dependencies change
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Loading state
  if (loading && payments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center">
          <FaSpinner className="animate-spin text-2xl text-blue-500 mb-2" />
          <p className="text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!loading && payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No payments</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterStatus || filterType || filterMonth || filterYear
              ? 'No payments match your filters.'
              : 'Get started by creating a new payment.'}
          </p>
          <div className="mt-6">
            <Link
              to="/htd/payments/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaPlus className="-ml-1 mr-2 h-5 w-5" />
              New Payment
            </Link>
            {(searchTerm || filterStatus || filterType || filterMonth || filterYear) && (
              <button
                type="button"
                onClick={handleFilterReset}
                className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Payment Records</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExportPayments}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md flex items-center gap-2"
          >
            <FaFileDownload /> Export
          </button>
          <button
            onClick={() => navigate('/htd/payments/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center gap-2"
          >
            <FaPlus /> Add Payment
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by candidate name, email, or transaction ID"
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(e as React.FormEvent)}
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={(e) => handleSearch(e)}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
            >
              Search
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-md flex items-center gap-2"
            >
              <FaFilter /> Filter
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
              <select
                className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="registration">Registration</option>
                <option value="tuition">Tuition</option>
                <option value="certification">Certification</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select
                className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              >
                <option value="">All Months</option>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              >
                <option value="">All Years</option>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year.toString()}>{year}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-4 flex justify-end gap-2">
              <button
                onClick={handleFilterReset}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-md"
              >
                Reset
              </button>
              <button
                onClick={handleFilterApply}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('candidateId')}
                >
                  Candidate
                  {sortField === 'candidateId' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('type')}
                >
                  Type
                  {sortField === 'type' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('amount')}
                >
                  Amount
                  {sortField === 'amount' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('month')}
                >
                  Month/Year
                  {sortField === 'month' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('paymentDate')}
                >
                  Date
                  {sortField === 'paymentDate' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  Status
                  {sortField === 'status' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No payment records found
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getCandidateName(payment?.candidateId)}
                      </div>
                      {getCandidateEmail(payment?.candidateId) && (
                        <div className="text-sm text-gray-500">
                          {getCandidateEmail(payment?.candidateId)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentTypeBadgeClass(payment?.type)}`}>
                        {payment?.type || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${payment?.amount?.toLocaleString() || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment?.month || 'N/A'} {payment?.year || ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment?.paymentDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(payment?.status)}`}>
                        {payment?.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/htd/payments/${payment?._id}`)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => navigate(`/htd/payments/${payment?._id}/edit`)}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeletePayment(payment?._id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && payments.length > 0 && (
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * pageSize, totalPayments)}
                  </span>{' '}
                  of <span className="font-medium">{totalPayments}</span> results
                </p>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border rounded-md p-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[10, 25, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    <span className="sr-only">First</span>
                    <span>«</span>
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    <span className="sr-only">Previous</span>
                    <span>‹</span>
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    <span className="sr-only">Next</span>
                    <span>›</span>
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    <span className="sr-only">Last</span>
                    <span>»</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentsList;