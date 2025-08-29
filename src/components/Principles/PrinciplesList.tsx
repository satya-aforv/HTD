import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  ChevronLeft,
  ChevronRight,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Users,
  Download,
  ExternalLink,
  CheckCircle,
  XCircle,
  FolderOpen,
  Files
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { principleAPI, Principle } from '../../services/principleAPI';
import { useAuthStore } from '../../store/authStore';
import PrincipleDetails from './PrincipleDetails';

const PrinciplesList: React.FC = () => {
  const [principles, setPrinciples] = useState<Principle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPrinciples, setTotalPrinciples] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [principleToDelete, setPrincipleToDelete] = useState<Principle | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [selectedPrinciple, setSelectedPrinciple] = useState<Principle | null>(null);
  const [modalContacts, setModalContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();
  
  const canCreate = hasPermission('principles', 'create');
  const canUpdate = hasPermission('principles', 'update');
  const canDelete = hasPermission('principles', 'delete');

  // Fetch principles data
  const fetchPrinciples = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm.trim() })
      };
      
      const response = await principleAPI.getPrinciples(params);
      
      if (response.data) {
        setPrinciples(response.data.principles || []);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages || 1);
          setTotalPrinciples(response.data.pagination.total || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching principles:', error);
      toast.error('Failed to fetch principles');
      setPrinciples([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPrinciples();
  }, [currentPage]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPrinciples();
  };

  // Handle search input change with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== '') {
        setCurrentPage(1);
        fetchPrinciples();
      } else if (searchTerm === '') {
        setCurrentPage(1);
        fetchPrinciples();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle delete
  const handleDelete = async () => {
    if (!principleToDelete) return;
    
    try {
      setDeleteLoading(true);
      await principleAPI.deletePrinciple(principleToDelete._id);
      toast.success('Principle deleted successfully');
      setShowDeleteModal(false);
      setPrincipleToDelete(null);
      fetchPrinciples();
    } catch (error) {
      console.error('Error deleting principle:', error);
      toast.error('Failed to delete principle');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon based on mime type
  const getFileIcon = (mimetype: string) => {
    if (mimetype?.includes('pdf')) return <FileText className="w-4 h-4 text-red-600" />;
    if (mimetype?.includes('word') || mimetype?.includes('document')) return <FileText className="w-4 h-4 text-blue-600" />;
    if (mimetype?.includes('sheet') || mimetype?.includes('excel')) return <FileText className="w-4 h-4 text-green-600" />;
    if (mimetype?.includes('image')) return <FileText className="w-4 h-4 text-purple-600" />;
    return <FileText className="w-4 h-4 text-gray-600" />;
  };

  // Get file type color
  const getFileTypeColor = (fileType: string) => {
    switch (fileType) {
      case 'agreement': return 'bg-blue-100 text-blue-800';
      case 'license': return 'bg-green-100 text-green-800';
      case 'certificate': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle file download
  const handleDownloadFile = async (filename: string, originalName: string) => {
    try {
      await principleAPI.downloadFile(filename, originalName);
      toast.success('File download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  // Handle file view
  const handleViewFile = (filename: string) => {
    try {
      principleAPI.viewFile(filename);
    } catch (error) {
      console.error('View error:', error);
      toast.error('Failed to view file');
    }
  };

  // Get total documents count for a principle
  const getTotalDocuments = (principle: Principle) => {
    let count = 0;
    if (principle.documents && principle.documents.length > 0) {
      count += principle.documents.length;
    }
    if (principle.agreementFile?.filename) {
      count += 1;
    }
    return count;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Principle Management</h1>
          <p className="text-gray-600 mt-1">
            Manage principle information and contacts
            {totalPrinciples > 0 && ` • ${totalPrinciples} total principles`}
          </p>
        </div>
        {canCreate && (
          <Link
            to="/principles/new"
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Principle
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search principles by name, GST, PAN, email, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
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

      {/* Principles List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading principles...</p>
          </div>
        ) : principles.length === 0 ? (
          <div className="p-8 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No principles found</p>
            {searchTerm && (
              <p className="text-gray-400 text-sm mt-2">
                Try adjusting your search terms or clear the search to see all principles
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Principle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documents
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {principles.map((principle, index) => {
                    const totalDocs = getTotalDocuments(principle);
                    
                    return (
                      <motion.tr
                        key={principle._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                              <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{principle.name}</div>
                              <div className="text-sm text-gray-500">
                                Created: {formatDate(principle.createdAt)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-900">
                              <Mail className="w-3 h-3 mr-1 text-gray-400" />
                              {principle.email}
                            </div>
                            <div className="flex items-center text-sm text-gray-900">
                              <Phone className="w-3 h-3 mr-1 text-gray-400" />
                              {principle.phone}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-900">
                              <FileText className="w-3 h-3 mr-1 text-gray-400" />
                              GST: {principle.gstNumber}
                            </div>
                            <div className="flex items-center text-sm text-gray-900">
                              <CreditCard className="w-3 h-3 mr-1 text-gray-400" />
                              PAN: {principle.panNumber}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-900">
                              <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                              {principle.city}
                            </div>
                            <div className="text-sm text-gray-500">
                              {principle.state.name} - {principle.pincode}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center text-sm text-gray-900">
                              <Files className="w-4 h-4 mr-1 text-gray-400" />
                              <span className="font-medium">{totalDocs}</span>
                              <span className="text-gray-500 ml-1">
                                {totalDocs === 1 ? 'document' : 'documents'}
                              </span>
                            </div>
                            {/* Show recent documents */}
                            {principle.documents && principle.documents.length > 0 && (
                              <div className="flex items-center space-x-1">
                                {principle.documents.slice(0, 3).map((doc) => (
                                  <div
                                    key={doc._id}
                                    className="flex items-center space-x-1"
                                  >
                                    <button
                                      onClick={() => handleViewFile(doc.filename)}
                                      className="text-blue-600 hover:text-blue-800 p-1 rounded"
                                      title={`View ${doc.originalName}`}
                                    >
                                      <Eye className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDownloadFile(doc.filename, doc.originalName)}
                                      className="text-green-600 hover:text-green-800 p-1 rounded"
                                      title={`Download ${doc.originalName}`}
                                    >
                                      <Download className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                                {principle.documents.length > 3 && (
                                  <span className="text-xs text-gray-400">
                                    +{principle.documents.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                            {/* Legacy agreement file */}
                            {principle.agreementFile?.filename && (
                              <div className="flex items-center space-x-1">
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                  Legacy
                                </span>
                                <button
                                  onClick={() => handleViewFile(principle.agreementFile!.filename)}
                                  className="text-blue-600 hover:text-blue-800 p-1 rounded"
                                  title="View Legacy Agreement"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDownloadFile(principle.agreementFile!.filename, principle.agreementFile!.originalName)}
                                  className="text-green-600 hover:text-green-800 p-1 rounded"
                                  title="Download Legacy Agreement"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                            {totalDocs === 0 && (
                              <span className="text-xs text-gray-400 flex items-center">
                                <XCircle className="w-3 h-3 mr-1" />
                                No documents
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={async () => {
                              setSelectedPrinciple(principle);
                              setShowContactsModal(true);
                              setContactsLoading(true);
                              try {
                                const res = await principleAPI.getPrinciple(principle._id);
                                setModalContacts(res.data.contacts || []);
                              } catch (e) {
                                setModalContacts([]);
                              }
                              setContactsLoading(false);
                            }}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium"
                            title="View Contacts"
                          >
                            {(principle.contactsCount !== undefined ? principle.contactsCount : (principle.contacts?.length || 0))} Contact{(principle.contactsCount !== undefined ? principle.contactsCount : (principle.contacts?.length || 0)) === 1 ? '' : 's'}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            principle.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {principle.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/principles/${principle._id}`}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded"
                              title="View Details & Contacts"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            {canUpdate && (
                              <Link
                                to={`/principles/${principle._id}/edit`}
                                className="text-yellow-600 hover:text-yellow-900 p-1 rounded"
                                title="Edit Principle"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => {
                                  setPrincipleToDelete(principle);
                                  setShowDeleteModal(true);
                                }}
                                className="text-red-600 hover:text-red-900 p-1 rounded"
                                title="Delete Principle"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Mobile Cards */}
            <div className="block lg:hidden">
              {principles.map((principle, index) => {
                const totalDocs = getTotalDocuments(principle);
                return (
                  <motion.div
                    key={principle._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="p-6 border-b last:border-b-0"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{principle.name}</h3>
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="w-4 h-4 mr-2" />
                              {principle.email}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="w-4 h-4 mr-2" />
                              {principle.phone}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="w-4 h-4 mr-2" />
                              {principle.city}, {principle.state.name}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <FileText className="w-4 h-4 mr-2" />
                              GST: {principle.gstNumber}
                            </div>
                            {/* Documents for Mobile */}
                            <div className="flex items-center text-sm text-gray-600">
                              <Files className="w-4 h-4 mr-2" />
                              Documents: {totalDocs > 0 ? (
                                <div className="flex items-center space-x-2 ml-1">
                                  <span className="text-green-600 font-medium">{totalDocs}</span>
                                  {principle.documents && principle.documents.length > 0 && (
                                    <div className="flex items-center space-x-1">
                                      {principle.documents.slice(0, 2).map((doc) => (
                                        <div key={doc._id} className="flex items-center space-x-1">
                                          <button
                                            onClick={() => handleViewFile(doc.filename)}
                                            className="text-blue-600 hover:text-blue-800"
                                            title={`View ${doc.originalName}`}
                                          >
                                            <Eye className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={() => handleDownloadFile(doc.filename, doc.originalName)}
                                            className="text-green-600 hover:text-green-800"
                                            title={`Download ${doc.originalName}`}
                                          >
                                            <Download className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {principle.agreementFile?.filename && (
                                    <div className="flex items-center space-x-1">
                                      <span className="text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded">
                                        Legacy
                                      </span>
                                      <button
                                        onClick={() => handleViewFile(principle.agreementFile!.filename)}
                                        className="text-blue-600 hover:text-blue-800"
                                        title="View Legacy Agreement"
                                      >
                                        <Eye className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleDownloadFile(principle.agreementFile!.filename, principle.agreementFile!.originalName)}
                                        className="text-green-600 hover:text-green-800"
                                        title="Download Legacy Agreement"
                                      >
                                        <Download className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400 ml-1">None</span>
                              )}
                            </div>
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            principle.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {principle.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            Created: {formatDate(principle.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Link
                          to={`/principles/${principle._id}`}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {canUpdate && (
                          <Link
                            to={`/principles/${principle._id}/edit`}
                            className="text-yellow-600 hover:text-yellow-900 p-2 rounded-lg hover:bg-yellow-50"
                            title="Edit Principle"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => {
                              setPrincipleToDelete(principle);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"
                            title="Delete Principle"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages} • {totalPrinciples} total principles
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 text-sm font-medium">
                  {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      {/* Delete Modal */}
      {showDeleteModal && principleToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Principle</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>"{principleToDelete.name}"</strong>? This action cannot be undone and will also delete all associated contacts and files.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setPrincipleToDelete(null);
                }}
                disabled={deleteLoading}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 flex items-center"
              >
                {deleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* Contacts Modal */}
      {showContactsModal && selectedPrinciple && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowContactsModal(false)}
              title="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-semibold mb-4 text-blue-700">Department Contacts</h2>
            {contactsLoading ? (
              <div>Loading contacts...</div>
            ) : modalContacts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {modalContacts.map((contact, idx) => (
                  <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                    <div className="font-semibold text-blue-700 mb-1">{contact.departmentName}</div>
                    <div className="text-gray-900">{contact.personName}</div>
                    <div className="text-gray-600 text-sm">{contact.email}</div>
                    <div className="text-gray-600 text-sm">{contact.phone}</div>
                    <div className="text-gray-600 text-sm">{contact.address}</div>
                    <div className="text-gray-600 text-sm">{contact.location}</div>
                    <div className="text-gray-600 text-sm">Pincode: {contact.pincode}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500">No contacts found for this principle.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrinciplesList; 