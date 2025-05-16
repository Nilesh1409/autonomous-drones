import { FiAirplay, FiMap, FiFileText, FiActivity } from "react-icons/fi";

const StatCard = ({ icon, title, value, color }) => {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-lg bg-${color} bg-opacity-10 text-${color}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-gray text-sm">{title}</h3>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
};

const DashboardStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<FiAirplay size={24} />}
        title="Total Drones"
        value={stats.totalDrones}
        color="primary"
      />

      <StatCard
        icon={<FiMap size={24} />}
        title="Total Missions"
        value={stats.totalMissions}
        color="secondary"
      />

      <StatCard
        icon={<FiActivity size={24} />}
        title="Active Missions"
        value={stats.activeMissions}
        color="warning"
      />

      <StatCard
        icon={<FiFileText size={24} />}
        title="Total Reports"
        value={stats.totalReports}
        color="success"
      />
    </div>
  );
};

export default DashboardStats;
