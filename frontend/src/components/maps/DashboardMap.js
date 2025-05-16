"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

console.log(
  "🚀 ~ process.env.REACT_APP_MAPBOX_TOKEN:",
  process.env.REACT_APP_MAPBOX_TOKEN
);
// Set Mapbox token
mapboxgl.accessToken =
  process.env.REACT_APP_MAPBOX_TOKEN ||
  "pk.eyJ1IjoibmlsZXNodGl3YXJpMTIzIiwiYSI6ImNtYW5sNGJyMTAwNG8ybHNjNHV4Z2ZjdTIifQ.4BB5SsAbzy2l-99rh2mFhg";

const DashboardMap = ({ drones, missions }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const popups = useRef([]);
  const missionLayers = useRef([]);
  const DEFAULT_CENTER = [-122.4195, 37.7749]; // San Francisco
  const [initialCenter, setInitialCenter] = useState(DEFAULT_CENTER);

  const ipLookup = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      if (!res.ok) throw new Error("IP lookup failed");
      const { latitude, longitude } = await res.json();
      if (latitude && longitude) return [longitude, latitude];
    } catch (_) {
      /* silent */
    }
    return null; // fallback handled later
  };

  useEffect(() => {
    let cancelled = false;

    const getCoords = async () => {
      // 1a. try browser geolocation
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!cancelled) {
              const { longitude, latitude } = pos.coords;
              setInitialCenter([longitude, latitude]);
            }
          },
          async () => {
            // 1b. fallback to IP lookup
            const ipCoords = await ipLookup();
            if (!cancelled && ipCoords) setInitialCenter(ipCoords);
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } else {
        // 1b. straight to IP lookup
        const ipCoords = await ipLookup();
        if (!cancelled && ipCoords) setInitialCenter(ipCoords);
      }
    };

    getCoords();
    return () => (cancelled = true);
  }, []);

  useEffect(() => {
    if (map.current) return; // Initialize map only once
    // If map already exists just recenter
    if (map.current) {
      map.current.flyTo({ center: initialCenter, zoom: 11 });
      return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: initialCenter, // Default to San Francisco
      zoom: 11,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl());

    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [initialCenter]);

  // Add drones and missions to map when data is available
  useEffect(() => {
    if (!map.current || !drones.length) return;

    // Wait for map to load
    const addMarkersAndLayers = () => {
      // Clear existing markers
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];

      // Clear existing popups
      popups.current.forEach((popup) => popup.remove());
      popups.current = [];

      // Clear existing mission layers
      missionLayers.current.forEach((layerId) => {
        if (map.current.getLayer(layerId)) {
          map.current.removeLayer(layerId);
        }
        if (map.current.getSource(layerId)) {
          map.current.removeSource(layerId);
        }
      });
      missionLayers.current = [];

      // Add drone markers
      drones.forEach((drone) => {
        if (drone.telemetry && drone.telemetry.lastKnownPosition) {
          // Create a drone element
          const el = document.createElement("div");
          el.className = "drone-marker";
          el.style.width = "20px";
          el.style.height = "20px";
          el.style.borderRadius = "50%";
          el.style.backgroundColor =
            drone.status === "active" ? "#10b981" : "#64748b";
          el.style.border = "2px solid white";
          el.style.boxShadow = "0 0 0 2px rgba(0, 0, 0, 0.1)";

          // Add a popup
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-2">
              <h3 class="font-bold text-gray-900 mb-1">${drone.name}</h3>
              <p class="text-sm text-gray-700 mb-1">Model: ${drone.model}</p>
              <p class="text-sm text-gray-700 mb-1">Battery: ${
                drone.telemetry.batteryLevel || "N/A"
              }%</p>
              <p class="text-sm text-gray-700">Status: ${drone.status}</p>
            </div>
          `);

          // Add marker to map
          const marker = new mapboxgl.Marker(el)
            .setLngLat([
              drone.telemetry.lastKnownPosition.longitude,
              drone.telemetry.lastKnownPosition.latitude,
            ])
            .setPopup(popup)
            .addTo(map.current);

          markers.current.push(marker);
          popups.current.push(popup);
        }
      });

      // Add mission boundaries
      missions.forEach((mission, index) => {
        if (
          mission.status === "in-progress" &&
          mission.boundary &&
          mission.boundary.coordinates
        ) {
          const sourceId = `mission-${index}`;
          const fillLayerId = `mission-fill-${index}`;
          const lineLayerId = `mission-line-${index}`;

          // Add mission boundary as a polygon
          map.current.addSource(sourceId, {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {
                name: mission.name,
                description: mission.description,
              },
              geometry: mission.boundary,
            },
          });

          map.current.addLayer({
            id: fillLayerId,
            type: "fill",
            source: sourceId,
            layout: {},
            paint: {
              "fill-color": "#3b82f6",
              "fill-opacity": 0.2,
            },
          });

          map.current.addLayer({
            id: lineLayerId,
            type: "line",
            source: sourceId,
            layout: {},
            paint: {
              "line-color": "#3b82f6",
              "line-width": 2,
            },
          });

          missionLayers.current.push(sourceId, fillLayerId, lineLayerId);

          // Add click event for the mission area
          map.current.on("click", fillLayerId, (e) => {
            const coordinates = e.lngLat;
            const description = `
              <div class="p-2">
                <h3 class="font-bold text-gray-900 mb-1">${mission.name}</h3>
                <p class="text-sm text-gray-700 mb-1">${
                  mission.description || ""
                }</p>
                <p class="text-sm text-gray-700 mb-1">Status: ${
                  mission.status
                }</p>
                <p class="text-sm text-gray-700">Progress: ${
                  mission.percentComplete || 0
                }%</p>
              </div>
            `;

            const popup = new mapboxgl.Popup()
              .setLngLat(coordinates)
              .setHTML(description)
              .addTo(map.current);

            popups.current.push(popup);
          });

          // Change cursor on hover
          map.current.on("mouseenter", fillLayerId, () => {
            map.current.getCanvas().style.cursor = "pointer";
          });

          map.current.on("mouseleave", fillLayerId, () => {
            map.current.getCanvas().style.cursor = "";
          });
        }
      });

      // Fit map to markers if there are any
      if (markers.current.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();

        // Add drone positions to bounds
        drones.forEach((drone) => {
          if (drone.telemetry && drone.telemetry.lastKnownPosition) {
            bounds.extend([
              drone.telemetry.lastKnownPosition.longitude,
              drone.telemetry.lastKnownPosition.latitude,
            ]);
          }
        });

        // Add mission boundaries to bounds
        missions.forEach((mission) => {
          if (mission.boundary && mission.boundary.coordinates) {
            mission.boundary.coordinates[0].forEach((coord) => {
              bounds.extend(coord);
            });
          }
        });

        // Only fit bounds if we have coordinates
        if (!bounds.isEmpty()) {
          map.current.fitBounds(bounds, {
            padding: 50,
            maxZoom: 15,
          });
        }
      }
    };

    if (map.current.loaded()) {
      addMarkersAndLayers();
    } else {
      map.current.on("load", addMarkersAndLayers);
    }

    return () => {
      if (map.current) {
        map.current.off("load", addMarkersAndLayers);
      }
    };
  }, [drones, missions]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full rounded-lg overflow-hidden"
    />
  );
};

export default DashboardMap;
