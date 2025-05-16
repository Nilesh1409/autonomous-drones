"use client";

import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Battery,
  MapPin,
  Wifi,
  Clock,
  CheckCircle,
  AlertTriangle,
  Sliders,
  Thermometer,
  Compass,
  Cpu,
  Zap,
  Layers,
  MapIcon,
} from "lucide-react";
import api from "../../services/api";
import { toast } from "react-toastify";
import DroneMap from "../../components/maps/DroneMap";

const DroneDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [drone, setDrone] = useState(null);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  /* ---------------- GET drone + missions -------------------------- */
  useEffect(() => {
    const load = async () => {
      try {
        /* Drone ----------------------------------------------------- */
        const d = await api.drones.getById(id);
        setDrone(d?.data?.drone);

        /* Missions that reference this drone ----------------------- */
        const allMissions = await api.missions.getAll();
        const filtered =
          allMissions?.data?.missions?.length &&
          allMissions?.data?.missions?.filter(
            (m) =>
              m.drone === id || // backend returns id
              m.droneId === id || // legacy
              m.drone?._id === id // embedded object
          );
        setMissions(filtered);
      } catch (err) {
        console.error(err);
        toast.error(err.message || "Unable to load drone");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  /* ---------------- Helpers -------------------------------------- */
  const badgeClass = (status) =>
    ({
      available: "badge-success",
      "in-mission": "badge-primary",
      maintenance: "badge-warning",
      inactive: "badge-gray",
    }[status] || "badge-gray");

  const deleteDrone = async () => {
    if (!window.confirm("Delete this drone?")) return;
    try {
      await api.drones.delete(id);
      toast.success("Drone deleted");
      navigate("/drones");
    } catch (err) {
      toast.error(err.message || "Delete failed");
    }
  };

  /* --------- Choose location for the map ------------------------- */
  const lastPos = drone?.telemetry?.lastKnownPosition;
  const firstMissionWithCoords = missions?.find((m) => m.location?.coordinates)
    ?.location?.coordinates;

  const mapLat = lastPos?.latitude ?? firstMissionWithCoords?.latitude ?? null;
  const mapLon =
    lastPos?.longitude ?? firstMissionWithCoords?.longitude ?? null;

  /* --------------------- Render ---------------------------------- */
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading"></div>
      </div>
    );
  }

  if (!drone) {
    return (
      <div className="empty-state">
        <p className="text-gray-500 mb-4">Drone not found</p>
        <Link to="/drones" className="btn btn-primary">
          Back to Drones
        </Link>
      </div>
    );
  }

  const batt = drone?.telemetry?.batteryLevel ?? 0;

  return (
    <div>
      {/* ---------- Header ----------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link to="/drones" className="btn btn-secondary btn-sm">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{drone.name}</h1>
              <span className={`badge ${badgeClass(drone.status)}`}>
                {drone.status}
              </span>
            </div>
            <p className="text-gray-500 mt-1">
              Model: {drone.model} • Serial: {drone.serialNumber}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link to={`/drones/edit/${id}`} className="btn btn-secondary">
            <Edit size={18} />
            <span>Edit</span>
          </Link>
          <button onClick={deleteDrone} className="btn btn-danger">
            <Trash2 size={18} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* ---------- Tabs ------------------------------------------- */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === "telemetry" ? "active" : ""}`}
          onClick={() => setActiveTab("telemetry")}
        >
          Telemetry
        </button>
        <button
          className={`tab ${activeTab === "missions" ? "active" : ""}`}
          onClick={() => setActiveTab("missions")}
        >
          Missions
        </button>
        <button
          className={`tab ${activeTab === "maintenance" ? "active" : ""}`}
          onClick={() => setActiveTab("maintenance")}
        >
          Maintenance
        </button>
      </div>

      {/* ---------- Content based on active tab -------------------- */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="text-lg font-bold mb-6">Drone Information</h2>

              <div className="stats-card mb-4">
                <div className="stats-card-icon bg-blue-50 text-blue-500">
                  <Layers size={20} />
                </div>
                <div>
                  <p className="stats-card-title">Status</p>
                  <p className="stats-card-value">{drone.status}</p>
                </div>
              </div>

              <div className="stats-card mb-4">
                <div className="stats-card-icon bg-green-50 text-green-500">
                  <Battery size={20} />
                </div>
                <div>
                  <p className="stats-card-title">Battery</p>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${
                          batt > 70
                            ? "bg-green-500"
                            : batt > 30
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${batt}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{batt}%</span>
                  </div>
                </div>
              </div>

              <div className="stats-card mb-4">
                <div className="stats-card-icon bg-purple-50 text-purple-500">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="stats-card-title">Last Updated</p>
                  <p className="stats-card-value">
                    {drone?.telemetry?.lastUpdated
                      ? new Date(
                          drone.telemetry.lastUpdated
                        ).toLocaleTimeString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="stats-card">
                <div className="stats-card-icon bg-yellow-50 text-yellow-500">
                  <Wifi size={20} />
                </div>
                <div>
                  <p className="stats-card-title">Signal Strength</p>
                  <p className="stats-card-value">
                    {drone.signalStrength || "Good"}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-bold mb-6">Capabilities</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Max Flight Time</p>
                  <p className="text-lg font-semibold">
                    {drone.capabilities?.maxFlightTime || "N/A"} min
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Max Speed</p>
                  <p className="text-lg font-semibold">
                    {drone.capabilities?.maxSpeed || "N/A"} m/s
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Max Altitude</p>
                  <p className="text-lg font-semibold">
                    {drone.capabilities?.maxAltitude || "N/A"} m
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Range</p>
                  <p className="text-lg font-semibold">
                    {drone.capabilities?.range || "N/A"} km
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-2">Sensors</p>
                <div className="flex flex-wrap gap-2">
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
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-2">
            <div className="card h-96">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Location</h2>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-500">
                    {lastPos
                      ? `${lastPos.latitude.toFixed(
                          6
                        )}, ${lastPos.longitude.toFixed(6)}`
                      : "Location not available"}
                  </span>
                </div>
              </div>

              {mapLat && mapLon ? (
                <div className="h-full">
                  <DroneMap
                    drone={drone}
                    latitude={mapLat}
                    longitude={mapLon}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <MapIcon size={48} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">No location data available</p>
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="text-lg font-bold mb-6">Recent Activity</h2>

              {missions && missions.length > 0 ? (
                <div className="timeline">
                  {missions.slice(0, 3).map((mission, index) => (
                    <div key={mission._id} className="timeline-item">
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{mission.name}</h3>
                            <p className="text-sm text-gray-500">
                              {mission.location?.name || "Unknown location"}
                            </p>
                          </div>
                          <span
                            className={`badge ${
                              mission.status === "completed"
                                ? "badge-success"
                                : mission.status === "in-progress"
                                ? "badge-primary"
                                : mission.status === "aborted"
                                ? "badge-danger"
                                : "badge-gray"
                            }`}
                          >
                            {mission.status}
                          </span>
                        </div>
                        <div className="mt-2 text-sm">
                          {mission.description?.substring(0, 100) ||
                            "No description"}
                          {mission.description?.length > 100 ? "..." : ""}
                        </div>
                        <div className="mt-3 flex justify-end">
                          <Link
                            to={`/missions/${mission._id}`}
                            className="text-primary text-sm font-medium"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No recent missions for this drone
                  </p>
                </div>
              )}

              {missions && missions.length > 3 && (
                <div className="mt-4 text-center">
                  <button
                    className="text-primary font-medium"
                    onClick={() => setActiveTab("missions")}
                  >
                    View all missions
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "telemetry" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="text-lg font-bold mb-6">Current Telemetry</h2>

              <div className="space-y-6">
                <div className="stats-card">
                  <div className="stats-card-icon bg-blue-50 text-blue-500">
                    <Battery size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="stats-card-title">Battery</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                      <div
                        className={`h-2.5 rounded-full ${
                          batt > 70
                            ? "bg-green-500"
                            : batt > 30
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${batt}%` }}
                      ></div>
                    </div>
                    <p className="text-sm font-medium mt-1">{batt}%</p>
                  </div>
                </div>

                <div className="stats-card">
                  <div className="stats-card-icon bg-green-50 text-green-500">
                    <Thermometer size={20} />
                  </div>
                  <div>
                    <p className="stats-card-title">Temperature</p>
                    <p className="stats-card-value">
                      {drone.telemetry?.temperature || "25"}°C
                    </p>
                  </div>
                </div>

                <div className="stats-card">
                  <div className="stats-card-icon bg-yellow-50 text-yellow-500">
                    <Compass size={20} />
                  </div>
                  <div>
                    <p className="stats-card-title">Altitude</p>
                    <p className="stats-card-value">
                      {drone.telemetry?.altitude || "0"} m
                    </p>
                  </div>
                </div>

                <div className="stats-card">
                  <div className="stats-card-icon bg-purple-50 text-purple-500">
                    <Sliders size={20} />
                  </div>
                  <div>
                    <p className="stats-card-title">Speed</p>
                    <p className="stats-card-value">
                      {drone.telemetry?.speed || "0"} m/s
                    </p>
                  </div>
                </div>

                <div className="stats-card">
                  <div className="stats-card-icon bg-red-50 text-red-500">
                    <Cpu size={20} />
                  </div>
                  <div>
                    <p className="stats-card-title">CPU Load</p>
                    <p className="stats-card-value">
                      {drone.telemetry?.cpuLoad || "15"}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="card h-96">
              <h2 className="text-lg font-bold mb-6">Live Location</h2>

              {mapLat && mapLon ? (
                <div className="h-full">
                  <DroneMap
                    drone={drone}
                    latitude={mapLat}
                    longitude={mapLon}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <MapIcon size={48} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">No location data available</p>
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="text-lg font-bold mb-6">Telemetry History</h2>

              <div className="text-center py-8">
                <p className="text-gray-500">
                  Telemetry history will be displayed here
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Feature coming soon
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "missions" && (
        <div className="card">
          <h2 className="text-lg font-bold mb-6">Mission History</h2>

          {missions && missions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="bg-gray-50">
                  <tr>
                    <th>Mission Name</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {missions.map((mission) => (
                    <tr key={mission._id}>
                      <td>
                        <div className="font-medium">{mission.name}</div>
                        <div className="text-sm text-gray-500">
                          {mission.description?.substring(0, 30) ||
                            "No description"}
                          {mission.description?.length > 30 ? "..." : ""}
                        </div>
                      </td>
                      <td className="capitalize">{mission.missionType}</td>
                      <td>{mission.location?.name || "Unknown"}</td>
                      <td>
                        <span
                          className={`badge ${
                            mission.status === "completed"
                              ? "badge-success"
                              : mission.status === "in-progress"
                              ? "badge-primary"
                              : mission.status === "aborted"
                              ? "badge-danger"
                              : "badge-gray"
                          }`}
                        >
                          {mission.status}
                        </span>
                      </td>
                      <td>
                        {mission.createdAt
                          ? new Date(mission.createdAt).toLocaleDateString()
                          : "Unknown date"}
                      </td>
                      <td>
                        <Link
                          to={`/missions/${mission._id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No missions found for this drone</p>
              <Link to="/missions/plan" className="btn btn-primary mt-4">
                Plan New Mission
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === "maintenance" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="text-lg font-bold mb-6">Maintenance Status</h2>

              <div className="stats-card mb-6">
                <div
                  className={`stats-card-icon ${
                    drone.maintenanceStatus === "good"
                      ? "bg-green-50 text-green-500"
                      : drone.maintenanceStatus === "needs-service"
                      ? "bg-yellow-50 text-yellow-500"
                      : "bg-red-50 text-red-500"
                  }`}
                >
                  {drone.maintenanceStatus === "good" ? (
                    <CheckCircle size={20} />
                  ) : (
                    <AlertTriangle size={20} />
                  )}
                </div>
                <div>
                  <p className="stats-card-title">Current Status</p>
                  <p className="stats-card-value capitalize">
                    {drone.maintenanceStatus || "Good"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Last Service Date</p>
                  <p className="text-lg font-semibold">
                    {drone.maintenanceInfo?.lastServiceDate
                      ? new Date(
                          drone.maintenanceInfo.lastServiceDate
                        ).toLocaleDateString()
                      : "Not available"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Next Service Due</p>
                  <p className="text-lg font-semibold">
                    {drone.maintenanceInfo?.nextServiceDate
                      ? new Date(
                          drone.maintenanceInfo.nextServiceDate
                        ).toLocaleDateString()
                      : "Not scheduled"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Flight Hours</p>
                  <p className="text-lg font-semibold">
                    {drone.maintenanceInfo?.flightHours || "0"} hours
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Battery Cycles</p>
                  <p className="text-lg font-semibold">
                    {drone.maintenanceInfo?.batteryCycles || "0"} cycles
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-bold mb-6">Component Health</h2>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-medium">Motors</p>
                    <p className="text-sm text-green-500">Good</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: "90%" }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-medium">Battery</p>
                    <p className="text-sm text-green-500">Good</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: "85%" }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-medium">Propellers</p>
                    <p className="text-sm text-yellow-500">Fair</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: "65%" }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-medium">Camera</p>
                    <p className="text-sm text-green-500">Good</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: "95%" }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-medium">GPS</p>
                    <p className="text-sm text-green-500">Good</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: "92%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-lg font-bold mb-6">Maintenance History</h2>

              <div className="timeline">
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">Routine Maintenance</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(
                            Date.now() - 30 * 24 * 60 * 60 * 1000
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="badge badge-success">Completed</span>
                    </div>
                    <div className="mt-2 text-sm">
                      Performed routine maintenance including propeller
                      replacement and firmware update.
                    </div>
                  </div>
                </div>

                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">Battery Replacement</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(
                            Date.now() - 90 * 24 * 60 * 60 * 1000
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="badge badge-success">Completed</span>
                    </div>
                    <div className="mt-2 text-sm">
                      Replaced the main battery due to reduced capacity after
                      200 cycles.
                    </div>
                  </div>
                </div>

                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">Camera Calibration</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(
                            Date.now() - 120 * 24 * 60 * 60 * 1000
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="badge badge-success">Completed</span>
                    </div>
                    <div className="mt-2 text-sm">
                      Performed camera calibration and sensor alignment for
                      improved image quality.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-bold mb-6">Schedule Maintenance</h2>

              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-blue-100 text-blue-500">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      Next Scheduled Maintenance
                    </h3>
                    <p className="text-sm mt-1">
                      This drone is due for maintenance in 30 days. Schedule
                      service to ensure optimal performance.
                    </p>
                  </div>
                </div>
              </div>

              <button className="btn btn-primary w-full">
                Schedule Maintenance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DroneDetails;
