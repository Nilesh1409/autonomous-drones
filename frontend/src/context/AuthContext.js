"use client";

import { createContext, useState, useContext, useEffect } from "react";
import api from "../services/api";
import { initializeSocket, disconnectSocket } from "../services/socket";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchUserProfile();
      initializeSocket(token);
    } else {
      setLoading(false);
    }

    return () => {
      disconnectSocket();
    };
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.auth.getProfile();

      if (response.status === "success") {
        setCurrentUser(response.user);
        setIsAuthenticated(true);
      } else {
        logout();
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.auth.login({ email, password });

      if (response.status === "success") {
        localStorage.setItem("token", response.token);
        setCurrentUser(response.user);
        setIsAuthenticated(true);
        initializeSocket(response.token);
        return true;
      } else {
        setError(response.message || "Login failed");
        return false;
      }
    } catch (error) {
      setError(error.message || "Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.auth.register(userData);

      if (response.status === "success") {
        localStorage.setItem("token", response.token);
        setCurrentUser(response.user);
        setIsAuthenticated(true);
        initializeSocket(response.token);
        return true;
      } else {
        setError(response.message || "Registration failed");
        return false;
      }
    } catch (error) {
      setError(error.message || "Registration failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setCurrentUser(null);
    setIsAuthenticated(false);
    disconnectSocket();
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    fetchUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
