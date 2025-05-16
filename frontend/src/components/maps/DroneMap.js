"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

/* ──────────────────────────────────────────────────────────── */
/* Mapbox token – use env var in prod, fall back to demo value */
mapboxgl.accessToken =
  process.env.REACT_APP_MAPBOX_TOKEN ||
  "pk.eyJ1IjoiZXhhbXBsZXVzZXIiLCJhIjoiY2xnNXRtbWt6MGd1eTNkcGZtbXhsbjE0eiJ9.xxxxxxxxxxx";

/* ──────────────────────────────────────────────────────────── */
/*              DroneMap component                              */
/* ──────────────────────────────────────────────────────────── */

const DroneMap = ({ latitude, longitude, drone = {} }) => {
  /* ---------------------------------------------------------- */
  /* Decide which coordinates to show                           */
  const lastPos = drone?.telemetry?.lastKnownPosition;
  const lng = longitude ?? lastPos?.longitude ?? null;
  const lat = latitude ?? lastPos?.latitude ?? null;

  /* Refs                                                     */
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const pulsingDotRef = useRef(null);

  /* ---------------------------------------------------------- */
  /* 1) Initialise the map once                                */
  useEffect(() => {
    if (!lat || !lng || mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [lng, lat],
      zoom: 15,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current.addControl(new mapboxgl.FullscreenControl());

    mapRef.current.on("load", () => {
      /* ---------- animated pulsing-dot icon ------------------ */
      const size = 200;
      pulsingDotRef.current = {
        width: size,
        height: size,
        data: new Uint8Array(size * size * 4),
        onAdd() {
          const canvas = document.createElement("canvas");
          canvas.width = this.width;
          canvas.height = this.height;
          this.context = canvas.getContext("2d");
        },
        render() {
          const duration = 1000;
          const t = (performance.now() % duration) / duration;
          const radius = (size / 2) * 0.3;
          const outerRadius = (size / 2) * 0.7 * t + radius;
          const ctx = this.context;

          ctx.clearRect(0, 0, this.width, this.height);

          // outer
          ctx.beginPath();
          ctx.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(59,130,246,${1 - t})`;
          ctx.fill();

          // inner
          ctx.beginPath();
          ctx.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(59,130,246,1)";
          ctx.strokeStyle = "white";
          ctx.lineWidth = 2 + 4 * (1 - t);
          ctx.fill();
          ctx.stroke();

          this.data = ctx.getImageData(0, 0, this.width, this.height).data;
          mapRef.current.triggerRepaint();
          return true;
        },
      };
      mapRef.current.addImage("pulsing-dot", pulsingDotRef.current, {
        pixelRatio: 2,
      });

      /* ---------- geojson source ----------------------------- */
      mapRef.current.addSource("drone-location", {
        type: "geojson",
        data: pointGeoJSON([lng, lat]),
      });

      mapRef.current.addLayer({
        id: "drone-location-layer",
        type: "symbol",
        source: "drone-location",
        layout: {
          "icon-image": "pulsing-dot",
          "icon-allow-overlap": true,
        },
      });

      /* ---------- static marker with popup ------------------- */
      const popupHtml = `
        <div class="p-3">
          <h3 class="font-bold text-gray-900 mb-2">${
            drone?.name ?? "Drone"
          }</h3>
          <div class="space-y-1 text-sm">
            ${drone?.model ? `<p>Model: ${drone.model}</p>` : ""}
            ${
              drone?.telemetry?.batteryLevel !== undefined
                ? `<p>Battery: ${drone.telemetry.batteryLevel}%</p>`
                : ""
            }
            ${drone?.status ? `<p>Status: ${drone.status}</p>` : ""}
          </div>
        </div>`;

      markerRef.current = new mapboxgl.Marker({
        color: drone?.status === "available" ? "#10b981" : "#64748b",
      })
        .setLngLat([lng, lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(popupHtml))
        .addTo(mapRef.current);
    });

    /* cleanup on unmount */
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng]);

  /* ---------------------------------------------------------- */
  /* 2) Update marker & geojson when coordinates change         */
  useEffect(() => {
    if (!mapRef.current || !lat || !lng) return;

    /* center smoothly */
    mapRef.current.easeTo({ center: [lng, lat], duration: 500 });

    /* update pulsing-dot source */
    if (mapRef.current.getSource("drone-location")) {
      mapRef.current
        .getSource("drone-location")
        .setData(pointGeoJSON([lng, lat]));
    }

    /* move static marker */
    if (markerRef.current) markerRef.current.setLngLat([lng, lat]);
  }, [lat, lng]);

  /* ---------------------------------------------------------- */
  /* Render                                                     */
  if (!lat || !lng) {
    return (
      <div className="flex items-center justify-center h-full bg-light rounded-lg">
        <p className="text-gray">No location data</p>
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      className="w-full h-full rounded-lg overflow-hidden"
    />
  );
};

/* ──────────────────────────────────────────────────────────── */
/* helpers                                                     */

const pointGeoJSON = (coords) => ({
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: coords },
    },
  ],
});

export default DroneMap;
