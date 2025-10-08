import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { AuthState, User, OTPRequest, OTPVerify } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType extends AuthState {
  requestOTP: (data: OTPRequest) => Promise<void>;
  verifyOTP: (data: OTPVerify) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_TOKEN'; payload: string | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGOUT' };

const storedToken = localStorage.getItem('token');

const initialState: AuthState = {
  user: null,
  token: storedToken,
  isAuthenticated: !!storedToken,
  isLoading: !!storedToken,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: !!action.payload };
    case 'SET_TOKEN':
      return { ...state, token: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'LOGOUT':
      return { ...initialState, token: null };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Begin loading while verifying token and fetching user
      dispatch({ type: 'SET_LOADING', payload: true });
      authAPI.getMe()
        .then((user) => {
          dispatch({ type: 'SET_USER', payload: user });
          dispatch({ type: 'SET_TOKEN', payload: token });
        })
        .catch(() => {
          // Do not auto-logout on transient failures; keep session and stop loading
          dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh session' });
        })
        .finally(() => {
          dispatch({ type: 'SET_LOADING', payload: false });
        });
    }
  }, []);

  const requestOTP = async (data: OTPRequest) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await authAPI.requestOTP(data);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to request OTP' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const verifyOTP = async (data: OTPVerify) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await authAPI.verifyOTP(data);
      localStorage.setItem('token', response.token);
      dispatch({ type: 'SET_TOKEN', payload: response.token });
      dispatch({ type: 'SET_USER', payload: { id: response.user_id, email: data.email, created_at: new Date().toISOString() } });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Invalid OTP' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ ...state, requestOTP, verifyOTP, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
