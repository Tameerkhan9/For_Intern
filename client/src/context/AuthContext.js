import React, { createContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (token) {
      checkAuth();
    } else {
      setLoading(false);
    }

    // Listen for logout events from other tabs
    const handleStorageChange = (e) => {
      if (e.key === 'logoutUser') {
        // Logout triggered from another tab
        sessionStorage.removeItem('token');
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getMe();
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      sessionStorage.removeItem('token');
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await authAPI.login({ email, password });
      sessionStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setIsAuthenticated(true);
      return { success: true, user: response.data.user };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, role) => {
    try {
      setLoading(true);
      const response = await authAPI.register({ name, email, password, role });
      sessionStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = ({ preservePortal = false, broadcast = false } = {}) => {
    // Broadcast only when explicitly requested.
    if (broadcast) {
      localStorage.setItem('logoutUser', Date.now().toString());
    }
    sessionStorage.removeItem('token');
    localStorage.removeItem('token');
    if (!preservePortal) {
      localStorage.removeItem('accessToken');
      localStorage.setItem('portalLogout', Date.now().toString());
    }
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
