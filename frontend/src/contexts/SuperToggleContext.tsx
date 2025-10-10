import React, { createContext, useContext, useState, useEffect } from 'react';
import type { SuperToggleRequest } from '../types';
import { superToggleAPI } from '../services/api';
import { useAuth } from './AuthContext';

interface SuperToggleContextType {
  enabled: boolean;
  isLoading: boolean;
  error: string | null;
  toggleSuperMode: (data: SuperToggleRequest) => Promise<void>;
  fetchSuperToggle: () => Promise<void>;
}

const SuperToggleContext = createContext<SuperToggleContextType | undefined>(undefined);

export function SuperToggleProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSuperToggle();
    } else {
      // Reset super toggle state when user is not authenticated
      setEnabled(false);
      setError(null);
    }
  }, [isAuthenticated]);

  const fetchSuperToggle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await superToggleAPI.getSuperToggle();
      setEnabled(response.enabled);
    } catch (error) {
      setError('Failed to fetch super toggle status');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSuperMode = async (data: SuperToggleRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await superToggleAPI.setSuperToggle(data);
      setEnabled(response.enabled);
    } catch (error) {
      setError('Failed to toggle super mode');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SuperToggleContext.Provider value={{ 
      enabled, 
      isLoading, 
      error, 
      toggleSuperMode, 
      fetchSuperToggle 
    }}>
      {children}
    </SuperToggleContext.Provider>
  );
}

export function useSuperToggle() {
  const context = useContext(SuperToggleContext);
  if (context === undefined) {
    throw new Error('useSuperToggle must be used within a SuperToggleProvider');
  }
  return context;
}
