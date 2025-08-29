// src/services/hospitalsAPI.ts
import api from './baseAPI';

export interface HospitalFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export interface HospitalData {
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  };
  contactNumber: string;
  email?: string;
  website?: string;
  type?: string;
  specializations?: string[];
}

export interface HospitalContactData {
  name: string;
  designation: string;
  contactNumber: string;
  email?: string;
  department?: string;
}

export const hospitalsAPI = {
  getHospitals: async (params?: HospitalFilters) => {
    try {
      console.log('Fetching hospitals with params:', params);
      const response = await api.get('/hospitals', { params });
      console.log('Hospitals API response:', response.data);
      return response;
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      throw error;
    }
  },
  
  getHospital: async (id: string) => {
    try {
      console.log('Fetching hospital with ID:', id);
      const response = await api.get(`/hospitals/${id}`);
      console.log('Hospital API response:', response.data);
      return response;
    } catch (error) {
      console.error('Error fetching hospital:', error);
      throw error;
    }
  },
  
  createHospital: async (data: HospitalData) => {
    try {
      console.log('Creating hospital with data:', data);
      const response = await api.post('/hospitals', data);
      console.log('Create hospital response:', response.data);
      return response;
    } catch (error) {
      console.error('Error creating hospital:', error);
      throw error;
    }
  },
  
  updateHospital: async (id: string, data: Partial<HospitalData>) => {
    try {
      console.log('Updating hospital:', id, 'with data:', data);
      const response = await api.put(`/hospitals/${id}`, data);
      console.log('Update hospital response:', response.data);
      return response;
    } catch (error) {
      console.error('Error updating hospital:', error);
      throw error;
    }
  },
  
  deleteHospital: async (id: string) => {
    try {
      console.log('Deleting hospital with ID:', id);
      const response = await api.delete(`/hospitals/${id}`);
      console.log('Delete hospital response:', response.data);
      return response;
    } catch (error) {
      console.error('Error deleting hospital:', error);
      throw error;
    }
  },

  // Hospital Contacts
  getHospitalContacts: async (hospitalId: string, params?: HospitalFilters) => {
    try {
      console.log('Fetching hospital contacts for hospital:', hospitalId, 'with params:', params);
      const response = await api.get(`/hospitals/${hospitalId}/contacts`, { params });
      console.log('Hospital contacts API response:', response.data);
      return response;
    } catch (error) {
      console.error('Error fetching hospital contacts:', error);
      throw error;
    }
  },
  
  createHospitalContact: async (hospitalId: string, data: HospitalContactData) => {
    try {
      console.log('Creating hospital contact for hospital:', hospitalId, 'with data:', data);
      const response = await api.post(`/hospitals/${hospitalId}/contacts`, data);
      console.log('Create hospital contact response:', response.data);
      return response;
    } catch (error) {
      console.error('Error creating hospital contact:', error);
      throw error;
    }
  },
  
  updateHospitalContact: async (hospitalId: string, contactId: string, data: Partial<HospitalContactData>) => {
    try {
      console.log('Updating hospital contact:', contactId, 'for hospital:', hospitalId, 'with data:', data);
      const response = await api.put(`/hospitals/${hospitalId}/contacts/${contactId}`, data);
      console.log('Update hospital contact response:', response.data);
      return response;
    } catch (error) {
      console.error('Error updating hospital contact:', error);
      throw error;
    }
  },
  
  deleteHospitalContact: async (hospitalId: string, contactId: string) => {
    try {
      console.log('Deleting hospital contact:', contactId, 'for hospital:', hospitalId);
      const response = await api.delete(`/hospitals/${hospitalId}/contacts/${contactId}`);
      console.log('Delete hospital contact response:', response.data);
      return response;
    } catch (error) {
      console.error('Error deleting hospital contact:', error);
      throw error;
    }
  },
};
