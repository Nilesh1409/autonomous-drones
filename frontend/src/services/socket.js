import { io } from "socket.io-client";

let socket = null;

const initializeSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:8080", {
    auth: {
      token,
    },
    withCredentials: true,
    extraHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("Socket connected");
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  return socket;
};

const joinMissionRoom = (missionId) => {
  if (socket && socket.connected) {
    socket.emit("join-mission", missionId);
  }
};

const subscribeToDroneTelemetry = (droneId, callback) => {
  if (socket && socket.connected) {
    socket.on(`drone-telemetry-${droneId}`, callback);
  }
};

const subscribeMissionEvents = (callbacks) => {
  if (socket && socket.connected) {
    if (callbacks.onMissionStarted) {
      socket.on("mission-started", callbacks.onMissionStarted);
    }
    if (callbacks.onMissionPaused) {
      socket.on("mission-paused", callbacks.onMissionPaused);
    }
    if (callbacks.onMissionResumed) {
      socket.on("mission-resumed", callbacks.onMissionResumed);
    }
    if (callbacks.onMissionAborted) {
      socket.on("mission-aborted", callbacks.onMissionAborted);
    }
    if (callbacks.onMissionCompleted) {
      socket.on("mission-completed", callbacks.onMissionCompleted);
    }
    if (callbacks.onMissionProgress) {
      socket.on("mission-progress", callbacks.onMissionProgress);
    }
  }
};

const unsubscribeMissionEvents = () => {
  if (socket && socket.connected) {
    socket.off("mission-started");
    socket.off("mission-paused");
    socket.off("mission-resumed");
    socket.off("mission-aborted");
    socket.off("mission-completed");
    socket.off("mission-progress");
  }
};

const unsubscribeDroneTelemetry = (droneId) => {
  if (socket && socket.connected) {
    socket.off(`drone-telemetry-${droneId}`);
  }
};

const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export {
  initializeSocket,
  joinMissionRoom,
  subscribeToDroneTelemetry,
  subscribeMissionEvents,
  unsubscribeMissionEvents,
  unsubscribeDroneTelemetry,
  disconnectSocket,
};
