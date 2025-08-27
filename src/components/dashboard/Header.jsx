import { useState, useRef, useEffect } from "react";
import {
  FiChevronDown,
  FiLogOut,
  FiUser,
  FiMenu,
  FiSettings,
  FiBell,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiSun,
  FiMoon
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

export default function Header({ toggleSidebar, darkMode, toggleTheme }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [adminData, setAdminData] = useState({
    name: "Admin",
    email: "admin@example.com"
  });

  const [urgentAlerts, setUrgentAlerts] = useState([
    {
      id: 1,
      type: "unassigned",
      text: "Parcel #DC-2023-07-14-001 unassigned for 35 mins",
      details: "Pickup: Connaught Place • Drop: Aerocity",
      time: "2 mins ago",
      read: false
    },
    {
      id: 2,
      type: "delay",
      text: "Potential delay for Parcel #DC-2023-07-14-002",
      details: "45 mins elapsed • 15 mins remaining",
      time: "5 mins ago",
      read: false
    }
  ]);

  const [regularNotifications, setRegularNotifications] = useState([
    {
      id: 3,
      type: "assigned",
      text: "Parcel assigned to Agent #A-102",
      details: "Parcel #DC-2023-07-14-003 • ETA: 22 mins",
      time: "15 mins ago",
      read: true
    },
    {
      id: 4,
      type: "delivered",
      text: "Parcel delivered successfully",
      details: "Parcel #DC-2023-07-14-004 • 48 mins",
      time: "1 hour ago",
      read: true
    }
  ]);

  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);

  useEffect(() => {
    const adminInfo = localStorage.getItem("adminData");
    if (adminInfo) {
      try {
        const parsed = JSON.parse(adminInfo);
        setAdminData({
          name: parsed.name || "Admin",
          email: parsed.email || "admin@example.com"
        });
      } catch (e) {
        console.error("Error parsing adminData:", e);
      }
    }

    const alertInterval = setInterval(() => {
      const now = new Date();
      if (now.getMinutes() % 5 === 0) {
        const newAlert = {
          id: now.getTime(),
          type: Math.random() > 0.5 ? "unassigned" : "delay",
          text: `Parcel #DC-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')} ${
            Math.random() > 0.5 ? "unassigned for 35+ mins" : "facing potential delay"
          }`,
          details:
            Math.random() > 0.5
              ? `Pickup: ${["Connaught Place", "Karol Bagh", "Rajouri Garden"][Math.floor(Math.random() * 3)]} • Drop: ${
                  ["Aerocity", "Dwarka", "Noida"][Math.floor(Math.random() * 3)]
                }`
              : `${Math.floor(Math.random() * 50) + 10} mins elapsed • ${Math.floor(Math.random() * 20) + 5} mins remaining`,
          time: "Just now",
          read: false
        };
        setUrgentAlerts((prev) => [newAlert, ...prev.slice(0, 4)]); // Keep only 5 alerts
      }
    }, 300000);

    return () => clearInterval(alertInterval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const markAsRead = (id) => {
    setUrgentAlerts((prev) => prev.map((alert) => (alert.id === id ? { ...alert, read: true } : alert)));
  };

  const markAllAsRead = () => {
    setUrgentAlerts((prev) => prev.map((alert) => ({ ...alert, read: true })));
  };

  const unreadCount = urgentAlerts.filter((alert) => !alert.read).length;

  const getIconForType = (type) => {
    switch (type) {
      case "unassigned":
        return <FiAlertTriangle className="text-red-500 dark:text-red-400" />;
      case "delay":
        return <FiClock className="text-yellow-500 dark:text-yellow-400" />;
      case "assigned":
        return <FiUser className="text-blue-500 dark:text-blue-400" />;
      case "delivered":
        return <FiCheckCircle className="text-green-500 dark:text-green-400" />;
      default:
        return <FiBell className="text-blue-500 dark:text-blue-400" />;
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm relative z-40">
      <div className="flex justify-between items-center px-4 md:px-6 py-3">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar} 
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
            aria-label="Toggle sidebar"
          >
            <FiMenu size={20} />
          </button>
          
          {/* Page title on mobile */}
          <div className="lg:hidden">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              Dashboard
            </h1>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Theme Toggle */}
          {toggleTheme && (
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
          )}

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setIsOpen(false);
              }}
              className="p-2 rounded-lg relative hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
              aria-label="Notifications"
            >
              <FiBell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Delivery Alerts</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {unreadCount} urgent {unreadCount === 1 ? "alert" : "alerts"}
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllAsRead} 
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {/* Urgent Alerts */}
                    {urgentAlerts.length > 0 && (
                      <div>
                        {urgentAlerts.map((alert) => (
                          <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                              !alert.read ? "bg-red-50 dark:bg-red-900/10 border-l-4 border-l-red-500" : ""
                            }`}
                            onClick={() => markAsRead(alert.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex-shrink-0">{getIconForType(alert.type)}</div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {alert.text}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                  {alert.details}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{alert.time}</p>
                              </div>
                              {!alert.read && (
                                <span className="h-2 w-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></span>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Regular Notifications */}
                    {regularNotifications.length > 0 && (
                      <div className={urgentAlerts.length > 0 ? "border-t border-gray-200 dark:border-gray-700" : ""}>
                        {regularNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex-shrink-0">{getIconForType(notification.type)}</div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {notification.text}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                  {notification.details}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{notification.time}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {urgentAlerts.length === 0 && regularNotifications.length === 0 && (
                      <div className="px-4 py-8 text-center">
                        <FiBell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No notifications</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Admin Info & Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Admin Info - Hidden on very small screens */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm shadow-sm">
                {getInitials(adminData.name)}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-32">
                  {adminData.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Admin</p>
              </div>
            </div>

            {/* Admin Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => {
                  setIsOpen(!isOpen);
                  setNotificationsOpen(false);
                }}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 group"
                aria-label="Account menu"
              >
                {/* Show avatar on mobile when admin info is hidden */}
                <div className="sm:hidden w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm shadow-sm">
                  {getInitials(adminData.name)}
                </div>
                <motion.div 
                  animate={{ rotate: isOpen ? 180 : 0 }} 
                  transition={{ duration: 0.2 }}
                  className="hidden sm:block"
                >
                  <FiChevronDown className="text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                </motion.div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                  >
                    <div className="px-1 py-1">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                            {getInitials(adminData.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {adminData.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {adminData.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="py-1">
                        <button className="w-full flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors">
                          <FiSettings className="mr-3 text-gray-500 dark:text-gray-400" size={16} />
                          Settings
                        </button>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                        >
                          <FiLogOut className="mr-3" size={16} />
                          Logout
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}