
import api from './api';

export interface Product {
  _id: string;
  supplierName: string;
  productCode: string;
  principle: {
    _id: string;
    name: string;
  };
  dp: number;
  mrp: number;
  description: string;
  quantity: number;
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

export interface ProductFormData {
  supplierName: string;
  productCode: string;
  principle: string;
  dp: number;
  mrp: number;
  description: string;
  quantity: number;
}

export const productAPI = {
  getProducts: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await api.get('/products', { params });
    return response;
  },

  getProduct: async (id: string) => {
    const response = await api.get(`/products/${id}`);
    return response;
  },

  createProduct: async (data: ProductFormData) => {
    const response = await api.post('/products', data);
    return response;
  },

  updateProduct: async (id: string, data: ProductFormData) => {
    const response = await api.put(`/products/${id}`, data);
    return response;
  },

  deleteProduct: async (id: string) => {
    const response = await api.delete(`/products/${id}`);
    return response;
  },
};
