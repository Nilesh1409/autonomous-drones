"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import * as turf from "@turf/turf";
import { PlusIcon, MinusIcon, Layers, Save, List } from "lucide-react";
import { missionsAPI } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

// Replace with your Mapbox access token
mapboxgl.accessToken =
  process.env.REACT_APP_MAPBOX_TOKEN ||
  "pk.eyJ1IjoiZXhhbXBsZXVzZXIiLCJhIjoiY2xnNXBtcm5xMDEwbDNkcGJsMnE1bjM0eiJ9.qOjm2ZGn-b95cCbHQTFaRA";

const MissionPlanning = () => {
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const draw = useRef(null);

  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMissionsList, setShowMissionsList] = useState(false);

  const [lng, setLng] = useState(-74.5);
  const [lat, setLat] = useState(40);
  const [zoom, setZoom] = useState(9);
  const [surveyArea, setSurveyArea] = useState(null);
  const [missionName, setMissionName] = useState("");
  const [description, setDescription] = useState("");
  const [altitude, setAltitude] = useState(100);
  const [speed, setSpeed] = useState(5);
  const [dataFrequency, setDataFrequency] = useState(1);
  const [patternType, setPatternType] = useState("grid");
  const [waypoints, setWaypoints] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch missions
  useEffect(() => {
    const fetchMissions = async () => {
      try {
        const { data } = await missionsAPI.getAllMissions();
        setMissions(data);
      } catch (error) {
        toast.error("Failed to fetch missions");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchMissions();
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

    map.current.on("load", () => {
      draw.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true,
        },
        defaultMode: "draw_polygon",
      });

      map.current.addControl(draw.current);

      map.current.on("draw.create", updateArea);
      map.current.on("draw.delete", updateArea);
      map.current.on("draw.update", updateArea);
    });

    map.current.on("move", () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });
  }, [lng, lat, zoom]);

  const updateArea = (e) => {
    const data = draw.current.getAll();
    if (data.features.length > 0) {
      const area = turf.area(data);
      setSurveyArea({
        area: Math.round(area * 100) / 100,
        polygon: data.features[0].geometry,
      });
      generateWaypoints(data.features[0].geometry);
    } else {
      setSurveyArea(null);
      setWaypoints([]);
    }
  };

  const generateWaypoints = (polygon) => {
    // This is a simplified waypoint generation
    // In a real app, you'd use more sophisticated algorithms
    if (!polygon || !polygon.coordinates || polygon.coordinates.length === 0)
      return;

    const bounds = polygon.coordinates[0];
    const center = bounds.reduce(
      (acc, coord) => [
        acc[0] + coord[0] / bounds.length,
        acc[1] + coord[1] / bounds.length,
      ],
      [0, 0]
    );

    // Generate a simple grid pattern
    const points = [];
    const gridSize = 0.005; // Roughly 500m at equator
    const rows = 5;
    const cols = 5;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const point = [
          center[0] - gridSize * 2 + j * gridSize,
          center[1] - gridSize * 2 + i * gridSize,
        ];
        points.push({
          order: i * cols + j,
          coordinates: point,
          altitude: altitude,
          speed: speed,
          action: "flyTo",
        });
      }
    }

    setWaypoints(points);

    // Add waypoints to map
    if (map.current.getSource("waypoints")) {
      map.current.removeLayer("waypoints");
      map.current.removeSource("waypoints");
    }

    map.current.addSource("waypoints", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: points.map((point, i) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: point.coordinates,
          },
          properties: {
            id: i,
            order: i,
          },
        })),
      },
    });

    map.current.addLayer({
      id: "waypoints",
      type: "circle",
      source: "waypoints",
      paint: {
        "circle-radius": 5,
        "circle-color": "#F7B801",
        "circle-stroke-width": 1,
        "circle-stroke-color": "#fff",
      },
    });

    // Add lines connecting waypoints
    if (map.current.getSource("waypoint-lines")) {
      map.current.removeLayer("waypoint-lines");
      map.current.removeSource("waypoint-lines");
    }

    const lineCoordinates = points.map((point) => point.coordinates);

    map.current.addSource("waypoint-lines", {
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
      id: "waypoint-lines",
      type: "line",
      source: "waypoint-lines",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#F7B801",
        "line-width": 2,
        "line-dasharray": [2, 1],
      },
    });
  };

  const handleSaveMission = async () => {
    console.log(
      "🚀 ~ handleSaveMission ~ missionName || !surveyArea:",
      missionName,
      surveyArea
    );
    if (!missionName || !surveyArea) {
      toast.error("Please provide a mission name and draw a survey area");
      return;
    }

    try {
      setIsSaving(true);

      const missionData = {
        name: missionName,
        description,
        surveyArea: {
          type: "Polygon",
          coordinates: surveyArea.polygon.coordinates,
        },
        waypoints,
        parameters: {
          altitude,
          speed,
          dataFrequency,
          patternType,
        },
      };

      const { data } = await missionsAPI.createMission(missionData);

      toast.success("Mission saved successfully!");

      // Reset form
      setMissionName("");
      setDescription("");
      draw.current.deleteAll();
      setSurveyArea(null);
      setWaypoints([]);

      // Add the new mission to the list
      setMissions([data, ...missions]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save mission");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewMission = (id) => {
    navigate(`/missions/${id}`);
  };

  const zoomIn = () => {
    map.current.zoomIn();
  };

  const zoomOut = () => {
    map.current.zoomOut();
  };

  const toggleMapStyle = () => {
    const currentStyle = map.current.getStyle().name;

    if (currentStyle.includes("Satellite")) {
      map.current.setStyle("mapbox://styles/mapbox/outdoors-v12");
    } else {
      map.current.setStyle("mapbox://styles/mapbox/satellite-streets-v12");
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mission Planning</h1>
          <p className="text-gray-600">
            Create and configure drone survey missions
          </p>
        </div>

        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button
            onClick={() => setShowMissionsList(!showMissionsList)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <List className="h-5 w-5 mr-2" />
            {showMissionsList ? "Hide Missions" : "Show Missions"}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full">
        {/* Map Section */}
        <div className="flex-1 relative rounded-lg overflow-hidden border border-gray-200 shadow-md bg-white">
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

          {/* Map Info */}
          <div className="absolute bottom-4 left-4 bg-white p-2 rounded-md shadow-md text-xs">
            <div>
              Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
            </div>
          </div>
        </div>

        {/* Mission Configuration Panel */}
        <div
          className={`w-full lg:w-80 bg-white rounded-lg border border-gray-200 shadow-md p-4 ${
            showMissionsList ? "hidden" : "block"
          }`}
        >
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Mission Configuration
          </h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="mission-name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Mission Name
              </label>
              <input
                id="mission-name"
                type="text"
                value={missionName}
                onChange={(e) => setMissionName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter mission name"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter mission description"
                rows="2"
              />
            </div>

            <div>
              <label
                htmlFor="altitude"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Altitude (meters)
              </label>
              <input
                id="altitude"
                type="number"
                value={altitude}
                onChange={(e) => setAltitude(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                min="10"
                max="500"
              />
            </div>

            <div>
              <label
                htmlFor="speed"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Speed (m/s)
              </label>
              <input
                id="speed"
                type="number"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max="20"
              />
            </div>

            <div>
              <label
                htmlFor="data-frequency"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Data Collection Frequency (Hz)
              </label>
              <input
                id="data-frequency"
                type="number"
                value={dataFrequency}
                onChange={(e) => setDataFrequency(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                min="0.1"
                max="10"
                step="0.1"
              />
            </div>

            <div>
              <label
                htmlFor="pattern-type"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Survey Pattern
              </label>
              <select
                id="pattern-type"
                value={patternType}
                onChange={(e) => setPatternType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="grid">Grid</option>
                <option value="crosshatch">Crosshatch</option>
                <option value="perimeter">Perimeter</option>
                <option value="spiral">Spiral</option>
              </select>
            </div>

            {surveyArea && (
              <div className="bg-blue-50 p-3 rounded-md">
                <h3 className="text-sm font-medium text-blue-800 mb-1">
                  Survey Area
                </h3>
                <p className="text-sm text-blue-600">
                  Area: {surveyArea.area} m² <br />
                  Waypoints: {waypoints.length}
                </p>
              </div>
            )}

            <button
              onClick={handleSaveMission}
              disabled={isSaving}
              className="w-full flex items-center justify-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <LoadingSpinner size="small" text="" />
                  <span className="ml-2">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Save Mission
                </>
              )}
            </button>
          </div>
        </div>

        {/* Missions List Panel */}
        <div
          className={`w-full lg:w-80 bg-white rounded-lg border border-gray-200 shadow-md p-4 ${
            showMissionsList ? "block" : "hidden"
          }`}
        >
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Saved Missions
          </h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner text="Loading missions..." />
            </div>
          ) : missions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No missions found. Create your first mission!
            </div>
          ) : (
            <div className="space-y-3">
              {missions.map((mission) => (
                <div
                  key={mission._id}
                  className="p-3 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleViewMission(mission._id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {mission.name}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {mission.description || "No description"}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          mission.status === "planned"
                            ? "bg-gray-100 text-gray-800"
                            : mission.status === "in-progress"
                            ? "bg-blue-100 text-blue-800"
                            : mission.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {mission.status.charAt(0).toUpperCase() +
                          mission.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>
                      Created:{" "}
                      {new Date(mission.createdAt).toLocaleDateString()}
                    </div>
                    <div>Pattern: {mission.parameters.patternType}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MissionPlanning;
