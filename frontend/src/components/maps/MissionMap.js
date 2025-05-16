"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Set Mapbox token
mapboxgl.accessToken =
  process.env.REACT_APP_MAPBOX_TOKEN ||
  "pk.eyJ1IjoiZXhhbXBsZXVzZXIiLCJhIjoiY2xnNXRtbWt6MGd1eTNkcGZtbXhsbjE0eiJ9.xxxxxxxxxxx";

const MissionMap = ({ mission, drone }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (!mission?.boundary?.coordinates) return;

    // Get center of mission boundary
    const coordinates = mission.boundary.coordinates[0];
    const bounds = coordinates.reduce((bounds, coord) => {
      return bounds.extend(coord);
    }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

    if (map.current) return; // Initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      bounds: bounds,
      padding: 50,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl());

    // Wait for map to load
    map.current.on("load", () => {
      // Add mission boundary
      map.current.addSource("mission-boundary", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: mission.boundary,
        },
      });

      map.current.addLayer({
        id: "mission-boundary-fill",
        type: "fill",
        source: "mission-boundary",
        layout: {},
        paint: {
          "fill-color": "#0062ff",
          "fill-opacity": 0.2,
        },
      });

      map.current.addLayer({
        id: "mission-boundary-line",
        type: "line",
        source: "mission-boundary",
        layout: {},
        paint: {
          "line-color": "#0062ff",
          "line-width": 2,
        },
      });

      // Generate flight path based on pattern type
      let flightPath = [];

      if (
        mission.patternType === "crosshatch" ||
        mission.patternType === "grid"
      ) {
        // Generate a grid pattern
        const bbox = bounds.toArray();
        const [[minLng, minLat], [maxLng, maxLat]] = bbox;
        const width = maxLng - minLng;
        const height = maxLat - minLat;
        const spacing = Math.min(width, height) / 10; // Adjust spacing as needed

        // Horizontal lines
        for (let lat = minLat; lat <= maxLat; lat += spacing) {
          if (((lat - minLat) / spacing) % 2 === 0) {
            flightPath.push([minLng, lat]);
            flightPath.push([maxLng, lat]);
          } else {
            flightPath.push([maxLng, lat]);
            flightPath.push([minLng, lat]);
          }
        }

        // For crosshatch, add vertical lines
        if (mission.patternType === "crosshatch") {
          for (let lng = minLng; lng <= maxLng; lng += spacing) {
            if (((lng - minLng) / spacing) % 2 === 0) {
              flightPath.push([lng, minLat]);
              flightPath.push([lng, maxLat]);
            } else {
              flightPath.push([lng, maxLat]);
              flightPath.push([lng, minLat]);
            }
          }
        }
      } else if (mission.patternType === "perimeter") {
        // Use the boundary coordinates for perimeter
        flightPath = coordinates;
      } else {
        // Default to a simple back-and-forth pattern
        const bbox = bounds.toArray();
        const [[minLng, minLat], [maxLng, maxLat]] = bbox;
        const height = maxLat - minLat;
        const spacing = height / 5; // Adjust spacing as needed

        for (let lat = minLat; lat <= maxLat; lat += spacing) {
          if (((lat - minLat) / spacing) % 2 === 0) {
            flightPath.push([minLng, lat]);
            flightPath.push([maxLng, lat]);
          } else {
            flightPath.push([maxLng, lat]);
            flightPath.push([minLng, lat]);
          }
        }
      }

      // Add flight path to map
      map.current.addSource("flight-path", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: flightPath,
          },
        },
      });

      map.current.addLayer({
        id: "flight-path-line",
        type: "line",
        source: "flight-path",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#ffab00",
          "line-width": 3,
          "line-dasharray": [2, 1],
        },
      });

      // Add waypoints
      map.current.addSource("waypoints", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: flightPath.map((coord, index) => ({
            type: "Feature",
            properties: {
              id: index,
              title: `Waypoint ${index + 1}`,
            },
            geometry: {
              type: "Point",
              coordinates: coord,
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
          "circle-color": "#ffab00",
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Add drone marker if available
      if (
        drone &&
        drone.telemetry &&
        drone.telemetry.latitude &&
        drone.telemetry.longitude
      ) {
        // Create a drone element
        const el = document.createElement("div");
        el.className = "drone-marker";
        el.style.width = "30px";
        el.style.height = "30px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor =
          drone.status === "active" ? "#00c853" : "#64748b";
        el.style.border = "3px solid white";
        el.style.boxShadow = "0 0 0 2px rgba(0, 0, 0, 0.1)";

        // Add a popup
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div>
              <h3 style="font-weight: bold; margin-bottom: 5px;">${
                drone.name
              }</h3>
              <p style="margin: 0;">Model: ${drone.model}</p>
              <p style="margin: 0;">Battery: ${
                drone.telemetry.batteryLevel || "N/A"
              }%</p>
              <p style="margin: 0;">Status: ${drone.status}</p>
              <p style="margin: 0;">Altitude: ${
                drone.telemetry.altitude || "N/A"
              } m</p>
            </div>
          `);

        // Add marker to map
        new mapboxgl.Marker(el)
          .setLngLat([drone.telemetry.longitude, drone.telemetry.latitude])
          .setPopup(popup)
          .addTo(map.current);
      }

      // Add hover effect for waypoints
      map.current.on("mouseenter", "waypoints", () => {
        map.current.getCanvas().style.cursor = "pointer";
      });

      map.current.on("mouseleave", "waypoints", () => {
        map.current.getCanvas().style.cursor = "";
      });

      // Add click event for waypoints
      map.current.on("click", "waypoints", (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const { id, title } = e.features[0].properties;

        const description = `
          <div>
            <h3 style="font-weight: bold; margin-bottom: 5px;">${title}</h3>
            <p style="margin: 0;">Coordinates: ${coordinates[0].toFixed(
              6
            )}, ${coordinates[1].toFixed(6)}</p>
            <p style="margin: 0;">Altitude: ${
              mission.parameters?.altitude || "N/A"
            } m</p>
          </div>
        `;

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(description)
          .addTo(map.current);
      });
    });

    // Clean up on unmount
    return () => map.current?.remove();
  }, [mission, drone]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full rounded-lg overflow-hidden"
    />
  );
};

export default MissionMap;
