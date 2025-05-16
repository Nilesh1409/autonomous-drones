"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiPlus,
  FiFileText,
  FiCalendar,
  FiClock,
  FiChevronRight,
} from "react-icons/fi";
import api from "../../services/api";
import { toast } from "react-toastify";

const ReportsList = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await api.reports.getAll();
        if (response.status === "success" && response.data.reports) {
          setReports(response.data.reports);
        } else {
          toast.error("Failed to fetch reports data");
        }
      } catch (error) {
        console.error("Error fetching reports:", error);
        toast.error(error.message || "Failed to fetch reports");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <Link
          to="/reports/create"
          className="btn btn-primary flex items-center gap-2"
        >
          <FiPlus />
          <span>Create Report</span>
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="mb-4 text-gray-500">
            <FiFileText size={48} className="mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Reports Found</h3>
            <p className="text-gray">You haven't created any reports yet.</p>
          </div>
          <Link to="/reports/create" className="btn btn-primary">
            Create Your First Report
          </Link>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4 font-medium">Title</th>
                  <th className="text-left py-4 px-4 font-medium">Mission</th>
                  <th className="text-left py-4 px-4 font-medium">Drone</th>
                  <th className="text-left py-4 px-4 font-medium">
                    Created By
                  </th>
                  <th className="text-left py-4 px-4 font-medium">Date</th>
                  <th className="text-left py-4 px-4 font-medium">Status</th>
                  <th className="text-left py-4 px-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report._id} className="border-b hover:bg-light">
                    <td className="py-4 px-4">
                      <div className="font-medium">{report.title}</div>
                      <div className="text-sm text-gray truncate max-w-xs">
                        {report.summary}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {report.mission ? (
                        <div>
                          <div className="font-medium">
                            {report.mission.name}
                          </div>
                          <div className="text-sm text-gray capitalize">
                            {report.mission.missionType}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {report.drone ? (
                        <div>
                          <div className="font-medium">{report.drone.name}</div>
                          <div className="text-sm text-gray">
                            {report.drone.serialNumber}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {report.createdBy ? (
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center mr-2">
                            {report.createdBy.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">
                              {report.createdBy.name}
                            </div>
                            <div className="text-sm text-gray">
                              {report.createdBy.email}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <FiCalendar className="mr-2 text-gray" />
                        <span>
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray flex items-center">
                        <FiClock className="mr-2" />
                        <span>
                          {new Date(report.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`badge ${getStatusBadgeClass(
                          report.status
                        )}`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/reports/${report._id}`}
                        className="btn btn-icon btn-sm btn-secondary"
                        title="View Report"
                      >
                        <FiChevronRight />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsList;
