// src/services/api.ts
import axios from "axios";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

// Format the API base URL properly
const getApiBaseUrl = () => {
  // Get base URL from environment or use default
  const envUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
  // Remove any trailing slashes
  return envUrl.replace(/\/+$/, "");
};

const API_BASE_URL = getApiBaseUrl();

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && token.trim() && token !== "undefined" && token !== "null") {
      // Validate token format (basic JWT structure check)
      const tokenParts = token.split(".");
      if (tokenParts.length === 3) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn("Invalid token format detected, clearing token");
        useAuthStore.getState().logout();
      }
    }
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors
    if (!error.response) {
      console.error("Network error:", error.message);
      toast.error("Network error. Please check your connection.");
      return Promise.reject(error);
    }

    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (
          refreshToken &&
          refreshToken.trim() &&
          refreshToken !== "undefined" &&
          refreshToken !== "null"
        ) {
          // Validate refresh token format
          const tokenParts = refreshToken.split(".");
          if (tokenParts.length === 3) {
            const response = await axios.post(
              `${API_BASE_URL}/auth/refresh-token`,
              {
                refreshToken,
              }
            );

            const { tokens } = response.data;
            if (tokens?.accessToken && tokens?.refreshToken) {
              useAuthStore
                .getState()
                .setTokens(tokens.accessToken, tokens.refreshToken);
              originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
              return api(originalRequest);
            }
          } else {
            console.warn("Invalid refresh token format, logging out");
            useAuthStore.getState().logout();
            window.location.href = "/login";
          }
        } else {
          console.warn("No valid refresh token available, logging out");
          useAuthStore.getState().logout();
          window.location.href = "/login";
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        useAuthStore.getState().logout();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Enhanced error handler
export const handleApiError = (error: any) => {
  console.error("API Error Details:", {
    message: error.message,
    response: error.response?.data,
    status: error.response?.status,
    config: {
      url: error.config?.url,
      method: error.config?.method,
      params: error.config?.params,
    },
  });

  let message = "An unexpected error occurred";

  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        message = data.message || "Invalid request";
        break;
      case 401:
        message = "Authentication required";
        break;
      case 403:
        message =
          data.message ||
          "Access denied. You don't have permission to perform this action";
        break;
      case 404:
        message = "Resource not found";
        break;
      case 422:
        message = data.message || "Validation failed";
        if (data.errors && Array.isArray(data.errors)) {
          message = data.errors.map((err: any) => err.msg).join(", ");
        }
        break;
      case 500:
        message = "Server error. Please try again later";
        break;
      default:
        message = data.message || `Server error (${status})`;
    }
  } else if (error.request) {
    // Network error
    message = "Network error. Please check your connection and try again";
  } else {
    // Other error
    message = error.message || "An unexpected error occurred";
  }

  toast.error(message);
  return message;
};

// Auth API
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),

  logout: () => api.post("/auth/logout"),

  forgotPassword: (data: { email: string }) =>
    api.post("/auth/forgot-password", data),

  resetPassword: (data: { token: string; newPassword: string }) =>
    api.post("/auth/reset-password", data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post("/auth/change-password", data),

  getProfile: () => api.get("/auth/profile"),
};

// States API
export const statesAPI = {
  getStates: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    try {
      console.log("Fetching states with params:", params);
      const response = await api.get("/states", { params });
      console.log("States API response:", response.data);
      return response;
    } catch (error) {
      console.error("Error fetching states:", error);
      throw error;
    }
  },

  getState: async (id: string) => {
    try {
      console.log("Fetching state with ID:", id);
      const response = await api.get(`/states/${id}`);
      console.log("State API response:", response.data);
      return response;
    } catch (error) {
      console.error("Error fetching state:", error);
      throw error;
    }
  },

  createState: async (data: any) => {
    try {
      console.log("Creating state with data:", data);
      const response = await api.post("/states", data);
      console.log("Create state response:", response.data);
      return response;
    } catch (error) {
      console.error("Error creating state:", error);
      throw error;
    }
  },

  updateState: async (id: string, data: any) => {
    try {
      console.log("Updating state:", id, "with data:", data);
      const response = await api.put(`/states/${id}`, data);
      console.log("Update state response:", response.data);
      return response;
    } catch (error) {
      console.error("Error updating state:", error);
      throw error;
    }
  },

  deleteState: async (id: string) => {
    try {
      console.log("Deleting state with ID:", id);
      const response = await api.delete(`/states/${id}`);
      console.log("Delete state response:", response.data);
      return response;
    } catch (error) {
      console.error("Error deleting state:", error);
      throw error;
    }
  },
};

