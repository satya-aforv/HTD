// src/services/portfolioAPI.ts
import api, { handleApiError } from './api';
import { useAuthStore } from '../store/authStore';


export interface Portfolio {
  _id: string;
  name: string;
  description: string;
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

export interface PortfolioFormData {
  name: string;
  description: string;
  isActive?: boolean;
}

export const portfolioAPI = {
  getPortfolios: async (params?: { page?: number; limit?: number; search?: string }) => {
    try {
      const response = await api.get('/portfolios', { params });
      return response;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  getPortfolio: async (id: string) => {
    try {
      const response = await api.get(`/portfolios/${id}`);
      return response;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  createPortfolio: async (data: PortfolioFormData) => {
    try {
      const response = await api.post('/portfolios', data);
      return response;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  updatePortfolio: async (id: string, data: PortfolioFormData) => {
    try {
      const response = await api.put(`/portfolios/${id}`, data);
      return response;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  deletePortfolio: async (id: string) => {
    try {
      const response = await api.delete(`/portfolios/${id}`);
      return response;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  toggleStatus: async (id: string) => {
    try {
      const response = await api.put(`/portfolios/${id}/toggle-status`);
      return response;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }
};
