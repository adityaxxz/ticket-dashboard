import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type {
  User,
  Project,
  Ticket,
  Activity,
  SuperToggle,
  OTPRequest,
  OTPVerify,
  AuthResponse,
  ProjectCreate,
  ProjectResponse,
  TicketCreate,
  TicketUpdate,
  SuperToggleRequest,
} from '../types';

const API_BASE_URL = 'http://localhost:8000';

class ApiClient {
  public client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  public handleResponse<T>(response: AxiosResponse<T>): T {
    return response.data;
  }

  public handleError(error: any): never {
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw new Error('An unexpected error occurred');
  }
}

const apiClient = new ApiClient();

// Auth API
export const authAPI = {
  requestOTP: async (data: OTPRequest): Promise<void> => {
    try {
      await apiClient.client.post('/auth/request-otp', data);
    } catch (error) {
      apiClient.handleError(error);
    }
  },

  verifyOTP: async (data: OTPVerify): Promise<AuthResponse> => {
    try {
      const response = await apiClient.client.post('/auth/verify-otp', data);
      return apiClient.handleResponse(response);
    } catch (error) {
      return apiClient.handleError(error);
    }
  },

  getMe: async (): Promise<User> => {
    try {
      const response = await apiClient.client.get('/auth/me');
      return apiClient.handleResponse(response);
    } catch (error) {
      return apiClient.handleError(error);
    }
  },
};

// Project API
export const projectAPI = {
  getProjects: async (): Promise<Project[]> => {
    try {
      const response = await apiClient.client.get('/api/projects');
      return apiClient.handleResponse(response);
    } catch (error) {
      return apiClient.handleError(error);
    }
  },

  getProject: async (projectId: number): Promise<ProjectResponse> => {
    try {
      const response = await apiClient.client.get(`/api/projects/${projectId}`);
      return apiClient.handleResponse(response);
    } catch (error) {
      return apiClient.handleError(error);
    }
  },

  createProject: async (data: ProjectCreate): Promise<Project> => {
    try {
      const response = await apiClient.client.post('/api/projects', data);
      return response.data.project;
    } catch (error) {
      return apiClient.handleError(error);
    }
  },
};

// Ticket API
export const ticketAPI = {
  createTicket: async (data: TicketCreate): Promise<Ticket> => {
    try {
      const response = await apiClient.client.post('/api/tickets', data);
      return response.data.ticket;
    } catch (error) {
      return apiClient.handleError(error);
    }
  },

  updateTicket: async (ticketId: number, data: TicketUpdate): Promise<Ticket> => {
    try {
      const response = await apiClient.client.patch(`/api/tickets/${ticketId}`, data);
      return apiClient.handleResponse(response);
    } catch (error) {
      return apiClient.handleError(error);
    }
  },
};

// Super Toggle API
export const superToggleAPI = {
  getSuperToggle: async (): Promise<SuperToggle> => {
    try {
      const response = await apiClient.client.get('/api/super-toggle');
      return apiClient.handleResponse(response);
    } catch (error) {
      return apiClient.handleError(error);
    }
  },

  setSuperToggle: async (data: SuperToggleRequest): Promise<SuperToggle> => {
    try {
      const response = await apiClient.client.post('/api/super-toggle', data);
      return apiClient.handleResponse(response);
    } catch (error) {
      return apiClient.handleError(error);
    }
  },
};

// Notification API
export const notificationAPI = {
  getActivities: async (limit: number = 50): Promise<Activity[]> => {
    try {
      const response = await apiClient.client.get(`/api/activities?limit=${limit}`);
      return apiClient.handleResponse(response);
    } catch (error) {
      return apiClient.handleError(error);
    }
  },

  getProjectActivities: async (projectId: number, limit: number = 50): Promise<Activity[]> => {
    try {
      const response = await apiClient.client.get(`/api/projects/${projectId}/activities?limit=${limit}`);
      return apiClient.handleResponse(response);
    } catch (error) {
      return apiClient.handleError(error);
    }
  },
};
