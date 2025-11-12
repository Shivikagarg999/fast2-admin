import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/dashboard/Sidebar";
import Header from "../components/dashboard/Header";
import SalesOverview from "../components/dashboard/SalesOverview";
import RevenueAnalytics from "../components/dashboard/RevenueAnalytics";
import OrderStatusBreakdown from "../components/dashboard/OrderStatusBreakdown";
import PaymentStatusCard from "../components/dashboard/PaymentStatusCard";
import TopSellingProducts from "../components/dashboard/TopSellingProducts";
import QuickMetrics from "../components/dashboard/QuickMetrics";
import {
  FiPackage,
  FiUsers,
  FiShoppingCart,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertTriangle,
  FiBox,
  FiClock,
  FiBell,
  FiRefreshCw,
  FiEye,
  FiX,
  FiTruck,
  FiPhone,
  FiMail,
  FiFilter
} from "react-icons/fi";

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    freshOrders: 0,
    freshOrdersData: [],
    recentOrders: [],
    onlineDrivers: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFreshOrdersNotification, setShowFreshOrdersNotification] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const location = useLocation();

  const isDashboard = location.pathname === '/dashboard';

  const periodOptions = [
    { value: 'day', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ];

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
    
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchDashboardStats(),
        fetchProductStats(),
        fetchUserStats(),
        fetchFreshOrders(),
        fetchRecentOrders(),
        fetchOnlineDrivers()
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/orders/stats`);
      
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      
      setStats(prev => ({
        ...prev,
        totalOrders: data.totalOrders || 0,
        totalRevenue: data.revenue?.totalRevenue || 0
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchProductStats = async () => {
    try {
      const statsResponse = await fetch(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/product/admin/stats`);
      
      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats(prev => ({
          ...prev,
          totalProducts: data.totalProducts || 0,
          lowStockProducts: data.lowStockProducts || 0,
          outOfStockProducts: data.outOfStockProducts || 0
        }));
      } else {
        await fetchProductsCount();
      }
    } catch (error) {
      console.error('Error fetching product stats:', error);
      await fetchProductsCount();
    }
  };

  const fetchProductsCount = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/products/getall`);
      
      if (response.ok) {
        const products = await response.json();
        const lowStockCount = products.filter(product => 
          product.quantity <= (product.lowStockThreshold || 10) && product.stockStatus === 'in-stock'
        ).length;
        const outOfStockCount = products.filter(product => 
          product.stockStatus === 'out-of-stock'
        ).length;
        
        setStats(prev => ({
          ...prev,
          totalProducts: products.length || 0,
          lowStockProducts: lowStockCount,
          outOfStockProducts: outOfStockCount
        }));
      }
    } catch (error) {
      console.error('Error fetching products count:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/users`);
      
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      
      if (data.success && data.users) {
        setStats(prev => ({
          ...prev,
          totalUsers: data.users.length || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchFreshOrders = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/orders/admin/fresh-orders`);
      
      if (!response.ok) throw new Error('Failed to fetch fresh orders');
      const data = await response.json();
      
      setStats(prev => ({
        ...prev,
        freshOrders: data.total || 0,
        freshOrdersData: data.orders || []
      }));

      if (data.total > 0) {
        setShowFreshOrdersNotification(true);
        setTimeout(() => setShowFreshOrdersNotification(false), 5000);
      }
    } catch (error) {
      console.error('Error fetching fresh orders:', error);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/orders/getall?limit=5&sortBy=createdAt&sortOrder=desc`);
      
      if (!response.ok) throw new Error('Failed to fetch recent orders');
      const data = await response.json();
      
      const transformedOrders = data.orders?.map(order => ({
        id: order._id?.slice(-8) || 'N/A',
        customer: order.user?.name || 'Unknown Customer',
        amount: order.total || 0,
        status: order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending',
        originalOrder: order
      })) || [];
      
      setStats(prev => ({
        ...prev,
        recentOrders: transformedOrders
      }));
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    }
  };

  const fetchOnlineDrivers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/drivers/getall`);
      
      if (!response.ok) throw new Error('Failed to fetch drivers');
      const data = await response.json();
      
      const driversData = data.data?.drivers || data.data || [];
      const onlineDrivers = driversData.filter(driver => 
        driver.workInfo?.availability === 'online' && driver.workInfo?.status === 'approved'
      );
      
      setStats(prev => ({
        ...prev,
        onlineDrivers: onlineDrivers.slice(0, 5)
      }));
    } catch (error) {
      console.error('Error fetching online drivers:', error);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order.originalOrder);
    setShowOrderModal(true);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100', label: 'Pending' },
      confirmed: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100', label: 'Confirmed' },
      processing: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100', label: 'Processing' },
      shipped: { color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100', label: 'Shipped' },
      delivered: { color: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100', label: 'Delivered' },
      cancelled: { color: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100', label: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100', label: 'Pending' },
      paid: { color: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100', label: 'Paid' },
      failed: { color: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100', label: 'Failed' },
      refunded: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100', label: 'Refunded' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, subtitle, onClick }) => (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all ${
        onClick ? 'cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transform hover:scale-[1.02]' : ''
      }`}
      onClick={onClick}
    >
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

  const FreshOrdersNotification = () => (
    <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FiBell className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
              New Orders Alert!
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              You have {stats.freshOrders} new orders in the last 24 hours
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshData}
            className="px-3 py-1 text-xs bg-blue-600 text-black rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
          >
            <FiRefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowFreshOrdersNotification(false)}
            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );

  const FreshOrders = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <FiClock className="text-blue-500 mr-2" />
          Fresh Orders (Last 24 Hours)
        </h2>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs bg-blue-100 text-black dark:bg-blue-900 dark:text-blue-200 rounded-full">
            {stats.freshOrders} orders
          </span>
          <button
            onClick={refreshData}
            className="p-1 text-black hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title="Refresh data"
          >
            <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {stats.freshOrders === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <FiClock className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No new orders in the last 24 hours</p>
        </div>
      ) : (
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {stats.freshOrdersData.map(order => (
                <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    #{order._id?.slice(-8) || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {order.user?.name || 'Unknown Customer'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    ₹{order.total?.toLocaleString() || '0'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      order.status === 'delivered' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : order.status === 'shipped'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : order.status === 'confirmed'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Recent'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderModal(true);
                      }}
                      className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
                      title="View Order Details"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {stats.freshOrders > 5 && (
            <div className="mt-4 text-center">
              <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
                View all {stats.freshOrders} fresh orders →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const RecentOrders = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h2>
        <button
          onClick={refreshData}
          className="p-1 text-black hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          title="Refresh data"
        >
          <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
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
                <td className="px-4 py-3">
                  <button
                    onClick={() => openOrderDetails(order)}
                    className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
                    title="View Order Details"
                  >
                    <FiEye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const OnlineDrivers = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <FiTruck className="text-green-500 mr-2" />
          Online Drivers
        </h2>
        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
          {stats.onlineDrivers.length} online
        </span>
      </div>
      
      {stats.onlineDrivers.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <FiTruck className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No drivers currently online</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stats.onlineDrivers.map(driver => (
            <div key={driver._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <FiTruck className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {driver.personalInfo?.name || 'Unknown Driver'}
                  </h4>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <FiPhone className="w-3 h-3 mr-1" />
                    {driver.personalInfo?.phone || 'N/A'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {driver.vehicle?.type || 'N/A'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {driver.vehicle?.registrationNumber || 'N/A'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

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

  const OrderDetailsModal = () => {
    if (!selectedOrder) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Order Details - #{selectedOrder._id?.slice(-8) || 'N/A'}
            </h2>
            <button
              onClick={closeOrderModal}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Customer Information</h3>
                <div className="space-y-2">
                  <p><strong>Name:</strong> {selectedOrder.user?.name || 'N/A'}</p>
                  <p><strong>Email:</strong> {selectedOrder.user?.email || 'N/A'}</p>
                  <p><strong>Phone:</strong> {selectedOrder.user?.phone || 'N/A'}</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Order Information</h3>
                <div className="space-y-2">
                  <p><strong>Order Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
                  <p><strong>Status:</strong> {getStatusBadge(selectedOrder.status)}</p>
                  <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod?.toUpperCase() || 'N/A'}</p>
                  <p><strong>Payment Status:</strong> {getPaymentStatusBadge(selectedOrder.paymentStatus)}</p>
                  <p><strong>Total Amount:</strong> {formatCurrency(selectedOrder.total)}</p>
                </div>
              </div>
            </div>

            {selectedOrder.shippingAddress && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Shipping Address</h3>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p>{selectedOrder.shippingAddress.addressLine}</p>
                  <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}</p>
                  <p>{selectedOrder.shippingAddress.country} - {selectedOrder.shippingAddress.pinCode}</p>
                  <p><strong>Phone:</strong> {selectedOrder.shippingAddress.phone}</p>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Order Items</h3>
              <div className="space-y-4">
                {selectedOrder.items?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.product?.images?.[0]?.url || "https://via.placeholder.com/60?text=No+Image"}
                        alt={item.product?.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{item.product?.name || 'Unknown Product'}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(item.price)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total: {formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900 dark:text-white">Total Amount:</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-[100vw] bg-gray-100 dark:bg-gray-900">
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        darkMode={darkMode}
        toggleTheme={toggleTheme}
      />

      <div className="lg:ml-64 min-h-screen flex flex-col">
        <Header 
          toggleSidebar={toggleSidebar}
          darkMode={darkMode}
          toggleTheme={toggleTheme}
        />

        <main className="flex-1 p-6">
          {isDashboard ? (
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Monitor your sales, orders, and business performance
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                    <FiFilter className="w-4 h-4 text-gray-500 dark:text-gray-400 ml-2" />
                    {periodOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => setSelectedPeriod(option.value)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                          selectedPeriod === option.value
                            ? 'bg-white text-black'
                            : 'text-black dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={refreshData}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-blue-600 transition-colors"
                    disabled={refreshing}
                  >
                    <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              </div>
              
              {showFreshOrdersNotification && stats.freshOrders > 0 && (
                <FreshOrdersNotification />
              )}
              
              {loading ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* Sales Overview Section */}
                  <div className="mb-6">
                    <SalesOverview period={selectedPeriod} />
                  </div>

                  {/* Quick Metrics */}
                  <div className="mb-6">
                    <QuickMetrics />
                  </div>

                  {/* Revenue Analytics and Order Status */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="lg:col-span-2">
                      <RevenueAnalytics period={selectedPeriod} />
                    </div>
                    <div>
                      <PaymentStatusCard />
                    </div>
                  </div>

                  {/* Order Status Breakdown and Top Products */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <OrderStatusBreakdown />
                    <TopSellingProducts />
                  </div>

                  {/* Fresh Orders and Online Drivers */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <FreshOrders />
                    <OnlineDrivers />
                  </div>

                  {/* Stock Alerts */}
                  <StockAlerts />

                  {/* Recent Orders */}
                  <RecentOrders />
                </>
              )}
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      {showOrderModal && <OrderDetailsModal />}
    </div>
  );
};

export default DashboardLayout;