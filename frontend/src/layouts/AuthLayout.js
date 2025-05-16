"use client";

import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Layers } from "lucide-react";

const AuthLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="loading"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-secondary text-white rounded-xl mb-4 shadow-lg">
            <Layers size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">DroneSync</h1>
          <p className="text-gray-600 mt-2">Drone Fleet Management System</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-100">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
