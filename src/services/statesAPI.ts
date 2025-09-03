// src/services/statesAPI.ts
import api from "./api";
import toast from "react-hot-toast";

// Type guard for axios error with response
type AxiosErrorWithResponse = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

function isAxiosError(error: unknown): error is AxiosErrorWithResponse {
  return typeof error === "object" && error !== null && "response" in error;
}

function getErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (isAxiosError(error) && error.response?.data?.message) {
    return String(error.response.data.message);
  }
  return defaultMessage;
}

export interface StateFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface StateData {
  _id?: string;
  name: string;
  code: string;
  country: string;
  population?: number;
  area?: number;
  capital?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface StateListResponse {
  states: StateData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const statesAPI = {
  /**
   * Fetches a paginated list of states with optional filtering and sorting
   */
  getStates: async (
    params: StateFilters = {}
  ): Promise<ApiResponse<StateListResponse>> => {
    try {
      const response = await api.get<ApiResponse<StateListResponse>>(
        "/states",
        { params }
      );
      return response.data;
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, "Failed to fetch states");
      console.error("Error fetching states:", error);
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Fetches a single state by ID
   */
  getState: async (id: string): Promise<ApiResponse<{ state: StateData }>> => {
    try {
      const response = await api.get<ApiResponse<{ state: StateData }>>(
        `/states/${id}`
      );
      return response.data;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : error &&
            typeof error === "object" &&
            "response" in error &&
            error.response?.data?.message
          ? String(error.response.data.message)
          : "Failed to fetch state details";
      console.error(`Error fetching state with ID ${id}:`, error);
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Creates a new state
   */
  createState: async (
    data: Omit<StateData, "_id" | "createdAt" | "updatedAt">
  ): Promise<ApiResponse<{ state: StateData }>> => {
    try {
      const response = await api.post<ApiResponse<{ state: StateData }>>(
        "/states",
        data
      );
      toast.success("State created successfully");
      return response.data;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : error &&
            typeof error === "object" &&
            "response" in error &&
            error.response?.data?.message
          ? String(error.response.data.message)
          : "Failed to create state";
      console.error("Error creating state:", error);
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Updates an existing state
   */
  updateState: async (
    id: string,
    data: Partial<StateData>
  ): Promise<ApiResponse<{ state: StateData }>> => {
    try {
      const response = await api.put<ApiResponse<{ state: StateData }>>(
        `/states/${id}`,
        data
      );
      toast.success("State updated successfully");
      return response.data;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : error &&
            typeof error === "object" &&
            "response" in error &&
            error.response?.data?.message
          ? String(error.response.data.message)
          : "Failed to update state";
      console.error(`Error updating state with ID ${id}:`, error);
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Deletes a state
   */
  deleteState: async (
    id: string
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await api.delete<ApiResponse<{ message: string }>>(
        `/states/${id}`
      );
      toast.success("State deleted successfully");
      return response.data;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : error &&
            typeof error === "object" &&
            "response" in error &&
            error.response?.data?.message
          ? String(error.response.data.message)
          : "Failed to delete state";
      console.error(`Error deleting state with ID ${id}:`, error);
      toast.error(errorMessage);
      throw error;
    }
  },
};
