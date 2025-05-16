"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  PlusCircle,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Battery,
  Wifi,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Camera,
  Sliders,
} from "lucide-react";
import api from "../../services/api";
import { toast } from "react-toastify";

const DronesList = () => {
  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState(null);

  const fetchDrones = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.drones.getAll();

      if (response.status === "success") {
        setDrones(response.data.drones);
      } else {
        setError("Failed to fetch drones");
        toast.error("Failed to fetch drones");
      }
    } catch (error) {
      console.error("Error fetching drones:", error);
      setError("Failed to fetch drones. Please try again.");
      toast.error(error.message || "Failed to fetch drones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrones();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this drone?")) {
      try {
        const response = await api.drones.delete(id);

        if (response.status === "success" || response.status === 204) {
          setDrones(drones.filter((drone) => drone._id !== id));
          toast.success("Drone deleted successfully");
        } else {
          toast.error("Failed to delete drone");
        }
      } catch (error) {
        console.error("Error deleting drone:", error);
        toast.error(error.message || "Failed to delete drone");
      }
    }
  };

  const filteredDrones = drones?.filter((drone) => {
    const matchesSearch =
      drone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drone.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (drone.serialNumber &&
        drone.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || drone.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={12} className="mr-1" />
            Active
          </span>
        );
      case "maintenance":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertTriangle size={12} className="mr-1" />
            Maintenance
          </span>
        );
      case "inactive":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock size={12} className="mr-1" />
            Inactive
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getBatteryIndicator = (level) => {
    if (!level && level !== 0) return null;

    let color = "text-green-500";
    if (level < 30) color = "text-red-500";
    else if (level < 70) color = "text-yellow-500";

    return (
      <div className="flex items-center">
        <Battery className={color} size={16} />
        <span className="ml-1 text-sm">{level}%</span>
      </div>
    );
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
          onClick={fetchDrones}
          className="mt-2 text-sm font-medium text-red-700 hover:text-red-900"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drone Fleet</h1>
          <p className="text-gray-500 mt-1">Manage your drone inventory</p>
        </div>
        <Link to="/drones/add" className="btn btn-primary">
          <PlusCircle size={18} />
          <span>Add Drone</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search drones by name, model, or serial number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="md:w-48">
            <div className="relative">
              <Filter
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 w-full border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <button
            className="btn btn-secondary flex items-center gap-2 md:w-auto"
            onClick={fetchDrones}
          >
            <RefreshCw size={18} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Drones List */}
      {filteredDrones.length === 0 ? (
        <div className="empty-state">
          <div className="icon">
            <Camera size={48} className="mx-auto text-gray-300" />
          </div>
          <h3>No drones found</h3>
          <p>Add your first drone to get started with your fleet management</p>
          <Link to="/drones/add" className="btn btn-primary inline-flex">
            <PlusCircle size={18} className="mr-2" />
            Add Drone
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrones.map((drone) => (
            <div key={drone._id} className="hover-card">
              <div className="hover-card-header">
                <div>
                  <h3 className="hover-card-title">{drone.name}</h3>
                  <p className="hover-card-subtitle">Model: {drone.model}</p>
                </div>
                {getStatusBadge(drone.status)}
              </div>

              <div className="hover-card-body">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Battery className="text-gray-400" size={16} />
                    <div>
                      <p className="text-xs text-gray-500">Battery</p>
                      <p className="text-sm font-medium">
                        {drone.telemetry?.batteryLevel || "N/A"}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Wifi className="text-gray-400" size={16} />
                    <div>
                      <p className="text-xs text-gray-500">Signal</p>
                      <p className="text-sm font-medium">
                        {drone.status === "active" ? "Connected" : "Offline"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Sliders className="text-gray-400" size={16} />
                    <div>
                      <p className="text-xs text-gray-500">Max Speed</p>
                      <p className="text-sm font-medium">
                        {drone.capabilities?.maxSpeed || "N/A"} m/s
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="text-gray-400" size={16} />
                    <div>
                      <p className="text-xs text-gray-500">Flight Time</p>
                      <p className="text-sm font-medium">
                        {drone.capabilities?.maxFlightTime || "N/A"} min
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {drone.capabilities?.sensors?.map((sensor, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {sensor}
                    </span>
                  ))}
                  {(!drone.capabilities?.sensors ||
                    drone.capabilities.sensors.length === 0) && (
                    <span className="text-sm text-gray-400">
                      No sensors specified
                    </span>
                  )}
                </div>
              </div>

              <div className="hover-card-footer">
                <Link
                  to={`/drones/${drone._id}`}
                  className="btn btn-primary flex-1"
                >
                  <Eye size={16} />
                  <span>View Details</span>
                </Link>

                <button
                  onClick={() => handleDelete(drone._id)}
                  className="btn btn-danger"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DronesList;
