import {
  Camera,
  Map,
  FileText,
  Check,
  PenToolIcon as Tool,
  PlusCircle,
  Play,
} from "lucide-react";

const getActivityIcon = (type, action) => {
  if (type === "drone") {
    if (action === "added")
      return <PlusCircle className="text-green-500" size={18} />;
    if (action === "maintenance")
      return <Tool className="text-yellow-500" size={18} />;
    return <Camera className="text-blue-500" size={18} />;
  }

  if (type === "mission") {
    if (action === "completed")
      return <Check className="text-green-500" size={18} />;
    if (action === "started")
      return <Play className="text-blue-500" size={18} />;
    return <Map className="text-blue-500" size={18} />;
  }

  if (type === "report") {
    return <FileText className="text-indigo-500" size={18} />;
  }

  return null;
};

const getActivityText = (type, action, name) => {
  if (type === "drone") {
    if (action === "added") return `New drone "${name}" added`;
    if (action === "maintenance")
      return `Drone "${name}" marked for maintenance`;
    return `Drone "${name}" ${action}`;
  }

  if (type === "mission") {
    if (action === "completed") return `Mission "${name}" completed`;
    if (action === "started") return `Mission "${name}" started`;
    return `Mission "${name}" ${action}`;
  }

  if (type === "report") {
    if (action === "created") return `Report "${name}" created`;
    return `Report "${name}" ${action}`;
  }

  return `${type} ${action}: ${name}`;
};

const RecentActivityList = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <p className="text-gray-500">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3">
          <div className="p-2 bg-gray-50 rounded-lg">
            {getActivityIcon(activity.type, activity.action)}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {getActivityText(activity.type, activity.action, activity.name)}
            </p>
            <p className="text-sm text-gray-500">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentActivityList;
