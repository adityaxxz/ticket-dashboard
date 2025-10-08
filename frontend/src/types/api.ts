// API Response Types
export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface Project {
  id: number;
  name: string;
  created_at: string;
  created_by_id?: number;
  created_by_email?: string;
}

export interface Ticket {
  id: number;
  project_id: number;
  description: string;
  status: 'todo' | 'inprogress' | 'deployed' | 'done' | 'proposed';
  creator_id: number;
  creator_email?: string; 
  updated_by_id: number;
  updated_by_email?: string; 
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: number;
  project_id: number;
  ticket_id?: number;
  message: string;
  actor_email: string;
  created_at: string;
}

export interface SuperToggle {
  enabled: boolean;
}

// API Request Types
export interface OTPRequest {
  email: string;
}

export interface OTPVerify {
  email: string;
  code: string;
}

export interface ProjectCreate {
  name: string;
}

export interface TicketCreate {
  project_id: number;
  description: string;
}

export interface TicketUpdate {
  description?: string;
  status?: 'todo' | 'inprogress' | 'deployed' | 'done' | 'proposed';
}

export interface SuperToggleRequest {
  enable: boolean;
  password: string;
}

// API Response Wrappers
export interface AuthResponse {
  token: string;
  user_id: number;
}

export interface ProjectResponse {
  project: Project;
  tickets: Ticket[];
}

export interface ApiResponse<T> {
  message: string;
  data?: T;
}

// Error Response
export interface ApiError {
  detail: string;
}
