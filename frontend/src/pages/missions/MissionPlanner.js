"use client";

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiSave,
  FiPlus,
  FiX,
  FiMapPin,
  FiCalendar,
  FiClock,
  FiSettings,
  FiLayers,
  FiInfo,
  FiTarget,
  FiWifi,
  FiCheckCircle,
} from "react-icons/fi";
import api from "../../services/api";
import { toast } from "react-toastify";
import PlannerMap from "../../components/maps/PlannerMap";

const MissionPlanner = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [drones, setDrones] = useState([]);
  const [boundary, setBoundary] = useState({
    type: "Polygon",
    coordinates: [[]],
  });
  // const [isDrawing, setIsDrawing] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: {
      name: "",
      coordinates: {
        latitude: 37.7749,
        longitude: -122.4194,
      },
    },
    droneId: "",
    missionType: "mapping",
    patternType: "crosshatch",
    parameters: {
      altitude: 60,
      speed: 8,
      overlap: 40,
      sensorSettings: {
        captureInterval: 1.5,
        activeSensors: [],
      },
    },
    boundary: {
      type: "Polygon",
      coordinates: [[]],
    },
    schedule: {
      startTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16),
      endTime: new Date(new Date().getTime() + 25 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16),
    },
  });
  const [sensor, setSensor] = useState("");
  const [step, setStep] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const fetchDrones = async () => {
      try {
        const response = await api.drones.getAll();
        console.log("Drone API response:", response);

        // Check if response has the expected structure
        if (
          response.status === "success" &&
          response.data &&
          response.data.drones
        ) {
          // Filter available drones (status can be "available" or "active")
          const availableDrones = response.data.drones.filter(
            (drone) => drone.status === "available" || drone.status === "active"
          );

          setDrones(availableDrones);
          console.log("Available drones:", availableDrones);

          // Set default drone if available
          if (availableDrones.length > 0) {
            setFormData((prev) => ({
              ...prev,
              droneId: availableDrones[0]._id,
            }));
          }
        } else {
          console.error("Unexpected API response format:", response);
          toast.error("Failed to parse drone data from API");
        }
      } catch (error) {
        console.error("Error fetching drones:", error);
        toast.error("Failed to fetch drones: " + error.message);
      }
    };

    fetchDrones();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const parts = name.split(".");
      if (parts.length === 2) {
        const [parent, child] = parts;
        setFormData({
          ...formData,
          [parent]: {
            ...formData[parent],
            [child]: value,
          },
        });
      } else if (parts.length === 3) {
        const [parent, child, grandchild] = parts;
        setFormData({
          ...formData,
          [parent]: {
            ...formData[parent],
            [child]: {
              ...formData[parent][child],
              [grandchild]: value,
            },
          },
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const parts = name.split(".");

    if (parts.length === 2) {
      const [parent, child] = parts;
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: Number.parseFloat(value) || 0,
        },
      });
    } else if (parts.length === 3) {
      const [parent, child, grandchild] = parts;
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: {
            ...formData[parent][child],
            [grandchild]: Number.parseFloat(value) || 0,
          },
        },
      });
    }
  };

  const addSensor = () => {
    if (
      sensor.trim() &&
      !formData.parameters.sensorSettings.activeSensors.includes(sensor.trim())
    ) {
      setFormData({
        ...formData,
        parameters: {
          ...formData.parameters,
          sensorSettings: {
            ...formData.parameters.sensorSettings,
            activeSensors: [
              ...formData.parameters.sensorSettings.activeSensors,
              sensor.trim(),
            ],
          },
        },
      });
      setSensor("");
    }
  };

  const removeSensor = (index) => {
    const updatedSensors = [
      ...formData.parameters.sensorSettings.activeSensors,
    ];
    updatedSensors.splice(index, 1);

    setFormData({
      ...formData,
      parameters: {
        ...formData.parameters,
        sensorSettings: {
          ...formData.parameters.sensorSettings,
          activeSensors: updatedSensors,
        },
      },
    });
  };

  const handleBoundaryChange = (newBoundary) => {
    console.log("Boundary changed:", newBoundary);
    setBoundary(newBoundary);
    setFormData((prevData) => ({
      ...prevData,
      boundary: newBoundary,
    }));
    setIsDrawing(false);
  };

  const handleLocationChange = (lat, lng) => {
    setFormData({
      ...formData,
      location: {
        ...formData.location,
        coordinates: {
          latitude: lat,
          longitude: lng,
        },
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("🚀 ~ handleSubmit ~ formData:", formData);
      // Ensure boundary is set
      if (formData.boundary.coordinates[0].length < 4) {
        toast.error("Please draw a valid boundary on the map");
        setLoading(false);
        return;
      }

      // Ensure the first and last coordinates are the same to close the polygon
      const coords = formData.boundary.coordinates[0];
      if (
        coords.length > 0 &&
        (coords[0][0] !== coords[coords.length - 1][0] ||
          coords[0][1] !== coords[coords.length - 1][1])
      ) {
        const updatedCoords = [...coords, coords[0]];
        const updatedBoundary = {
          ...formData.boundary,
          coordinates: [updatedCoords],
        };
        setFormData({
          ...formData,
          boundary: updatedBoundary,
        });
      }

      const response = await api.missions.create(formData);
      console.log("Mission creation response:", response);

      if (response.status === "success") {
        toast.success("Mission created successfully");
        navigate("/missions");
      } else {
        toast.error(
          "Failed to create mission: " + (response.message || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error creating mission:", error);
      toast.error("Failed to create mission: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    console.log("Current step:", step);
    console.log("Form data:", formData);
    console.log("Boundary:", boundary);

    if (
      step === 1 &&
      (!formData.name || !formData.description || !formData.droneId)
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (step === 2) {
      if (!formData.location.name) {
        toast.error("Please provide a location name");
        return;
      }

      // Check if boundary is defined
      if (
        !formData.boundary ||
        !formData.boundary.coordinates ||
        !formData.boundary.coordinates[0] ||
        formData.boundary.coordinates[0].length < 4
      ) {
        console.log("Boundary validation failed:", formData.boundary);

        // If using the test button, we'll bypass this check

        if (formData.boundary.coordinates[0].length === 0) {
          toast.error("Please draw a boundary on the map");
          return;
        } else if (formData.boundary.coordinates[0].length < 4) {
          toast.warning(
            "Boundary should have at least 4 points for a proper polygon"
          );
        }
      }
    }

    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const startDrawing = () => {
    setIsDrawing(true);
  };

  const skipBoundaryCheck = () => {
    // This is a temporary function to bypass the boundary check for testing
    setStep(step + 1);
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step >= 1 ? "bg-primary text-white" : "bg-gray-light text-gray"
            }`}
          >
            <FiInfo />
          </div>
          <div
            className={`h-1 w-16 ${step >= 2 ? "bg-primary" : "bg-gray-light"}`}
          ></div>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step >= 2 ? "bg-primary text-white" : "bg-gray-light text-gray"
            }`}
          >
            <FiMapPin />
          </div>
          <div
            className={`h-1 w-16 ${step >= 3 ? "bg-primary" : "bg-gray-light"}`}
          ></div>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step >= 3 ? "bg-primary text-white" : "bg-gray-light text-gray"
            }`}
          >
            <FiSettings />
          </div>
          <div
            className={`h-1 w-16 ${step >= 4 ? "bg-primary" : "bg-gray-light"}`}
          ></div>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step >= 4 ? "bg-primary text-white" : "bg-gray-light text-gray"
            }`}
          >
            <FiCheckCircle />
          </div>
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="card bg-white shadow-lg rounded-lg p-6 border border-gray-light">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <FiInfo size={20} />
              </div>
              <h2 className="text-xl font-bold">Mission Details</h2>
            </div>

            <div className="form-group">
              <label htmlFor="name" className="font-medium text-gray-700">
                Mission Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter mission name"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
                required
              />
            </div>

            <div className="form-group">
              <label
                htmlFor="description"
                className="font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter mission description"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
                required
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label
                  htmlFor="missionType"
                  className="font-medium text-gray-700"
                >
                  Mission Type
                </label>
                <div className="relative">
                  <select
                    id="missionType"
                    name="missionType"
                    value={formData.missionType}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20 pl-10"
                    required
                  >
                    <option value="mapping">Mapping</option>
                    <option value="inspection">Inspection</option>
                    <option value="surveillance">Surveillance</option>
                    <option value="survey">Survey</option>
                  </select>
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray">
                    <FiLayers />
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label
                  htmlFor="patternType"
                  className="font-medium text-gray-700"
                >
                  Flight Pattern
                </label>
                <div className="relative">
                  <select
                    id="patternType"
                    name="patternType"
                    value={formData.patternType}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20 pl-10"
                    required
                  >
                    <option value="crosshatch">Crosshatch</option>
                    <option value="grid">Grid</option>
                    <option value="perimeter">Perimeter</option>
                    <option value="custom">Custom</option>
                  </select>
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray">
                    <FiTarget />
                  </span>
                </div>
              </div>
            </div>

            <div className="form-group mt-4">
              <label htmlFor="droneId" className="font-medium text-gray-700">
                Assign Drone
              </label>
              <div className="relative">
                <select
                  id="droneId"
                  name="droneId"
                  value={formData.droneId}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20 pl-10"
                  required
                >
                  <option value="">Select a drone</option>
                  {drones.length > 0 ? (
                    drones.map((drone) => (
                      <option key={drone._id} value={drone._id}>
                        {drone.name} - {drone.model}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      No available drones
                    </option>
                  )}
                </select>
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray">
                  <FiWifi />
                </span>
              </div>
              {drones.length === 0 && (
                <p className="text-sm text-warning mt-2">
                  No available drones found. Please add a drone before creating
                  a mission.
                </p>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2 bg-gradient-to-r from-primary to-secondary rounded-md shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
              >
                Next <FiArrowLeft className="rotate-180" />
              </button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="card bg-white shadow-lg rounded-lg p-6 border border-gray-light">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <FiMapPin size={20} />
                  </div>
                  <h2 className="text-xl font-bold">Location</h2>
                </div>

                <div className="form-group">
                  <label
                    htmlFor="location.name"
                    className="font-medium text-gray-700"
                  >
                    Location Name
                  </label>
                  <div className="relative">
                    <input
                      id="location.name"
                      name="location.name"
                      type="text"
                      value={formData.location.name}
                      onChange={handleChange}
                      placeholder="Enter location name"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20 pl-10"
                      required
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray">
                      <FiMapPin />
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="form-group">
                    <label
                      htmlFor="location.coordinates.latitude"
                      className="font-medium text-gray-700"
                    >
                      Latitude
                    </label>
                    <input
                      id="location.coordinates.latitude"
                      name="location.coordinates.latitude"
                      type="number"
                      step="0.000001"
                      value={formData.location.coordinates.latitude}
                      onChange={handleNumberChange}
                      placeholder="Latitude"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label
                      htmlFor="location.coordinates.longitude"
                      className="font-medium text-gray-700"
                    >
                      Longitude
                    </label>
                    <input
                      id="location.coordinates.longitude"
                      name="location.coordinates.longitude"
                      type="number"
                      step="0.000001"
                      value={formData.location.coordinates.longitude}
                      onChange={handleNumberChange}
                      placeholder="Longitude"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={startDrawing}
                    className={`w-full py-2 ${
                      isDrawing ? "bg-success" : "bg-primary"
                    } text-white rounded-md shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2`}
                  >
                    {isDrawing ? (
                      <>
                        <FiCheckCircle /> Drawing Mode Active
                      </>
                    ) : (
                      <>
                        <FiTarget /> Start Drawing Boundary
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setIsDrawing(false)}
                    type="button"
                    className="px-3 py-1 bg-primary text-white rounded mt-2"
                  >
                    Finish Drawing
                  </button>
                </div>

                <p className="text-sm text-gray mt-4">
                  {boundary.coordinates[0].length > 0 ? (
                    <span className="text-success flex items-center gap-1">
                      <FiCheckCircle /> Boundary defined with{" "}
                      {boundary.coordinates[0].length} points
                    </span>
                  ) : (
                    "Draw the mission boundary on the map to define the area."
                  )}
                </p>

                {/* Debug info */}
                <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                  <p className="font-medium">Debug Info:</p>
                  <p>Boundary Type: {boundary.type}</p>
                  <p>Points: {boundary.coordinates[0].length}</p>
                  <p>Drawing Mode: {isDrawing ? "Active" : "Inactive"}</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="card bg-white shadow-lg rounded-lg p-6 border border-gray-light h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <FiTarget size={20} />
                  </div>
                  <h2 className="text-xl font-bold">Mission Area</h2>
                </div>
                <p className="text-sm text-gray mb-4">
                  {isDrawing ? (
                    <span className="text-success font-medium">
                      Click on the map to add points. Close the polygon by
                      clicking on the first point.
                    </span>
                  ) : (
                    "Use the 'Start Drawing Boundary' button to define the mission area."
                  )}
                </p>
                <div className="h-[400px] rounded-lg overflow-hidden border border-gray-light">
                  <PlannerMap
                    center={[
                      formData.location.coordinates.longitude,
                      formData.location.coordinates.latitude,
                    ]}
                    onBoundaryChange={handleBoundaryChange}
                    onLocationChange={handleLocationChange}
                    isDrawing={isDrawing}
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-md shadow-sm hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
              >
                <FiArrowLeft /> Back
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={skipBoundaryCheck}
                  className="px-6 py-2 bg-gray-500 rounded-md shadow-md hover:bg-gray-600 transition-all duration-200"
                >
                  Skip Boundary Check (Debug)
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-gradient-to-r from-primary to-secondary rounded-md shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                >
                  Next <FiArrowLeft className="rotate-180" />
                </button>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card bg-white shadow-lg rounded-lg p-6 border border-gray-light">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <FiCalendar size={20} />
                </div>
                <h2 className="text-xl font-bold">Schedule</h2>
              </div>

              <div className="form-group">
                <label
                  htmlFor="schedule.startTime"
                  className="font-medium text-gray-700"
                >
                  Start Time
                </label>
                <div className="relative">
                  <input
                    id="schedule.startTime"
                    name="schedule.startTime"
                    type="datetime-local"
                    value={formData.schedule.startTime}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20 pl-10"
                    required
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray">
                    <FiCalendar />
                  </span>
                </div>
              </div>

              <div className="form-group mt-4">
                <label
                  htmlFor="schedule.endTime"
                  className="font-medium text-gray-700"
                >
                  End Time (Estimated)
                </label>
                <div className="relative">
                  <input
                    id="schedule.endTime"
                    name="schedule.endTime"
                    type="datetime-local"
                    value={formData.schedule.endTime}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20 pl-10"
                    required
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray">
                    <FiClock />
                  </span>
                </div>
              </div>
            </div>

            <div className="card bg-white shadow-lg rounded-lg p-6 border border-gray-light">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <FiSettings size={20} />
                </div>
                <h2 className="text-xl font-bold">Flight Parameters</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label
                    htmlFor="parameters.altitude"
                    className="font-medium text-gray-700"
                  >
                    Altitude (m)
                  </label>
                  <input
                    id="parameters.altitude"
                    name="parameters.altitude"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.parameters.altitude}
                    onChange={handleNumberChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
                    required
                  />
                </div>

                <div className="form-group">
                  <label
                    htmlFor="parameters.speed"
                    className="font-medium text-gray-700"
                  >
                    Speed (m/s)
                  </label>
                  <input
                    id="parameters.speed"
                    name="parameters.speed"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.parameters.speed}
                    onChange={handleNumberChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
                    required
                  />
                </div>

                <div className="form-group">
                  <label
                    htmlFor="parameters.overlap"
                    className="font-medium text-gray-700"
                  >
                    Overlap (%)
                  </label>
                  <input
                    id="parameters.overlap"
                    name="parameters.overlap"
                    type="number"
                    min="0"
                    max="90"
                    step="1"
                    value={formData.parameters.overlap}
                    onChange={handleNumberChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
                    required
                  />
                </div>

                <div className="form-group">
                  <label
                    htmlFor="parameters.sensorSettings.captureInterval"
                    className="font-medium text-gray-700"
                  >
                    Capture Interval (s)
                  </label>
                  <input
                    id="parameters.sensorSettings.captureInterval"
                    name="parameters.sensorSettings.captureInterval"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={formData.parameters.sensorSettings.captureInterval}
                    onChange={handleNumberChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
                    required
                  />
                </div>
              </div>

              <div className="form-group mt-6">
                <label htmlFor="sensor" className="font-medium text-gray-700">
                  Active Sensors
                </label>
                <div className="flex gap-2 mt-1">
                  <input
                    id="sensor"
                    type="text"
                    value={sensor}
                    onChange={(e) => setSensor(e.target.value)}
                    placeholder="Add a sensor (e.g., rgb, thermal)"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={addSensor}
                    className="px-4 py-2 bg-primary text-white rounded-md shadow-sm hover:bg-primary-dark transition-colors"
                  >
                    <FiPlus />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.parameters.sensorSettings.activeSensors.map(
                    (s, index) => (
                      <div
                        key={index}
                        className="px-3 py-1 bg-gray-100 rounded-full flex items-center gap-2"
                      >
                        <span className="text-gray-800">{s}</span>
                        <button
                          type="button"
                          onClick={() => removeSensor(index)}
                          className="text-gray hover:text-danger"
                        >
                          <FiX size={14} />
                        </button>
                      </div>
                    )
                  )}
                  {formData.parameters.sensorSettings.activeSensors.length ===
                    0 && <p className="text-sm text-gray">No sensors added</p>}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-md shadow-sm hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
              >
                <FiArrowLeft /> Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2 bg-gradient-to-r from-primary to-secondary  rounded-md shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
              >
                Next <FiArrowLeft className="rotate-180" />
              </button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="card bg-white shadow-lg rounded-lg p-6 border border-gray-light">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <FiCheckCircle size={20} />
              </div>
              <h2 className="text-xl font-bold">Review & Create Mission</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-3 text-gray-800">
                  Mission Details
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p>
                    <span className="font-medium">Name:</span> {formData.name}
                  </p>
                  <p className="mt-2">
                    <span className="font-medium">Description:</span>{" "}
                    {formData.description}
                  </p>
                  <p className="mt-2">
                    <span className="font-medium">Type:</span>{" "}
                    {formData.missionType}
                  </p>
                  <p className="mt-2">
                    <span className="font-medium">Pattern:</span>{" "}
                    {formData.patternType}
                  </p>
                  <p className="mt-2">
                    <span className="font-medium">Drone:</span>{" "}
                    {drones.find((d) => d._id === formData.droneId)?.name ||
                      "Not selected"}
                  </p>
                </div>

                <h3 className="font-semibold text-lg mb-3 mt-6 text-gray-800">
                  Location
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p>
                    <span className="font-medium">Name:</span>{" "}
                    {formData.location.name}
                  </p>
                  <p className="mt-2">
                    <span className="font-medium">Coordinates:</span>{" "}
                    {formData.location.coordinates.latitude},{" "}
                    {formData.location.coordinates.longitude}
                  </p>
                  <p className="mt-2">
                    <span className="font-medium">Boundary Points:</span>{" "}
                    {formData.boundary.coordinates[0].length}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 text-gray-800">
                  Schedule
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p>
                    <span className="font-medium">Start:</span>{" "}
                    {new Date(formData.schedule.startTime).toLocaleString()}
                  </p>
                  <p className="mt-2">
                    <span className="font-medium">End:</span>{" "}
                    {new Date(formData.schedule.endTime).toLocaleString()}
                  </p>
                </div>

                <h3 className="font-semibold text-lg mb-3 mt-6 text-gray-800">
                  Flight Parameters
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p>
                    <span className="font-medium">Altitude:</span>{" "}
                    {formData.parameters.altitude} m
                  </p>
                  <p className="mt-2">
                    <span className="font-medium">Speed:</span>{" "}
                    {formData.parameters.speed} m/s
                  </p>
                  <p className="mt-2">
                    <span className="font-medium">Overlap:</span>{" "}
                    {formData.parameters.overlap}%
                  </p>
                  <p className="mt-2">
                    <span className="font-medium">Capture Interval:</span>{" "}
                    {formData.parameters.sensorSettings.captureInterval} s
                  </p>
                  <p className="mt-2">
                    <span className="font-medium">Active Sensors:</span>{" "}
                    {formData.parameters.sensorSettings.activeSensors.length > 0
                      ? formData.parameters.sensorSettings.activeSensors.join(
                          ", "
                        )
                      : "None"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-md shadow-sm hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
              >
                <FiArrowLeft /> Back
              </button>
              <div className="flex gap-3">
                <Link
                  to="/missions"
                  className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-md shadow-sm hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-gradient-to-r from-primary to-secondary rounded-md shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="loading"></div>
                  ) : (
                    <>
                      <FiSave />
                      <span>Create Mission</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Link
          to="/missions"
          className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all duration-200"
        >
          <FiArrowLeft className="text-gray" />
        </Link>
        <h1 className="text-2xl font-bold">Plan New Mission</h1>
      </div>

      {renderStepIndicator()}

      <form onSubmit={(e) => e.preventDefault()}>{renderStepContent()}</form>
    </div>
  );
};

export default MissionPlanner;
