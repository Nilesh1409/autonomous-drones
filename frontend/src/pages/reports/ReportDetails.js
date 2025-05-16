"use client";

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiDownload,
  FiEdit,
  FiMapPin,
  FiThermometer,
  FiWind,
  FiDroplet,
} from "react-icons/fi";
import api from "../../services/api";
import { toast } from "react-toastify";

const ReportDetails = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportDetails = async () => {
      try {
        const response = await api.reports.getById(id);
        if (response.status === "success" && response.data.report) {
          setReport(response.data.report);
        } else {
          toast.error("Failed to fetch report details");
        }
      } catch (error) {
        console.error("Error fetching report details:", error);
        toast.error(error.message || "Failed to fetch report details");
      } finally {
        setLoading(false);
      }
    };

    fetchReportDetails();
  }, [id]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "published":
        return "badge-success";
      case "draft":
        return "badge-warning";
      default:
        return "badge-gray";
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case "high":
        return "badge-danger";
      case "medium":
        return "badge-warning";
      case "low":
        return "badge-success";
      default:
        return "badge-gray";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray mb-4">Report not found</p>
        <Link to="/reports" className="btn btn-primary">
          Back to Reports
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Link to="/reports" className="btn btn-secondary btn-sm">
            <FiArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold">{report.title}</h1>
          <span className={`badge ${getStatusBadgeClass(report.status)}`}>
            {report.status}
          </span>
        </div>

        <div className="flex gap-2">
          <Link
            to={`/reports/edit/${id}`}
            className="btn btn-secondary flex items-center gap-2"
          >
            <FiEdit />
            <span>Edit</span>
          </Link>

          <button className="btn btn-primary flex items-center gap-2">
            <FiDownload />
            <span>Download</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Summary */}
        <div className="lg:col-span-2">
          <div className="card mb-6">
            <h2 className="text-lg font-bold mb-4">Summary</h2>
            <p className="text-gray">
              {report.summary || "No summary provided"}
            </p>
          </div>

          {/* Findings */}
          <div className="card mb-6">
            <h2 className="text-lg font-bold mb-4">Findings</h2>

            {Array.isArray(report.findings) && report.findings.length > 0 ? (
              <div className="space-y-4">
                {report.findings.map((finding, index) => (
                  <div key={index} className="p-4 bg-light rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold">{finding.category}</h3>
                      <span
                        className={`badge ${getPriorityBadgeClass(
                          finding.priority
                        )}`}
                      >
                        {finding.priority}
                      </span>
                    </div>
                    <p className="mb-2">{finding.description}</p>
                    {finding.location && (
                      <div className="flex items-center gap-2 text-sm text-gray">
                        <FiMapPin />
                        <span>
                          {finding.location.latitude.toFixed(6)},{" "}
                          {finding.location.longitude.toFixed(6)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray">No findings reported</p>
            )}
          </div>

          {/* Issues */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Issues</h2>

            {Array.isArray(report.issues) && report.issues.length > 0 ? (
              <div className="space-y-4">
                {report.issues.map((issue, index) => (
                  <div key={index} className="p-4 bg-light rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold capitalize">{issue.type}</h3>
                      <span
                        className={`badge ${getPriorityBadgeClass(
                          issue.severity
                        )}`}
                      >
                        {issue.severity}
                      </span>
                    </div>
                    <p>{issue.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray">No issues reported</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Mission Info */}
          {report.mission && (
            <div className="card mb-6">
              <h2 className="text-lg font-bold mb-4">Mission Information</h2>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray">Mission Name</p>
                  <p className="font-medium">{report.mission.name}</p>
                </div>

                <div>
                  <p className="text-sm text-gray">Mission Type</p>
                  <p className="font-medium capitalize">
                    {report.mission.missionType}
                  </p>
                </div>

                {report.mission.location && (
                  <div>
                    <p className="text-sm text-gray">Location</p>
                    <p className="font-medium">
                      {report.mission.location.name || "N/A"}
                    </p>
                  </div>
                )}

                {report.mission.schedule && (
                  <div>
                    <p className="text-sm text-gray">Date</p>
                    <p className="font-medium">
                      {report.mission.schedule.startTime
                        ? new Date(
                            report.mission.schedule.startTime
                          ).toLocaleDateString()
                        : "Not specified"}
                    </p>
                  </div>
                )}

                <Link
                  to={`/missions/${report.mission._id}`}
                  className="btn btn-secondary btn-sm w-full text-center"
                >
                  View Mission
                </Link>
              </div>
            </div>
          )}

          {/* Drone Info */}
          {report.drone && (
            <div className="card mb-6">
              <h2 className="text-lg font-bold mb-4">Drone Information</h2>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray">Drone Name</p>
                  <p className="font-medium">{report.drone.name}</p>
                </div>

                <div>
                  <p className="text-sm text-gray">Serial Number</p>
                  <p className="font-medium">{report.drone.serialNumber}</p>
                </div>

                <Link
                  to={`/drones/${report.drone._id}`}
                  className="btn btn-secondary btn-sm w-full text-center"
                >
                  View Drone
                </Link>
              </div>
            </div>
          )}

          {/* Flight Statistics */}
          {report.flightStatistics && (
            <div className="card mb-6">
              <h2 className="text-lg font-bold mb-4">Flight Statistics</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray">Duration</p>
                  <p className="font-medium">
                    {report.flightStatistics.duration} min
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray">Distance</p>
                  <p className="font-medium">
                    {report.flightStatistics.distance} km
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray">Max Altitude</p>
                  <p className="font-medium">
                    {report.flightStatistics.maxAltitude} m
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray">Max Speed</p>
                  <p className="font-medium">
                    {report.flightStatistics.maxSpeed} m/s
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray">Area Covered</p>
                  <p className="font-medium">
                    {report.flightStatistics.areaCovered} m²
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray">Battery Used</p>
                  <p className="font-medium">
                    {report.flightStatistics.batteryUsed}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Weather Conditions */}
          {report.weatherConditions && (
            <div className="card">
              <h2 className="text-lg font-bold mb-4">Weather Conditions</h2>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-light rounded-lg">
                    <FiThermometer className="text-primary" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray">Temperature</p>
                    <p className="font-medium">
                      {report.weatherConditions.temperature}°C
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-light rounded-lg">
                    <FiWind className="text-primary" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray">Wind Speed</p>
                    <p className="font-medium">
                      {report.weatherConditions.windSpeed} m/s
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-light rounded-lg">
                    <FiDroplet className="text-primary" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray">Humidity</p>
                    <p className="font-medium">
                      {report.weatherConditions.humidity}%
                    </p>
                  </div>
                </div>

                {report.weatherConditions.conditions && (
                  <div>
                    <p className="text-sm text-gray">Conditions</p>
                    <p className="font-medium">
                      {report.weatherConditions.conditions}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportDetails;
