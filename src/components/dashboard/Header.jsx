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
  FiMoon,
  FiShoppingCart,
  FiPackage,
  FiRefreshCw
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

export default function Header({ toggleSidebar, darkMode, toggleTheme }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [adminData, setAdminData] = useState({
    name: "Admin",
  });

  const [freshOrders, setFreshOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

    fetchFreshOrders();
    
    const interval = setInterval(fetchFreshOrders, 120000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchFreshOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching fresh orders from API...');
      
      const response = await fetch('https://api.fast2.in/api/admin/orders/admin/fresh-orders');
      
      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response data:', data);
      
      const orders = data.orders || [];
      console.log('Orders found:', orders.length);
      
      // Transform orders into notifications
      const orderNotifications = orders.map(order => ({
        id: order._id,
        type: getNotificationType(order.status),
        text: `New Order #${order._id?.slice(-8) || 'N/A'}`,
        details: `${order.user?.phone || 'Customer'} - ₹${order.total?.toLocaleString() || '0'}`,
        time: getTimeAgo(order.createdAt),
        read: false,
        orderData: order
      }));
      
      console.log('Transformed notifications:', orderNotifications);
      setFreshOrders(orderNotifications);
      
    } catch (error) {
      console.error('Error fetching fresh orders:', error);
      setError(error.message);
      // Fallback to sample data for testing
      setFreshOrders(getSampleOrders());
    } finally {
      setLoading(false);
    }
  };

  // Sample data for testing when API fails
  const getSampleOrders = () => {
    return [
      {
        id: 'sample-1',
        type: 'new',
        text: 'New Order #A1B2C3D4',
        details: 'Customer - ₹1,599',
        time: '5 mins ago',
        read: false
      },
      {
        id: 'sample-2',
        type: 'confirmed',
        text: 'New Order #E5F6G7H8',
        details: 'Customer - ₹2,499',
        time: '15 mins ago',
        read: false
      }
    ];
  };

  const getNotificationType = (status) => {
    switch (status) {
      case 'pending':
        return 'new';
      case 'confirmed':
        return 'confirmed';
      case 'processing':
        return 'processing';
      case 'shipped':
        return 'shipped';
      case 'delivered':
        return 'delivered';
      default:
        return 'new';
    }
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
    
    const now = new Date();
    const orderDate = new Date(dateString);
    const diffInMinutes = Math.floor((now - orderDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

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
    setFreshOrders((prev) => prev.map((order) => (order.id === id ? { ...order, read: true } : order)));
  };

  const markAllAsRead = () => {
    setFreshOrders((prev) => prev.map((order) => ({ ...order, read: true })));
  };

  const unreadCount = freshOrders.filter((order) => !order.read).length;

  const getIconForType = (type) => {
    switch (type) {
      case "new":
        return <FiShoppingCart className="text-blue-500 dark:text-blue-400" />;
      case "confirmed":
        return <FiCheckCircle className="text-green-500 dark:text-green-400" />;
      case "processing":
        return <FiPackage className="text-purple-500 dark:text-purple-400" />;
      case "shipped":
        return <FiClock className="text-orange-500 dark:text-orange-400" />;
      case "delivered":
        return <FiCheckCircle className="text-green-500 dark:text-green-400" />;
      default:
        return <FiBell className="text-blue-500 dark:text-blue-400" />;
    }
  };

  const getStatusColor = (type) => {
    switch (type) {
      case "new":
        return "bg-blue-50 dark:bg-blue-900/10 border-l-4 border-l-blue-500";
      case "confirmed":
        return "bg-green-50 dark:bg-green-900/10 border-l-4 border-l-green-500";
      case "processing":
        return "bg-purple-50 dark:bg-purple-900/10 border-l-4 border-l-purple-500";
      case "shipped":
        return "bg-orange-50 dark:bg-orange-900/10 border-l-4 border-l-orange-500";
      case "delivered":
        return "bg-green-50 dark:bg-green-900/10 border-l-4 border-l-green-500";
      default:
        return "";
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

  const handleOrderClick = (order) => {
    // You can implement navigation to order details or show a modal
    console.log('Order clicked:', order);
    // For now, just mark as read
    markAsRead(order.id);
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
                        <p className="font-medium text-gray-900 dark:text-white">Order Notifications</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {unreadCount} new {unreadCount === 1 ? "order" : "orders"}
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
                    {error ? (
                      <div className="px-4 py-4 text-center">
                        <FiAlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Failed to load orders</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{error}</p>
                        <button
                          onClick={fetchFreshOrders}
                          className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          Try Again
                        </button>
                      </div>
                    ) : loading ? (
                      <div className="px-4 py-8 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading orders...</p>
                      </div>
                    ) : freshOrders.length > 0 ? (
                      freshOrders.map((order) => (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                            !order.read ? getStatusColor(order.type) : ""
                          }`}
                          onClick={() => handleOrderClick(order)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex-shrink-0">{getIconForType(order.type)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {order.text}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                {order.details}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-gray-400 dark:text-gray-500">{order.time}</p>
                                <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                                  order.type === 'new' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                  order.type === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                  order.type === 'processing' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                  order.type === 'shipped' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                }`}>
                                  {order.type}
                                </span>
                              </div>
                            </div>
                            {!order.read && (
                              <span className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                            )}
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center">
                        <FiShoppingCart className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No new orders</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">New orders will appear here</p>
                      </div>
                    )}
                  </div>

                  {(freshOrders.length > 0 || error) && (
                    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                      <button 
                        onClick={fetchFreshOrders}
                        className="w-full text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center justify-center gap-2"
                      >
                        <FiRefreshCw className="w-3 h-3" />
                        Refresh Orders
                      </button>
                    </div>
                  )}
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