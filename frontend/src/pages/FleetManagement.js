"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Battery,
  Wifi,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Plus,
  Search,
  Filter,
} from "lucide-react";
import { dronesAPI } from "../services/api";
import { getSocket } from "../services/socket";
import LoadingSpinner from "../components/LoadingSpinner";

const FleetManagement = () => {
  const navigate = useNavigate();
  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDroneModal, setShowAddDroneModal] = useState(false);
  const [newDroneData, setNewDroneData] = useState({
    name: "",
    model: "",
    serialNumber: "",
    capabilities: {
      maxFlightTime: 30,
      maxSpeed: 10,
      maxAltitude: 120,
      sensors: ["rgb"],
    },
  });

  // Fetch drones
  useEffect(() => {
    const fetchDrones = async () => {
      try {
        const response = await dronesAPI.getAllDrones();

        if (response.status === "success") {
          setDrones(response.data.drones);
        } else {
          throw new Error(response.message || "Failed to fetch drones");
        }
      } catch (error) {
        toast.error(error.message || "Failed to fetch drones");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDrones();
  }, []);

  // Set up socket listeners for real-time updates
  useEffect(() => {
    const socket = getSocket();

    // Listen for drone updates
    socket.on("drone_updated", (updatedDrone) => {
      setDrones((prevDrones) =>
        prevDrones.map((drone) =>
          drone._id === updatedDrone.droneId
            ? {
                ...drone,
                status: updatedDrone.status,
                batteryLevel: updatedDrone.batteryLevel,
                location: updatedDrone.location,
                maintenanceStatus: updatedDrone.maintenanceStatus,
              }
            : drone
        )
      );
    });

    // Listen for drone battery updates
    socket.on("drone_battery_update", (data) => {
      setDrones((prevDrones) =>
        prevDrones.map((drone) =>
          drone._id === data.droneId
            ? { ...drone, batteryLevel: data.batteryLevel }
            : drone
        )
      );
    });

    // Listen for drone status updates
    socket.on("drone_status_update", (data) => {
      setDrones((prevDrones) =>
        prevDrones.map((drone) =>
          drone._id === data.droneId ? { ...drone, status: data.status } : drone
        )
      );
    });

    // Listen for drone alerts
    socket.on("drone_alert", (alert) => {
      toast.warning(`Alert: ${alert.message}`);
    });

    return () => {
      socket.off("drone_updated");
      socket.off("drone_battery_update");
      socket.off("drone_status_update");
      socket.off("drone_alert");
    };
  }, []);

  const filteredDrones = drones.filter((drone) => {
    const matchesStatus =
      filterStatus === "all" || drone.status === filterStatus;
    const matchesSearch =
      drone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drone.model.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getBatteryColor = (level) => {
    if (level > 70) return "text-green-500";
    if (level > 30) return "text-yellow-500";
    return "text-red-500";
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "available":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            Available
          </span>
        );
      case "in-mission":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            In Mission
          </span>
        );
      case "charging":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            Charging
          </span>
        );
      case "maintenance":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            Maintenance
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  const getSignalIcon = (strength) => {
    switch (strength) {
      case "strong":
        return <Wifi className="h-5 w-5 text-green-500" />;
      case "medium":
        return <Wifi className="h-5 w-5 text-yellow-500" />;
      case "weak":
        return <Wifi className="h-5 w-5 text-red-500" />;
      default:
        return <Wifi className="h-5 w-5 text-gray-300" />;
    }
  };

  const getMaintenanceIcon = (status) => {
    switch (status) {
      case "good":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "needs-service":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "in-repair":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-300" />;
    }
  };

  const handleViewDrone = (id) => {
    navigate(`/fleet/${id}`);
  };

  const handleAddDrone = async () => {
    try {
      if (
        !newDroneData.name ||
        !newDroneData.model ||
        !newDroneData.serialNumber
      ) {
        toast.error("Please provide drone name, model, and serial number");
        return;
      }

      const response = await dronesAPI.createDrone(newDroneData);

      if (response.status === "success") {
        setDrones([...drones, response.data.drone]);
        setShowAddDroneModal(false);
        setNewDroneData({
          name: "",
          model: "",
          serialNumber: "",
          capabilities: {
            maxFlightTime: 30,
            maxSpeed: 10,
            maxAltitude: 120,
            sensors: ["rgb"],
          },
        });
        toast.success("Drone added successfully!");
      } else {
        throw new Error(response.message || "Failed to add drone");
      }
    } catch (error) {
      toast.error(error.message || "Failed to add drone");
      console.error(error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setNewDroneData({
        ...newDroneData,
        [parent]: {
          ...newDroneData[parent],
          [child]: value,
        },
      });
    } else {
      setNewDroneData({
        ...newDroneData,
        [name]: value,
      });
    }
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setNewDroneData({
        ...newDroneData,
        [parent]: {
          ...newDroneData[parent],
          [child]: Number(value),
        },
      });
    } else {
      setNewDroneData({
        ...newDroneData,
        [name]: Number(value),
      });
    }
  };

  const handleSensorChange = (e) => {
    const sensors = e.target.value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);
    setNewDroneData({
      ...newDroneData,
      capabilities: {
        ...newDroneData.capabilities,
        sensors,
      },
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
        <p className="text-gray-600">Monitor and manage your drone fleet</p>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search drones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="in-mission">In Mission</option>
              <option value="charging">Charging</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <button
            onClick={() => setShowAddDroneModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="h-5 w-5 mr-1" />
            Add Drone
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Drones</h3>
          <p className="text-2xl font-bold text-gray-900">{drones.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-500">Available</h3>
          <p className="text-2xl font-bold text-green-600">
            {drones.filter((d) => d.status === "available").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-500">In Mission</h3>
          <p className="text-2xl font-bold text-blue-600">
            {drones.filter((d) => d.status === "in-mission").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-500">Needs Attention</h3>
          <p className="text-2xl font-bold text-red-600">
            {
              drones.filter(
                (d) =>
                  d.status === "maintenance" ||
                  d.maintenanceStatus === "needs-service"
              ).length
            }
          </p>
        </div>
      </div>

      {/* Drone List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden flex-1">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner text="Loading drones..." />
          </div>
        ) : filteredDrones.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Search className="h-12 w-12 mb-2 text-gray-400" />
            <p>No drones found matching your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Drone
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Battery
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Location
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Signal
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Maintenance
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDrones.map((drone) => (
                  <tr key={drone._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {drone.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {drone.model}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(drone.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Battery
                          className={`h-5 w-5 mr-1 ${getBatteryColor(
                            drone.telemetry?.batteryLevel || 0
                          )}`}
                        />
                        <span
                          className={`text-sm ${getBatteryColor(
                            drone.telemetry?.batteryLevel || 0
                          )}`}
                        >
                          {drone.telemetry?.batteryLevel || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-500">
                          {drone.telemetry?.lastKnownPosition
                            ? `${drone.telemetry.lastKnownPosition.latitude.toFixed(
                                4
                              )}, ${drone.telemetry.lastKnownPosition.longitude.toFixed(
                                4
                              )}`
                            : "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getSignalIcon(drone.signalStrength)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getMaintenanceIcon(drone.maintenanceStatus)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        onClick={() => handleViewDrone(drone._id)}
                      >
                        Details
                      </button>
                      <button className="text-blue-600 hover:text-blue-900">
                        Assign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Drone Modal */}
      {showAddDroneModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() => setShowAddDroneModal(false)}
              ></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Add New Drone
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label
                          htmlFor="drone-name"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Drone Name
                        </label>
                        <input
                          type="text"
                          id="drone-name"
                          name="name"
                          value={newDroneData.name}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter drone name"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="drone-model"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Model
                        </label>
                        <input
                          type="text"
                          id="drone-model"
                          name="model"
                          value={newDroneData.model}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter drone model"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="serial-number"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Serial Number
                        </label>
                        <input
                          type="text"
                          id="serial-number"
                          name="serialNumber"
                          value={newDroneData.serialNumber}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter serial number"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="max-flight-time"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Max Flight Time (minutes)
                        </label>
                        <input
                          type="number"
                          id="max-flight-time"
                          name="capabilities.maxFlightTime"
                          value={newDroneData.capabilities.maxFlightTime}
                          onChange={handleNumberChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="max-speed"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Max Speed (m/s)
                        </label>
                        <input
                          type="number"
                          id="max-speed"
                          name="capabilities.maxSpeed"
                          value={newDroneData.capabilities.maxSpeed}
                          onChange={handleNumberChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="max-altitude"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Max Altitude (m)
                        </label>
                        <input
                          type="number"
                          id="max-altitude"
                          name="capabilities.maxAltitude"
                          value={newDroneData.capabilities.maxAltitude}
                          onChange={handleNumberChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="sensors"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Sensors (comma separated)
                        </label>
                        <input
                          type="text"
                          id="sensors"
                          value={newDroneData.capabilities.sensors.join(", ")}
                          onChange={handleSensorChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="rgb, thermal, lidar"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleAddDrone}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Add Drone
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddDroneModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetManagement;
