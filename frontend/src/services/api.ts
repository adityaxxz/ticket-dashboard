const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getHeaders = (includeAuth = true) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = localStorage.getItem('token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  
  return headers;
};

const fetchAPI = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...getHeaders(true),
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    const errorText = await response.text();
    throw new Error(errorText || 'Request failed');
  }

  return response.json();
};


export const authAPI = {
  requestOTP: async (data: { email: string }) => {
    return fetchAPI('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: getHeaders(false),
    });
  },

  verifyOTP: async (data: { email: string; code: string }) => {
    return fetchAPI('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: getHeaders(false),
    });
  },

  getMe: async () => {
    return fetchAPI('/auth/me');
  },
};

export const projectAPI = {
  getProjects: async () => {
    return fetchAPI('/api/projects');
  },

  getProject: async (projectId: number) => {
    return fetchAPI(`/api/projects/${projectId}`);
  },

  createProject: async (data: { name: string }) => {
    return fetchAPI('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const ticketAPI = {
  createTicket: async (data: { project_id: number; description: string }) => {
    return fetchAPI('/api/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateTicket: async (ticketId: number, data: { description?: string; status?: string }) => {
    return fetchAPI(`/api/tickets/${ticketId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

export const superToggleAPI = {
  getSuperToggle: async () => {
    return fetchAPI('/api/super-toggle');
  },

  setSuperToggle: async (data: { enable: boolean; password: string }) => {
    return fetchAPI('/api/super-toggle', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const notificationAPI = {
  getActivities: async (limit = 50) => {
    return fetchAPI(`/api/activities?limit=${limit}`);
  },
};

export const API_BASE_URL = API_BASE;    //exposing the API base url for WebSocket usage