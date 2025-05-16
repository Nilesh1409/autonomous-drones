"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Camera,
  Map,
  FileText,
  PlusCircle,
  Activity,
  Clock,
  BarChart2,
  ArrowUpRight,
} from "lucide-react";
import api from "../services/api";
import DashboardMap from "../components/maps/DashboardMap";
import MissionStatusChart from "../components/dashboard/MissionStatusChart";
import RecentActivityList from "../components/dashboard/RecentActivityList";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDrones: 0,
    activeDrones: 0,
    totalMissions: 0,
    activeMissions: 0,
    completedMissions: 0,
    totalReports: 0,
  });
  const [drones, setDrones] = useState([]);
  const [missions, setMissions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch organization stats
        const statsResponse = await api.reports.getOrganizationStats();
        console.log("🚀 ~ fetchDashboardData ~ statsResponse:", statsResponse);

        // Fetch drones
        const dronesResponse = await api.drones.getAll();

        // Fetch missions
        const missionsResponse = await api.missions.getAll();

        if (
          statsResponse.status === "success" &&
          dronesResponse.status === "success" &&
          missionsResponse.status === "success"
        ) {
          const dronesData = dronesResponse.data.drones;
          const missionsData = missionsResponse.data.missions;
          const statsData = statsResponse.data;

          setDrones(dronesData);
          setMissions(missionsData);

          // Calculate stats
          const activeDrones = dronesData.filter(
            (drone) => drone.status === "active"
          ).length;
          const activeMissions = missionsData.filter(
            (mission) => mission.status === "in-progress"
          ).length;
          const completedMissions = missionsData.filter(
            (mission) => mission.status === "completed"
          ).length;

          setStats({
            totalDrones: dronesData.length,
            activeDrones,
            totalMissions: missionsData.length,
            activeMissions,
            completedMissions,
            totalReports: statsData.totalReports || 0,
          });

          // Generate recent activities
          generateRecentActivities(dronesData, missionsData);
        } else {
          setError("Failed to fetch dashboard data");
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to fetch dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const generateRecentActivities = (drones, missions) => {
    const activities = [];

    // Add mission activities
    missions.slice(0, 3).forEach((mission) => {
      let action = "planned";
      if (mission.status === "in-progress") action = "started";
      if (mission.status === "completed") action = "completed";
      if (mission.status === "aborted") action = "aborted";

      activities.push({
        id: `mission-${mission._id}`,
        type: "mission",
        action,
        name: mission.name,
        time: formatTimeAgo(mission.updatedAt || new Date()),
      });
    });

    // Add drone activities
    drones.slice(0, 2).forEach((drone) => {
      let action = "added";
      if (drone.status === "maintenance") action = "maintenance";

      activities.push({
        id: `drone-${drone._id}`,
        type: "drone",
        action,
        name: drone.name,
        time: formatTimeAgo(drone.updatedAt || new Date()),
      });
    });

    setActivities(activities);
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
        <p className="font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm font-medium text-red-700 hover:text-red-900"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome to your drone management dashboard
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/missions/plan" className="btn btn-primary">
            <PlusCircle size={18} />
            <span>New Mission</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <div className="icon-wrapper bg-blue-50 text-primary">
            <Camera size={24} />
          </div>
          <div className="content">
            <h3>Total Drones</h3>
            <p>{stats.totalDrones}</p>
            <div className="flex items-center mt-2">
              <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                {stats.activeDrones} Active
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="icon-wrapper bg-indigo-50 text-indigo-600">
            <Map size={24} />
          </div>
          <div className="content">
            <h3>Total Missions</h3>
            <p>{stats.totalMissions}</p>
            <div className="flex items-center mt-2">
              <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                {stats.activeMissions} Active
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="icon-wrapper bg-green-50 text-green-600">
            <Activity size={24} />
          </div>
          <div className="content">
            <h3>Completed Missions</h3>
            <p>{stats.completedMissions}</p>
            <div className="flex items-center mt-2">
              <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                {Math.round(
                  (stats.completedMissions / stats.totalMissions) * 100
                ) || 0}
                % Success Rate
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="icon-wrapper bg-amber-50 text-amber-600">
            <FileText size={24} />
          </div>
          <div className="content">
            <h3>Total Reports</h3>
            <p>{stats.totalReports}</p>
            <div className="flex items-center mt-2">
              <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                Documentation
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Map with Active Drones */}
        <div className="lg:col-span-2 data-card">
          <div className="data-card-header">
            <h2 className="data-card-title flex items-center gap-2">
              <MapPin className="text-primary" size={18} />
              Active Drones & Missions
            </h2>
            <div className="data-card-actions">
              <Link
                to="/missions"
                className="text-sm text-primary hover:text-primary-dark flex items-center gap-1"
              >
                View All
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
          <div className="data-card-body h-80">
            <DashboardMap drones={drones} missions={missions} />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="data-card">
          <div className="data-card-header">
            <h2 className="data-card-title flex items-center gap-2">
              <Clock className="text-primary" size={18} />
              Recent Activity
            </h2>
          </div>
          <div className="data-card-body overflow-y-auto">
            <RecentActivityList activities={activities} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Mission Status Chart */}
        <div className="data-card">
          <div className="data-card-header">
            <h2 className="data-card-title flex items-center gap-2">
              <BarChart2 className="text-primary" size={18} />
              Mission Status
            </h2>
          </div>
          <div className="data-card-body">
            <MissionStatusChart
              data={[
                {
                  status: "Completed",
                  count: stats.completedMissions,
                  color: "#10b981",
                },
                {
                  status: "In Progress",
                  count: stats.activeMissions,
                  color: "#3b82f6",
                },
                {
                  status: "Scheduled",
                  count:
                    stats.totalMissions -
                    stats.activeMissions -
                    stats.completedMissions,
                  color: "#f59e0b",
                },
              ]}
            />
          </div>
        </div>

        {/* Drone Status Chart */}
        <div className="data-card">
          <div className="data-card-header">
            <h2 className="data-card-title flex items-center gap-2">
              <Camera className="text-primary" size={18} />
              Drone Status
            </h2>
          </div>
          <div className="data-card-body">
            <MissionStatusChart
              data={[
                {
                  status: "Active",
                  count: stats.activeDrones,
                  color: "#10b981",
                },
                {
                  status: "Maintenance",
                  count: Math.floor(stats.totalDrones * 0.2),
                  color: "#f59e0b",
                },
                {
                  status: "Idle",
                  count:
                    stats.totalDrones -
                    stats.activeDrones -
                    Math.floor(stats.totalDrones * 0.2),
                  color: "#6b7280",
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/drones/add"
          className="hover-card bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-200 transition-all duration-300"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Camera size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Add New Drone</h3>
              <p className="text-sm text-white/80 mt-1">
                Register a drone to your fleet
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/missions/plan"
          className="hover-card bg-gradient-to-br from-indigo-500 to-indigo-600 text-white hover:shadow-lg hover:shadow-indigo-200 transition-all duration-300"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Map size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Plan Mission</h3>
              <p className="text-sm text-white/80 mt-1">
                Create a new survey mission
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/reports/create"
          className="hover-card bg-gradient-to-br from-green-500 to-green-600 text-white hover:shadow-lg hover:shadow-green-200 transition-all duration-300"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Create Report</h3>
              <p className="text-sm text-white/80 mt-1">
                Generate a new survey report
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
