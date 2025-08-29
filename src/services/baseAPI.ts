// src/services/baseAPI.ts
import axios from "axios";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://htd-backend.onrender.com/api";

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
export const handleApiError = (error: unknown) => {
  const axiosError = error as any; // Type assertion for axios error structure

  console.error("API Error Details:", {
    message: axiosError.message,
    response: axiosError.response?.data,
    status: axiosError.response?.status,
    config: {
      url: axiosError.config?.url,
      method: axiosError.config?.method,
      params: axiosError.config?.params,
    },
  });

  let message = "An unexpected error occurred";

  if (axiosError.response) {
    // Server responded with error status
    const status = axiosError.response.status;
    const data = axiosError.response.data;

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
  } else if (axiosError.request) {
    // Network error
    message = "Network error. Please check your connection and try again";
  } else {
    // Other error
    message = axiosError.message || "An unexpected error occurred";
  }

  toast.error(message);
  return message;
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
