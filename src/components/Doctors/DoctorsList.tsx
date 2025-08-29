// src/components/Doctors/DoctorsList.tsx - Updated with multiple file support
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
import { doctorAPI, Doctor } from '../../services/doctorAPI';
import { handleApiError } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const DoctorsList: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();
  
  const canCreate = hasPermission('doctors', 'create');
  const canUpdate = hasPermission('doctors', 'update');
  const canDelete = hasPermission('doctors', 'delete');

  // Fetch doctors data
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm.trim() })
      };
      
      const response = await doctorAPI.getDoctors(params);
      
      if (response.data) {
        setDoctors(response.data.doctors || []);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages || 1);
          setTotalDoctors(response.data.pagination.total || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      handleApiError(error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDoctors();
  }, [currentPage]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDoctors();
  };

  // Handle search input change with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== '') {
        setCurrentPage(1);
        fetchDoctors();
      } else if (searchTerm === '') {
        setCurrentPage(1);
        fetchDoctors();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle delete
  const handleDelete = async () => {
    if (!doctorToDelete) return;
    
    try {
      setDeleteLoading(true);
      await doctorAPI.deleteDoctor(doctorToDelete._id);
      toast.success('Doctor deleted successfully');
      setShowDeleteModal(false);
      setDoctorToDelete(null);
      fetchDoctors();
    } catch (error) {
      handleApiError(error);
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
      await doctorAPI.downloadFile(filename, originalName);
      toast.success('File download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  // Handle file view
  const handleViewFile = (filename: string) => {
    try {
      doctorAPI.viewFile(filename);
    } catch (error) {
      console.error('View error:', error);
      toast.error('Failed to view file');
    }
  };

  // Get total documents count for a doctor
  const getTotalDocuments = (doctor: Doctor) => {
    let count = 0;
    if (doctor.documents && doctor.documents.length > 0) {
      count += doctor.documents.length;
    }
    if (doctor.agreementFile?.filename) {
      count += 1;
    }
    return count;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctor Management</h1>
          <p className="text-gray-600 mt-1">
            Manage doctor information and contacts
            {totalDoctors > 0 && ` • ${totalDoctors} total doctors`}
          </p>
        </div>
        
        {canCreate && (
          <Link
            to="/doctors/new"
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Doctor
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
                placeholder="Search doctors by name, GST, PAN, email, or city..."
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

      {/* Doctors List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading doctors...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="p-8 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No doctors found</p>
            {searchTerm && (
              <p className="text-gray-400 text-sm mt-2">
                Try adjusting your search terms or clear the search to see all doctors
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
                      Doctor
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
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {doctors.map((doctor, index) => {
                    const totalDocs = getTotalDocuments(doctor);
                    
                    return (
                      <motion.tr
                        key={doctor._id}
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
                              <div className="text-sm font-medium text-gray-900">{doctor.name}</div>
                              <div className="text-sm text-gray-500">
                                Created: {formatDate(doctor.createdAt)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-900">
                              <FileText className="w-3 h-3 mr-1 text-gray-400" />
                              GST: {doctor.gstNumber}
                            </div>
                            <div className="flex items-center text-sm text-gray-900">
                              <CreditCard className="w-3 h-3 mr-1 text-gray-400" />
                              PAN: {doctor.panNumber}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-900">
                              <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                              {doctor.city}
                            </div>
                            <div className="text-sm text-gray-500">
                              {doctor.state.name} - {doctor.pincode}
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
                            {doctor.documents && doctor.documents.length > 0 && (
                              <div className="flex items-center space-x-1">
                                {doctor.documents.slice(0, 3).map((doc) => (
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
                                {doctor.documents.length > 3 && (
                                  <span className="text-xs text-gray-400">
                                    +{doctor.documents.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {/* Legacy agreement file */}
                            {doctor.agreementFile?.filename && (
                              <div className="flex items-center space-x-1">
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                  Legacy
                                </span>
                                <button
                                  onClick={() => handleViewFile(doctor.agreementFile!.filename)}
                                  className="text-blue-600 hover:text-blue-800 p-1 rounded"
                                  title="View Legacy Agreement"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDownloadFile(doctor.agreementFile!.filename, doctor.agreementFile!.originalName)}
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
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            doctor.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {doctor.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/doctors/${doctor._id}`}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded"
                              title="View Details & Contacts"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            
                            {canUpdate && (
                              <Link
                                to={`/doctors/${doctor._id}/edit`}
                                className="text-green-600 hover:text-green-900 p-1 rounded"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                            )}
                            
                            {canDelete && (
                              <button
                                onClick={() => {
                                  setDoctorToDelete(doctor);
                                  setShowDeleteModal(true);
                                }}
                                className="text-red-600 hover:text-red-900 p-1 rounded"
                                title="Delete"
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
            <div className="lg:hidden divide-y divide-gray-200">
              {doctors.map((doctor, index) => {
                const totalDocs = getTotalDocuments(doctor);
                
                return (
                  <motion.div
                    key={doctor._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900">{doctor.name}</h3>
                          
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <FileText className="w-4 h-4 mr-2" />
                              GST: {doctor.gstNumber}
                            </div>
                            
                            {/* Documents for Mobile */}
                            <div className="flex items-center text-sm text-gray-600">
                              <Files className="w-4 h-4 mr-2" />
                              Documents: {totalDocs > 0 ? (
                                <div className="flex items-center space-x-2 ml-1">
                                  <span className="text-green-600 font-medium">{totalDocs}</span>
                                  {doctor.documents && doctor.documents.length > 0 && (
                                    <div className="flex items-center space-x-1">
                                      {doctor.documents.slice(0, 2).map((doc) => (
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
                                  {doctor.agreementFile?.filename && (
                                    <div className="flex items-center space-x-1">
                                      <span className="text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded">
                                        Legacy
                                      </span>
                                      <button
                                        onClick={() => handleViewFile(doctor.agreementFile!.filename)}
                                        className="text-blue-600 hover:text-blue-800"
                                        title="View Legacy Agreement"
                                      >
                                        <Eye className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleDownloadFile(doctor.agreementFile!.filename, doctor.agreementFile!.originalName)}
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
                          
                          <div className="mt-3 flex items-center space-x-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              doctor.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {doctor.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span className="text-xs text-gray-500">
                              Created: {formatDate(doctor.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Link
                          to={`/doctors/${doctor._id}`}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        
                        {canUpdate && (
                          <Link
                            to={`/doctors/${doctor._id}/edit`}
                            className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                        )}
                        
                        {canDelete && (
                          <button
                            onClick={() => {
                              setDoctorToDelete(doctor);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"
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
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages} • {totalDoctors} total doctors
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
            )}
          </>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && doctorToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Doctor</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>"{doctorToDelete.name}"</strong>? This action cannot be undone and will also delete all associated contacts and files.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDoctorToDelete(null);
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
    </div>
  );
};

export default DoctorsList;