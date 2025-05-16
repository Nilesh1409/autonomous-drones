"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

// Set Mapbox token
mapboxgl.accessToken =
  process.env.REACT_APP_MAPBOX_TOKEN ||
  "pk.eyJ1IjoiZXhhbXBsZXVzZXIiLCJhIjoiY2xnNXRtbWt6MGd1eTNkcGZtbXhsbjE0eiJ9.xxxxxxxxxxx";

const PlannerMap = ({
  center,
  onBoundaryChange,
  onLocationChange,
  isDrawing,
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const draw = useRef(null);
  const [lng, setLng] = useState(center[0]);
  const [lat, setLat] = useState(center[1]);
  const [zoom, setZoom] = useState(14);
  const [drawingEnabled, setDrawingEnabled] = useState(false);

  useEffect(() => {
    if (map.current) return; // Initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [lng, lat],
      zoom: zoom,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl());

    // Initialize the draw control with all controls
    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
      defaultMode: "simple_select",
      styles: [
        // === Inactive polygons (just drawn but not selected) ===
        {
          id: "gl-draw-polygon-fill-inactive",
          type: "fill",
          filter: [
            "all",
            ["==", "$type", "Polygon"],
            ["==", "active", "false"],
          ],
          paint: {
            "fill-color": "#00ff00",
            "fill-opacity": 0.1,
          },
        },
        {
          id: "gl-draw-polygon-stroke-inactive",
          type: "line",
          filter: [
            "all",
            ["==", "$type", "Polygon"],
            ["==", "active", "false"],
          ],
          paint: {
            "line-color": "#00ff00",
            "line-width": 2,
          },
        },

        // === Active polygons (selected/being edited) ===
        {
          id: "gl-draw-polygon-fill-active",
          type: "fill",
          filter: ["all", ["==", "$type", "Polygon"], ["==", "active", "true"]],
          paint: {
            "fill-color": "#00ff00",
            "fill-opacity": 0.25,
          },
        },
        {
          id: "gl-draw-polygon-stroke-active",
          type: "line",
          filter: ["all", ["==", "$type", "Polygon"], ["==", "active", "true"]],
          paint: {
            "line-color": "#00ff00",
            "line-width": 3,
          },
        },

        // …and then you’d want to copy in the rest of the default Mapbox-Draw layers
        // (points, vertex circles, midpoints, etc.) so nothing else breaks.
        // You can grab them from the official style sheet here:
        // https://github.com/mapbox/mapbox-gl-draw/blob/main/src/lib/default_styles.js
      ],
    });

    // Add the draw control to the map
    map.current.addControl(draw.current);

    // Wait for map to load
    map.current.on("load", () => {
      console.log("Map loaded");

      // Update coordinates when map is moved
      map.current.on("move", () => {
        setLng(map.current.getCenter().lng.toFixed(6));
        setLat(map.current.getCenter().lat.toFixed(6));
        setZoom(map.current.getZoom().toFixed(2));
      });

      // Handle draw events
      map.current.on("draw.create", updateBoundary);
      map.current.on("draw.update", updateBoundary);
      map.current.on("draw.delete", updateBoundary);
      map.current.on("draw.selectionchange", updateBoundary);
      map.current.on("draw.modechange", (e) => {
        console.log("Draw mode changed:", e);
      });

      // Add click event to update location
      map.current.on("click", (e) => {
        onLocationChange(e.lngLat.lat, e.lngLat.lng);
      });
    });

    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.off("draw.create", updateBoundary);
        map.current.off("draw.update", updateBoundary);
        map.current.off("draw.delete", updateBoundary);
        map.current.off("draw.selectionchange", updateBoundary);
        map.current.remove();
      }
    };
  }, []);

  // Update center when props change
  useEffect(() => {
    if (map.current && center[0] !== lng && center[1] !== lat) {
      map.current.flyTo({
        center: center,
        essential: true,
      });
    }
  }, [center]);

  // Handle drawing mode changes
  useEffect(() => {
    if (map.current && draw.current) {
      if (isDrawing && !drawingEnabled) {
        console.log("Enabling drawing mode");
        draw.current.changeMode("draw_polygon");
        setDrawingEnabled(true);
      } else if (!isDrawing && drawingEnabled) {
        console.log("Disabling drawing mode");
        draw.current.changeMode("simple_select");
        setDrawingEnabled(false);
      }
    }
  }, [isDrawing]);

  const updateBoundary = () => {
    console.log("Updating boundary");
    const data = draw.current.getAll();
    console.log("Draw data:", data);

    if (data.features.length > 0) {
      // Get the first polygon
      const polygon = data.features[0];
      console.log("Polygon:", polygon);

      if (polygon.geometry.type === "Polygon") {
        console.log(
          "Valid polygon found with coordinates:",
          polygon.geometry.coordinates
        );
        onBoundaryChange(polygon.geometry);
      }
    } else {
      // No polygons, reset boundary
      console.log("No polygons found, resetting boundary");
      onBoundaryChange({
        type: "Polygon",
        coordinates: [[]],
      });
    }
  };

  // Helper function to manually create a polygon
  const createTestPolygon = () => {
    if (map.current && draw.current) {
      // Delete any existing features
      const existingFeatures = draw.current.getAll().features;
      if (existingFeatures.length > 0) {
        draw.current.delete(existingFeatures.map((f) => f.id));
      }

      // Create a polygon around the current center
      const center = map.current.getCenter();
      const offset = 0.01; // roughly 1km

      const polygon = {
        type: "Polygon",
        coordinates: [
          [
            [center.lng - offset, center.lat - offset],
            [center.lng + offset, center.lat - offset],
            [center.lng + offset, center.lat + offset],
            [center.lng - offset, center.lat + offset],
            [center.lng - offset, center.lat - offset], // Close the polygon
          ],
        ],
      };

      // Add the polygon to the draw tool
      draw.current.add({
        type: "Feature",
        geometry: polygon,
        properties: {},
      });

      // Update the boundary
      onBoundaryChange(polygon);
    }
  };

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainer}
        className="w-full h-full rounded-lg overflow-hidden"
      />
      <div className="absolute top-2 left-2 bg-white p-2 rounded shadow text-sm">
        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
      </div>
      <div className="absolute bottom-2 left-2 bg-white p-2 rounded shadow text-sm max-w-xs">
        <p>
          <strong>Instructions:</strong>
        </p>
        <p className="text-xs mt-1">
          1. Click the polygon tool to start drawing
        </p>
        <p className="text-xs">2. Click on the map to add points</p>
        <p className="text-xs">
          3. Close the polygon by clicking the first point
        </p>
        <p className="text-xs">4. Use the trash tool to delete and redraw</p>
      </div>

      {/* Debug button for testing */}
      <div className="absolute bottom-2 right-2">
        <button
          onClick={createTestPolygon}
          className="bg-primary mb-10  px-3 py-1 rounded text-xs"
        >
          Create Test Boundary
        </button>
      </div>
    </div>
  );
};

export default PlannerMap;
