"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  PlusCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Play,
  Pause,
  Check,
  X,
  Map,
  Calendar,
  MapPin,
  Clock,
} from "lucide-react";
import api from "../../services/api";
import { toast } from "react-toastify";

const MissionsList = () => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [error, setError] = useState(null);

  const fetchMissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.missions.getAll();

      if (response.status === "success") {
        setMissions(response.data.missions);
      } else {
        setError("Failed to fetch missions");
        toast.error("Failed to fetch missions");
      }
    } catch (error) {
      console.error("Error fetching missions:", error);
      setError("Failed to fetch missions. Please try again.");
      toast.error(error.message || "Failed to fetch missions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, []);

  const handleMissionAction = async (id, action) => {
    try {
      let response;

      switch (action) {
        case "start":
          response = await api.missions.start(id);
          break;
        case "pause":
          response = await api.missions.pause(id);
          break;
        case "resume":
          response = await api.missions.resume(id);
          break;
        case "complete":
          response = await api.missions.complete(id);
          break;
        case "abort":
          if (
            !window.confirm(
              "Are you sure you want to abort this mission? This action cannot be undone."
            )
          ) {
            return;
          }
          response = await api.missions.abort(id);
          break;
        default:
          throw new Error("Invalid action");
      }

      if (response.status === "success") {
        // Update mission status in the UI
        setMissions(
          missions.map((mission) => {
            if (mission._id === id) {
              let newStatus;
              switch (action) {
                case "start":
                  newStatus = "in-progress";
                  break;
                case "pause":
                  newStatus = "paused";
                  break;
                case "resume":
                  newStatus = "in-progress";
                  break;
                case "complete":
                  newStatus = "completed";
                  break;
                case "abort":
                  newStatus = "aborted";
                  break;
                default:
                  newStatus = mission.status;
              }

              return { ...mission, status: newStatus };
            }
            return mission;
          })
        );

        toast.success(`Mission ${action}ed successfully`);
      } else {
        toast.error(`Failed to ${action} mission`);
      }
    } catch (error) {
      console.error(`Error ${action}ing mission:`, error);
      toast.error(error.message || `Failed to ${action} mission`);
    }
  };

  const filteredMissions = missions.filter((mission) => {
    const matchesSearch =
      mission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mission.description &&
        mission.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || mission.status === statusFilter;
    const matchesType =
      typeFilter === "all" || mission.missionType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Check size={12} className="mr-1" />
            Completed
          </span>
        );
      case "in-progress":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Play size={12} className="mr-1" />
            In Progress
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Pause size={12} className="mr-1" />
            Paused
          </span>
        );
      case "scheduled":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Calendar size={12} className="mr-1" />
            Scheduled
          </span>
        );
      case "aborted":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <X size={12} className="mr-1" />
            Aborted
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
          onClick={fetchMissions}
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
          <h1 className="text-2xl font-bold text-gray-900">Missions</h1>
          <p className="text-gray-500 mt-1">
            Plan and manage your drone survey missions
          </p>
        </div>
        <Link to="/missions/plan" className="btn btn-primary">
          <PlusCircle size={18} />
          <span>Plan Mission</span>
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
              placeholder="Search missions..."
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
                <option value="scheduled">Scheduled</option>
                <option value="in-progress">In Progress</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="aborted">Aborted</option>
              </select>
            </div>
          </div>

          <div className="md:w-48">
            <div className="relative">
              <Filter
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="pl-10 w-full border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none"
              >
                <option value="all">All Types</option>
                <option value="mapping">Mapping</option>
                <option value="inspection">Inspection</option>
                <option value="surveillance">Surveillance</option>
                <option value="survey">Survey</option>
              </select>
            </div>
          </div>

          <button
            className="btn btn-secondary flex items-center gap-2 md:w-auto"
            onClick={fetchMissions}
          >
            <RefreshCw size={18} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Missions List */}
      {filteredMissions.length === 0 ? (
        <div className="empty-state">
          <div className="icon">
            <Map size={48} className="mx-auto text-gray-300" />
          </div>
          <h3>No missions found</h3>
          <p>Plan your first mission to get started with drone operations</p>
          <Link to="/missions/plan" className="btn btn-primary inline-flex">
            <PlusCircle size={18} className="mr-2" />
            Plan Mission
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMissions.map((mission) => (
            <div key={mission._id} className="hover-card">
              <div className="hover-card-header">
                <div>
                  <h3 className="hover-card-title">{mission.name}</h3>
                  <p className="hover-card-subtitle capitalize">
                    {mission.missionType}
                  </p>
                </div>
                {getStatusBadge(mission.status)}
              </div>

              <div className="hover-card-body">
                <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                  <MapPin size={16} className="text-gray-400" />
                  <span>{mission.location?.name || "Unknown location"}</span>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {mission.description || "No description provided"}
                </p>

                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{mission.percentComplete || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        mission.status === "completed"
                          ? "bg-green-500"
                          : mission.status === "in-progress"
                          ? "bg-blue-500"
                          : mission.status === "paused"
                          ? "bg-yellow-500"
                          : mission.status === "aborted"
                          ? "bg-red-500"
                          : "bg-gray-500"
                      }`}
                      style={{ width: `${mission.percentComplete || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="font-medium">
                        {mission.schedule?.startTime
                          ? new Date(
                              mission.schedule.startTime
                            ).toLocaleDateString()
                          : "Not scheduled"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="font-medium">
                        {mission.statistics?.duration
                          ? `${Math.floor(
                              mission.statistics.duration / 60
                            )} min`
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hover-card-footer">
                <Link
                  to={`/missions/${mission._id}`}
                  className="btn btn-primary flex-1"
                >
                  <Eye size={16} />
                  <span>View Details</span>
                </Link>

                <div className="flex gap-1">
                  {mission.status === "scheduled" && (
                    <button
                      onClick={() => handleMissionAction(mission._id, "start")}
                      className="btn btn-secondary"
                      title="Start Mission"
                    >
                      <Play size={16} />
                    </button>
                  )}

                  {mission.status === "in-progress" && (
                    <button
                      onClick={() => handleMissionAction(mission._id, "pause")}
                      className="btn btn-warning"
                      title="Pause Mission"
                    >
                      <Pause size={16} />
                    </button>
                  )}

                  {mission.status === "paused" && (
                    <button
                      onClick={() => handleMissionAction(mission._id, "resume")}
                      className="btn btn-secondary"
                      title="Resume Mission"
                    >
                      <Play size={16} />
                    </button>
                  )}

                  {(mission.status === "in-progress" ||
                    mission.status === "paused") && (
                    <button
                      onClick={() => handleMissionAction(mission._id, "abort")}
                      className="btn btn-danger"
                      title="Abort Mission"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MissionsList;
