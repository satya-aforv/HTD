// src/services/authAPI.ts
import api from './baseAPI';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const authAPI = {
  register: (data: RegisterData) =>
    api.post('/auth/register', data),
  
  login: (data: LoginData) =>
    api.post('/auth/login', data),
  
  logout: () => api.post('/auth/logout'),
  
  forgotPassword: (data: ForgotPasswordData) =>
    api.post('/auth/forgot-password', data),
  
  resetPassword: (data: ResetPasswordData) =>
    api.post('/auth/reset-password', data),
  
  changePassword: (data: ChangePasswordData) =>
    api.post('/auth/change-password', data),
  
  getProfile: () => api.get('/auth/profile'),
};
