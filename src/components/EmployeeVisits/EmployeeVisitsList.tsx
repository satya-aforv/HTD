import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { employeeVisitAPI, EmployeeVisit } from '../../services/employeeVisitAPI';
import { usersAPI } from '../../services/usersAPI';
import { useAuthStore } from '../../store/authStore';

const EmployeeVisitsList: React.FC = () => {
  const [visits, setVisits] = useState<EmployeeVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVisits, setTotalVisits] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [visitToDelete, setVisitToDelete] = useState<EmployeeVisit | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [users, setUsers] = useState<{ _id: string; name: string }[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<EmployeeVisit | null>(null);

  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();

  const canCreate = hasPermission('employeeTravelLogs', 'create');
  const canUpdate = hasPermission('employeeTravelLogs', 'update');
  const canDelete = hasPermission('employeeTravelLogs', 'delete');

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm.trim() })
      };
      const response = await employeeVisitAPI.getVisits(params);
      if (response.data) {
        setVisits(response.data.logs || []);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages || 1);
          setTotalVisits(response.data.pagination.total || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching visits:', error);
      toast.error('Failed to fetch employee visits');
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, [currentPage]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchVisits();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    // Fetch users for mapping employeeId to name
    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        const response = await usersAPI.getUsers({ limit: 100 });
        setUsers(response.data.users || []);
      } catch (error) {
        console.error('Error fetching visits:', error);
      toast.error('Failed to fetch employee visits');
        setUsers([]);
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleDelete = async () => {
    if (!visitToDelete) return;
    try {
      setDeleteLoading(true);
      await employeeVisitAPI.deleteVisit(visitToDelete._id!);
      toast.success('Visit deleted successfully');
      setShowDeleteModal(false);
      setVisitToDelete(null);
      fetchVisits();
    } catch (error) {
      console.error('Error fetching visits:', error);
      toast.error('Failed to fetch employee visits');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Helper to get employee name by id
  const getEmployeeName = (id: string) => {
    const user = users.find(u => u._id === id);
    return user ? user.name : id;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logistics Logs</h1>
          <p className="text-gray-600 mt-1">
            Manage employee travel and work site logs
            {totalVisits > 0 && ` • ${totalVisits} total logs`}
          </p>
        </div>
        {canCreate && (
          <Link
            to="/logistic-logs/new"
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Visit
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={e => { e.preventDefault(); fetchVisits(); }} className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by employee, location, purpose..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
            title="Search"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Visits List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start From</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8">Loading...</td></tr>
            ) : visits.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8">No visits found.</td></tr>
            ) : visits.map(visit => (
              <tr key={visit._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">{getEmployeeName(visit.employeeId)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{visit.startFrom}</td>
                <td className="px-6 py-4 whitespace-nowrap">{visit.location}</td>
                <td className="px-6 py-4 whitespace-nowrap">{visit.purpose}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(visit.startTime).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(visit.endTime).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                  <button
                    title="View Details"
                    onClick={() => { setSelectedVisit(visit); setShowDetailsModal(true); }}
                    className="text-blue-600 hover:text-blue-900 p-1 rounded"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {canUpdate && (
                    <Link
                      to={`/logistic-logs/${visit._id}/edit`}
                      className="text-green-600 hover:text-green-900 p-1 rounded"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                  )}
                  {canDelete && (
                    <button
                      title="Delete"
                      onClick={() => { setVisitToDelete(visit); setShowDeleteModal(true); }}
                      className="text-red-600 hover:text-red-900 p-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-gray-600">Total: {totalVisits}</span>
        <div className="flex gap-2">
          <button
            className="btn btn-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span className="text-gray-700">Page {currentPage} of {totalPages}</span>
          <button
            className="btn btn-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && visitToDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-lg font-bold mb-4">Delete Visit</h2>
            <p>Are you sure you want to delete this visit?</p>
            <div className="flex gap-2 mt-4">
              <button className="btn btn-error" onClick={handleDelete} disabled={deleteLoading}>Yes, Delete</button>
              <button className="btn" onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex-1">Logistics Log Details</h3>
              <button
                onClick={() => { setShowDetailsModal(false); setSelectedVisit(null); }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                title="Close"
              >
                Close
              </button>
            </div>
            <div className="space-y-3">
              <div><span className="text-sm font-medium text-gray-500">Employee:</span> <span className="ml-2 text-sm text-gray-900">{getEmployeeName(selectedVisit.employeeId)}</span></div>
              <div><span className="text-sm font-medium text-gray-500">Start From:</span> <span className="ml-2 text-sm text-gray-900">{selectedVisit.startFrom}</span></div>
              <div><span className="text-sm font-medium text-gray-500">Location:</span> <span className="ml-2 text-sm text-gray-900">{selectedVisit.location}</span></div>
              <div><span className="text-sm font-medium text-gray-500">Purpose:</span> <span className="ml-2 text-sm text-gray-900">{selectedVisit.purpose}</span></div>
              <div><span className="text-sm font-medium text-gray-500">Start Time:</span> <span className="ml-2 text-sm text-gray-900">{new Date(selectedVisit.startTime).toLocaleString()}</span></div>
              <div><span className="text-sm font-medium text-gray-500">End Time:</span> <span className="ml-2 text-sm text-gray-900">{new Date(selectedVisit.endTime).toLocaleString()}</span></div>
              {/* Add more fields if desired */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeVisitsList; 