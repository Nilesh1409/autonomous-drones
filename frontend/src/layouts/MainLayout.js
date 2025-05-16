"use client";

import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Home,
  Clipboard,
  Map,
  FileText,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  Settings,
  Search,
  ChevronDown,
  BarChart2,
  Layers,
  Zap,
  HelpCircle,
} from "lucide-react";

const MainLayout = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      message: "Drone #3 completed mission",
      time: "5 min ago",
      read: false,
    },
    { id: 2, message: "New report available", time: "1 hour ago", read: false },
    {
      id: 3,
      message: "Maintenance required for Drone #2",
      time: "3 hours ago",
      read: true,
    },
  ]);
  const [notificationDropdown, setNotificationDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const toggleNotifications = () => {
    setNotificationDropdown(!notificationDropdown);
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarOpen &&
        !event.target.closest(".sidebar") &&
        !event.target.closest(".sidebar-toggle")
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  const navItems = [
    { path: "/", label: "Dashboard", icon: <Home size={20} /> },
    { path: "/drones", label: "Drones", icon: <Clipboard size={20} /> },
    { path: "/missions", label: "Missions", icon: <Map size={20} /> },
    { path: "/reports", label: "Reports", icon: <FileText size={20} /> },
    { path: "/profile", label: "Profile", icon: <User size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Layers size={24} />
            <span>DroneSync</span>
          </div>
          <button
            className="lg:hidden text-white/70 hover:text-white"
            onClick={toggleSidebar}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? "active" : ""}`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            onClick={handleLogout}
            className="sidebar-nav-item text-white/70 hover:text-white w-full"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64 flex-1">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden text-gray-500 hover:text-gray-700"
                onClick={toggleSidebar}
              >
                <Menu size={24} />
              </button>

              <div className="relative hidden md:block w-64">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* User Profile */}
              <div className="relative">
                <div
                  className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-100"
                  onClick={toggleDropdown}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 text-white rounded-full flex items-center justify-center">
                    {currentUser?.name?.charAt(0) || "U"}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium">
                      {currentUser?.name || "User"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {currentUser?.email || "user@example.com"}
                    </p>
                  </div>
                  <ChevronDown size={16} className="text-gray-500" />
                </div>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg overflow-hidden z-50">
                    <div className="p-3 border-b">
                      <p className="font-medium">
                        {currentUser?.name || "User"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {currentUser?.email || "user@example.com"}
                      </p>
                    </div>
                    <NavLink
                      to="/profile"
                      className="flex items-center gap-2 p-3 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <User size={16} className="text-gray-500" />
                      <span>Profile</span>
                    </NavLink>
                    <NavLink
                      to="/settings"
                      className="flex items-center gap-2 p-3 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Settings size={16} className="text-gray-500" />
                      <span>Settings</span>
                    </NavLink>
                    <div className="border-t"></div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 p-3 w-full text-left text-red-500 hover:bg-red-50"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
