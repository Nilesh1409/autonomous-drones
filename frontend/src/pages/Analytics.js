"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Calendar,
  BarChart2,
  Download,
  Filter,
  MapPin,
  Clock,
  ChevronRight,
  DrillIcon as Drone,
} from "lucide-react";
import { reportsAPI } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";

const Analytics = () => {
  const [dateRange, setDateRange] = useState("week");
  const [loading, setLoading] = useState(true);
  const [missionStats, setMissionStats] = useState(null);
  const [droneStats, setDroneStats] = useState(null);
  const [orgStats, setOrgStats] = useState(null);

  // Fetch analytics data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get date range for mission stats
        const startDate = new Date();
        switch (dateRange) {
          case "week":
            startDate.setDate(startDate.getDate() - 7);
            break;
          case "month":
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          case "quarter":
            startDate.setMonth(startDate.getMonth() - 3);
            break;
          case "year":
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
          default:
            startDate.setDate(startDate.getDate() - 7);
        }

        // Fetch all reports in parallel
        const [missionResponse, droneResponse, orgResponse] = await Promise.all(
          [
            reportsAPI.getMissionStats({
              startDate: startDate.toISOString(),
              endDate: new Date().toISOString(),
            }),
            reportsAPI.getDroneStats(),
            reportsAPI.getOrganizationStats(),
          ]
        );

        if (
          missionResponse.status === "success" &&
          droneResponse.status === "success" &&
          orgResponse.status === "success"
        ) {
          setMissionStats(missionResponse.data);
          setDroneStats(droneResponse.data);
          setOrgStats(orgResponse.data);
        } else {
          throw new Error("Failed to fetch analytics data");
        }
      } catch (error) {
        toast.error(error.message || "Failed to fetch analytics data");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  // Prepare chart data
  const getMissionActivityData = () => {
    if (!missionStats || !missionStats.missionsByDay) return [];

    return missionStats.missionsByDay.map((day) => ({
      date: day._id,
      missions: day.count,
      area: Number.parseFloat((day.totalArea / 10000).toFixed(2)), // Convert to hectares
    }));
  };

  const getMissionTypeData = () => {
    if (!orgStats || !orgStats.missionTypes) return [];

    return orgStats.missionTypes.map((type) => ({
      name: type.type.charAt(0).toUpperCase() + type.type.slice(1),
      value: type.count,
    }));
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  const handleExportData = () => {
    // In a real app, this would generate a CSV or PDF report
    toast.info(
      "Exporting data... This feature is not implemented in the demo."
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Analytics & Reporting
          </h1>
          <p className="text-gray-600">
            Mission statistics and performance metrics
          </p>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="quarter">Last 90 days</option>
              <option value="year">Last 12 months</option>
            </select>
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>

          <button
            className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => toast.info("Filtering options would appear here")}
          >
            <Filter className="h-5 w-5 text-gray-500" />
            <span>Filter</span>
          </button>

          <button
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={handleExportData}
          >
            <Download className="h-5 w-5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner text="Loading analytics data..." />
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex items-center">
                <div className="p-2 rounded-md bg-blue-100 text-blue-600 mr-3">
                  <BarChart2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Missions
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {orgStats?.totalMissions || 0}
                  </h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex items-center">
                <div className="p-2 rounded-md bg-green-100 text-green-600 mr-3">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Area Surveyed
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {orgStats?.totalAreaCovered
                      ? `${(orgStats.totalAreaCovered / 10000).toFixed(1)} ha`
                      : "0 ha"}
                  </h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex items-center">
                <div className="p-2 rounded-md bg-yellow-100 text-yellow-600 mr-3">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Flight Hours
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {orgStats?.totalFlightTime
                      ? `${orgStats.totalFlightTime.toFixed(1)} hrs`
                      : "0 hrs"}
                  </h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex items-center">
                <div className="p-2 rounded-md bg-purple-100 text-purple-600 mr-3">
                  <Drone className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Drones
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {droneStats?.totalDrones || 0}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Mission Activity Chart */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-md p-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">
                Mission Activity
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getMissionActivityData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#82ca9d"
                    />
                    <Tooltip />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="missions"
                      name="Missions"
                      fill="#8884d8"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="area"
                      name="Area (ha)"
                      fill="#82ca9d"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Mission Types Chart */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-md p-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">
                Mission Types
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={getMissionTypeData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {getMissionTypeData().map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Drone Usage Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-md p-4 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Drone Usage
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Drone
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Missions
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Flight Hours
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Distance
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Efficiency
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {droneStats?.droneUsage?.map((drone, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {drone.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {drone.totalMissions || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {drone.totalDuration
                          ? (drone.totalDuration / 3600).toFixed(1)
                          : 0}{" "}
                        hrs
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {drone.totalDistance
                          ? (drone.totalDistance / 1000).toFixed(1)
                          : 0}{" "}
                        km
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{
                              width: `${
                                drone.totalMissions &&
                                droneStats.droneUsage[0].totalMissions
                                  ? (drone.totalMissions /
                                      droneStats.droneUsage[0].totalMissions) *
                                    100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Missions */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Recent Missions
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Mission
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Drone
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Duration
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Area
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orgStats?.recentMissions?.map((mission) => (
                    <tr key={mission._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {mission.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(mission.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {mission.drone?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {mission.statistics?.duration
                          ? `${Math.floor(
                              mission.statistics.duration / 60
                            )} min`
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {mission.statistics?.area
                          ? `${(mission.statistics.area / 10000).toFixed(2)} ha`
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {mission.status === "completed" ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Completed
                          </span>
                        ) : mission.status === "aborted" ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            Aborted
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {mission.status.charAt(0).toUpperCase() +
                              mission.status.slice(1)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button className="text-blue-600 hover:text-blue-900 flex items-center">
                          View <ChevronRight className="h-4 w-4 ml-1" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
