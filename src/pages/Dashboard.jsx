import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/dashboard/Sidebar";
import Header from "../components/dashboard/Header";
import {
  FiPackage,
  FiUsers,
  FiShoppingCart,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertTriangle,
  FiBox
} from "react-icons/fi";

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Check if current route is the main dashboard
  const isDashboard = location.pathname === '/dashboard';

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
    
    // Load dummy data with a slight delay to simulate loading
    const timer = setTimeout(() => {
      loadDummyData();
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  const loadDummyData = () => {
    setStats({
      totalProducts: 142,
      totalUsers: 86,
      totalOrders: 324,
      totalRevenue: 184500,
      lowStockProducts: 12,
      outOfStockProducts: 5,
      recentOrders: [
        { id: 1, customer: "Rahul Sharma", amount: 2499, status: "Delivered" },
        { id: 2, customer: "Priya Patel", amount: 1599, status: "Processing" },
        { id: 3, customer: "Amit Kumar", amount: 3499, status: "Shipped" },
        { id: 4, customer: "Sneha Singh", amount: 899, status: "Delivered" },
        { id: 5, customer: "Vikram Mehta", amount: 4299, status: "Processing" }
      ]
    });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Stats cards component
  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, subtitle }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? <FiTrendingUp className="mr-1" /> : <FiTrendingDown className="mr-1" />}
              {trendValue}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color} bg-opacity-20`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
    </div>
  );

  // Recent orders component
  const RecentOrders = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mt-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Orders</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {stats.recentOrders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">#{order.id}</td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{order.customer}</td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">₹{order.amount.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    order.status === 'Delivered' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : order.status === 'Shipped'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Stock alerts component
  const StockAlerts = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mt-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <FiAlertTriangle className="text-yellow-500 mr-2" />
        Stock Alerts
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-4 rounded-lg border-l-4 ${stats.lowStockProducts > 0 ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'border-green-500 bg-green-50 dark:bg-green-900/20'}`}>
          <div className="flex items-center">
            <FiBox className={`w-5 h-5 ${stats.lowStockProducts > 0 ? 'text-yellow-500' : 'text-green-500'}`} />
            <div className="ml-3">
              <h3 className="text-sm font-medium">Low Stock Products</h3>
              <p className={`text-lg font-bold ${stats.lowStockProducts > 0 ? 'text-yellow-700 dark:text-yellow-300' : 'text-green-700 dark:text-green-300'}`}>
                {stats.lowStockProducts} products
              </p>
            </div>
          </div>
        </div>
        <div className={`p-4 rounded-lg border-l-4 ${stats.outOfStockProducts > 0 ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-green-500 bg-green-50 dark:bg-green-900/20'}`}>
          <div className="flex items-center">
            <FiBox className={`w-5 h-5 ${stats.outOfStockProducts > 0 ? 'text-red-500' : 'text-green-500'}`} />
            <div className="ml-3">
              <h3 className="text-sm font-medium">Out of Stock</h3>
              <p className={`text-lg font-bold ${stats.outOfStockProducts > 0 ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`}>
                {stats.outOfStockProducts} products
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-[100vw] bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        darkMode={darkMode}
        toggleTheme={toggleTheme}
      />

      {/* Main Content Container */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        {/* Header */}
        <Header 
          toggleSidebar={toggleSidebar}
          darkMode={darkMode}
          toggleTheme={toggleTheme}
        />

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Show dashboard stats only on the main dashboard route */}
          {isDashboard ? (
            <>
              {/* Dashboard Stats Section */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard Overview</h1>
                
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <StatCard
                        title="Total Products"
                        value={stats.totalProducts.toLocaleString()}
                        icon={FiPackage}
                        trend="up"
                        trendValue="+12% this month"
                        color="bg-blue-500"
                      />
                      <StatCard
                        title="Total Users"
                        value={stats.totalUsers.toLocaleString()}
                        icon={FiUsers}
                        trend="up"
                        trendValue="+8% this month"
                        color="bg-green-500"
                      />
                      <StatCard
                        title="Total Orders"
                        value={stats.totalOrders.toLocaleString()}
                        icon={FiShoppingCart}
                        trend="up"
                        trendValue="+15% this month"
                        color="bg-purple-500"
                      />
                      <StatCard
                        title="Total Revenue"
                        value={`₹${stats.totalRevenue.toLocaleString()}`}
                        icon={FiDollarSign}
                        trend="up"
                        trendValue="+20% this month"
                        color="bg-yellow-500"
                        subtitle="This month: ₹42,500"
                      />
                    </div>

                    {/* Stock Alerts */}
                    <StockAlerts />

                    {/* Recent Orders */}
                    <RecentOrders />
                  </>
                )}
              </div>
            </>
          ) : (
            // Show the nested route content for other pages
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;