// Re-export all types
export * from './api';

import type { User, Project, Ticket, Activity, TicketCreate, TicketUpdate } from './api';

// UI State Types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
}

export interface TicketState {
  tickets: Ticket[];
  isLoading: boolean;
  error: string | null;
}

export interface NotificationState {
  notifications: Activity[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

export interface SuperToggleState {
  enabled: boolean;
  isLoading: boolean;
  error: string | null;
}

// Component Props Types
export interface KanbanColumnProps {
  title: string;
  status: Ticket['status'];
  tickets: Ticket[];
  onTicketUpdate: (ticketId: number, updates: Partial<TicketUpdate>) => void;
  onTicketCreate: (ticket: TicketCreate) => void;
}

export interface TicketCardProps {
  ticket: Ticket;
  onUpdate: (ticketId: number, updates: Partial<TicketUpdate>) => void;
}

export interface ProjectCardProps {
  project: Project;
  ticketCount: number;
  onClick: () => void;
}

// Form Types
export interface LoginFormData {
  email: string;
}

export interface OTPFormData {
  email: string;
  code: string;
}

export interface ProjectFormData {
  name: string;
}

export interface TicketFormData {
  description: string;
}

export interface SuperToggleFormData {
  password: string;
}
