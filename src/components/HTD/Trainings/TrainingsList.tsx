import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FaEdit,
  FaTrash,
  FaEye,
  FaPlus,
  FaSearch,
  FaFilter,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { htdAPI, Training } from "../../../services/htdAPI";

const TrainingsList: React.FC = () => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [sortField, setSortField] = useState<string>("startDate");
  const [sortDirection, setSortDirection] = useState<string>("desc");

  // Memoize fetchTrainings to prevent infinite re-renders
    const fetchTrainings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await htdAPI.getTrainings({
        page: currentPage,
        limit: 10,
        search: searchTerm.trim(),
        status: filterStatus as Training['status'],
        sortField,
        sortDirection,
      });

      let trainingsData = Array.isArray(response?.trainings)
        ? response.trainings
        : [];

      // Client-side sorting as backend may not support it yet
      if (sortField) {
        trainingsData = [...trainingsData].sort((a, b) => {
          const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
            return path.split('.').reduce((acc: unknown, key: string) => {
              if (acc && typeof acc === 'object' && key in acc) {
                return (acc as Record<string, unknown>)[key];
              }
              return null;
            }, obj);
          };

          const valA = getNestedValue(a, sortField);
          const valB = getNestedValue(b, sortField);

          if (valA === null || valA === undefined) return 1;
          if (valB === null || valB === undefined) return -1;

          if (typeof valA === 'string' && typeof valB === 'string') {
            return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
          }

          if (valA < valB) {
            return sortDirection === 'asc' ? -1 : 1;
          }
          if (valA > valB) {
            return sortDirection === 'asc' ? 1 : -1;
          }
          return 0;
        });
      }

      setTrainings(trainingsData);
      setTotalPages(Math.max(1, Number(response?.totalPages) || 1));
    } catch (error) {
      console.error("Error fetching trainings:", error);
      toast.error("Failed to fetch trainings");
      setTrainings([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterStatus, sortField, sortDirection]);

  useEffect(() => {
    fetchTrainings();
  }, [fetchTrainings]);

  const handleDelete = async (id?: string) => {
    if (!id) {
      toast.error("Invalid training ID");
      return;
    }

    if (
      window.confirm("Are you sure you want to delete this training record?")
    ) {
      try {
        await htdAPI.deleteTraining(id);
        toast.success("Training record deleted successfully");
        await fetchTrainings();
      } catch (error) {
        console.error("Error deleting training:", error);
        toast.error("Failed to delete training record");
      }
    }
  };

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  const calculateDuration = (
    startDate?: string,
    endDate?: string | null
  ): string => {
    if (!startDate) return "N/A";

    try {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date();

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return "Invalid Date";
      }

      // Ensure end date is after start date
      if (end < start) {
        return "Invalid Date Range";
      }

      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const months = Math.floor(diffDays / 30);
      const days = diffDays % 30;

      return `${months} month${months !== 1 ? "s" : ""} ${days} day${
        days !== 1 ? "s" : ""
      }`;
    } catch (error) {
      console.error("Error calculating duration:", error);
      return "Error";
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    if (!status) return "bg-gray-100 text-gray-800";

    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "on-hold":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Training Management
        </h1>
        <Link
          to="/htd/trainings/new"
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center gap-2"
        >
          <FaPlus /> Add New Training
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by candidate name or skills..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : trainings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No training records found. Add a new training record to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("candidateId.name")}
                  >
                    Candidate
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("startDate")}
                  >
                    Start Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Duration
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("status")}
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("averageRating")}
                  >
                    Avg. Rating
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("totalExpenses")}
                  >
                    Total Expenses
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Skills Acquired
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trainings.map((training) => (
                  <tr key={training._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {training?.candidateId?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {training?.startDate ? formatDate(training.startDate) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {calculateDuration(
                          training?.startDate,
                          training?.endDate
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                          training?.status
                        )}`}
                      >
                        {training?.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {training?.averageRating
                          ? training.averageRating.toFixed(1)
                          : "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        $
                        {training?.totalExpenses?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {training?.skillsAcquired && training.skillsAcquired.length > 0 ? (
                          training.skillsAcquired.slice(0, 3).map((skill: string, index: number) => (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">None</span>
                        )}
                        {training?.skillsAcquired &&
                          training.skillsAcquired.length > 3 && (
                            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                              +{training.skillsAcquired.length - 3}
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/htd/trainings/${training?._id}`}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="View Details"
                        >
                          <FaEye />
                        </Link>
                        <Link
                          to={`/htd/trainings/${training?._id}/edit`}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="Edit"
                        >
                          <FaEdit />
                        </Link>
                        <button
                          onClick={() => handleDelete(training?._id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && trainings.length > 0 && (
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-500">
              Showing page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md ${
                  currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingsList;
