"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Cpu,
  Zap,
  Maximize,
  Camera,
  Clock,
} from "lucide-react";
import api from "../../services/api";
import { toast } from "react-toastify";

const AddDrone = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    serialNumber: "",
    model: "",
    status: "inactive",
    capabilities: {
      maxFlightTime: 0,
      maxSpeed: 0,
      maxAltitude: 0,
      sensors: [],
    },
  });
  const [sensor, setSensor] = useState("");
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Drone name is required";
    if (!formData.serialNumber.trim())
      newErrors.serialNumber = "Serial number is required";
    if (!formData.model.trim()) newErrors.model = "Model is required";
    if (formData.capabilities.maxFlightTime <= 0)
      newErrors.maxFlightTime = "Flight time must be greater than 0";
    if (formData.capabilities.maxSpeed <= 0)
      newErrors.maxSpeed = "Speed must be greater than 0";
    if (formData.capabilities.maxAltitude <= 0)
      newErrors.maxAltitude = "Altitude must be greater than 0";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const [parent, child] = name.split(".");

    setFormData({
      ...formData,
      [parent]: {
        ...formData[parent],
        [child]: Number.parseFloat(value) || 0,
      },
    });
  };

  const addSensor = () => {
    if (
      sensor.trim() &&
      !formData.capabilities.sensors.includes(sensor.trim())
    ) {
      setFormData({
        ...formData,
        capabilities: {
          ...formData.capabilities,
          sensors: [...formData.capabilities.sensors, sensor.trim()],
        },
      });
      setSensor("");
    }
  };

  const removeSensor = (index) => {
    const updatedSensors = [...formData.capabilities.sensors];
    updatedSensors.splice(index, 1);

    setFormData({
      ...formData,
      capabilities: {
        ...formData.capabilities,
        sensors: updatedSensors,
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      const response = await api.drones.create(formData);

      if (response.status === "success") {
        toast.success("Drone added successfully");
        navigate("/drones");
      } else {
        toast.error(response.message || "Failed to add drone");
      }
    } catch (error) {
      console.error("Error adding drone:", error);
      toast.error(error.message || "Failed to add drone");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link
          to="/drones"
          className="btn btn-secondary btn-sm rounded-full w-10 h-10 p-0 flex items-center justify-center"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Drone</h1>
          <p className="text-gray-500 mt-1">
            Register a new drone to your fleet
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-primary">
              <Camera size={20} />
            </div>
            <h2 className="text-xl font-bold">Basic Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Drone Name*
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter drone name"
                className={`w-full rounded-lg border ${
                  errors.name
                    ? "border-red-300 ring-1 ring-red-300"
                    : "border-gray-300"
                } focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
                required
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div className="form-group">
              <label
                htmlFor="serialNumber"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Serial Number*
              </label>
              <input
                id="serialNumber"
                name="serialNumber"
                type="text"
                value={formData.serialNumber}
                onChange={handleChange}
                placeholder="Enter serial number"
                className={`w-full rounded-lg border ${
                  errors.serialNumber
                    ? "border-red-300 ring-1 ring-red-300"
                    : "border-gray-300"
                } focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
                required
              />
              {errors.serialNumber && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.serialNumber}
                </p>
              )}
            </div>

            <div className="form-group">
              <label
                htmlFor="model"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Model*
              </label>
              <input
                id="model"
                name="model"
                type="text"
                value={formData.model}
                onChange={handleChange}
                placeholder="Enter drone model"
                className={`w-full rounded-lg border ${
                  errors.model
                    ? "border-red-300 ring-1 ring-red-300"
                    : "border-gray-300"
                } focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
                required
              />
              {errors.model && (
                <p className="mt-1 text-sm text-red-600">{errors.model}</p>
              )}
            </div>

            <div className="form-group">
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Cpu size={20} />
            </div>
            <h2 className="text-xl font-bold">Capabilities</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="form-group">
              <label
                htmlFor="capabilities.maxFlightTime"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-gray-400" />
                  <span>Max Flight Time (minutes)*</span>
                </div>
              </label>
              <input
                id="capabilities.maxFlightTime"
                name="capabilities.maxFlightTime"
                type="number"
                min="0"
                step="0.1"
                value={formData.capabilities.maxFlightTime}
                onChange={handleNumberChange}
                placeholder="Enter max flight time"
                className={`w-full rounded-lg border ${
                  errors.maxFlightTime
                    ? "border-red-300 ring-1 ring-red-300"
                    : "border-gray-300"
                } focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
                required
              />
              {errors.maxFlightTime && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.maxFlightTime}
                </p>
              )}
            </div>

            <div className="form-group">
              <label
                htmlFor="capabilities.maxSpeed"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-gray-400" />
                  <span>Max Speed (km/h)*</span>
                </div>
              </label>
              <input
                id="capabilities.maxSpeed"
                name="capabilities.maxSpeed"
                type="number"
                min="0"
                step="0.1"
                value={formData.capabilities.maxSpeed}
                onChange={handleNumberChange}
                placeholder="Enter max speed"
                className={`w-full rounded-lg border ${
                  errors.maxSpeed
                    ? "border-red-300 ring-1 ring-red-300"
                    : "border-gray-300"
                } focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
                required
              />
              {errors.maxSpeed && (
                <p className="mt-1 text-sm text-red-600">{errors.maxSpeed}</p>
              )}
            </div>

            <div className="form-group">
              <label
                htmlFor="capabilities.maxAltitude"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                <div className="flex items-center gap-2">
                  <Maximize size={16} className="text-gray-400" />
                  <span>Max Altitude (meters)*</span>
                </div>
              </label>
              <input
                id="capabilities.maxAltitude"
                name="capabilities.maxAltitude"
                type="number"
                min="0"
                step="0.1"
                value={formData.capabilities.maxAltitude}
                onChange={handleNumberChange}
                placeholder="Enter max altitude"
                className={`w-full rounded-lg border ${
                  errors.maxAltitude
                    ? "border-red-300 ring-1 ring-red-300"
                    : "border-gray-300"
                } focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors`}
                required
              />
              {errors.maxAltitude && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.maxAltitude}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
              <Plus size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Sensors</h3>
              <p className="text-gray-500 mt-1">Add sensors to the drone</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="form-group">
              <label
                htmlFor="sensor"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Sensor Name
              </label>
              <input
                id="sensor"
                name="sensor"
                type="text"
                value={sensor}
                onChange={(e) => setSensor(e.target.value)}
                placeholder="Enter sensor name"
                className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            <div className="form-group">
              <button
                type="button"
                onClick={addSensor}
                className="btn btn-primary btn-sm"
              >
                Add Sensor
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {formData.capabilities.sensors.map((sensor, index) => (
              <div key={index} className="form-group flex items-center gap-3">
                <span>{sensor}</span>
                <button
                  type="button"
                  onClick={() => removeSensor(index)}
                  className="btn btn-danger btn-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Drone"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddDrone;
