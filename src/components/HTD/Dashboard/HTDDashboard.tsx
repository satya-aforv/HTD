import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaUserGraduate,
  FaChalkboardTeacher,
  FaMoneyBillWave,
} from "react-icons/fa";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import { htdAPI, type DashboardStats } from "../../../services/htdAPI";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const HTDDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const data = await htdAPI.getDashboardStats();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError(
          "Failed to load dashboard statistics. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";

    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return "bg-gray-100 text-gray-800";

    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "onboarding":
        return "bg-blue-100 text-blue-800";
      case "training":
        return "bg-purple-100 text-purple-800";
      case "placed":
        return "bg-indigo-100 text-indigo-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "ongoing":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Safely handle potentially undefined data
  const candidatesByStatus = stats?.candidatesByStatus || [];
  const trainingsByMonth = stats?.trainingsByMonth || [];
  const recentCandidates = stats?.recentCandidates || [];
  const upcomingPayments = stats?.upcomingPayments || [];
  const totalCandidates = stats?.totalCandidates || 0;
  const activeCandidates = stats?.activeCandidates || 0;
  const completedTrainings = stats?.completedTrainings || 0;
  const ongoingTrainings = stats?.ongoingTrainings || 0;
  const totalPayments = stats?.totalPayments || 0;
  const monthlyPayments = stats?.monthlyPayments || 0;

  // Candidate Status Chart Data
  const candidateStatusData = {
    labels: candidatesByStatus.map((item) => item.status || "Unknown"),
    datasets: [
      {
        data: candidatesByStatus.map((item) => item.count || 0),
        backgroundColor: [
          "#4F46E5", // Indigo
          "#10B981", // Green
          "#F59E0B", // Amber
          "#EF4444", // Red
          "#8B5CF6", // Purple
          "#EC4899", // Pink
        ],
        borderWidth: 1,
      },
    ],
  };

  const monthlyTrainingsData = {
    labels: trainingsByMonth.map((item) => item.month || "Unknown"),
    datasets: [
      {
        label: "Trainings",
        data: trainingsByMonth.map((item) => item.count || 0),
        backgroundColor: "#3B82F6",
      },
    ],
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">
        HTD Management Dashboard
      </h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Candidates Stats */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 flex items-center">
          <div className="rounded-full bg-indigo-100 p-3 mr-4">
            <FaUserGraduate className="text-indigo-600 text-xl" />
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-500">Total Candidates</p>
            <div className="flex flex-col md:flex-row md:items-end gap-1 md:gap-2">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800">
                {totalCandidates}
              </h3>
              <p className="text-xs md:text-sm text-green-600">
                <span className="font-medium">{activeCandidates}</span> active
              </p>
            </div>
          </div>
        </div>

        {/* Trainings Stats */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <FaChalkboardTeacher className="text-blue-600 text-xl" />
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-500">Trainings</p>
            <div className="flex flex-col md:flex-row md:items-end gap-1 md:gap-2">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800">
                {completedTrainings + ongoingTrainings}
              </h3>
              <p className="text-xs md:text-sm text-blue-600">
                <span className="font-medium">{ongoingTrainings}</span> ongoing
              </p>
            </div>
          </div>
        </div>

        {/* Payments Stats */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <FaMoneyBillWave className="text-green-600 text-xl" />
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-500">Total Payments</p>
            <div className="flex flex-col md:flex-row md:items-end gap-1 md:gap-2">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800">
                ${totalPayments.toLocaleString()}
              </h3>
              <p className="text-xs md:text-sm text-green-600">
                <span className="font-medium">
                  ${monthlyPayments.toLocaleString()}
                </span>{" "}
                this month
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-3">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/htd/candidates/new"
              className="bg-indigo-50 hover:bg-indigo-100 p-2 md:p-3 rounded-md text-center text-indigo-700 text-xs md:text-sm font-medium"
            >
              Add Candidate
            </Link>
            <Link
              to="/htd/trainings/new"
              className="bg-blue-50 hover:bg-blue-100 p-2 md:p-3 rounded-md text-center text-blue-700 text-xs md:text-sm font-medium"
            >
              New Training
            </Link>
            <Link
              to="/htd/payments/new"
              className="bg-green-50 hover:bg-green-100 p-2 md:p-3 rounded-md text-center text-green-700 text-xs md:text-sm font-medium"
            >
              Record Payment
            </Link>
            <Link
              to="/htd/candidates"
              className="bg-gray-50 hover:bg-gray-100 p-2 md:p-3 rounded-md text-center text-gray-700 text-xs md:text-sm font-medium"
            >
              View All
            </Link>
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Candidate Status Chart */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="text-base md:text-lg font-medium text-gray-800 mb-4">
            Candidates by Status
          </h3>
          <div className="h-64 flex justify-center items-center">
            {candidatesByStatus.length > 0 ? (
              <Pie
                data={candidateStatusData}
                options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        boxWidth: 12,
                        font: {
                          size: 10,
                        },
                      },
                    },
                  },
                }}
              />
            ) : (
              <p className="text-gray-500">
                No candidate status data available
              </p>
            )}
          </div>
        </div>

        {/* Training Monthly Chart */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="text-base md:text-lg font-medium text-gray-800 mb-4">
            Trainings by Month
          </h3>
          <div className="h-64 flex justify-center items-center">
            {trainingsByMonth.length > 0 ? (
              <Bar
                data={monthlyTrainingsData}
                options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0,
                      },
                    },
                    x: {
                      ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                }}
              />
            ) : (
              <p className="text-gray-500">No training data available</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Candidates */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base md:text-lg font-medium text-gray-800">
              Recent Candidates
            </h3>
            <Link
              to="/htd/candidates"
              className="text-xs md:text-sm text-indigo-600 hover:text-indigo-800"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Added
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentCandidates.length > 0 ? (
                  recentCandidates.map((candidate) => (
                    <tr key={candidate._id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">
                        <Link
                          to={`/htd/candidates/${candidate._id}`}
                          className="text-indigo-600 hover:text-indigo-900 text-sm"
                        >
                          {candidate.name || "Unnamed Candidate"}
                        </Link>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                            candidate.status || ""
                          )}`}
                        >
                          {candidate.status || "Unknown"}
                        </span>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-500">
                        {formatDate(candidate.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-4 text-center text-gray-500 text-sm"
                    >
                      No recent candidates found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Payments */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base md:text-lg font-medium text-gray-800">
              Upcoming Payments
            </h3>
            <Link
              to="/htd/payments"
              className="text-xs md:text-sm text-indigo-600 hover:text-indigo-800"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {upcomingPayments.length > 0 ? (
                  upcomingPayments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">
                        <Link
                          to={`/htd/candidates/${
                            payment.candidateId?._id || "#"
                          }`}
                          className="text-indigo-600 hover:text-indigo-900 text-sm"
                        >
                          {payment.candidateId?.name || "Unknown Candidate"}
                        </Link>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap font-medium text-sm">
                        ${(payment.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                            payment.type || ""
                          )}`}
                        >
                          {payment.type || "Unknown"}
                        </span>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-500">
                        {formatDate(payment.paymentDate)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-4 text-center text-gray-500 text-sm"
                    >
                      No upcoming payments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HTDDashboard;
