import { useEffect, useState } from "react";
import { 
  FiCreditCard, 
  FiEye, 
  FiSearch, 
  FiPackage, 
  FiX, 
  FiFilter,
  FiDollarSign,
  FiCalendar,
  FiUser,
  FiShoppingBag,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw
} from "react-icons/fi";

const OnlinePay = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("");
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const [viewMode, setViewMode] = useState("table");

    const ordersPerPage = 10;

    useEffect(() => {
        fetchOrders();
    }, [currentPage, statusFilter, paymentStatusFilter, dateFilter]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage,
                limit: ordersPerPage,
                ...(statusFilter !== "all" && { status: statusFilter }),
                ...(paymentStatusFilter !== "all" && { paymentStatus: paymentStatusFilter }),
                ...(dateFilter && { startDate: dateFilter }),
                ...(search && { search: search })
            });

            const response = await fetch(
                `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/orders/getonline?${params}`
            );
            
            if (!response.ok) throw new Error('Failed to fetch online orders');
            
            const data = await response.json();
            
            if (data.success) {
                setOrders(data.orders || []);
                setTotalPages(data.totalPages || 1);
                setTotalOrders(data.total || 0);
            } else {
                setOrders([]);
                setTotalPages(1);
                setTotalOrders(0);
            }
        } catch (err) {
            console.error("Error fetching online orders:", err);
            setOrders([]);
            setTotalPages(1);
            setTotalOrders(0);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchOrders();
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/orders/${orderId}/status`, 
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update order status');
            }

            alert('Order status updated successfully!');
            fetchOrders();
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('Error updating order status: ' + error.message);
        }
    };

    const openOrderDetails = (order) => {
        setSelectedOrder(order);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedOrder(null);
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
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
            confirmed: { color: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
            processing: { color: 'bg-purple-100 text-purple-800', label: 'Processing' },
            shipped: { color: 'bg-indigo-100 text-indigo-800', label: 'Shipped' },
            delivered: { color: 'bg-green-100 text-green-800', label: 'Delivered' },
            cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
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
            pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
            paid: { color: 'bg-green-100 text-green-800', label: 'Paid' },
            failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
            refunded: { color: 'bg-gray-100 text-gray-800', label: 'Refunded' },
            partially_paid: { color: 'bg-orange-100 text-orange-800', label: 'Partial' }
        };

        const config = statusConfig[status] || statusConfig.pending;
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const statusOptions = [
        { value: 'all', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'processing', label: 'Processing' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' }
    ];

    const paymentStatusOptions = [
        { value: 'all', label: 'All Payments' },
        { value: 'paid', label: 'Paid' },
        { value: 'pending', label: 'Pending' },
        { value: 'failed', label: 'Failed' },
        { value: 'refunded', label: 'Refunded' },
        { value: 'partially_paid', label: 'Partial' }
    ];

    const buttonStyles = {
        primary: "bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2",
        secondary: "bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2",
        outline: "bg-transparent text-blue-600 px-4 py-2 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2",
        danger: "bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
    };

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                    <div className="flex items-center mb-4 lg:mb-0">
                        <FiCreditCard className="w-6 h-6 text-blue-600 mr-2" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Online Payments</h1>
                        <span className="ml-3 px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                            {totalOrders} orders
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode("table")}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    viewMode === "table" 
                                        ? "bg-black text-white" 
                                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                }`}
                            >
                                Table
                            </button>
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                                    viewMode === "grid" 
                                        ? "bg-black text-white" 
                                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                }`}
                            >
                                Grid
                            </button>
                        </div>
                        <button 
                            onClick={fetchOrders}
                            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            title="Refresh"
                        >
                            <FiRefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search orders by customer name, email, or order ID..."
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </form>

                        <div className="flex flex-wrap gap-3">
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                {statusOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={paymentStatusFilter}
                                onChange={(e) => {
                                    setPaymentStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                {paymentStatusOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>

                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => {
                                    setDateFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Orders Section */}
                {viewMode === "table" ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-900">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Order Details
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Payment
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-8 text-center">
                                                <div className="flex justify-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                                </div>
                                                <p className="mt-2 text-gray-500">Loading orders...</p>
                                            </td>
                                        </tr>
                                    ) : orders.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-8 text-center">
                                                <FiCreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                                <p className="text-gray-500">No online payments found</p>
                                                {(search || statusFilter !== 'all' || paymentStatusFilter !== 'all' || dateFilter) && (
                                                    <button
                                                        onClick={() => {
                                                            setSearch("");
                                                            setStatusFilter("all");
                                                            setPaymentStatusFilter("all");
                                                            setDateFilter("");
                                                            setCurrentPage(1);
                                                        }}
                                                        className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                                                    >
                                                        Clear all filters
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.map((order) => (
                                            <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                                            <FiPackage className="h-5 w-5 text-gray-500" />
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {order.orderId}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {order.items?.length || 0} items
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900 dark:text-white">
                                                        {order.user?.name || 'N/A'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {order.user?.email || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        {formatCurrency(order.finalAmount)}
                                                    </div>
                                                    {order.walletDeduction > 0 && (
                                                        <div className="text-xs text-gray-500">
                                                            Wallet: -{formatCurrency(order.walletDeduction)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getStatusBadge(order.status)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getPaymentStatusBadge(order.paymentStatus)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900 dark:text-white">
                                                        {new Date(order.createdAt).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => openOrderDetails(order)}
                                                            className="text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-50"
                                                            title="View Details"
                                                        >
                                                            <FiEye className="w-4 h-4" />
                                                        </button>
                                                        <select
                                                            onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                                            className="text-xs border border-gray-300 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            defaultValue=""
                                                        >
                                                            <option value="" disabled>Update</option>
                                                            <option value="confirmed">Confirm</option>
                                                            <option value="processing">Processing</option>
                                                            <option value="shipped">Ship</option>
                                                            <option value="delivered">Deliver</option>
                                                            <option value="cancelled">Cancel</option>
                                                        </select>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {orders.map((order) => (
                            <div key={order._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {order.orderId}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {getStatusBadge(order.status)}
                                        {getPaymentStatusBadge(order.paymentStatus)}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <FiUser className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {order.user?.name || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FiShoppingBag className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {order.items?.length || 0} items
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FiDollarSign className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {formatCurrency(order.finalAmount)}
                                        </span>
                                        {order.walletDeduction > 0 && (
                                            <span className="text-xs text-gray-500">
                                                (-{formatCurrency(order.walletDeduction)} wallet)
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => openOrderDetails(order)}
                                        className="flex-1 bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1"
                                    >
                                        <FiEye className="w-3 h-3" />
                                        View
                                    </button>
                                    <select
                                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                        className="flex-1 text-xs border border-gray-300 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Update</option>
                                        <option value="confirmed">Confirm</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Ship</option>
                                        <option value="delivered">Deliver</option>
                                        <option value="cancelled">Cancel</option>
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && !loading && orders.length > 0 && (
                    <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                            Showing {(currentPage - 1) * ordersPerPage + 1} to{" "}
                            {Math.min(currentPage * ordersPerPage, totalOrders)} of {totalOrders} orders
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className={`px-3 py-2 text-sm rounded-lg border ${
                                    currentPage === 1
                                        ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                }`}
                            >
                                Previous
                            </button>
                            
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`px-3 py-2 text-sm rounded-lg border ${
                                            currentPage === pageNum
                                                ? "bg-black text-white border-black"
                                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className={`px-3 py-2 text-sm rounded-lg border ${
                                    currentPage === totalPages
                                        ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                }`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Order Details Modal */}
                {showModal && selectedOrder && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        Order #{selectedOrder.orderId}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {formatDate(selectedOrder.createdAt)}
                                    </p>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Order Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FiUser className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Customer</span>
                                        </div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{selectedOrder.user?.name || 'N/A'}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedOrder.user?.email || 'N/A'}</p>
                                    </div>

                                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FiDollarSign className="w-4 h-4 text-green-600" />
                                            <span className="text-sm font-medium text-green-700 dark:text-green-300">Amount</span>
                                        </div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedOrder.finalAmount)}</p>
                                        {selectedOrder.walletDeduction > 0 && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                -{formatCurrency(selectedOrder.walletDeduction)} from wallet
                                            </p>
                                        )}
                                    </div>

                                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FiPackage className="w-4 h-4 text-purple-600" />
                                            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Status</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(selectedOrder.status)}
                                            {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                                        </div>
                                    </div>

                                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FiShoppingBag className="w-4 h-4 text-orange-600" />
                                            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Items</span>
                                        </div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{selectedOrder.items?.length || 0} items</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Online Payment</p>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Order Items</h3>
                                    <div className="space-y-3">
                                        {selectedOrder.items?.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                                                        <FiPackage className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 dark:text-white">
                                                            {item.product?.name || `Item ${index + 1}`}
                                                        </h4>
                                                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {formatCurrency(item.price)}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Total: {formatCurrency(item.price * item.quantity)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Shipping Address */}
                                {selectedOrder.shippingAddress && (
                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Shipping Address</h3>
                                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                                            <p className="text-gray-900 dark:text-white">{selectedOrder.shippingAddress.addressLine}</p>
                                            <p className="text-gray-600 dark:text-gray-400">
                                                {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pinCode}
                                            </p>
                                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                                Phone: {selectedOrder.shippingAddress.phone}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Payment Summary */}
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Payment Summary</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                                            <span className="font-medium">{formatCurrency(selectedOrder.subtotal || selectedOrder.total)}</span>
                                        </div>
                                        {selectedOrder.deliveryCharges > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Delivery</span>
                                                <span className="font-medium">{formatCurrency(selectedOrder.deliveryCharges)}</span>
                                            </div>
                                        )}
                                        {selectedOrder.coupon?.discount > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Discount</span>
                                                <span className="font-medium text-green-600">-{formatCurrency(selectedOrder.coupon.discount)}</span>
                                            </div>
                                        )}
                                        {selectedOrder.walletDeduction > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Wallet Deduction</span>
                                                <span className="font-medium text-green-600">-{formatCurrency(selectedOrder.walletDeduction)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                                            <span className="font-semibold">Total Amount</span>
                                            <span className="font-bold text-lg">{formatCurrency(selectedOrder.finalAmount)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end gap-3">
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        // Implement any action here
                                        alert('Action triggered!');
                                    }}
                                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    Take Action
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OnlinePay;