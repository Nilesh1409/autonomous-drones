"use client";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Layouts
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";

// Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/Dashboard";
import DronesList from "./pages/drones/DronesList";
import DroneDetails from "./pages/drones/DroneDetails";
import AddDrone from "./pages/drones/AddDrone";
import MissionsList from "./pages/missions/MissionsList";
import MissionDetails from "./pages/missions/MissionDetails";
import MissionPlanner from "./pages/missions/MissionPlanner";
import ReportsList from "./pages/reports/ReportsList";
import ReportDetails from "./pages/reports/ReportDetails";
import CreateReport from "./pages/reports/CreateReport";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="loading"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/drones" element={<DronesList />} />
        <Route path="/drones/add" element={<AddDrone />} />
        <Route path="/drones/:id" element={<DroneDetails />} />
        <Route path="/missions" element={<MissionsList />} />
        <Route path="/missions/plan" element={<MissionPlanner />} />
        <Route path="/missions/:id" element={<MissionDetails />} />
        <Route path="/reports" element={<ReportsList />} />
        <Route path="/reports/create" element={<CreateReport />} />
        <Route path="/reports/:id" element={<ReportDetails />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