// Users API
export const usersAPI = {
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    designation?: string;
  }) => {
    try {
      console.log("Fetching users with params:", params);
      const response = await api.get("/users", { params });
      console.log("Users API response:", response.data);
      return response;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  getUser: async (id: string) => {
    try {
      console.log("Fetching user with ID:", id);
      const response = await api.get(`/users/${id}`);
      console.log("User API response:", response.data);
      return response;
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  },

  createUser: async (data: any) => {
    try {
      console.log("Creating user with data:", data);
      const response = await api.post("/users", data);
      console.log("Create user response:", response.data);
      return response;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  updateUser: async (id: string, data: any) => {
    try {
      console.log("Updating user:", id, "with data:", data);
      const response = await api.put(`/users/${id}`, data);
      console.log("Update user response:", response.data);
      return response;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },

  deleteUser: async (id: string) => {
    try {
      console.log("Deleting user with ID:", id);
      const response = await api.delete(`/users/${id}`);
      console.log("Delete user response:", response.data);
      return response;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },

  getUserPermissions: async (id: string) => {
    try {
      console.log("Fetching user permissions for ID:", id);
      const response = await api.get(`/users/${id}/permissions`);
      console.log("User permissions response:", response.data);
      return response;
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      throw error;
    }
  },

  updateUserPermissions: async (
    id: string,
    data: { permissions: string[] }
  ) => {
    try {
      console.log("Updating user permissions:", id, "with data:", data);
      const response = await api.put(`/users/${id}/permissions`, data);
      console.log("Update user permissions response:", response.data);
      return response;
    } catch (error) {
      console.error("Error updating user permissions:", error);
      throw error;
    }
  },
};

// Permissions API
export const permissionsAPI = {
  getPermissions: async () => {
    try {
      console.log("Fetching all permissions");
      const response = await api.get("/permissions");
      console.log("Permissions API response:", response.data);
      return response;
    } catch (error) {
      console.error("Error fetching permissions:", error);
      throw error;
    }
  },

  getPermission: async (id: string) => {
    try {
      console.log("Fetching permission with ID:", id);
      const response = await api.get(`/permissions/${id}`);
      console.log("Permission API response:", response.data);
      return response;
    } catch (error) {
      console.error("Error fetching permission:", error);
      throw error;
    }
  },

  createPermission: async (data: any) => {
    try {
      console.log("Creating permission with data:", data);
      const response = await api.post("/permissions", data);
      console.log("Create permission response:", response.data);
      return response;
    } catch (error) {
      console.error("Error creating permission:", error);
      throw error;
    }
  },

  updatePermission: async (id: string, data: any) => {
    try {
      console.log("Updating permission:", id, "with data:", data);
      const response = await api.put(`/permissions/${id}`, data);
      console.log("Update permission response:", response.data);
      return response;
    } catch (error) {
      console.error("Error updating permission:", error);
      throw error;
    }
  },

  deletePermission: async (id: string) => {
    try {
      console.log("Deleting permission with ID:", id);
      const response = await api.delete(`/permissions/${id}`);
      console.log("Delete permission response:", response.data);
      return response;
    } catch (error) {
      console.error("Error deleting permission:", error);
      throw error;
    }
  },
};

// Doctor API
export const doctorAPI = {
  // Doctor CRUD operations
  getDoctors: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    try {
      console.log("Fetching doctors with params:", params);
      const response = await api.get("/doctors", { params });
      console.log("Doctors API response:", response.data);
      return response;
    } catch (error) {
      console.error("Error fetching doctors:", error);
      throw error;
    }
  },

  getDoctor: async (id: string) => {
    try {
      console.log("Fetching doctor with ID:", id);
      const response = await api.get(`/doctors/${id}`);
      console.log("Doctor API response:", response.data);
      return response;
    } catch (error) {
      console.error("Error fetching doctor:", error);
      throw error;
    }
  },

  createDoctor: async (data: any) => {
    try {
      console.log("Creating doctor with data:", data);
      const response = await api.post("/doctors", data);
      console.log("Create doctor response:", response.data);
      return response;
    } catch (error) {
      console.error("Error creating doctor:", error);
      throw error;
    }
  },

  updateDoctor: async (id: string, data: any) => {
    try {
      console.log("Updating doctor:", id, "with data:", data);
      const response = await api.put(`/doctors/${id}`, data);
      console.log("Update doctor response:", response.data);
      return response;
    } catch (error) {
      console.error("Error updating doctor:", error);
      throw error;
    }
  },

  deleteDoctor: async (id: string) => {
    try {
      console.log("Deleting doctor with ID:", id);
      const response = await api.delete(`/doctors/${id}`);
      console.log("Delete doctor response:", response.data);
      return response;
    } catch (error) {
      console.error("Error deleting doctor:", error);
      throw error;
    }
  },
};
// Hospital API
export const hospitalAPI = {
  // Hospital CRUD operations
  getHospitals: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    try {
      console.log("Fetching hospitals with params:", params);
      const response = await api.get("/hospitals", { params });
      console.log("Hospitals API response:", response.data);
      return response;
    } catch (error) {
      console.error("Error fetching hospitals:", error);
      throw error;
    }
  },

  getHospital: async (id: string) => {
    try {
      console.log("Fetching hospital with ID:", id);
      const response = await api.get(`/hospitals/${id}`);
      console.log("Hospital API response:", response.data);
      return response;
    } catch (error) {
      console.error("Error fetching hospital:", error);
      throw error;
    }
  },

  createHospital: async (data: any) => {
    try {
      console.log("Creating hospital with data:", data);
      const response = await api.post("/hospitals", data);
      console.log("Create hospital response:", response.data);
      return response;
    } catch (error) {
      console.error("Error creating hospital:", error);
      throw error;
    }
  },

  updateHospital: async (id: string, data: any) => {
    try {
      console.log("Updating hospital:", id, "with data:", data);
      const response = await api.put(`/hospitals/${id}`, data);
      console.log("Update hospital response:", response.data);
      return response;
    } catch (error) {
      console.error("Error updating hospital:", error);
      throw error;
    }
  },

  deleteHospital: async (id: string) => {
    try {
      console.log("Deleting hospital with ID:", id);
      const response = await api.delete(`/hospitals/${id}`);
      console.log("Delete hospital response:", response.data);
      return response;
    } catch (error) {
      console.error("Error deleting hospital:", error);
      throw error;
    }
  },

  // Hospital Contacts CRUD operations
  getHospitalContacts: async (
    hospitalId: string,
    params?: { page?: number; limit?: number; search?: string }
  ) => {
    try {
      console.log(
        "Fetching hospital contacts for hospital:",
        hospitalId,
        "with params:",
        params
      );
      const response = await api.get(`/hospitals/${hospitalId}/contacts`, {
        params,
      });
      console.log("Hospital contacts API response:", response.data);
      return response;
    } catch (error) {
      console.error("Error fetching hospital contacts:", error);
      throw error;
    }
  },

  createHospitalContact: async (hospitalId: string, data: any) => {
    try {
      console.log(
        "Creating hospital contact for hospital:",
        hospitalId,
        "with data:",
        data
      );
      const response = await api.post(
        `/hospitals/${hospitalId}/contacts`,
        data
      );
      console.log("Create hospital contact response:", response.data);
      return response;
    } catch (error) {
      console.error("Error creating hospital contact:", error);
      throw error;
    }
  },

  updateHospitalContact: async (
    hospitalId: string,
    contactId: string,
    data: any
  ) => {
    try {
      console.log(
        "Updating hospital contact:",
        contactId,
        "for hospital:",
        hospitalId,
        "with data:",
        data
      );
      const response = await api.put(
        `/hospitals/${hospitalId}/contacts/${contactId}`,
        data
      );
      console.log("Update hospital contact response:", response.data);
      return response;
    } catch (error) {
      console.error("Error updating hospital contact:", error);
      throw error;
    }
  },

  deleteHospitalContact: async (hospitalId: string, contactId: string) => {
    try {
      console.log(
        "Deleting hospital contact:",
        contactId,
        "for hospital:",
        hospitalId
      );
      const response = await api.delete(
        `/hospitals/${hospitalId}/contacts/${contactId}`
      );
      console.log("Delete hospital contact response:", response.data);
      return response;
    } catch (error) {
      console.error("Error deleting hospital contact:", error);
      throw error;
    }
  },
};

// Candidates API
export const candidatesAPI = {
  getCandidates: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    skill?: string;
    experience?: string;
    hasGaps?: boolean;
    search?: string;
  }) => {
    try {
      console.log("Fetching candidates with params:", params);
      const response = await api.get("/htd/candidates", { params });
      console.log("Candidates API response:", response.data);
      return response;
    } catch (error) {
      console.error("Error fetching candidates:", error);
      throw error;
    }
  },

  getCandidate: async (id: string) => {
    try {
      console.log("Fetching candidate with ID:", id);
      const response = await api.get(`/htd/candidates/${id}`);
      console.log("Candidate API response:", response.data);
      return response;
    } catch (error) {
      console.error("Error fetching candidate:", error);
      throw error;
    }
  },

  createCandidate: async (data: any) => {
    try {
      console.log("Creating candidate with data:", data);
      const response = await api.post("/htd/candidates", data);
      console.log("Create candidate response:", response.data);
      return response;
    } catch (error) {
      console.error("Error creating candidate:", error);
      throw error;
    }
  },

  updateCandidate: async (id: string, data: any) => {
    try {
      console.log("Updating candidate:", id, "with data:", data);
      const response = await api.put(`/htd/candidates/${id}`, data);
      console.log("Update candidate response:", response.data);
      return response;
    } catch (error) {
      console.error("Error updating candidate:", error);
      throw error;
    }
  },

  deleteCandidate: async (id: string) => {
    try {
      console.log("Deleting candidate with ID:", id);
      const response = await api.delete(`/htd/candidates/${id}`);
      console.log("Delete candidate response:", response.data);
      return response;
    } catch (error) {
      console.error("Error deleting candidate:", error);
      throw error;
    }
  },

  // Candidate documents
  uploadDocument: async (id: string, formData: FormData) => {
    try {
      console.log("Uploading document for candidate:", id);
      const response = await api.post(
        `/htd/candidates/${id}/documents`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      console.log("Upload document response:", response.data);
      return response;
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error;
    }
  },

  getDocuments: async (id: string) => {
    try {
      console.log("Fetching documents for candidate:", id);
      const response = await api.get(`/htd/candidates/${id}/documents`);
      console.log("Get documents response:", response.data);
      return response;
    } catch (error) {
      console.error("Error fetching documents:", error);
      throw error;
    }
  },

  // Education management
  addEducation: async (id: string, data: any) => {
    try {
      console.log("Adding education for candidate:", id, "with data:", data);
      const response = await api.post(`/htd/candidates/${id}/education`, data);
      console.log("Add education response:", response.data);
      return response;
    } catch (error) {
      console.error("Error adding education:", error);
      throw error;
    }
  },

  updateEducation: async (id: string, educationId: string, data: any) => {
    try {
      console.log("Updating education:", educationId, "for candidate:", id);
      const response = await api.put(
        `/htd/candidates/${id}/education/${educationId}`,
        data
      );
      console.log("Update education response:", response.data);
      return response;
    } catch (error) {
      console.error("Error updating education:", error);
      throw error;
    }
  },

  deleteEducation: async (id: string, educationId: string) => {
    try {
      console.log("Deleting education:", educationId, "for candidate:", id);
      const response = await api.delete(
        `/htd/candidates/${id}/education/${educationId}`
      );
      console.log("Delete education response:", response.data);
      return response;
    } catch (error) {
      console.error("Error deleting education:", error);
      throw error;
    }
  },

  // Experience management
  addExperience: async (id: string, data: any) => {
    try {
      console.log("Adding experience for candidate:", id, "with data:", data);
      const response = await api.post(`/htd/candidates/${id}/experience`, data);
      console.log("Add experience response:", response.data);
      return response;
    } catch (error) {
      console.error("Error adding experience:", error);
      throw error;
    }
  },

  updateExperience: async (id: string, experienceId: string, data: any) => {
    try {
      console.log("Updating experience:", experienceId, "for candidate:", id);
      const response = await api.put(
        `/htd/candidates/${id}/experience/${experienceId}`,
        data
      );
      console.log("Update experience response:", response.data);
      return response;
    } catch (error) {
      console.error("Error updating experience:", error);
      throw error;
    }
  },

  deleteExperience: async (id: string, experienceId: string) => {
    try {
      console.log("Deleting experience:", experienceId, "for candidate:", id);
      const response = await api.delete(
        `/htd/candidates/${id}/experience/${experienceId}`
      );
      console.log("Delete experience response:", response.data);
      return response;
    } catch (error) {
      console.error("Error deleting experience:", error);
      throw error;
    }
  },

  // Career gaps management
  addCareerGap: async (id: string, data: any) => {
    try {
      console.log("Adding career gap for candidate:", id, "with data:", data);
      const response = await api.post(
        `/htd/candidates/${id}/career-gaps`,
        data
      );
      console.log("Add career gap response:", response.data);
      return response;
    } catch (error) {
      console.error("Error adding career gap:", error);
      throw error;
    }
  },

  updateCareerGap: async (id: string, gapId: string, data: any) => {
    try {
      console.log("Updating career gap:", gapId, "for candidate:", id);
      const response = await api.put(
        `/htd/candidates/${id}/career-gaps/${gapId}`,
        data
      );
      console.log("Update career gap response:", response.data);
      return response;
    } catch (error) {
      console.error("Error updating career gap:", error);
      throw error;
    }
  },

  deleteCareerGap: async (id: string, gapId: string) => {
    try {
      console.log("Deleting career gap:", gapId, "for candidate:", id);
      const response = await api.delete(
        `/htd/candidates/${id}/career-gaps/${gapId}`
      );
      console.log("Delete career gap response:", response.data);
      return response;
    } catch (error) {
      console.error("Error deleting career gap:", error);
      throw error;
    }
  },

  // Skills management
  addSkill: async (id: string, data: any) => {
    try {
      console.log("Adding skill for candidate:", id, "with data:", data);
      const response = await api.post(`/htd/candidates/${id}/skills`, data);
      console.log("Add skill response:", response.data);
      return response;
    } catch (error) {
      console.error("Error adding skill:", error);
      throw error;
    }
  },

  updateSkill: async (id: string, skillId: string, data: any) => {
    try {
      console.log("Updating skill:", skillId, "for candidate:", id);
      const response = await api.put(
        `/htd/candidates/${id}/skills/${skillId}`,
        data
      );
      console.log("Update skill response:", response.data);
      return response;
    } catch (error) {
      console.error("Error updating skill:", error);
      throw error;
    }
  },

  deleteSkill: async (id: string, skillId: string) => {
    try {
      console.log("Deleting skill:", skillId, "for candidate:", id);
      const response = await api.delete(
        `/htd/candidates/${id}/skills/${skillId}`
      );
      console.log("Delete skill response:", response.data);
      return response;
    } catch (error) {
      console.error("Error deleting skill:", error);
      throw error;
    }
  },

  // Generate client profile
  generateClientProfile: async (id: string) => {
    try {
      console.log("Generating client profile for candidate:", id);
      const response = await api.get(`/htd/candidates/${id}/client-profile`);
      console.log("Generate client profile response:", response.data);
      return response;
    } catch (error) {
      console.error("Error generating client profile:", error);
      throw error;
    }
  },
};

// Helper function to check if API is reachable
export const checkApiHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    console.error("API health check failed:", error);
    return false;
  }
};

export default api;
