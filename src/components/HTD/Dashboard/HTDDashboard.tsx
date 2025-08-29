import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUserGraduate, FaChalkboardTeacher, FaMoneyBillWave } from 'react-icons/fa';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { htdAPI, type DashboardStats } from '../../../services/htdAPI';

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
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard statistics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
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

  // Candidate Status Chart Data
  const candidateStatusData = {
    labels: stats?.candidatesByStatus?.map((item) => item.status) || [],
    datasets: [
      {
        data: stats?.candidatesByStatus?.map((item) => item.count) || [],
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
    labels: stats?.trainingsByMonth?.map((item) => item.month) || [],
    datasets: [
      {
        label: "Trainings",
        data: stats?.trainingsByMonth?.map((item) => item.count) || [],
        backgroundColor: "#3B82F6",
      },
    ],
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        HTD Management Dashboard
      </h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Candidates Stats */}
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="rounded-full bg-indigo-100 p-3 mr-4">
            <FaUserGraduate className="text-indigo-600 text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Candidates</p>
            <div className="flex items-end gap-2">
              <h3 className="text-2xl font-bold text-gray-800">
                {stats?.totalCandidates || 0}
              </h3>
              <p className="text-sm text-green-600">
                <span className="font-medium">
                  {stats?.activeCandidates || 0}
                </span>{" "}
                active
              </p>
            </div>
          </div>
        </div>

        {/* Trainings Stats */}
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <FaChalkboardTeacher className="text-blue-600 text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Trainings</p>
            <div className="flex items-end gap-2">
              <h3 className="text-2xl font-bold text-gray-800">
                {(stats?.completedTrainings || 0) +
                  (stats?.ongoingTrainings || 0)}
              </h3>
              <p className="text-sm text-blue-600">
                <span className="font-medium">
                  {stats?.ongoingTrainings || 0}
                </span>{" "}
                ongoing
              </p>
            </div>
          </div>
        </div>

        {/* Payments Stats */}
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <FaMoneyBillWave className="text-green-600 text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Payments</p>
            <div className="flex items-end gap-2">
              <h3 className="text-2xl font-bold text-gray-800">
                ${stats?.totalPayments?.toLocaleString() || 0}
              </h3>
              <p className="text-sm text-green-600">
                <span className="font-medium">
                  ${stats?.monthlyPayments?.toLocaleString() || 0}
                </span>{" "}
                this month
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/htd/candidates/new"
              className="bg-indigo-50 hover:bg-indigo-100 p-3 rounded-md text-center text-indigo-700 text-sm font-medium"
            >
              Add Candidate
            </Link>
            <Link
              to="/htd/trainings/new"
              className="bg-blue-50 hover:bg-blue-100 p-3 rounded-md text-center text-blue-700 text-sm font-medium"
            >
              New Training
            </Link>
            <Link
              to="/htd/payments/new"
              className="bg-green-50 hover:bg-green-100 p-3 rounded-md text-center text-green-700 text-sm font-medium"
            >
              Record Payment
            </Link>
            <Link
              to="/htd/candidates"
              className="bg-gray-50 hover:bg-gray-100 p-3 rounded-md text-center text-gray-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Candidate Status Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Candidates by Status
          </h3>
          <div className="h-64 flex justify-center items-center">
            {stats?.candidatesByStatus &&
            stats.candidatesByStatus.length > 0 ? (
              <Pie
                data={candidateStatusData}
                options={{ maintainAspectRatio: false }}
              />
            ) : (
              <p className="text-gray-500">
                No candidate status data available
              </p>
            )}
          </div>
        </div>

        {/* Training Monthly Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Trainings by Month
          </h3>
          <div className="h-64 flex justify-center items-center">
            {stats?.trainingsByMonth && stats.trainingsByMonth.length > 0 ? (
              <Bar
                data={monthlyTrainingsData}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0,
                      },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Candidates */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">
              Recent Candidates
            </h3>
            <Link
              to="/htd/candidates"
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Added
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats?.recentCandidates &&
                stats.recentCandidates.length > 0 ? (
                  stats.recentCandidates.map((candidate) => (
                    <tr key={candidate._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link
                          to={`/htd/candidates/${candidate._id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {candidate.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                            candidate.status
                          )}`}
                        >
                          {candidate.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(candidate.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-4 text-center text-gray-500"
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
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">
              Upcoming Payments
            </h3>
            <Link
              to="/htd/payments"
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats?.upcomingPayments &&
                stats.upcomingPayments.length > 0 ? (
                  stats.upcomingPayments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link
                          to={`/htd/candidates/${payment.candidateId._id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {payment.candidateId.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        ${payment.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                            payment.type
                          )}`}
                        >
                          {payment.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(payment.paymentDate)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-4 text-center text-gray-500"
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
