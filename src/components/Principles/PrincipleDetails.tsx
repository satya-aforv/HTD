import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Mail, Phone, MapPin, Save, X, Upload, FileText, User, Search, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { principleAPI, Principle } from '../../services/principleAPI';
import { useAuthStore } from '../../store/authStore';

const PrincipleDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();

  const [principle, setPrinciple] = useState<Principle | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Document management states
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [selectedDocumentFile, setSelectedDocumentFile] = useState<File | null>(null);
  const [documentData, setDocumentData] = useState({ fileType: 'other', description: '' });
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingDocuments, setDeletingDocuments] = useState<Set<string>>(new Set());

  const canCreate = hasPermission('principles', 'create');
  const canUpdate = hasPermission('principles', 'update');
  const canDelete = hasPermission('principles', 'delete');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>({ defaultValues: { isActive: true } });

  useEffect(() => { if (id) fetchPrincipleDetails(); }, [id]);
  useEffect(() => { if (id) fetchContacts(); }, [id, searchTerm]);

  const fetchPrincipleDetails = async () => {
    try {
      setLoading(true);
      const response = await principleAPI.getPrinciple(id!);
      setPrinciple(response.data.principle);
    } catch (error) {
      toast.error('Failed to fetch principle');
      navigate('/principles');
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      setContactsLoading(true);
      const params = { limit: 100, ...(searchTerm && { search: searchTerm.trim() }) };
      const response = await principleAPI.getPrincipleContacts(id!, params);
      setContacts(response.data.contacts || []);
    } catch (error) {
      toast.error('Failed to fetch contacts');
    } finally {
      setContactsLoading(false);
    }
  };

  // Document management functions
  const handleDocumentFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedDocumentFile(file);
      toast.success('File selected successfully');
    }
  };

  const handleAddDocument = async () => {
    if (!selectedDocumentFile || !id) return;
    try {
      setUploadingDocument(true);
      setUploadProgress(0);
      const formData = new FormData();
      formData.append('file', selectedDocumentFile);
      formData.append('fileType', documentData.fileType);
      formData.append('description', documentData.description);
      await principleAPI.addPrincipleDocument(id, formData, (e: any) => setUploadProgress(Math.round((e.loaded * 100) / e.total)));
      await fetchPrincipleDetails();
      setSelectedDocumentFile(null);
      setDocumentData({ fileType: 'other', description: '' });
      setShowAddDocument(false);
      toast.success('Document uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload document');
    } finally {
      setUploadingDocument(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!id) return;
    try {
      setDeletingDocuments(prev => new Set(prev).add(documentId));
      await principleAPI.deletePrincipleDocument(id, documentId);
      if (principle) {
        setPrinciple({ ...principle, documents: principle.documents.filter(doc => doc._id !== documentId) });
      }
      toast.success('Document deleted successfully');
    } catch (error) {
      toast.error('Failed to delete document');
    } finally {
      setDeletingDocuments(prev => { const newSet = new Set(prev); newSet.delete(documentId); return newSet; });
    }
  };

  // Contact management functions
  const handleAddContact = () => {
    reset({ departmentName: '', personName: '', email: '', phone: '', address: '', location: '', pincode: '', isActive: true });
    setEditingContact(null);
    setShowAddContact(true);
  };

  const handleEditContact = (contact: any) => {
    reset({ departmentName: contact.departmentName, personName: contact.personName, email: contact.email, phone: contact.phone, address: contact.address, location: contact.location, pincode: contact.pincode, isActive: contact.isActive });
    setEditingContact(contact);
    setShowAddContact(true);
  };

  const onSubmitContact = async (data: any) => {
    try {
      setSaving(true);
      if (editingContact) {
        await principleAPI.updatePrincipleContact(id!, editingContact._id, data);
        toast.success('Contact updated successfully');
      } else {
        await principleAPI.createPrincipleContact(id!, data);
        toast.success('Contact added successfully');
      }
      setShowAddContact(false);
      setEditingContact(null);
      fetchContacts();
    } catch (error) {
      toast.error('Failed to save contact');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = async () => {
    if (!contactToDelete) return;
    try {
      setDeleteLoading(true);
      await principleAPI.deletePrincipleContact(id!, contactToDelete._id);
      toast.success('Contact deleted successfully');
      setShowDeleteModal(false);
      setContactToDelete(null);
      fetchContacts();
    } catch (error) {
      toast.error('Failed to delete contact');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  if (!principle) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Principle Info */}
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate('/principles')} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{principle.name}</h1>
          <p className="text-gray-600 mt-1">Principle Details</p>
        </div>
      </div>

      {/* Documents Section */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
            <p className="text-gray-600 text-sm mt-1">Manage principle documents and files{principle.documents && principle.documents.length > 0 && ` • ${principle.documents.length} document(s)`}</p>
          </div>
          {canUpdate && (
            <button onClick={() => setShowAddDocument(true)} className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"><Plus className="w-4 h-4 mr-2" />Add Document</button>
          )}
        </div>
        {/* Documents List */}
        <div className="p-6">
          {principle.documents && principle.documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {principle.documents.map((doc) => (
                <div key={doc._id} className="bg-gray-50 rounded-lg p-4 flex flex-col">
                  <div className="flex items-center mb-2">
                    <FileText className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="font-medium text-gray-900">{doc.originalName}</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">{doc.fileType} • {doc.size} bytes</div>
                  <div className="flex-1 text-sm text-gray-700 mb-2">{doc.description}</div>
                  <div className="flex items-center space-x-2">
                    <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Download</a>
                    <a href={doc.viewUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a>
                    {canUpdate && (
                      <button onClick={() => handleDeleteDocument(doc._id)} disabled={deletingDocuments.has(doc._id)} className="text-red-600 hover:text-red-900 p-1 rounded" title="Delete Document">{deletingDocuments.has(doc._id) ? 'Deleting...' : <Trash2 className="w-4 h-4" />}</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8"><FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No documents found</p></div>
          )}
        </div>
      </div>

      {/* Contacts Section */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Department Contacts</h2>
            <p className="text-gray-600 text-sm mt-1">Manage principle department contacts and personnel</p>
          </div>
          {canCreate && (
            <button onClick={handleAddContact} className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"><Plus className="w-4 h-4 mr-2" />Add Contact</button>
          )}
        </div>
        {/* Search */}
        <div className="mt-4 px-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search contacts by department, name, or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
        </div>
        {/* Contacts List */}
        <div className="p-6">
          {contactsLoading ? (
            <div className="text-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div><p className="text-gray-500 mt-2">Loading contacts...</p></div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8"><User className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No contacts found</p>{searchTerm && (<p className="text-gray-400 text-sm mt-2">Try adjusting your search terms</p>)}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contacts.map((contact, index) => (
                <motion.div key={contact._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{contact.departmentName}</h3>
                      <p className="text-sm text-gray-600 mt-1">{contact.personName}</p>
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center text-sm text-gray-600"><Mail className="w-3 h-3 mr-2" />{contact.email}</div>
                        <div className="flex items-center text-sm text-gray-600"><Phone className="w-3 h-3 mr-2" />{contact.phone}</div>
                        <div className="flex items-center text-sm text-gray-600"><MapPin className="w-3 h-3 mr-2" />{contact.location}</div>
                      </div>
                      <div className="mt-3 text-xs text-gray-500">{contact.address} - {contact.pincode}</div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${contact.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{contact.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      {canUpdate && (<button onClick={() => handleEditContact(contact)} className="text-blue-600 hover:text-blue-900 p-1 rounded" title="Edit"><Edit className="w-4 h-4" /></button>)}
                      {canDelete && (<button onClick={() => { setContactToDelete(contact); setShowDeleteModal(true); }} className="text-red-600 hover:text-red-900 p-1 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Document Modal */}
      {showAddDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Add New Document</h3>
              <button onClick={() => { setShowAddDocument(false); setSelectedDocumentFile(null); setDocumentData({ fileType: 'other', description: '' }); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt" onChange={handleDocumentFileSelect} className="w-full" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File Type</label>
                <select value={documentData.fileType} onChange={e => setDocumentData({ ...documentData, fileType: e.target.value })} className="w-full border rounded px-3 py-2">
                  <option value="agreement">Agreement</option>
                  <option value="license">License</option>
                  <option value="certificate">Certificate</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={documentData.description} onChange={e => setDocumentData({ ...documentData, description: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-gray-200">
              <button onClick={() => { setShowAddDocument(false); setSelectedDocumentFile(null); setDocumentData({ fileType: 'other', description: '' }); }} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200">Cancel</button>
              <button onClick={handleAddDocument} disabled={!selectedDocumentFile || uploadingDocument} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors duration-200">{uploadingDocument ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Uploading...</>) : (<><Upload className="w-4 h-4 mr-2" />Upload Document</>)}</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add/Edit Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">{editingContact ? 'Edit Contact' : 'Add New Contact'}</h3>
                <button onClick={() => { setShowAddContact(false); setEditingContact(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit(onSubmitContact)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
                    <input {...register('departmentName', { required: 'Department name is required' })} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter department name" />
                    {errors.departmentName && (<p className="mt-1 text-sm text-red-600">{errors.departmentName.message}</p>)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Person Name *</label>
                    <input {...register('personName', { required: 'Person name is required' })} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter person name" />
                    {errors.personName && (<p className="mt-1 text-sm text-red-600">{errors.personName.message}</p>)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input {...register('email', { required: 'Email is required' })} type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter email address" />
                    {errors.email && (<p className="mt-1 text-sm text-red-600">{errors.email.message}</p>)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input {...register('phone', { required: 'Phone is required', minLength: { value: 10, message: 'Phone number must be at least 10 digits' } })} type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter phone number" />
                    {errors.phone && (<p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                    <textarea {...register('address', { required: 'Address is required' })} className="w-full border rounded px-3 py-2" placeholder="Enter address" />
                    {errors.address && (<p className="mt-1 text-sm text-red-600">{errors.address.message}</p>)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                    <input {...register('location', { required: 'Location is required' })} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter location" />
                    {errors.location && (<p className="mt-1 text-sm text-red-600">{errors.location.message}</p>)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                    <input {...register('pincode', { required: 'Pincode is required', minLength: { value: 6, message: 'Pincode must be 6 digits' }, maxLength: { value: 6, message: 'Pincode must be 6 digits' } })} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter pincode" />
                    {errors.pincode && (<p className="mt-1 text-sm text-red-600">{errors.pincode.message}</p>)}
                  </div>
                </div>
                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 mt-6">
                  <button type="button" onClick={() => { setShowAddContact(false); setEditingContact(null); }} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200">Cancel</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors duration-200">{saving ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>{editingContact ? 'Updating...' : 'Adding...'}</>) : (<><Save className="w-4 h-4 mr-2" />{editingContact ? 'Update Contact' : 'Add Contact'}</>)}</button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Contact Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Contact</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete the contact for <strong>"{contactToDelete?.personName}"</strong> in <strong>"{contactToDelete?.departmentName}"</strong>? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4">
              <button onClick={() => { setShowDeleteModal(false); setContactToDelete(null); }} disabled={deleteLoading} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50">Cancel</button>
              <button onClick={handleDeleteContact} disabled={deleteLoading} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 flex items-center">{deleteLoading ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Deleting...</>) : ('Delete Contact')}</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PrincipleDetails; 