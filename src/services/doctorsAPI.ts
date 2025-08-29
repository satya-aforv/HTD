// src/services/doctorsAPI.ts
import api from './baseAPI';

export interface DoctorFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export interface DoctorData {
  name: string;
  email?: string;
  contactNumber: string;
  specialization: string;
  qualification: string;
  experience?: number;
  hospitalId?: string;
  licenseNumber?: string;
  isActive?: boolean;
}

export const doctorsAPI = {
  getDoctors: async (params?: DoctorFilters) => {
    try {
      console.log('Fetching doctors with params:', params);
      const response = await api.get('/doctors', { params });
      console.log('Doctors API response:', response.data);
      return response;
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }
  },
  
  getDoctor: async (id: string) => {
    try {
      console.log('Fetching doctor with ID:', id);
      const response = await api.get(`/doctors/${id}`);
      console.log('Doctor API response:', response.data);
      return response;
    } catch (error) {
      console.error('Error fetching doctor:', error);
      throw error;
    }
  },
  
  createDoctor: async (data: DoctorData) => {
    try {
      console.log('Creating doctor with data:', data);
      const response = await api.post('/doctors', data);
      console.log('Create doctor response:', response.data);
      return response;
    } catch (error) {
      console.error('Error creating doctor:', error);
      throw error;
    }
  },
  
  updateDoctor: async (id: string, data: Partial<DoctorData>) => {
    try {
      console.log('Updating doctor:', id, 'with data:', data);
      const response = await api.put(`/doctors/${id}`, data);
      console.log('Update doctor response:', response.data);
      return response;
    } catch (error) {
      console.error('Error updating doctor:', error);
      throw error;
    }
  },
  
  deleteDoctor: async (id: string) => {
    try {
      console.log('Deleting doctor with ID:', id);
      const response = await api.delete(`/doctors/${id}`);
      console.log('Delete doctor response:', response.data);
      return response;
    } catch (error) {
      console.error('Error deleting doctor:', error);
      throw error;
    }
  },
};
