import { useEffect, useState } from "react";
import axios from "axios";
import {
  FiBarChart2,
  FiDownload,
  FiFilter,
  FiPackage,
  FiShoppingBag,
  FiUsers,
  FiUserCheck,
  FiDollarSign,
  FiTruck,
  FiStar,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiGrid
} from "react-icons/fi";

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState("orders");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    recordsPerPage: 20
  });
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    orderStatus: "",
    paymentStatus: "",
    sellerId: "",
    promotorId: "",
    minPrice: "",
    maxPrice: "",
    stockStatus: "",
    approvalStatus: "",
    active: ""
  });
  const [showFilters, setShowFilters] = useState(false);

  const tabs = [
    { id: "orders", label: "Orders Report", icon: FiPackage },
    { id: "sellers", label: "Sellers Report", icon: FiShoppingBag },
    { id: "promotors", label: "Promotors Report", icon: FiUsers },
    { id: "products", label: "Products Report", icon: FiGrid }
  ];

  const fetchReport = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      let url = `${import.meta.env.VITE_BASE_URL || 'https://admin.fast2.in/proxy'}/api/admin/reports/`;
      let params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", 20);
      
      switch (activeTab) {
        case "orders":
          url += "orders";
          if (filters.startDate) params.append("startDate", filters.startDate);
          if (filters.endDate) params.append("endDate", filters.endDate);
          if (filters.orderStatus) params.append("status", filters.orderStatus);
          if (filters.paymentStatus) params.append("paymentStatus", filters.paymentStatus);
          break;
        case "sellers":
          url += "sellers";
          if (filters.sellerId) params.append("sellerId", filters.sellerId);
          if (filters.approvalStatus) params.append("approvalStatus", filters.approvalStatus);
          break;
        case "promotors":
          url += "promotors";
          if (filters.promotorId) params.append("promotorId", filters.promotorId);
          if (filters.active) params.append("active", filters.active);
          break;
        case "products":
          url += "products";
          if (filters.minPrice) params.append("minPrice", filters.minPrice);
          if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
          if (filters.stockStatus) params.append("stockStatus", filters.stockStatus);
          break;
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setReportData(response.data.data || []);
        setSummary(response.data.summary);
        if (response.data.pagination) {
          setPagination({
            currentPage: response.data.pagination.currentPage,
            totalPages: response.data.pagination.totalPages,
            totalRecords: response.data.pagination.totalRecords,
            recordsPerPage: response.data.pagination.recordsPerPage
          });
        }
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      alert("Failed to load report: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      let url = `${import.meta.env.VITE_BASE_URL || 'https://admin.fast2.in/proxy'}/api/admin/reports/`;
      let params = new URLSearchParams();
      params.append("format", "csv");
      
      switch (activeTab) {
        case "orders":
          url += "orders";
          if (filters.startDate) params.append("startDate", filters.startDate);
          if (filters.endDate) params.append("endDate", filters.endDate);
          if (filters.orderStatus) params.append("status", filters.orderStatus);
          if (filters.paymentStatus) params.append("paymentStatus", filters.paymentStatus);
          break;
        case "sellers":
          url += "sellers";
          if (filters.sellerId) params.append("sellerId", filters.sellerId);
          if (filters.approvalStatus) params.append("approvalStatus", filters.approvalStatus);
          break;
        case "promotors":
          url += "promotors";
          if (filters.promotorId) params.append("promotorId", filters.promotorId);
          if (filters.active) params.append("active", filters.active);
          break;
        case "products":
          url += "products";
          if (filters.minPrice) params.append("minPrice", filters.minPrice);
          if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
          if (filters.stockStatus) params.append("stockStatus", filters.stockStatus);
          break;
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob"
      });
      
      const blob = new Blob([response.data], { type: "text/csv" });
      const url_ = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url_;
      a.download = `${activeTab}_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url_);
      
      alert("CSV downloaded successfully!");
    } catch (error) {
      console.error("Error downloading CSV:", error);
      alert("Failed to download CSV: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchReport(newPage);
    }
  };

  const applyFilters = () => {
    fetchReport(1);
  };

  useEffect(() => {
    fetchReport(1);
  }, [activeTab]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const getStatusBadge = (status, type = "order") => {
    if (type === "order") {
      const config = {
        delivered: { bg: "bg-green-100", text: "text-green-800", icon: FiCheckCircle, label: "Delivered" },
        cancelled: { bg: "bg-red-100", text: "text-red-800", icon: FiXCircle, label: "Cancelled" },
        "picked-up": { bg: "bg-purple-100", text: "text-purple-800", icon: FiTruck, label: "Picked Up" },
        accepted: { bg: "bg-blue-100", text: "text-blue-800", icon: FiClock, label: "Accepted" },
        pending: { bg: "bg-yellow-100", text: "text-yellow-800", icon: FiClock, label: "Pending" }
      };
      const cfg = config[status] || config.pending;
      const Icon = cfg.icon;
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${cfg.bg} ${cfg.text}`}>
          <Icon className="w-3 h-3" />
          {cfg.label}
        </span>
      );
    }
    return null;
  };

  const getPaymentBadge = (status) => {
    const config = {
      paid: { bg: "bg-green-100", text: "text-green-800", icon: FiCheckCircle, label: "Paid" },
      pending: { bg: "bg-yellow-100", text: "text-yellow-800", icon: FiClock, label: "Pending" },
      failed: { bg: "bg-red-100", text: "text-red-800", icon: FiXCircle, label: "Failed" },
      refunded: { bg: "bg-gray-100", text: "text-gray-800", icon: FiXCircle, label: "Refunded" }
    };
    const cfg = config[status] || config.pending;
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${cfg.bg} ${cfg.text}`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 w-full min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center mb-4 sm:mb-0">
            <FiBarChart2 className="w-6 h-6 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{ backgroundColor: "#000000" }}
              className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors hover:opacity-90"
            >
              <FiFilter className="w-4 h-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
            <button
              onClick={downloadCSV}
              style={{ backgroundColor: "#000000" }}
              className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors hover:opacity-90"
            >
              <FiDownload className="w-4 h-4" />
              Download CSV
            </button>
          </div>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-b-2 border-black text-black dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-sm">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Filters</h3>
            
            {activeTab === "orders" && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Order Status</label>
                  <select
                    value={filters.orderStatus}
                    onChange={(e) => setFilters({...filters, orderStatus: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="picked-up">Picked Up</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Payment Status</label>
                  <select
                    value={filters.paymentStatus}
                    onChange={(e) => setFilters({...filters, paymentStatus: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
                <div className="md:col-span-4">
                  <button
                    onClick={applyFilters}
                    style={{ backgroundColor: "#000000" }}
                    className="px-4 py-2 text-white rounded-lg hover:opacity-90"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}

            {activeTab === "sellers" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Approval Status</label>
                  <select
                    value={filters.approvalStatus}
                    onChange={(e) => setFilters({...filters, approvalStatus: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="">All</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <button
                    onClick={applyFilters}
                    style={{ backgroundColor: "#000000" }}
                    className="px-4 py-2 text-white rounded-lg hover:opacity-90"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}

            {activeTab === "promotors" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Status</label>
                  <select
                    value={filters.active}
                    onChange={(e) => setFilters({...filters, active: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="">All</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <button
                    onClick={applyFilters}
                    style={{ backgroundColor: "#000000" }}
                    className="px-4 py-2 text-white rounded-lg hover:opacity-90"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}

            {activeTab === "products" && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Min Price</label>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                    placeholder="Min Price"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Max Price</label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                    placeholder="Max Price"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Stock Status</label>
                  <select
                    value={filters.stockStatus}
                    onChange={(e) => setFilters({...filters, stockStatus: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="">All</option>
                    <option value="in-stock">In Stock</option>
                    <option value="out-of-stock">Out of Stock</option>
                  </select>
                </div>
                <div className="md:col-span-4">
                  <button
                    onClick={applyFilters}
                    style={{ backgroundColor: "#000000" }}
                    className="px-4 py-2 text-white rounded-lg hover:opacity-90"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {activeTab === "orders" && (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalOrders || 0}</p>
                    </div>
                    <FiPackage className="w-8 h-8 text-blue-500 opacity-50" />
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalRevenue || 0)}</p>
                    </div>
                    <FiDollarSign className="w-8 h-8 text-green-500 opacity-50" />
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Platform Fees</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalPlatformFees || 0)}</p>
                    </div>
                    <FiDollarSign className="w-8 h-8 text-blue-500 opacity-50" />
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Promotor Commission</p>
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary.totalPromotorCommission || 0)}</p>
                    </div>
                    <FiUsers className="w-8 h-8 text-purple-500 opacity-50" />
                  </div>
                </div>
              </>
            )}

            {activeTab === "sellers" && (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Sellers</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalSellers || 0}</p>
                    </div>
                    <FiUsers className="w-8 h-8 text-blue-500 opacity-50" />
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Sales</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalSales || 0)}</p>
                    </div>
                    <FiDollarSign className="w-8 h-8 text-green-500 opacity-50" />
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Payout</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalPayout || 0)}</p>
                    </div>
                    <FiDollarSign className="w-8 h-8 text-blue-500 opacity-50" />
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Products</p>
                      <p className="text-2xl font-bold text-purple-600">{summary.totalProducts || 0}</p>
                    </div>
                    <FiPackage className="w-8 h-8 text-purple-500 opacity-50" />
                  </div>
                </div>
              </>
            )}

            {activeTab === "promotors" && (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Promotors</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalPromotors || 0}</p>
                    </div>
                    <FiUsers className="w-8 h-8 text-blue-500 opacity-50" />
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Commission</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalCommission || 0)}</p>
                    </div>
                    <FiDollarSign className="w-8 h-8 text-green-500 opacity-50" />
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Sales</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalSales || 0)}</p>
                    </div>
                    <FiDollarSign className="w-8 h-8 text-blue-500 opacity-50" />
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Active Promotors</p>
                      <p className="text-2xl font-bold text-purple-600">{summary.activePromotors || 0}</p>
                    </div>
                    <FiUserCheck className="w-8 h-8 text-purple-500 opacity-50" />
                  </div>
                </div>
              </>
            )}

            {activeTab === "products" && (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Products</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalProducts || 0}</p>
                    </div>
                    <FiPackage className="w-8 h-8 text-blue-500 opacity-50" />
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalRevenue || 0)}</p>
                    </div>
                    <FiDollarSign className="w-8 h-8 text-green-500 opacity-50" />
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Quantity Sold</p>
                      <p className="text-2xl font-bold text-blue-600">{summary.totalQuantitySold || 0}</p>
                    </div>
                    <FiPackage className="w-8 h-8 text-blue-500 opacity-50" />
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Out of Stock</p>
                      <p className="text-2xl font-bold text-red-600">{summary.outOfStockProducts || 0}</p>
                    </div>
                    <FiXCircle className="w-8 h-8 text-red-500 opacity-50" />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                {activeTab === "orders" && (
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                )}
                {activeTab === "sellers" && (
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Sales</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                )}
                {activeTab === "promotors" && (
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Earned</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sellers</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                )}
                {activeTab === "products" && (
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-500">Loading report...</span>
                      </div>
                    </td>
                  </tr>
                ) : reportData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8">
                      <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <span className="text-gray-500">No data found</span>
                    </td>
                  </tr>
                ) : (
                  reportData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {activeTab === "orders" && (
                        <>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.orderId}</td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{item.customerName}</div>
                            <div className="text-xs text-gray-500">{item.customerPhone}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{item.sellerName}</div>
                            <div className="text-xs text-gray-500">{item.sellerEmail}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{item.driverName}</div>
                            <div className="text-xs text-gray-500">{item.driverPhone}</div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(item.finalAmount)}</td>
                          <td className="px-6 py-4">{getStatusBadge(item.status, "order")}</td>
                          <td className="px-6 py-4">{getPaymentBadge(item.paymentStatus)}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{item.orderDate?.split(',')[0]}</td>
                        </>
                      )}
                      {activeTab === "sellers" && (
                        <>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{item.businessName}</div>
                            <div className="text-xs text-gray-500">{item.name}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.phone}</td>
                          <td className="px-6 py-4 text-sm font-medium text-green-600">{formatCurrency(item.totalSales)}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.totalOrders}</td>
                          <td className="px-6 py-4 flex items-center gap-1 text-sm text-gray-900">
                            <FiStar className="w-4 h-4 text-yellow-500" />
                            {item.rating}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                              item.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                              item.approvalStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {item.approvalStatus === 'approved' ? <FiCheckCircle className="w-3 h-3" /> : <FiClock className="w-3 h-3" />}
                              {item.approvalStatus}
                            </span>
                          </td>
                        </>
                      )}
                      {activeTab === "promotors" && (
                        <>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.phone}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.commissionRate}%</td>
                          <td className="px-6 py-4 text-sm font-medium text-purple-600">{formatCurrency(item.totalCommissionEarned)}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.totalSellers}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                              item.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {item.active ? <FiCheckCircle className="w-3 h-3" /> : <FiXCircle className="w-3 h-3" />}
                              {item.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </>
                      )}
                      {activeTab === "products" && (
                        <>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            <div className="text-xs text-gray-500">{item.hsnCode}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.category}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(item.price)}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                              item.stockStatus === 'In Stock' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {item.stockStatus === 'In Stock' ? <FiCheckCircle className="w-3 h-3" /> : <FiXCircle className="w-3 h-3" />}
                              {item.stockStatus} ({item.currentStock})
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.totalQuantitySold}</td>
                          <td className="px-6 py-4 text-sm font-medium text-green-600">{formatCurrency(item.totalRevenue)}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.sellerName}</td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {pagination.totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {((pagination.currentPage - 1) * pagination.recordsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.recordsPerPage, pagination.totalRecords)} of {pagination.totalRecords} records
            </div>
            <div className="flex gap-1 flex-wrap justify-center">
              <button
                onClick={() => handlePageChange(1)}
                disabled={pagination.currentPage === 1}
                style={{ backgroundColor: "#000000" }}
                className="px-3 py-2 text-sm text-white rounded-lg transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                style={{ backgroundColor: "#000000" }}
                className="flex items-center gap-1 px-3 py-2 text-sm text-white rounded-lg transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronLeft className="w-4 h-4" />
                Prev
              </button>
              
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    style={{ 
                      backgroundColor: pagination.currentPage === pageNum ? "#000000" : "#e5e7eb",
                      color: pagination.currentPage === pageNum ? "#ffffff" : "#374151"
                    }}
                    className="px-3 py-2 text-sm rounded-lg transition-colors hover:opacity-90"
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                style={{ backgroundColor: "#000000" }}
                className="flex items-center gap-1 px-3 py-2 text-sm text-white rounded-lg transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <FiChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.currentPage === pagination.totalPages}
                style={{ backgroundColor: "#000000" }}
                className="px-3 py-2 text-sm text-white rounded-lg transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;