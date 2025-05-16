"use client";

import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiPlay,
  FiPause,
  FiCheck,
  FiX,
  FiFileText,
  FiClock,
  FiMapPin,
  FiSettings,
} from "react-icons/fi";
import api from "../../services/api";
import { toast } from "react-toastify";
import MissionMap from "../../components/maps/MissionMap";

/* ───────────────────────────────────────────────────────────── */

const MissionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [mission, setMission] = useState(null);
  const [drone, setDrone] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ---------------- fetch mission + drone -------------------- */
  const loadMission = async () => {
    try {
      const data = await api.missions.getById(id); // ✔ helper
      console.log("🚀 ~ loadMission ~ data:", data);
      setMission(data?.data?.mission);

      // drone reference can be object or id
      if (data.drone?._id) {
        setDrone(data.drone);
      } else if (typeof data.drone === "string" || data.droneId) {
        const d = await api.drones.getById(data.drone ?? data.droneId);
        console.log("🚀 ~ loadMission ~ d:", d);
        setDrone(d?.data?.drone);
      } else {
        setDrone(null);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to fetch mission details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMission();
  }, [id]);

  /* ---------------- mission actions -------------------------- */
  const doAction = async (action) => {
    try {
      await api.missions[action](id); // e.g. api.missions.start(id)
      await loadMission(); // refresh state
      toast.success(`Mission ${action}ed successfully`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || `Failed to ${action} mission`);
    }
  };

  /* ---------------- helpers ---------------------------------- */
  const badge = (s) =>
    ({
      completed: "badge-success",
      "in-progress": "badge-primary",
      paused: "badge-warning",
      planned: "badge-gray",
      scheduled: "badge-gray",
      aborted: "badge-danger",
    }[s] || "badge-gray");

  const percent =
    mission?.progress?.percentComplete ?? mission?.percentComplete ?? 0;

  const eta =
    mission?.progress?.estimatedTimeRemaining ??
    mission?.estimatedTimeRemaining ??
    null;

  /* ---------------- loading / error -------------------------- */
  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading" />
      </div>
    );

  if (!mission)
    return (
      <div className="card p-8 text-center">
        <p className="text-gray mb-4">Mission not found</p>
        <Link to="/missions" className="btn btn-primary">
          Back to Missions
        </Link>
      </div>
    );

  /* ---------------- render ----------------------------------- */
  return (
    <div>
      {/* ── header ───────────────────────────────────────────── */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Link to="/missions" className="btn btn-secondary btn-sm">
            <FiArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold">{mission.name}</h1>
          <span className={`badge ${badge(mission.status)}`}>
            {mission.status}
          </span>
        </div>

        <div className="flex gap-2">
          {["planned", "scheduled"].includes(mission.status) && (
            <Btn
              icon={FiPlay}
              label="Start"
              onClick={() => doAction("start")}
            />
          )}
          {mission.status === "in-progress" && (
            <>
              <Btn
                icon={FiPause}
                label="Pause"
                color="warning"
                onClick={() => doAction("pause")}
              />
              <Btn
                icon={FiCheck}
                label="Complete"
                color="success"
                onClick={() => doAction("complete")}
              />
            </>
          )}
          {mission.status === "paused" && (
            <Btn
              icon={FiPlay}
              label="Resume"
              onClick={() => doAction("resume")}
            />
          )}
          {["in-progress", "paused"].includes(mission.status) && (
            <Btn
              icon={FiX}
              label="Abort"
              color="danger"
              onClick={() => doAction("abort")}
            />
          )}
          {mission.status === "completed" && (
            <Btn
              icon={FiFileText}
              label="Create&nbsp;Report"
              onClick={() =>
                navigate("/reports/create", { state: { missionId: id } })
              }
            />
          )}
        </div>
      </div>

      {/* ── grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT column */}
        <div className="lg:col-span-1">
          <Card title="Mission Information">
            <Info label="Description" value={mission.description || "—"} />
            <Info label="Mission Type" value={mission.missionType} />
            <Info label="Pattern Type" value={mission.patternType || "—"} />
            <Info label="Status" value={mission.status} />

            {/* progress */}
            <Progress percent={percent} />

            {eta && (
              <Stat
                icon={FiClock}
                label="Estimated Time Remaining"
                value={`${eta} min`}
              />
            )}
          </Card>

          <Card title="Location">
            <Stat
              icon={FiMapPin}
              label="Location Name"
              value={mission.location?.name || "N/A"}
            />
            {mission.location?.coordinates && (
              <Info
                label="Coordinates"
                value={`${mission.location.coordinates.latitude.toFixed(
                  6
                )}, ${mission.location.coordinates.longitude.toFixed(6)}`}
              />
            )}
          </Card>

          <Card title="Schedule">
            {mission.schedule?.startTime ? (
              <>
                <Info
                  label="Start"
                  value={new Date(mission.schedule.startTime).toLocaleString()}
                />
                {mission.schedule.endTime && (
                  <Info
                    label="End"
                    value={new Date(mission.schedule.endTime).toLocaleString()}
                  />
                )}
              </>
            ) : (
              <p className="text-gray">No schedule available</p>
            )}
          </Card>

          <Card title="Mission Parameters">
            <Stat icon={FiSettings} label="Flight Parameters" hideValue />
            <Info
              label="Altitude"
              value={`${mission.parameters?.altitude ?? "N/A"} m`}
            />
            <Info
              label="Speed"
              value={`${mission.parameters?.speed ?? "N/A"} m/s`}
            />
            <Info
              label="Overlap"
              value={`${mission.parameters?.overlap ?? "N/A"} %`}
            />
            {mission.parameters?.sensorSettings && (
              <>
                <Info
                  label="Capture Interval"
                  value={`${mission.parameters.sensorSettings.captureInterval} s`}
                />
                <div className="mt-2">
                  <p className="text-sm text-gray">Active Sensors</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {mission.parameters.sensorSettings.activeSensors?.map(
                      (s) => (
                        <span key={s} className="badge badge-gray">
                          {s}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* RIGHT column */}
        <div className="lg:col-span-2">
          <Card title="Mission Map" className="h-96 mb-6">
            <MissionMap
              latitude={mission.location?.coordinates?.latitude}
              longitude={mission.location?.coordinates?.longitude}
              waypoints={mission.waypoints}
              boundary={mission.boundary}
              mission={mission}
              drone={drone}
            />
          </Card>

          {drone && (
            <Card title="Assigned Drone">
              <DroneSummary drone={drone} />
              <div className="mt-4 text-right">
                <Link
                  to={`/drones/${drone._id}`}
                  className="text-primary text-sm"
                >
                  View full details →
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

/* ───────────── reusable pieces ─────────────────────────────── */
const Card = ({ title, children, className = "" }) => (
  <div className={`card ${className}`}>
    <h2 className="text-lg font-bold mb-4">{title}</h2>
    {children}
  </div>
);

const Info = ({ label, value }) => (
  <div className="mb-2">
    <p className="text-sm text-gray">{label}</p>
    <p className="font-medium break-all">{value}</p>
  </div>
);

const Stat = ({ icon: Icon, label, value, hideValue = false }) => (
  <div className="flex items-center gap-3 mb-2">
    <div className="p-2 bg-light rounded-lg">
      <Icon className="text-primary" size={20} />
    </div>
    <div>
      <p className="text-sm text-gray">{label}</p>
      {!hideValue && <p className="font-medium">{value}</p>}
    </div>
  </div>
);

const Progress = ({ percent }) => (
  <div className="mt-4">
    <p className="text-sm text-gray">Progress</p>
    <div className="w-full bg-gray-light rounded-full h-2.5 mt-1">
      <div
        className="bg-primary h-2.5 rounded-full"
        style={{ width: `${percent}%` }}
      />
    </div>
    <p className="text-sm font-medium mt-1">{percent}% Complete</p>
  </div>
);

const Btn = ({ icon: Icon, label, onClick, color = "primary" }) => (
  <button
    onClick={onClick}
    className={`btn btn-${color} flex items-center gap-2`}
  >
    <Icon />
    <span dangerouslySetInnerHTML={{ __html: label }} />
  </button>
);

const DroneSummary = ({ drone }) => (
  <div className="flex items-start gap-4">
    <div className="p-3 bg-light rounded-lg">
      <span
        className={`flex items-center justify-center w-10 h-10 rounded-full ${
          drone.status === "available"
            ? "bg-success"
            : drone.status === "maintenance"
            ? "bg-warning"
            : "bg-gray"
        } text-white font-bold text-lg`}
      >
        {drone.name.charAt(0)}
      </span>
    </div>

    <div className="flex-1">
      <h3 className="text-lg font-bold">{drone.name}</h3>
      <p className="text-gray">{drone.model}</p>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <Info label="Status" value={drone.status} />
        <Battery level={drone.telemetry?.batteryLevel ?? 0} />
        <Info
          label="Max Flight Time"
          value={`${drone.capabilities?.maxFlightTime ?? "N/A"} min`}
        />
        <Info
          label="Max Speed"
          value={`${drone.capabilities?.maxSpeed ?? "N/A"} m/s`}
        />
      </div>

      <div className="mt-4">
        <p className="text-sm text-gray">Sensors</p>
        <div className="flex flex-wrap gap-2 mt-1">
          {drone.capabilities?.sensors?.map((s) => (
            <span key={s} className="badge badge-gray">
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const Battery = ({ level }) => (
  <div>
    <p className="text-sm text-gray">Battery</p>
    <div className="w-full bg-gray-light rounded-full h-2.5 mt-1">
      <div
        className="bg-primary h-2.5 rounded-full"
        style={{ width: `${level}%` }}
      />
    </div>
    <p className="text-sm font-medium mt-1">{level}%</p>
  </div>
);

/* ───────────────────────────────────────────────────────────── */
export default MissionDetails;
