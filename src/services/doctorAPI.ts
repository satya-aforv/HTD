// src/services/doctorAPI.ts - Cleaned based on image fields
import api, { handleApiError } from './api';
import { useAuthStore } from '../store/authStore';

export interface Doctor {
  _id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  Hospitallist: string[];
  location: string;
  targets: number;
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

export interface DoctorFormData {
  name: string;
  email: string;
  phone: string;
  specialization: string;
  Hospitallist: string[];
  location: string;
  targets: number;
  isActive?: boolean;
  fileTypes?: string[];
  descriptions?: string[];
  agreementFile?: File;
}

const createFormDataRequest = async (
  url: string,
  data: DoctorFormData | FormData,
  method: 'POST' | 'PUT' = 'POST',
  onProgress?: (progress: number) => void
) => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const token = useAuthStore.getState().accessToken;

  return new Promise<any>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({ data: response });
        } catch (e) {
          resolve({ data: xhr.responseText });
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          const error = new Error(errorData.message || `HTTP ${xhr.status}: ${xhr.statusText}`);
          (error as any).response = {
            status: xhr.status,
            data: errorData,
          };
          reject(error);
        } catch (e) {
          const error = new Error(`HTTP ${xhr.status}: ${xhr.statusText}`);
          (error as any).response = {
            status: xhr.status,
            data: { message: xhr.statusText },
          };
          reject(error);
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error occurred'));
    };

    xhr.open(method, `${API_BASE_URL}${url}`, true);

    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    let requestData: FormData;
    if (data instanceof FormData) {
      requestData = data;
    } else {
      requestData = new FormData();
      Object.keys(data).forEach((key) => {
        const value = (data as any)[key];
        if (value !== undefined && value !== null) {
          if (key === 'fileTypes' && Array.isArray(value)) {
            value.forEach((type: string) => {
              requestData.append('fileTypes', type);
            });
          } else if (key === 'descriptions' && Array.isArray(value)) {
            value.forEach((desc: string) => {
              requestData.append('descriptions', desc);
            });
          } else if (key === 'agreementFile' && value instanceof File) {
            requestData.append('agreementFile', value);
          } else {
            requestData.append(key, value.toString());
          }
        }
      });
    }

    xhr.send(requestData);
  });
};

export const doctorAPI = {
  getDoctors: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await api.get('/doctors', { params });
    return response;
  },

  getDoctor: async (id: string) => {
    const response = await api.get(`/doctors/${id}`);
    return response;
  },

  createDoctor: async (data: DoctorFormData, onProgress?: (progress: number) => void) => {
    if (data.agreementFile instanceof File) {
      return await createFormDataRequest('/doctors', data, 'POST', onProgress);
    } else {
      const { fileTypes, descriptions, agreementFile, ...doctorData } = data;
      const response = await api.post('/doctors', doctorData);
      return response;
    }
  },

  updateDoctor: async (id: string, data: DoctorFormData, onProgress?: (progress: number) => void) => {
    if (data.agreementFile instanceof File) {
      return await createFormDataRequest(`/doctors/${id}`, data, 'PUT', onProgress);
    } else {
      const { fileTypes, descriptions, agreementFile, ...doctorData } = data;
      const response = await api.put(`/doctors/${id}`, doctorData);
      return response;
    }
  },

  deleteDoctor: async (id: string) => {
    const response = await api.delete(`/doctors/${id}`);
    return response;
  },
};
