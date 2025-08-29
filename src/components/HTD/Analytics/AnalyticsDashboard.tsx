import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaUsers, 
  FaChartLine, 
  FaDollarSign, 
  FaDownload,
  FaFilter,
  FaCalendarAlt
} from 'react-icons/fa';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import toast from 'react-hot-toast';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

interface AnalyticsData {
  candidates: {
    totalCount: { count: number }[];
    statusBreakdown: { _id: string; count: number }[];
    genderBreakdown: { _id: string; count: number }[];
    monthlyHiring: { _id: { year: number; month: number }; count: number }[];
  };
  trainings: {
    totalTrainings: { count: number }[];
    statusBreakdown: { _id: string; count: number }[];
    performanceAnalysis: { _id: { year: number; month: number }; avgRating: number; count: number }[];
    skillsAcquired: { _id: string; count: number; avgProficiency: number }[];
  };
  payments: {
    totalPayments: { total: number; count: number }[];
    typeBreakdown: { _id: string; total: number; count: number }[];
    monthlyTrend: { _id: { year: number; month: number }; total: number; count: number }[];
  };
  skills: {
    skillDistribution: { _id: string; count: number }[];
    proficiencyAnalysis: { _id: string; count: number }[];
  };
  roi: { _id: string; candidates: number; avgInvestment: number; totalInvestment: number }[];
}

const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    skillType: ''
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.status) params.append('status', filters.status);
      if (filters.skillType) params.append('skillType', filters.skillType);

      const response = await axios.get(`/api/htd/analytics/dashboard?${params}`);
      setAnalyticsData(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    fetchAnalyticsData();
  };

  const exportData = async (type: string) => {
    try {
      toast.loading('Generating export...');
      const response = await axios.get(`/api/htd/exports/${type}/excel`, {
        responseType: 'blob',
        params: filters
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-export.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.dismiss();
      toast.success('Export completed successfully');
    } catch (error) {
      toast.dismiss();
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Chart data preparation
  const candidateStatusData = {
    labels: analyticsData?.candidates.statusBreakdown?.map(item => item._id) || [],
    datasets: [{
      data: analyticsData?.candidates.statusBreakdown?.map(item => item.count) || [],
      backgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
      borderWidth: 1
    }]
  };

  const monthlyHiringData = {
    labels: analyticsData?.candidates.monthlyHiring?.map(item => `${item._id.month}/${item._id.year}`) || [],
    datasets: [{
      label: 'Candidates Hired',
      data: analyticsData?.candidates.monthlyHiring?.map(item => item.count) || [],
      backgroundColor: '#3B82F6',
      borderColor: '#1D4ED8',
      borderWidth: 1
    }]
  };

  const paymentTrendData = {
    labels: analyticsData?.payments.monthlyTrend?.map(item => `${item._id.month}/${item._id.year}`) || [],
    datasets: [{
      label: 'Payment Amount ($)',
      data: analyticsData?.payments.monthlyTrend?.map(item => item.total) || [],
      backgroundColor: '#10B981',
      borderColor: '#059669',
      tension: 0.1
    }]
  };

  const skillsData = {
    labels: analyticsData?.skills.skillDistribution?.slice(0, 10).map(item => item._id) || [],
    datasets: [{
      label: 'Skill Count',
      data: analyticsData?.skills.skillDistribution?.slice(0, 10).map(item => item.count) || [],
      backgroundColor: '#8B5CF6'
    }]
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">HTD Analytics Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={() => exportData('candidates')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <FaDownload /> Export Candidates
          </button>
          <button
            onClick={() => exportData('comprehensive')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <FaDownload /> Full Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FaFilter className="text-gray-500" />
          <h3 className="font-medium text-gray-700">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="HIRED">Hired</option>
              <option value="IN_TRAINING">In Training</option>
              <option value="DEPLOYED">Deployed</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={applyFilters}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-blue-100 p-3 mr-4">
              <FaUsers className="text-blue-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Candidates</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {analyticsData?.candidates.totalCount?.[0]?.count || 0}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-green-100 p-3 mr-4">
              <FaChartLine className="text-green-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Trainings</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {analyticsData?.trainings.totalTrainings?.[0]?.count || 0}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-purple-100 p-3 mr-4">
              <FaDollarSign className="text-purple-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Payments</p>
              <h3 className="text-2xl font-bold text-gray-800">
                ${analyticsData?.payments.totalPayments?.[0]?.total?.toLocaleString() || 0}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-yellow-100 p-3 mr-4">
              <FaCalendarAlt className="text-yellow-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Investment</p>
              <h3 className="text-2xl font-bold text-gray-800">
                ${analyticsData?.roi?.[0]?.avgInvestment?.toLocaleString() || 0}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Candidate Status Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Candidates by Status</h3>
          <div className="h-64">
            <Pie data={candidateStatusData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Monthly Hiring Trend */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Monthly Hiring Trend</h3>
          <div className="h-64">
            <Bar data={monthlyHiringData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Payment Trend */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Payment Trend</h3>
          <div className="h-64">
            <Line data={paymentTrendData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Top Skills */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Top Skills</h3>
          <div className="h-64">
            <Bar data={skillsData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* ROI Analysis Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">ROI Analysis by Status</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Investment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Investment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {analyticsData?.roi?.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item._id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.candidates}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${item.avgInvestment.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${item.totalInvestment.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
