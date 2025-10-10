import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, OTPRequest, OTPVerify } from '../types';

const API_BASE = import.meta.env.VITE_API_URL;
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const authAPI = {
  requestOTP: async (data: OTPRequest) => {
    const response = await fetch(`${API_BASE}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to send OTP');
    return response.json();
  },

  verifyOTP: async (data: OTPVerify) => {
    const response = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Invalid OTP');
    return response.json();
  },

  getMe: async () => {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to get user info');
    return response.json();
  },

  logout: async () => {
    const response = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to logout');
    return response.json();
  }
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  requestOTP: (data: OTPRequest) => Promise<void>;
  verifyOTP: (data: OTPVerify) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Simple state hooks instead of complex reducer
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(!!token); // Only load if we have a token
  const [error, setError] = useState<string | null>(null);
  const isAuthenticated = !!user;


  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setIsLoading(true);
      authAPI.getMe()
        .then(setUser)
        .catch(() => setError('Failed to refresh session'))
        .finally(() => setIsLoading(false));
    }
  }, []);

  const requestOTP = async (data: OTPRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      await authAPI.requestOTP(data);
    } catch (error) {
      setError('Failed to request OTP');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (data: OTPVerify) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authAPI.verifyOTP(data);
      const newToken = response.token;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser({ 
        id: response.user_id, 
        email: data.email, 
        created_at: new Date().toISOString() 
      });
    } catch (error) {
      setError('Invalid OTP');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call backend logout to clear super toggle state
      await authAPI.logout();
    } catch (error) {
      // Continue with logout even if backend call fails
      console.warn('Backend logout failed:', error);
    } finally {
      // Always clear frontend state
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setError(null);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isAuthenticated, 
      isLoading, 
      error, 
      requestOTP, 
      verifyOTP, 
      logout 
    }}>
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
