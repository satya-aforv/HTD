// src/services/permissionsAPI.ts
import api from './baseAPI';

export interface PermissionData {
  name: string;
  description?: string;
  module: string;
  action: string;
  isActive?: boolean;
}

export const permissionsAPI = {
  getPermissions: async () => {
    try {
      console.log('Fetching all permissions');
      const response = await api.get('/permissions');
      console.log('Permissions API response:', response.data);
      return response;
    } catch (error) {
      console.error('Error fetching permissions:', error);
      throw error;
    }
  },
  
  getPermission: async (id: string) => {
    try {
      console.log('Fetching permission with ID:', id);
      const response = await api.get(`/permissions/${id}`);
      console.log('Permission API response:', response.data);
      return response;
    } catch (error) {
      console.error('Error fetching permission:', error);
      throw error;
    }
  },
  
  createPermission: async (data: PermissionData) => {
    try {
      console.log('Creating permission with data:', data);
      const response = await api.post('/permissions', data);
      console.log('Create permission response:', response.data);
      return response;
    } catch (error) {
      console.error('Error creating permission:', error);
      throw error;
    }
  },
  
  updatePermission: async (id: string, data: Partial<PermissionData>) => {
    try {
      console.log('Updating permission:', id, 'with data:', data);
      const response = await api.put(`/permissions/${id}`, data);
      console.log('Update permission response:', response.data);
      return response;
    } catch (error) {
      console.error('Error updating permission:', error);
      throw error;
    }
  },
  
  deletePermission: async (id: string) => {
    try {
      console.log('Deleting permission with ID:', id);
      const response = await api.delete(`/permissions/${id}`);
      console.log('Delete permission response:', response.data);
      return response;
    } catch (error) {
      console.error('Error deleting permission:', error);
      throw error;
    }
  },
};
