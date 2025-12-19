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
  FiBox,
  FiClock,
  FiBell,
  FiRefreshCw,
  FiEye,
  FiX,
  FiTruck,
  FiPhone,
  FiMail,
  FiFilter,
  FiStar,
  FiPercent,
  
  FiTrendingUp as FiUp
} from "react-icons/fi";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    ordersToday: 0,
    breakdown: {
      paymentMethods: { wallet: 0, cod: 0 },
      platformEarnings: { serviceFee: 0, gstCollection: 0, total: 0 },
      sellerPayout: { payableAmount: 0, gstDeduction: 0, tdsDeduction: 0, netAmount: 0 },
      promotorCommission: 0
    },
    totals: {
      products: 0,
      sellers: 0,
      promotors: 0
    },
    dailySales: [],
    topSellers: [],
    topPromotors: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFreshOrdersNotification, setShowFreshOrdersNotification] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const location = useLocation();

  const isDashboard = location.pathname === '/dashboard';

  const periodOptions = [
    { value: 'today', label: 'Today' },
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

  useEffect(() => {
    if (selectedPeriod) {
      fetchDashboardData();
    }
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchDashboardData(),
        fetchDailySales(),
        fetchTopSellers(),
        fetchTopPromotors()
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await fetch(`https://api.fast2.in/api/admin/dashboard/overview?filter=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const data = await response.json();
      
      if (data) {
        setStats(prev => ({
          ...prev,
          totalRevenue: data.totalRevenue?.amount || 0,
          totalOrders: data.totalOrders?.count || 0,
          averageOrderValue: data.averageOrderValue?.amount || 0,
          ordersToday: data.ordersToday || 0,
          breakdown: data.breakdown || prev.breakdown,
          totals: data.totals || prev.totals
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchDailySales = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await fetch('https://api.fast2.in/api/admin/dashboard/daily-sales?days=30', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch daily sales');
      const data = await response.json();
      
      if (data.salesData) {
        setStats(prev => ({
          ...prev,
          dailySales: data.salesData
        }));
      }
    } catch (error) {
      console.error('Error fetching daily sales:', error);
    }
  };

  const fetchTopSellers = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await fetch(`https://api.fast2.in/api/admin/dashboard/top-sellers?filter=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch top sellers');
      const data = await response.json();
      
      if (data.topSellers) {
        setStats(prev => ({
          ...prev,
          topSellers: data.topSellers
        }));
      }
    } catch (error) {
      console.error('Error fetching top sellers:', error);
    }
  };

  const fetchTopPromotors = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await fetch(`https://api.fast2.in/api/admin/dashboard/top-promotors?filter=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch top promotors');
      const data = await response.json();
      
      if (data.topPromotors) {
        setStats(prev => ({
          ...prev,
          topPromotors: data.topPromotors
        }));
      }
    } catch (error) {
      console.error('Error fetching top promotors:', error);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num || 0);
  };

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, subtitle, onClick, percentageChange }) => (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
      style={onClick ? { cursor: 'pointer' } : {}}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {title.includes('Revenue') || title.includes('Order Value') || title.includes('Commission') ? formatCurrency(value) : formatNumber(value)}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
          {percentageChange !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {percentageChange >= 0 ? <FiTrendingUp className="mr-1" /> : <FiTrendingDown className="mr-1" />}
              {Math.abs(percentageChange)}%
            </div>
          )}
        </div>
        <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </div>
  );

  const SalesTrendChart = () => {
    const chartData = stats.dailySales.slice(-7).map(day => ({
      name: day.date.split('/')[0],
      revenue: day.revenue,
      orders: day.orders
    }));

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sales Trend (Last 7 Days)</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#3b82f6' }}></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Revenue</span>
            </div>
            <div className="flex items-center ml-3">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#10b981' }}></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Orders</span>
            </div>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                  borderColor: darkMode ? '#374151' : '#E5E7EB'
                }}
                formatter={(value) => [formatCurrency(value), '']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                activeDot={{ r: 8 }}
              />
              <Line 
                type="monotone" 
                dataKey="orders" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const RevenueBreakdownChart = () => {
    const data = [
      { name: 'Platform', value: stats.breakdown.platformEarnings.total, color: '#3b82f6' },
      { name: 'Seller Payout', value: stats.breakdown.sellerPayout.netAmount, color: '#10b981' },
      { name: 'Promotor Comm', value: stats.breakdown.promotorCommission, color: '#8b5cf6' }
    ];

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Distribution</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const TopSellersChart = () => {
    const data = stats.topSellers.slice(0, 5).map(seller => ({
      name: seller.sellerName?.substring(0, 12) || 'Seller',
      revenue: seller.totalRevenue || 0,
      orders: seller.totalOrders || 0
    }));

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Sellers</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                contentStyle={{ 
                  backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                  borderColor: darkMode ? '#374151' : '#E5E7EB'
                }}
              />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="orders" name="Orders" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const PaymentMethodsChart = () => {
    const data = [
      { name: 'Wallet', value: stats.breakdown.paymentMethods.wallet, color: '#8b5cf6' },
      { name: 'COD', value: stats.breakdown.paymentMethods.cod, color: '#f59e0b' }
    ];

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Methods</h2>
        <div className="flex items-center justify-center h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const PayoutBreakdownCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payout Breakdown</h2>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">Platform Earnings</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {formatCurrency(stats.breakdown.platformEarnings.total)}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${(stats.breakdown.platformEarnings.total / Math.max(1, stats.totalRevenue)) * 100}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex justify-between">
            <span>Service Fee: {formatCurrency(stats.breakdown.platformEarnings.serviceFee)}</span>
            <span>GST: {formatCurrency(stats.breakdown.platformEarnings.gstCollection)}</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">Seller Payout</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {formatCurrency(stats.breakdown.sellerPayout.netAmount)}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full" 
              style={{ width: `${(stats.breakdown.sellerPayout.netAmount / Math.max(1, stats.totalRevenue)) * 100}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex justify-between">
            <span>Payable: {formatCurrency(stats.breakdown.sellerPayout.payableAmount)}</span>
            <span>Net: {formatCurrency(stats.breakdown.sellerPayout.netAmount)}</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">Promotor Commission</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {formatCurrency(stats.breakdown.promotorCommission)}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full" 
              style={{ width: `${(stats.breakdown.promotorCommission / Math.max(1, stats.totalRevenue)) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );

  const TopPromotorsCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Promotors</h2>
      <div className="space-y-4">
        {stats.topPromotors.slice(0, 5).map((promotor, index) => (
          <div key={promotor.promotorId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-full mr-3" style={{ backgroundColor: '#8b5cf620' }}>
                <span className="font-bold text-sm" style={{ color: '#8b5cf6' }}>{index + 1}</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{promotor.promotorName}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{promotor.city}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-gray-900 dark:text-white" style={{ color: '#8b5cf6' }}>
                {formatCurrency(promotor.totalCommission)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {promotor.sellersAdded} sellers
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

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
                        style={{
                          padding: '0.375rem 0.75rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          transition: 'all 0.2s',
                          ...(selectedPeriod === option.value
                            ? { backgroundColor: '#3b82f6', color: 'white' }
                            : { 
                                color: darkMode ? '#9CA3AF' : '#4B5563',
                                backgroundColor: 'transparent'
                              })
                        }}
                        className="hover:opacity-90"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={refreshData}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: refreshing ? 'not-allowed' : 'pointer',
                      opacity: refreshing ? 0.7 : 1,
                      transition: 'all 0.2s'
                    }}
                    disabled={refreshing}
                    className="hover:opacity-90"
                  >
                    <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              </div>
              
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
                  {/* Main Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <StatCard
                      title="Total Revenue"
                      value={stats.totalRevenue}
                      icon={FiDollarSign}
                      percentageChange={100.0}
                      color="#3b82f6"
                    />
                    <StatCard
                      title="Total Orders"
                      value={stats.totalOrders}
                      icon={FiShoppingCart}
                      percentageChange={88.9}
                      color="#10b981"
                    />
                    <StatCard
                      title="Avg Order Value"
                      value={stats.averageOrderValue}
                      icon={FiTrendingUp}
                      percentageChange={0}
                      color="#8b5cf6"
                    />
                    <StatCard
                      title="Orders Today"
                      value={stats.ordersToday}
                      icon={FiClock}
                      subtitle="Current day orders"
                      color="#f59e0b"
                    />
                  </div>

                  {/* Platform Totals */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <StatCard
                      title="Total Products"
                      value={stats.totals.products}
                      icon={FiPackage}
                      color="#3b82f6"
                      subtitle="Active products"
                    />
                    <StatCard
                      title="Active Sellers"
                      value={stats.totals.sellers}
                      icon={FiUsers}
                      color="#10b981"
                      subtitle="Approved sellers"
                    />
                    <StatCard
                      title="Active Promotors"
                      value={stats.totals.promotors}
                      icon={FiStar}
                      color="#8b5cf6"
                      subtitle="Active promotors"
                    />
                  </div>

                  {/* Charts Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <SalesTrendChart />
                    <RevenueBreakdownChart />
                  </div>

                  {/* More Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <TopSellersChart />
                    <PaymentMethodsChart />
                  </div>

                  {/* Payout and Promotor Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <PayoutBreakdownCard />
                    <TopPromotorsCard />
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Payment Methods</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#8b5cf6' }}></div>
                            <span className="text-sm">Wallet</span>
                          </div>
                          <span className="font-medium" style={{ color: '#8b5cf6' }}>
                            {formatCurrency(stats.breakdown.paymentMethods.wallet)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#f59e0b' }}></div>
                            <span className="text-sm">Cash on Delivery</span>
                          </div>
                          <span className="font-medium" style={{ color: '#f59e0b' }}>
                            {formatCurrency(stats.breakdown.paymentMethods.cod)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Platform Earnings</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#3b82f6' }}></div>
                            <span className="text-sm">Service Fee (10%)</span>
                          </div>
                          <span className="font-medium" style={{ color: '#3b82f6' }}>
                            {formatCurrency(stats.breakdown.platformEarnings.serviceFee)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#10b981' }}></div>
                            <span className="text-sm">GST Collection (18%)</span>
                          </div>
                          <span className="font-medium" style={{ color: '#10b981' }}>
                            {formatCurrency(stats.breakdown.platformEarnings.gstCollection)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#8b5cf6' }}></div>
                            <span className="text-sm font-medium">Total Platform Earnings</span>
                          </div>
                          <span className="font-bold" style={{ color: '#8b5cf6' }}>
                            {formatCurrency(stats.breakdown.platformEarnings.total)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Seller Payout</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                          <span className="text-sm">Payable Amount</span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {formatCurrency(stats.breakdown.sellerPayout.payableAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                          <span className="text-sm">GST Deduction</span>
                          <span className="font-medium text-red-600 dark:text-red-400">
                            -{formatCurrency(stats.breakdown.sellerPayout.gstDeduction)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                          <span className="text-sm">TDS Deduction (1%)</span>
                          <span className="font-medium text-red-600 dark:text-red-400">
                            -{formatCurrency(stats.breakdown.sellerPayout.tdsDeduction)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded border-t">
                          <span className="text-sm font-medium">Net Amount</span>
                          <span className="font-bold text-purple-600 dark:text-purple-400">
                            {formatCurrency(stats.breakdown.sellerPayout.netAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;