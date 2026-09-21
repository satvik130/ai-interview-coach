import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore authenticated session from localStorage on initial load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } catch (err) {
          console.error('Session restoration failed:', err.response?.data?.message || err.message);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Register a new user
   */
  const register = async (name, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      const { token: receivedToken, user: receivedUser } = res.data;

      localStorage.setItem('token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      setLoading(false);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      setLoading(false);
      return { success: false, message };
    }
  };

  /**
   * Log in an existing user
   */
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token: receivedToken, user: receivedUser } = res.data;

      localStorage.setItem('token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      setLoading(false);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid email or password';
      setError(message);
      setLoading(false);
      return { success: false, message };
    }
  };

  /**
   * Log out user
   */
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  const clearError = () => setError(null);

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    isAuthenticated: Boolean(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to easily consume the AuthContext in any component
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
