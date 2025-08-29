// 3. PortfolioList component - src/components/Portfolio/PortfolioList.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { portfolioAPI } from '../../services/portfolioAPI';
import { Eye, Edit, Trash2, Plus } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const PortfolioList: React.FC = () => {
  const [portfolios, setPortfolios] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [portfolioToDelete, setPortfolioToDelete] = React.useState(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();
  const canCreate = hasPermission('portfolios', 'create');
  const canUpdate = hasPermission('portfolios', 'update');
  const canDelete = hasPermission('portfolios', 'delete');

  React.useEffect(() => {
    setLoading(true);
    portfolioAPI.getPortfolios().then(res => {
      setPortfolios(res.data.portfolios || []);
      setLoading(false);
    }).catch(() => setLoading(false));
}, []);

  const handleDelete = async () => {
    if (!portfolioToDelete) return;
    try {
      setDeleteLoading(true);
      await portfolioAPI.deletePortfolio(portfolioToDelete._id);
      toast.success('Portfolio deleted successfully');
      setShowDeleteModal(false);
      setPortfolioToDelete(null);
      // Refresh list
      setLoading(true);
      const res = await portfolioAPI.getPortfolios();
      setPortfolios(res.data.portfolios || []);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to delete portfolio');
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portfolio Management</h1>
          <p className="text-gray-600 mt-1">Manage portfolio information</p>
        </div>
        {canCreate && (
          <button
            onClick={() => navigate('/portfolios/new')}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Portfolio
          </button>
        )}
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Portfolio Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8">Loading...</td></tr>
            ) : portfolios.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">No portfolios found</td></tr>
            ) : portfolios.map((p, idx) => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                <td className="px-6 py-4 text-gray-700">{p.description}</td>
                <td className="px-6 py-4 text-gray-700">{p.createdBy?.name || '-'}</td>
                <td className="px-6 py-4 text-gray-700">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{p.isActive ? 'Active' : 'Inactive'}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button onClick={() => navigate(`/portfolios/${p._id}`)} className="text-blue-600 hover:text-blue-900 p-1 rounded" title="View Details">
                      <Eye className="w-4 h-4" />
                    </button>
                    {canUpdate && (
                      <button onClick={() => navigate(`/portfolios/${p._id}/edit`)} className="text-green-600 hover:text-green-900 p-1 rounded" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => { setPortfolioToDelete(p); setShowDeleteModal(true); }} className="text-red-600 hover:text-red-900 p-1 rounded" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Delete Modal */}
      {showDeleteModal && portfolioToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Portfolio</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete <strong>"{portfolioToDelete.name}"</strong>? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4">
              <button onClick={() => { setShowDeleteModal(false); setPortfolioToDelete(null); }} disabled={deleteLoading} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleteLoading} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 flex items-center">{deleteLoading ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Deleting...</>) : ('Delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioList;
