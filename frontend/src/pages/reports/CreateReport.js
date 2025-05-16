"use client";

import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiArrowLeft, FiSave, FiPlus, FiX } from "react-icons/fi";
import api from "../../services/api";
import { toast } from "react-toastify";

/* helper: blank objects for new issue / finding */
const BLANK_ISSUE = { type: "technical", description: "", severity: "medium" };
const BLANK_FIND = {
  category: "Maintenance",
  description: "",
  location: { latitude: 0, longitude: 0 },
  priority: "medium",
};

const CreateReport = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [missions, setMissions] = useState([]);
  const [selectedMission, setSelectedMission] = useState(null);

  const [formData, setFormData] = useState({
    missionId: location.state?.missionId || "",
    title: "",
    summary: "",
    status: "draft",
    flightStatistics: {
      duration: 0,
      distance: 0,
      maxAltitude: 0,
      maxSpeed: 0,
      areaCovered: 0,
      batteryUsed: 0,
    },
    weatherConditions: {
      temperature: 0,
      windSpeed: 0,
      humidity: 0,
      conditions: "",
    },
    issues: [],
    findings: [],
  });

  const [newIssue, setNewIssue] = useState({ ...BLANK_ISSUE });
  const [newFinding, setNewFinding] = useState({ ...BLANK_FIND });
  const [loading, setLoading] = useState(false);

  /* ------------- fetch missions ------------------------------ */
  useEffect(() => {
    const load = async () => {
      try {
        const all = await api.missions.getAll();
        setMissions(
          all.data?.missions?.filter((m) => m.status === "completed")
        );

        if (location.state?.missionId) {
          const m = await api.missions.getById(location.state.missionId);
          prefillFromMission(m?.data?.mission);
        }
      } catch (err) {
        console.error(err);
        toast.error(err.message || "Failed to fetch missions");
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------- helpers ------------------------------------- */
  const prefillFromMission = (m) => {
    setSelectedMission(m);
    setFormData((prev) => ({
      ...prev,
      missionId: m._id,
      title: `${m.name} - Report`,
      summary: `Survey report for ${m.name} mission at ${
        m.location?.name || "unknown location"
      }.`,
      flightStatistics: {
        ...prev.flightStatistics,
        maxAltitude: m.parameters?.altitude || 0,
        maxSpeed: m.parameters?.speed || 0,
      },
    }));
  };

  const handleMissionChange = async (e) => {
    const id = e.target.value;
    setFormData((f) => ({ ...f, missionId: id }));

    if (id) {
      try {
        const m = await api.missions.getById(id);
        prefillFromMission(m);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load mission");
      }
    } else {
      setSelectedMission(null);
    }
  };

  /* ---- generic form change helpers (string / number) -------- */
  const setDeep = (name, value, isNumber = false) => {
    if (!name.includes(".")) {
      setFormData((f) => ({ ...f, [name]: value }));
      return;
    }
    const parts = name.split(".");
    setFormData((f) => {
      const obj = { ...f };
      let cur = obj;
      parts.forEach((p, idx) => {
        if (idx === parts.length - 1) {
          cur[p] = isNumber ? +value || 0 : value;
        } else {
          cur[p] = { ...cur[p] };
          cur = cur[p];
        }
      });
      return obj;
    });
  };

  /* ------------- add / remove issue & finding ---------------- */
  const addIssue = () => {
    if (newIssue.description.trim())
      setFormData((f) => ({ ...f, issues: [...f.issues, newIssue] }));
    setNewIssue({ ...BLANK_ISSUE });
  };
  const addFinding = () => {
    if (newFinding.description.trim())
      setFormData((f) => ({ ...f, findings: [...f.findings, newFinding] }));
    setNewFinding({ ...BLANK_FIND });
  };
  const removeIssue = (i) =>
    setFormData((f) => ({
      ...f,
      issues: f.issues.filter((_, idx) => idx !== i),
    }));
  const removeFinding = (i) =>
    setFormData((f) => ({
      ...f,
      findings: f.findings.filter((_, idx) => idx !== i),
    }));

  /* ------------- submit -------------------------------------- */
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.reports.create(formData);
      toast.success("Report created");
      navigate("/reports");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to create report");
    } finally {
      setLoading(false);
    }
  };

  /* ------------- render -------------------------------------- */
  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link to="/reports" className="btn btn-secondary btn-sm">
          <FiArrowLeft />
        </Link>
        <h1 className="text-2xl font-bold">Create Report</h1>
      </div>

      <form onSubmit={submit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ---------- details & arrays (2/3 width) ------------- */}
          <div className="lg:col-span-2">
            <Card title="Report Details">
              <Select
                label="Select Mission"
                name="missionId"
                value={formData.missionId}
                onChange={handleMissionChange}
                required
              >
                <option value="">Select a mission</option>
                {missions.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} – {m.location?.name || "Unknown location"}
                  </option>
                ))}
              </Select>

              <Input
                label="Report Title"
                name="title"
                value={formData.title}
                onChange={(e) => setDeep("title", e.target.value)}
                required
              />

              <Textarea
                label="Summary"
                name="summary"
                value={formData.summary}
                onChange={(e) => setDeep("summary", e.target.value)}
                required
              />

              <Select
                label="Status"
                name="status"
                value={formData.status}
                onChange={(e) => setDeep("status", e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
            </Card>

            {/* findings */}
            <Findings
              list={formData.findings}
              newFinding={newFinding}
              onNewChange={(e) => {
                const { name, value } = e.target;
                if (name.startsWith("location.")) {
                  const field = name.split(".")[1];
                  setNewFinding((nf) => ({
                    ...nf,
                    location: {
                      ...nf.location,
                      [field]: parseFloat(value) || 0,
                    },
                  }));
                } else setNewFinding((nf) => ({ ...nf, [name]: value }));
              }}
              add={addFinding}
              remove={removeFinding}
            />

            {/* issues */}
            <Issues
              list={formData.issues}
              newIssue={newIssue}
              onNewChange={(e) =>
                setNewIssue((ni) => ({
                  ...ni,
                  [e.target.name]: e.target.value,
                }))
              }
              add={addIssue}
              remove={removeIssue}
            />
          </div>

          {/* ---------- sidebar (1/3 width) ---------------------- */}
          <div className="lg:col-span-1">
            {/* selected mission quick view */}
            {selectedMission && (
              <Card title="Selected Mission">
                <Info label="Mission Name" value={selectedMission.name} />
                <Info
                  label="Mission Type"
                  value={selectedMission.missionType}
                />
                <Info
                  label="Location"
                  value={selectedMission.location?.name || "N/A"}
                />
                <Info
                  label="Date"
                  value={
                    selectedMission.schedule?.startTime
                      ? new Date(
                          selectedMission.schedule.startTime
                        ).toLocaleDateString()
                      : "Not specified"
                  }
                />
              </Card>
            )}

            {/* flight stats */}
            <FlightStats
              data={formData.flightStatistics}
              onNumChange={(e) => setDeep(e.target.name, e.target.value, true)}
            />

            {/* weather */}
            <WeatherBlock
              data={formData.weatherConditions}
              onNumChange={(e) => setDeep(e.target.name, e.target.value, true)}
              onChange={(e) => setDeep(e.target.name, e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <Link to="/reports" className="btn btn-secondary">
                Cancel
              </Link>
              <button
                type="submit"
                className="btn btn-primary flex items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <div className="loading" />
                ) : (
                  <>
                    <FiSave />
                    <span>Create Report</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

/* ------- smaller building-block components ------------------ */
const Card = ({ title, children }) => (
  <div className="card mb-6">
    <h2 className="text-lg font-bold mb-4">{title}</h2>
    {children}
  </div>
);

const Label = ({ children }) => (
  <label className="block mb-1 font-medium">{children}</label>
);
const Input = ({ label, ...props }) => (
  <div className="form-group">
    <Label>{label}</Label>
    <input {...props} />
  </div>
);
const Textarea = ({ label, ...props }) => (
  <div className="form-group">
    <Label>{label}</Label>
    <textarea {...props} rows={props.rows || 3} />
  </div>
);
const Select = ({ label, children, ...props }) => (
  <div className="form-group">
    <Label>{label}</Label>
    <select {...props}>{children}</select>
  </div>
);

const Info = ({ label, value }) => (
  <div className="mb-2">
    <p className="text-sm text-gray">{label}</p>
    <p className="font-medium break-all">{value}</p>
  </div>
);

/* ----- Issues block ---------------------------------------- */
const Issues = ({ list, newIssue, onNewChange, add, remove }) => (
  <Card title="Issues">
    <p className="text-sm text-gray mb-4">
      Add any issues encountered during the mission.
    </p>

    {/* existing */}
    <div className="space-y-4 mb-4">
      {list.map((iss, i) => (
        <div key={i} className="p-4 bg-light rounded-lg">
          <div className="flex justify-between">
            <div>
              <h3 className="font-bold capitalize">{iss.type}</h3>
              <p className="text-sm">{iss.description}</p>
              <p className="text-xs text-gray mt-1">Severity: {iss.severity}</p>
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-gray hover:text-danger"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>

    {/* add new */}
    <div className="bg-light p-4 rounded-lg">
      <h3 className="font-bold mb-3">Add New Issue</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <Select
          label="Type"
          name="type"
          value={newIssue.type}
          onChange={onNewChange}
        >
          <option value="technical">Technical</option>
          <option value="environmental">Environmental</option>
          <option value="operational">Operational</option>
          <option value="other">Other</option>
        </Select>

        <Select
          label="Severity"
          name="severity"
          value={newIssue.severity}
          onChange={onNewChange}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </Select>
      </div>
      <Textarea
        label="Description"
        name="description"
        value={newIssue.description}
        onChange={onNewChange}
      />
      <button
        type="button"
        onClick={add}
        className="btn btn-primary flex items-center gap-2 w-full mt-3"
      >
        <FiPlus />
        <span>Add Issue</span>
      </button>
    </div>
  </Card>
);

/* ----- Findings block -------------------------------------- */
const Findings = ({ list, newFinding, onNewChange, add, remove }) => (
  <Card title="Findings">
    <p className="text-sm text-gray mb-4">
      Add important findings from the mission.
    </p>

    <div className="space-y-4 mb-4">
      {list.map((f, i) => (
        <div key={i} className="p-4 bg-light rounded-lg">
          <div className="flex justify-between">
            <div>
              <h3 className="font-bold">{f.category}</h3>
              <p className="text-sm">{f.description}</p>
              <p className="text-xs text-gray">
                Location: {f.location.latitude.toFixed(6)},{" "}
                {f.location.longitude.toFixed(6)}
              </p>
              <p className="text-xs text-gray">Priority: {f.priority}</p>
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-gray hover:text-danger"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>

    <div className="bg-light p-4 rounded-lg">
      <h3 className="font-bold mb-3">Add New Finding</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <Input
          label="Category"
          name="category"
          value={newFinding.category}
          onChange={onNewChange}
        />
        <Select
          label="Priority"
          name="priority"
          value={newFinding.priority}
          onChange={onNewChange}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </Select>
      </div>
      <Textarea
        label="Description"
        name="description"
        value={newFinding.description}
        onChange={onNewChange}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <Input
          label="Latitude"
          name="location.latitude"
          type="number"
          step="0.000001"
          value={newFinding.location.latitude}
          onChange={onNewChange}
        />
        <Input
          label="Longitude"
          name="location.longitude"
          type="number"
          step="0.000001"
          value={newFinding.location.longitude}
          onChange={onNewChange}
        />
      </div>

      <button
        type="button"
        onClick={add}
        className="btn btn-primary flex items-center gap-2 w-full"
      >
        <FiPlus />
        <span>Add Finding</span>
      </button>
    </div>
  </Card>
);

/* ----- Flight stats block ---------------------------------- */
const FlightStats = ({ data, onNumChange }) => (
  <Card title="Flight Statistics">
    <div className="grid grid-cols-2 gap-4">
      {[
        ["Duration (min)", "duration", 0.1],
        ["Distance (km)", "distance", 0.1],
        ["Max Altitude (m)", "maxAltitude", 0.1],
        ["Max Speed (m/s)", "maxSpeed", 0.1],
        ["Area Covered (m²)", "areaCovered", 1],
        ["Battery Used (%)", "batteryUsed", 1, 100],
      ].map(([label, field, step, max]) => (
        <div key={field} className="form-group">
          <Label>{label}</Label>
          <input
            name={`flightStatistics.${field}`}
            type="number"
            min="0"
            {...(max ? { max } : {})}
            step={step}
            value={data[field]}
            onChange={onNumChange}
          />
        </div>
      ))}
    </div>
  </Card>
);

/* ----- Weather block --------------------------------------- */
const WeatherBlock = ({ data, onNumChange, onChange }) => (
  <Card title="Weather Conditions">
    <div className="grid grid-cols-2 gap-4">
      {[
        ["Temperature (°C)", "temperature", 0.1],
        ["Wind Speed (m/s)", "windSpeed", 0.1],
        ["Humidity (%)", "humidity", 1, 100],
      ].map(([label, field, step, max]) => (
        <div key={field} className="form-group">
          <Label>{label}</Label>
          <input
            name={`weatherConditions.${field}`}
            type="number"
            min="0"
            {...(max ? { max } : {})}
            step={step}
            value={data[field]}
            onChange={onNumChange}
          />
        </div>
      ))}
      <Input
        label="Conditions"
        name="weatherConditions.conditions"
        value={data.conditions}
        onChange={onChange}
      />
    </div>
  </Card>
);

export default CreateReport;
