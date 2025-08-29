// src/services/usersAPI.ts
import api from './baseAPI';

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  designation?: string;
}

export interface UserData {
  name: string;
  email: string;
  password?: string;
  designation?: string;
  role?: string;
  permissions?: string[];
}

export const usersAPI = {
  getUsers: async (params?: UserFilters) => {
    try {
      console.log('Fetching users with params:', params);
      const response = await api.get('/users', { params });
      console.log('Users API response:', response.data);
      return response;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },
  
  getUser: async (id: string) => {
    try {
      console.log('Fetching user with ID:', id);
      const response = await api.get(`/users/${id}`);
      console.log('User API response:', response.data);
      return response;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },
  
  createUser: async (data: UserData) => {
    try {
      console.log('Creating user with data:', data);
      const response = await api.post('/users', data);
      console.log('Create user response:', response.data);
      return response;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },
  
  updateUser: async (id: string, data: Partial<UserData>) => {
    try {
      console.log('Updating user:', id, 'with data:', data);
      const response = await api.put(`/users/${id}`, data);
      console.log('Update user response:', response.data);
      return response;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },
  
  deleteUser: async (id: string) => {
    try {
      console.log('Deleting user with ID:', id);
      const response = await api.delete(`/users/${id}`);
      console.log('Delete user response:', response.data);
      return response;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },
  
  getUserPermissions: async (id: string) => {
    try {
      console.log('Fetching user permissions for ID:', id);
      const response = await api.get(`/users/${id}/permissions`);
      console.log('User permissions response:', response.data);
      return response;
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      throw error;
    }
  },
  
  updateUserPermissions: async (id: string, data: { permissions: string[] }) => {
    try {
      console.log('Updating user permissions:', id, 'with data:', data);
      const response = await api.put(`/users/${id}/permissions`, data);
      console.log('Update user permissions response:', response.data);
      return response;
    } catch (error) {
      console.error('Error updating user permissions:', error);
      throw error;
    }
  },
};
