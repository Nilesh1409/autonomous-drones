import axios from "axios";

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message =
      error.response?.data?.message || error.message || "Something went wrong";

    // Handle token expiration
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject({ message });
  }
);

// Auth API
const auth = {
  login: (credentials) => apiClient.post("/api/auth/login", credentials),
  register: (userData) => apiClient.post("/api/auth/register", userData),
  getProfile: () => apiClient.get("/api/auth/profile"),
  createUser: (userData) => apiClient.post("/api/auth/users", userData),
};

// Drones API
const drones = {
  getAll: (params) => apiClient.get("/api/drones", { params }),
  getById: (id) => apiClient.get(`/api/drones/${id}`),
  create: (droneData) => apiClient.post("/api/drones", droneData),
  update: (id, droneData) => apiClient.patch(`/api/drones/${id}`, droneData),
  delete: (id) => apiClient.delete(`/api/drones/${id}`),
  updateTelemetry: (id, telemetryData) =>
    apiClient.patch(`/api/drones/${id}/telemetry`, telemetryData),
};

// Missions API
const missions = {
  getAll: (params) => apiClient.get("/api/missions", { params }),
  getById: (id) => apiClient.get(`/api/missions/${id}`),
  create: (missionData) => apiClient.post("/api/missions", missionData),
  update: (id, missionData) =>
    apiClient.patch(`/api/missions/${id}`, missionData),
  delete: (id) => apiClient.delete(`/api/missions/${id}`),
  start: (id) => apiClient.post(`/api/missions/${id}/start`),
  pause: (id) => apiClient.post(`/api/missions/${id}/pause`),
  resume: (id) => apiClient.post(`/api/missions/${id}/resume`),
  abort: (id, reason) =>
    apiClient.post(`/api/missions/${id}/abort`, { reason }),
  complete: (id) => apiClient.post(`/api/missions/${id}/complete`),
  updateProgress: (id, progressData) =>
    apiClient.patch(`/api/missions/${id}/progress`, progressData),
};

// Reports API
const reports = {
  getAll: (params) => apiClient.get("/api/reports", { params }),
  getById: (id) => apiClient.get(`/api/reports/${id}`),
  create: (reportData) => apiClient.post("/api/reports", reportData),
  update: (id, reportData) => apiClient.patch(`/api/reports/${id}`, reportData),
  delete: (id) => apiClient.delete(`/api/reports/${id}`),
  getOrganizationStats: () => apiClient.get("/api/reports/stats/organization"),
};

// Mock data for development (remove in production)
const mockData = {
  getDrones: () => {
    return Promise.resolve({
      status: "success",
      data: {
        drones: [
          {
            _id: "1",
            name: "Surveyor X1",
            serialNumber: "SX1-001",
            model: "DJI Phantom 4 RTK",
            status: "active",
            capabilities: {
              maxFlightTime: 30,
              maxSpeed: 45,
              maxAltitude: 120,
              sensors: ["rgb", "multispectral"],
            },
            telemetry: {
              batteryLevel: 85,
              lastKnownPosition: {
                latitude: 37.7749,
                longitude: -122.4194,
                altitude: 50,
              },
            },
          },
          {
            _id: "2",
            name: "Mapper Pro",
            serialNumber: "MP-002",
            model: "DJI Matrice 300 RTK",
            status: "maintenance",
            capabilities: {
              maxFlightTime: 55,
              maxSpeed: 55,
              maxAltitude: 200,
              sensors: ["rgb", "thermal", "lidar"],
            },
            telemetry: {
              batteryLevel: 65,
              lastKnownPosition: {
                latitude: 37.775,
                longitude: -122.4195,
                altitude: 0,
              },
            },
          },
          {
            _id: "3",
            name: "Inspector Mini",
            serialNumber: "IM-003",
            model: "DJI Mini 3 Pro",
            status: "inactive",
            capabilities: {
              maxFlightTime: 25,
              maxSpeed: 35,
              maxAltitude: 100,
              sensors: ["rgb"],
            },
            telemetry: {
              batteryLevel: 100,
              lastKnownPosition: null,
            },
          },
        ],
      },
    });
  },
  getMissions: () => {
    return Promise.resolve({
      status: "success",
      data: {
        missions: [
          {
            _id: "1",
            name: "Factory Roof Inspection",
            description: "Monthly inspection of factory roof",
            status: "completed",
            missionType: "inspection",
            patternType: "grid",
            percentComplete: 100,
            location: {
              name: "Factory Site",
              coordinates: {
                latitude: 37.7749,
                longitude: -122.4194,
              },
            },
            schedule: {
              startTime: "2023-06-18T10:00:00.000Z",
              endTime: "2023-06-18T10:30:00.000Z",
            },
          },
          {
            _id: "2",
            name: "Solar Farm Mapping",
            description:
              "Complete mapping of solar farm for maintenance planning",
            status: "in-progress",
            missionType: "mapping",
            patternType: "crosshatch",
            percentComplete: 45,
            location: {
              name: "Solar Farm Alpha",
              coordinates: {
                latitude: 37.78,
                longitude: -122.4,
              },
            },
            schedule: {
              startTime: "2023-06-20T09:00:00.000Z",
              endTime: "2023-06-20T10:00:00.000Z",
            },
          },
          {
            _id: "3",
            name: "Perimeter Security Patrol",
            description: "Security patrol of facility perimeter",
            status: "scheduled",
            missionType: "surveillance",
            patternType: "perimeter",
            percentComplete: 0,
            location: {
              name: "Main Facility",
              coordinates: {
                latitude: 37.77,
                longitude: -122.41,
              },
            },
            schedule: {
              startTime: "2023-06-21T08:00:00.000Z",
              endTime: "2023-06-21T09:00:00.000Z",
            },
          },
        ],
      },
    });
  },
  getReports: () => {
    return Promise.resolve({
      status: "success",
      data: {
        reports: [
          {
            _id: "1",
            title: "Factory Roof Inspection Report",
            summary: "Monthly inspection completed successfully",
            status: "published",
            mission: {
              _id: "1",
              name: "Factory Roof Inspection",
              missionType: "inspection",
            },
          },
          {
            _id: "2",
            title: "Solar Farm Mapping - Preliminary",
            summary: "Initial mapping results for solar farm",
            status: "draft",
            mission: {
              _id: "2",
              name: "Solar Farm Mapping",
              missionType: "mapping",
            },
          },
        ],
      },
    });
  },
  getStats: () => {
    return Promise.resolve({
      status: "success",
      data: {
        totalMissions: 5,
        totalFlightTime: 75,
        totalDistance: 2.5,
        totalAreaCovered: 50000,
        totalDrones: 3,
        activeDrones: 1,
        totalReports: 2,
      },
    });
  },
};

// Export the API service
const api = {
  auth,
  drones,
  missions,
  reports,
  mockData,
};

export default api;
