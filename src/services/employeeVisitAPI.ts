import api from './api';

export interface EmployeeVisit {
  _id?: string;
  employeeId: string;
  loginTime: string;
  startTime: string;
  endTime: string;
  workHours: number;
  travelDuration: string;
  totalTravelWorkTime: string;
  otHours?: number;
  startFrom: string;
  location: string;
  distanceKm: number;
  purpose: string;
  createdBy?: any;
  updatedBy?: any;
  createdAt?: string;
  updatedAt?: string;
}

export const employeeVisitAPI = {
  getVisits: async (params?: { page?: number; limit?: number; search?: string }) => {
    return api.get('/employee-travel-logs', { params });
  },
  getVisit: async (id: string) => {
    return api.get(`/employee-travel-logs/${id}`);
  },
  createVisit: async (data: EmployeeVisit) => {
    return api.post('/employee-travel-logs', data);
  },
  updateVisit: async (id: string, data: EmployeeVisit) => {
    return api.put(`/employee-travel-logs/${id}`, data);
  },
  deleteVisit: async (id: string) => {
    return api.delete(`/employee-travel-logs/${id}`);
  },
}; 