// src/services/htdAPI.ts
import api from "./api";

// Candidate types
export interface Candidate {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  highestQualification: string;
  totalITExperience: number;
  totalNonITExperience: number;
  skills?: Array<{ name: string; type: string }>;
  createdAt: string;
  updatedAt: string;
}

// Module types
export interface Module {
  _id?: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  instructor: string;
  resources?: string[];
}

// Training types
export interface Training {
  _id: string;
  title: string;
  status:
    | "ongoing"
    | "completed"
    | "upcoming"
    | "active"
    | "on-hold"
    | "cancelled";
  startDate: string;
  endDate: string | null;
  candidate?: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
    photo?: string;
  };
  averageRating?: number;
  totalExpenses?: number;
  skillsAcquired?: string[];
  description?: string;
  modules?: Array<Module>;
  evaluations?: Array<Evaluation>;
  expenses?: Array<Expense>;
  notes?: string;
}

// Evaluation types
export interface Evaluation {
  _id?: string;
  date: string;
  rating: number;
  feedback: string;
  evaluator: string;
  strengths?: string[];
  weaknesses?: string[];
}

// Expense types
export interface Expense {
  _id?: string;
  date: string;
  amount: number;
  category: string;
  description: string;
}

// Payment types
export interface Payment {
  _id: string;
  candidateId: Candidate | string;
  amount: number;
  type: "registration" | "tuition" | "certification" | "other";
  paymentDate: string;
  paymentMode?: string;
  transactionId?: string;
  status: "pending" | "completed" | "failed" | "refunded";
  month?: string;
  year?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Dashboard stats
export interface DashboardStats {
  totalCandidates: number;
  activeCandidates: number;
  completedTrainings: number;
  ongoingTrainings: number;
  totalPayments: number;
  monthlyPayments: number;
  candidatesByStatus: Array<{ status: string; count: number }>;
  trainingsByMonth: Array<{ month: string; count: number }>;
  recentCandidates: Array<{
    _id: string;
    name: string;
    email: string;
    status: string;
    createdAt: string;
  }>;
  upcomingPayments: Array<{
    _id: string;
    candidateId: { _id: string; name: string };
    amount: number;
    type: string;
    status: string;
    paymentDate: string;
  }>;
}

// HTD API service
export const htdAPI = {
  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const response = await api.get("/htd/dashboard/stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching HTD dashboard stats:", error);
      throw error;
    }
  },

  // Candidates
  getCandidates: async (params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    skill?: string;
  }) => {
    try {
      const response = await api.get("/htd/candidates", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching HTD candidates:", error);
      throw error;
    }
  },

  getCandidate: async (id: string | unknown) => {
    try {
      const response = await api.get(`/htd/candidates/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching HTD candidate:", error);
      throw error;
    }
  },

  deleteCandidate: async (id: string) => {
    try {
      const response = await api.delete(`/htd/candidates/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting HTD candidate:", error);
      throw error;
    }
  },

  // Trainings
  getTrainings: async (params: {
    page?: number;
    limit?: number;
    status?: Training["status"];
    search?: string;
    sortField?: string;
    sortDirection?: string;
  }) => {
    try {
      const response = await api.get("/htd/trainings", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching HTD trainings:", error);
      throw error;
    }
  },

  getTraining: async (id: string): Promise<Training> => {
    try {
      const response = await api.get(`/htd/trainings/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching HTD training:", error);
      throw error;
    }
  },

  getTrainingReport: async (id: string): Promise<Blob> => {
    try {
      const response = await api.get(`/htd/trainings/${id}/report`, {
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching HTD training report:", error);
      throw error;
    }
  },

  createTraining: async (data: Partial<Training>) => {
    try {
      const response = await api.post("/htd/trainings", data);
      return response.data;
    } catch (error) {
      console.error("Error creating HTD training:", error);
      throw error;
    }
  },

  updateTraining: async (id: string, data: Partial<Training>) => {
    try {
      const response = await api.put(`/htd/trainings/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating HTD training:", error);
      throw error;
    }
  },

  deleteTraining: async (id: string) => {
    try {
      const response = await api.delete(`/htd/trainings/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting HTD training:", error);
      throw error;
    }
  },

  // Payments
  getPayments: async (params: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    month?: string;
    year?: number;
    search?: string;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
  }) => {
    try {
      const response = await api.get("/htd/payments", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching HTD payments:", error);
      throw error;
    }
  },

  getPayment: async (id: string) => {
    try {
      const response = await api.get(`/htd/payments/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching HTD payment:", error);
      throw error;
    }
  },

  createPayment: async (data: Partial<Payment>) => {
    try {
      const response = await api.post("/htd/payments", data);
      return response.data;
    } catch (error) {
      console.error("Error creating HTD payment:", error);
      throw error;
    }
  },

  updatePayment: async (id: string, data: Partial<Payment>) => {
    try {
      const response = await api.put(`/htd/payments/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating HTD payment:", error);
      throw error;
    }
  },

  deletePayment: async (id: string) => {
    try {
      const response = await api.delete(`/htd/payments/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting HTD payment:", error);
      throw error;
    }
  },

  exportPayments: async (params: {
    search?: string;
    type?: string;
    status?: string;
    month?: string;
    year?: number;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
  }): Promise<Blob> => {
    try {
      const response = await api.get("/htd/payments/export", {
        params,
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      console.error("Error exporting HTD payments:", error);
      throw error;
    }
  },

  // Analytics
  getAnalytics: async (params: {
    startDate?: string;
    endDate?: string;
    status?: string;
    skillType?: string;
  }) => {
    try {
      const response = await api.get("/htd/analytics", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching HTD analytics:", error);
      throw error;
    }
  },
};

export default htdAPI;
