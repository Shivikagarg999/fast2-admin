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
  FiCheckCircle
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

export default function Header({ toggleSidebar }) {
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
      details: "Pickup: Sharjah Airport • Drop: Sharjah",
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
          text: `Parcel #DC-${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${Math.floor(Math.random() * 1000)} ${
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
        setUrgentAlerts((prev) => [newAlert, ...prev]);
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
        return <FiAlertTriangle className="text-red-500" />;
      case "delay":
        return <FiClock className="text-yellow-500" />;
      case "assigned":
        return <FiUser className="text-blue-500" />;
      case "delivered":
        return <FiCheckCircle className="text-green-500" />;
      default:
        return <FiBell className="text-blue-500" />;
    }
  };

  return (
    <header className="sticky top-0 bg-white border-b border-gray-200 shadow-sm relative">
      <div className="flex justify-between items-center px-4 md:px-6 py-3">
        {/* Mobile menu button */}
        <div className="flex items-center gap-4">
          <button onClick={toggleSidebar} className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-700">
            <FiMenu size={20} />
          </button>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          {/* Admin Info */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
              <FiUser size={16} />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">{adminData.name}</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setIsOpen(false);
              }}
              className="p-2 rounded-full relative hover:bg-gray-100 text-gray-700"
            >
              <FiBell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <p className="font-medium text-gray-900">Delivery Alerts</p>
                    <p className="text-xs text-gray-500">{unreadCount} urgent {unreadCount === 1 ? "alert" : "alerts"}</p>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {/* Urgent Alerts */}
                    {urgentAlerts.length > 0 && (
                      <div className="border-b border-gray-200">
                        {urgentAlerts.map((alert) => (
                          <div
                            key={alert.id}
                            className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${!alert.read ? "bg-red-50" : ""}`}
                            onClick={() => markAsRead(alert.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">{getIconForType(alert.type)}</div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{alert.text}</p>
                                <p className="text-xs text-gray-500 mt-1">{alert.details}</p>
                                <p className="text-xs text-gray-400 mt-1">{alert.time}</p>
                              </div>
                              {!alert.read && <span className="h-2 w-2 rounded-full bg-red-500 mt-1.5"></span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Regular Notifications */}
                    {regularNotifications.length > 0 && (
                      <div>
                        {regularNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">{getIconForType(notification.type)}</div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{notification.text}</p>
                                <p className="text-xs text-gray-500 mt-1">{notification.details}</p>
                                <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {urgentAlerts.length === 0 && regularNotifications.length === 0 && (
                      <div className="px-4 py-6 text-center">
                        <p className="text-sm text-gray-500">No notifications</p>
                      </div>
                    )}
                  </div>

                  {urgentAlerts.some((alert) => !alert.read) && (
                    <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-center">
                      <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:text-blue-800">
                        Mark all as read
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Admin Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                setIsOpen(!isOpen);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 hover:bg-gray-100 group"
            >
              <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <FiChevronDown className="text-gray-500 group-hover:text-gray-700" />
              </motion.div>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50"
                >
                  <div className="px-1 py-1">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{adminData.name}</p>
                      <p className="text-xs text-gray-500">{adminData.email}</p>
                    </div>

                    <button className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                      <FiSettings className="mr-3 text-gray-500" size={14} />
                      Settings
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-gray-100 hover:text-red-800 transition-colors"
                    >
                      <FiLogOut className="mr-3" size={14} />
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
