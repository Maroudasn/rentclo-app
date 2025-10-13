import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { fetchUserData, getUserProfile } from '../../utils/api';

const AuthContext = createContext();

const API_BASE_URL = 'http://localhost:8001';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('session_token'));
  const [token, setToken] = useState(localStorage.getItem('session_token'));
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Treat the session token as an opaque string (not a JWT)
  const getValidToken = useCallback(async () => {
    const currentToken = localStorage.getItem('session_token');
    return currentToken || null;
  }, []);

  // No-op refresh function to keep API compatibility
  const manualRefreshToken = async () => {
    const currentToken = localStorage.getItem('session_token');
    return currentToken || null;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('session_token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error initializing authentication:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (newToken, userData /* newRefreshToken ignored for opaque tokens */) => {
    try {
      localStorage.setItem('session_token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error during login:', error);
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem('session_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');

    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  // Add this function to refresh user data from the backend
  const refreshUserData = async () => {
    try {
      const userProfile = await getUserProfile();
      setUser(userProfile);
      localStorage.setItem('user', JSON.stringify(userProfile));
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const value = {
    isAuthenticated,
    token,
    user,
    isLoading,
    login,
    logout,
    refreshUserData, // Add this to the context value
    fetchUserData,
    getValidToken,
    refreshAccessToken: manualRefreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};