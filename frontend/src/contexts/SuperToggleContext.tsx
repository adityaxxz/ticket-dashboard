import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { SuperToggleState, SuperToggleRequest } from '../types';
import { superToggleAPI } from '../services/api';

interface SuperToggleContextType extends SuperToggleState {
  toggleSuperMode: (data: SuperToggleRequest) => Promise<void>;
  fetchSuperToggle: () => Promise<void>;
}

const SuperToggleContext = createContext<SuperToggleContextType | undefined>(undefined);

type SuperToggleAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ENABLED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: SuperToggleState = {
  enabled: false,
  isLoading: false,
  error: null,
};

function superToggleReducer(state: SuperToggleState, action: SuperToggleAction): SuperToggleState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ENABLED':
      return { ...state, enabled: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

export function SuperToggleProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(superToggleReducer, initialState);

  useEffect(() => {
    fetchSuperToggle();
  }, []);

  const fetchSuperToggle = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await superToggleAPI.getSuperToggle();
      dispatch({ type: 'SET_ENABLED', payload: response.enabled });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch super toggle status' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const toggleSuperMode = async (data: SuperToggleRequest) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await superToggleAPI.setSuperToggle(data);
      dispatch({ type: 'SET_ENABLED', payload: response.enabled });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to toggle super mode' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <SuperToggleContext.Provider value={{ ...state, toggleSuperMode, fetchSuperToggle }}>
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
