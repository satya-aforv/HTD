import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiPlay, 
  FiPause, 
  FiClock, 
  FiMail, 
  FiDownload,
  FiCalendar,
  FiUsers
} from 'react-icons/fi';

interface ScheduledReport {
  _id: string;
  name: string;
  description: string;
  template: {
    _id: string;
    name: string;
    type: string;
  };
  schedule: {
    frequency: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: {
      hour: number;
      minute: number;
    };
    timezone: string;
  };
  recipients: Array<{
    user: {
      _id: string;
      name: string;
      email: string;
    };
    email: string;
    deliveryMethod: string;
  }>;
  format: string;
  isActive: boolean;
  lastRun?: string;
  nextRun: string;
  runCount: number;
  failureCount: number;
  createdAt: string;
}

interface ScheduledReportsProps {
  onCreateReport: () => void;
  onEditReport: (report: ScheduledReport) => void;
}

const ScheduledReports: React.FC<ScheduledReportsProps> = ({ onCreateReport, onEditReport }) => {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);

  const fetchScheduledReports = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });
      
      if (filterActive !== undefined) {
        params.append('isActive', filterActive.toString());
      }

      const response = await fetch(`/api/scheduled-reports?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.data.reports);
        setTotalPages(data.data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterActive]);

  useEffect(() => {
    fetchScheduledReports();
  }, [fetchScheduledReports]);

  const toggleReportStatus = async (reportId: string) => {
    try {
      const response = await fetch(`/api/scheduled-reports/${reportId}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchScheduledReports();
      }
    } catch (error) {
      console.error('Error toggling report status:', error);
    }
  };

  const runReportNow = async (reportId: string) => {
    try {
      const response = await fetch(`/api/scheduled-reports/${reportId}/run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        alert('Report execution started successfully');
        fetchScheduledReports();
      }
    } catch (error) {
      console.error('Error running report:', error);
      alert('Failed to run report');
    }
  };

  const deleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this scheduled report?')) {
      return;
    }

    try {
      const response = await fetch(`/api/scheduled-reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchScheduledReports();
      }
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const formatSchedule = (schedule: ScheduledReport['schedule']) => {
    const { frequency, dayOfWeek, dayOfMonth, time } = schedule;
    const timeStr = `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;
    
    switch (frequency) {
      case 'DAILY':
        return `Daily at ${timeStr}`;
      case 'WEEKLY': {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `Weekly on ${days[dayOfWeek!]} at ${timeStr}`;
      }
      case 'MONTHLY':
        return `Monthly on ${dayOfMonth}${getOrdinalSuffix(dayOfMonth!)} at ${timeStr}`;
      case 'QUARTERLY':
        return `Quarterly at ${timeStr}`;
      case 'YEARLY':
        return `Yearly at ${timeStr}`;
      default:
        return frequency;
    }
  };

  const getOrdinalSuffix = (num: number) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  const getStatusColor = (report: ScheduledReport) => {
    if (!report.isActive) return 'text-gray-500';
    if (report.failureCount > 0) return 'text-red-500';
    return 'text-green-500';
  };

  const getDeliveryMethodIcon = (method: string) => {
    switch (method) {
      case 'EMAIL':
        return <FiMail className="w-4 h-4" />;
      case 'DOWNLOAD_LINK':
        return <FiDownload className="w-4 h-4" />;
      case 'BOTH':
        return (
          <div className="flex space-x-1">
            <FiMail className="w-4 h-4" />
            <FiDownload className="w-4 h-4" />
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Scheduled Reports</h2>
          <p className="text-gray-600">Manage automated report generation and delivery</p>
        </div>
        <button
          onClick={onCreateReport}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <FiPlus className="w-4 h-4" />
          <span>New Scheduled Report</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <select
          value={filterActive === undefined ? 'all' : filterActive.toString()}
          onChange={(e) => {
            const value = e.target.value;
            setFilterActive(value === 'all' ? undefined : value === 'true');
            setCurrentPage(1);
          }}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="all">All Reports</option>
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
        </select>
      </div>

      {/* Reports List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No scheduled reports</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new scheduled report.</p>
            <div className="mt-6">
              <button
                onClick={onCreateReport}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <FiPlus className="w-4 h-4 mr-2" />
                New Scheduled Report
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Run
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{report.name}</div>
                        <div className="text-sm text-gray-500">{report.template.name}</div>
                        <div className="text-xs text-gray-400">{report.format}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatSchedule(report.schedule)}</div>
                      <div className="text-xs text-gray-500">
                        Next: {new Date(report.nextRun).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <FiUsers className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{report.recipients.length}</span>
                        <div className="flex space-x-1">
                          {report.recipients.map((recipient, index) => (
                            <div key={index} className="text-gray-400">
                              {getDeliveryMethodIcon(recipient.deliveryMethod)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${getStatusColor(report)}`}>
                        {report.isActive ? 'Active' : 'Inactive'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Runs: {report.runCount} | Failures: {report.failureCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.lastRun ? new Date(report.lastRun).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleReportStatus(report._id)}
                          className={`p-1 rounded ${
                            report.isActive 
                              ? 'text-orange-600 hover:text-orange-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={report.isActive ? 'Pause' : 'Resume'}
                        >
                          {report.isActive ? <FiPause className="w-4 h-4" /> : <FiPlay className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => runReportNow(report._id)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Run Now"
                        >
                          <FiClock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditReport(report)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                          title="Edit"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteReport(report._id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Delete"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-2 text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ScheduledReports;
