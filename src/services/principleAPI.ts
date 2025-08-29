import api, { handleApiError } from './api';

export interface PrincipleDocument {
  _id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  fileType: 'agreement' | 'license' | 'certificate' | 'other';
  description?: string;
  uploadedAt: string;
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
  };
  downloadUrl?: string;
  viewUrl?: string;
}

export interface Principle {
  _id: string;
  name: string;
  email: string;
  phone: string;
  gstNumber: string;
  panNumber: string;
  documents: PrincipleDocument[];
  documentsCount?: number;
  agreementFile?: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    uploadedAt: string;
    uploadedBy: string;
  };
  gstAddress: string;
  city: string;
  state: {
    _id: string;
    name: string;
    code: string;
  };
  pincode: string;
  isActive: boolean;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  updatedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const principleAPI = {
  getPrinciples: (params: any) => api.get('/principles', { params }),
  getPrinciple: (id: string) => api.get(`/principles/${id}`),
  createPrinciple: (data: any) => api.post('/principles', data),
  updatePrinciple: (id: string, data: any) => api.put(`/principles/${id}`, data),
  deletePrinciple: (id: string) => api.delete(`/principles/${id}`),
  // Contacts
  getPrincipleContacts: (principleId: string, params?: any) => api.get(`/principles/${principleId}/contacts`, { params }),
  createPrincipleContact: (principleId: string, contact: any) => api.post(`/principles/${principleId}/contacts`, contact),
  updatePrincipleContact: (principleId: string, contactId: string, contact: any) => api.put(`/principles/${principleId}/contacts/${contactId}`, contact),
  deletePrincipleContact: (principleId: string, contactId: string) => api.delete(`/principles/${principleId}/contacts/${contactId}`),
  // Documents
  getPrincipleDocuments: (principleId: string) => api.get(`/principles/${principleId}`), // principle.documents is included in getPrinciple
  addPrincipleDocument: (principleId: string, formData: any, onUploadProgress?: (progressEvent: any) => void) =>
    api.post(`/principles/${principleId}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress }),
  deletePrincipleDocument: (principleId: string, documentId: string) =>
    api.delete(`/principles/${principleId}/documents/${documentId}`),
}; 