"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Play,
  Pause,
  X,
  Clock,
  BarChart2,
  Layers,
  PlusIcon,
  MinusIcon,
} from "lucide-react";
import { missionsAPI } from "../services/api";
import {
  getSocket,
  joinMissionRoom,
  leaveMissionRoom,
} from "../services/socket";
import LoadingSpinner from "../components/LoadingSpinner";

// Replace with your Mapbox access token
mapboxgl.accessToken =
  process.env.REACT_APP_MAPBOX_TOKEN ||
  "pk.eyJ1IjoiZXhhbXBsZXVzZXIiLCJhIjoiY2xnNXBtcm5xMDEwbDNkcGJsMnE1bjM0eiJ9.qOjm2ZGn-b95cCbHQTFaRA";

const MissionMonitoring = () => {
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const droneMarkers = useRef({});

  const [activeMissions, setActiveMissions] = useState([]);
  const [missionHistory, setMissionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMission, setSelectedMission] = useState(null);
  const [lng, setLng] = useState(-74.5);
  const [lat, setLat] = useState(40);
  const [zoom, setZoom] = useState(9);

  // Fetch missions
  useEffect(() => {
    const fetchMissions = async () => {
      try {
        const response = await missionsAPI.getAllMissions();

        if (response.status === "success") {
          const missions = response.data.missions;

          // Filter active missions (in-progress or paused)
          const active = missions.filter(
            (m) => m.status === "in-progress" || m.status === "paused"
          );
          setActiveMissions(active);

          // Filter completed or aborted missions
          const history = missions
            .filter((m) => m.status === "completed" || m.status === "aborted")
            .sort((a, b) => new Date(b.endTime) - new Date(a.endTime))
            .slice(0, 5); // Get only the 5 most recent
          setMissionHistory(history);

          // Join socket rooms for active missions
          const socket = getSocket();
          active.forEach((mission) => {
            joinMissionRoom(mission._id);
          });
        } else {
          throw new Error(response.message || "Failed to fetch missions");
        }
      } catch (error) {
        toast.error(error.message || "Failed to fetch missions");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchMissions();

    // Cleanup: leave mission rooms
    return () => {
      activeMissions.forEach((mission) => {
        leaveMissionRoom(mission._id);
      });
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (map.current) return; // initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [lng, lat],
      zoom: zoom,
    });

    map.current.on("move", () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });

    // Add navigation control
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
  }, [lng, lat, zoom]);

  // Set up socket listeners for real-time updates
  useEffect(() => {
    const socket = getSocket();

    // Listen for drone updates
    socket.on("drone_update", (data) => {
      // Update drone position on map
      updateDroneMarker(data);

      // Update mission progress in state
      setActiveMissions((prevMissions) =>
        prevMissions.map((mission) =>
          mission._id === data.missionId
            ? { ...mission, progress: data.progress }
            : mission
        )
      );
    });

    // Listen for mission status changes
    socket.on("mission_completed", (data) => {
      toast.success(`Mission ${data.missionId} completed!`);

      // Move mission from active to history
      setActiveMissions((prevMissions) => {
        const completedMission = prevMissions.find(
          (m) => m._id === data.missionId
        );
        if (completedMission) {
          setMissionHistory((prev) => [
            { ...completedMission, status: "completed", endTime: data.endTime },
            ...prev.slice(0, 4), // Keep only 5 most recent
          ]);
        }
        return prevMissions.filter((m) => m._id !== data.missionId);
      });

      // Remove drone marker
      if (droneMarkers.current[data.droneId]) {
        droneMarkers.current[data.droneId].remove();
        delete droneMarkers.current[data.droneId];
      }

      // If this was the selected mission, clear selection
      if (selectedMission && selectedMission._id === data.missionId) {
        setSelectedMission(null);
      }

      // Leave mission room
      leaveMissionRoom(data.missionId);
    });

    socket.on("mission_aborted", (data) => {
      toast.info(`Mission ${data.missionId} aborted`);

      // Move mission from active to history
      setActiveMissions((prevMissions) => {
        const abortedMission = prevMissions.find(
          (m) => m._id === data.missionId
        );
        if (abortedMission) {
          setMissionHistory((prev) => [
            { ...abortedMission, status: "aborted", endTime: data.endTime },
            ...prev.slice(0, 4), // Keep only 5 most recent
          ]);
        }
        return prevMissions.filter((m) => m._id !== data.missionId);
      });

      // Remove drone marker
      const mission = activeMissions.find((m) => m._id === data.missionId);
      if (
        mission &&
        mission.assignedDrone &&
        droneMarkers.current[mission.assignedDrone._id]
      ) {
        droneMarkers.current[mission.assignedDrone._id].remove();
        delete droneMarkers.current[mission.assignedDrone._id];
      }

      // If this was the selected mission, clear selection
      if (selectedMission && selectedMission._id === data.missionId) {
        setSelectedMission(null);
      }

      // Leave mission room
      leaveMissionRoom(data.missionId);
    });

    socket.on("mission_paused", (data) => {
      toast.info(`Mission ${data.missionId} paused`);

      // Update mission status in state
      setActiveMissions((prevMissions) =>
        prevMissions.map((mission) =>
          mission._id === data.missionId
            ? { ...mission, status: "paused" }
            : mission
        )
      );

      // Update selected mission if needed
      if (selectedMission && selectedMission._id === data.missionId) {
        setSelectedMission((prev) => ({ ...prev, status: "paused" }));
      }
    });

    socket.on("mission_resumed", (data) => {
      toast.info(`Mission ${data.missionId} resumed`);

      // Update mission status in state
      setActiveMissions((prevMissions) =>
        prevMissions.map((mission) =>
          mission._id === data.missionId
            ? { ...mission, status: "in-progress" }
            : mission
        )
      );

      // Update selected mission if needed
      if (selectedMission && selectedMission._id === data.missionId) {
        setSelectedMission((prev) => ({ ...prev, status: "in-progress" }));
      }
    });

    socket.on("drone_alert", (alert) => {
      toast.warning(`Alert: ${alert.message}`);
    });

    return () => {
      socket.off("drone_update");
      socket.off("mission_completed");
      socket.off("mission_aborted");
      socket.off("mission_paused");
      socket.off("mission_resumed");
      socket.off("drone_alert");
    };
  }, [activeMissions, selectedMission]);

  // Add mission paths to map when active missions change
  useEffect(() => {
    if (!map.current || !map.current.loaded() || activeMissions.length === 0)
      return;

    // Add mission paths to map
    activeMissions.forEach((mission) => {
      if (!mission.waypoints || mission.waypoints.length === 0) return;

      // Add path line if it doesn't exist
      if (!map.current.getSource(`path-${mission._id}`)) {
        const lineCoordinates = mission.waypoints.map((wp) => wp.coordinates);

        map.current.addSource(`path-${mission._id}`, {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: lineCoordinates,
            },
          },
        });

        map.current.addLayer({
          id: `path-${mission._id}`,
          type: "line",
          source: `path-${mission._id}`,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": mission.status === "paused" ? "#F59E0B" : "#3B82F6",
            "line-width": 3,
            "line-opacity": 0.8,
          },
        });
      }

      // Add drone marker if it doesn't exist
      if (
        mission.assignedDrone &&
        !droneMarkers.current[mission.assignedDrone._id]
      ) {
        const el = document.createElement("div");
        el.className = "drone-marker";
        el.style.width = "20px";
        el.style.height = "20px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = "#3B82F6";
        el.style.border = "2px solid white";
        el.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.3)";

        const marker = new mapboxgl.Marker(el)
          .setLngLat(mission.assignedDrone.location?.coordinates || [0, 0])
          .addTo(map.current);

        droneMarkers.current[mission.assignedDrone._id] = marker;
      }
    });

    // Center map on first active mission if no mission is selected
    if (activeMissions.length > 0 && !selectedMission) {
      const firstMission = activeMissions[0];
      if (firstMission.assignedDrone && firstMission.assignedDrone.location) {
        map.current.flyTo({
          center: firstMission.assignedDrone.location.coordinates,
          zoom: 15,
          speed: 1.2,
        });
      }
    }

    return () => {
      // Clean up sources and layers when component unmounts
      activeMissions.forEach((mission) => {
        if (map.current && map.current.getSource(`path-${mission._id}`)) {
          map.current.removeLayer(`path-${mission._id}`);
          map.current.removeSource(`path-${mission._id}`);
        }
      });
    };
  }, [activeMissions, selectedMission]);

  const updateDroneMarker = (data) => {
    if (!map.current || !droneMarkers.current[data.droneId]) return;

    // Update marker position
    droneMarkers.current[data.droneId].setLngLat(data.location);

    // If this is the selected mission's drone, update the map view
    if (
      selectedMission &&
      selectedMission.assignedDrone &&
      selectedMission.assignedDrone._id === data.droneId
    ) {
      map.current.panTo(data.location);
    }
  };

  const handleSelectMission = (mission) => {
    setSelectedMission(mission);

    if (
      map.current &&
      mission.assignedDrone &&
      mission.assignedDrone.location
    ) {
      map.current.flyTo({
        center: mission.assignedDrone.location.coordinates,
        zoom: 15,
        speed: 1.2,
      });
    }
  };

  const handleMissionAction = async (action, missionId) => {
    try {
      let response;

      switch (action) {
        case "pause":
          response = await missionsAPI.pauseMission(missionId);
          break;
        case "resume":
          response = await missionsAPI.resumeMission(missionId);
          break;
        case "abort":
          if (
            window.confirm(
              "Are you sure you want to abort this mission? This action cannot be undone."
            )
          ) {
            response = await missionsAPI.abortMission(missionId);
          } else {
            return;
          }
          break;
        default:
          return;
      }

      if (response.status === "success") {
        toast.success(response.message || `Mission ${action}d successfully`);
      } else {
        throw new Error(response.message || `Failed to ${action} mission`);
      }
    } catch (error) {
      toast.error(error.message || `Failed to ${action} mission`);
      console.error(error);
    }
  };

  const formatDuration = (startTime) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now - start;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    return `${diffHrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  };

  const formatTimeRemaining = (endTime) => {
    const end = new Date(endTime);
    const now = new Date();
    const diffMs = end - now;

    if (diffMs <= 0) return "00:00";

    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    return `${diffHrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  };

  const toggleMapStyle = () => {
    const currentStyle = map.current.getStyle().name;

    if (currentStyle.includes("Satellite")) {
      map.current.setStyle("mapbox://styles/mapbox/outdoors-v12");
    } else {
      map.current.setStyle("mapbox://styles/mapbox/satellite-streets-v12");
    }
  };

  const zoomIn = () => {
    map.current.zoomIn();
  };

  const zoomOut = () => {
    map.current.zoomOut();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mission Monitoring</h1>
        <p className="text-gray-600">Track and control active drone missions</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full">
        {/* Map Section */}
        <div className="flex-1 relative rounded-lg overflow-hidden border border-gray-200 shadow-md bg-white">
          {loading ? (
            <div className="flex justify-center items-center h-[500px] lg:h-full w-full">
              <LoadingSpinner text="Loading missions..." />
            </div>
          ) : (
            <>
              <div ref={mapContainer} className="h-[500px] lg:h-full w-full" />

              {/* Map Controls */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button
                  onClick={zoomIn}
                  className="bg-white p-2 rounded-md shadow-md hover:bg-gray-100"
                  aria-label="Zoom in"
                >
                  <PlusIcon className="h-5 w-5 text-gray-700" />
                </button>
                <button
                  onClick={zoomOut}
                  className="bg-white p-2 rounded-md shadow-md hover:bg-gray-100"
                  aria-label="Zoom out"
                >
                  <MinusIcon className="h-5 w-5 text-gray-700" />
                </button>
                <button
                  onClick={toggleMapStyle}
                  className="bg-white p-2 rounded-md shadow-md hover:bg-gray-100"
                  aria-label="Toggle map style"
                >
                  <Layers className="h-5 w-5 text-gray-700" />
                </button>
              </div>

              {/* Mission Info Overlay */}
              {selectedMission && (
                <div className="absolute bottom-4 left-4 bg-white p-4 rounded-md shadow-md max-w-xs">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-semibold">
                      {selectedMission.name}
                    </h3>
                    <button
                      onClick={() => setSelectedMission(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    <div>Drone: {selectedMission.assignedDrone?.name}</div>
                    <div>
                      Battery: {selectedMission.assignedDrone?.batteryLevel}%
                    </div>
                    <div>Altitude: {selectedMission.parameters?.altitude}m</div>
                    <div>Status: {selectedMission.status}</div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            selectedMission.status === "in-progress"
                              ? "bg-blue-600"
                              : selectedMission.status === "paused"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{
                            width: `${
                              selectedMission.progress?.percentComplete || 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span>
                          {selectedMission.progress?.percentComplete || 0}%
                          complete
                        </span>
                        <span>
                          Duration: {formatDuration(selectedMission.startTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Mission Control Panel */}
        <div className="w-full lg:w-96 flex flex-col">
          {/* Active Missions */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-md p-4 mb-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-600" />
              Active Missions ({activeMissions.length})
            </h2>

            {loading ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner size="small" text="Loading missions..." />
              </div>
            ) : activeMissions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No active missions at the moment
              </div>
            ) : (
              <div className="space-y-4">
                {activeMissions.map((mission) => (
                  <div
                    key={mission._id}
                    className={`p-3 rounded-md border ${
                      selectedMission?._id === mission._id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    } cursor-pointer`}
                    onClick={() => handleSelectMission(mission)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {mission.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Drone: {mission.drone?.name}
                        </p>
                      </div>
                      <div>
                        {mission.status === "in-progress" ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : mission.status === "paused" ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            Paused
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            Aborting
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            mission.status === "in-progress"
                              ? "bg-blue-600"
                              : mission.status === "paused"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{
                            width: `${mission.progress?.percentComplete || 0}%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span>
                          {mission.progress?.percentComplete || 0}% complete
                        </span>
                        <span>
                          Duration:{" "}
                          {formatDuration(mission.progress?.startedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end space-x-2">
                      {mission.status === "in-progress" ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMissionAction("pause", mission._id);
                          }}
                          className="p-1 rounded-md hover:bg-gray-200"
                          title="Pause Mission"
                        >
                          <Pause className="h-5 w-5 text-gray-600" />
                        </button>
                      ) : mission.status === "paused" ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMissionAction("resume", mission._id);
                          }}
                          className="p-1 rounded-md hover:bg-gray-200"
                          title="Resume Mission"
                        >
                          <Play className="h-5 w-5 text-gray-600" />
                        </button>
                      ) : null}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMissionAction("abort", mission._id);
                        }}
                        className="p-1 rounded-md hover:bg-gray-200"
                        title="Abort Mission"
                      >
                        <X className="h-5 w-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Missions */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-md p-4 flex-1">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
              <BarChart2 className="h-5 w-5 mr-2 text-blue-600" />
              Recent Missions
            </h2>

            {loading ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner size="small" text="Loading missions..." />
              </div>
            ) : missionHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No mission history available
              </div>
            ) : (
              <div className="space-y-3">
                {missionHistory.map((mission) => (
                  <div
                    key={mission._id}
                    className="p-3 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/missions/${mission._id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {mission.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Drone: {mission.drone?.name}
                        </p>
                      </div>
                      <div>
                        {mission.status === "completed" ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Completed
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            Aborted
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>
                        Date: {new Date(mission.endTime).toLocaleDateString()}
                      </div>
                      <div>
                        Duration:{" "}
                        {mission.statistics?.duration
                          ? `${Math.floor(
                              mission.statistics.duration / 60
                            )} min`
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionMonitoring;
