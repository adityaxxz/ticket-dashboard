import React, { createContext, useContext, useState } from 'react';
import type { Activity } from '../types';
import { notificationAPI } from '../services/api';

interface NotificationContextType {
  notifications: Activity[];
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  // Simple state hooks instead of complex reducer
  const [notifications, setNotifications] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const notifications = await notificationAPI.getActivities();
      setNotifications(notifications);
    } catch (error) {
      setError('Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      isLoading, 
      error, 
      fetchNotifications 
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
