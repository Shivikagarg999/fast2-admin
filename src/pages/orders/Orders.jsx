import { useEffect, useState } from "react";
import { Edit, Trash2, Plus, Package, X, Search, Eye, Truck } from "lucide-react";

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [statusFilter, setStatusFilter] = useState("all");
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);

    const ordersPerPage = 10;

    useEffect(() => {
        fetchOrders();
    }, [currentPage, statusFilter]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage,
                limit: ordersPerPage,
                ...(statusFilter !== "all" && { status: statusFilter }),
                ...(search && { search: search })
            });

            const response = await fetch(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/orders/getall`);
            if (!response.ok) throw new Error('Failed to fetch orders');
            const data = await response.json();
            
            setOrders(data.orders || []);
            setTotalPages(data.totalPages || 1);
            setTotalOrders(data.total || 0);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching orders:", err);
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
            const response = await fetch(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update order status');
            }

            alert('Order status updated successfully!');
            fetchOrders(); // Refresh orders
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

    const statusOptions = [
        { value: 'all', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'processing', label: 'Processing' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' }
    ];

    const updateStatusOptions = [
        { value: 'confirmed', label: 'Confirm' },
        { value: 'processing', label: 'Processing' },
        { value: 'shipped', label: 'Ship' },
        { value: 'delivered', label: 'Deliver' },
        { value: 'cancelled', label: 'Cancel' }
    ];

    return (
        <div className="bg-gray-100 dark:bg-gray-900 w-full min-h-screen">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div className="flex items-center mb-4 sm:mb-0">
                        <Package className="w-6 h-6 text-blue-600 mr-2" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
                        <span className="ml-3 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                            {totalOrders} orders
                        </span>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="mb-6 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search orders by customer name, phone, or order ID..."
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                        bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                        focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Search
                        </button>
                    </form>

                    <div className="flex gap-4">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Order & Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Items
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Total
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
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8">
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                                <span className="ml-2 text-gray-500 dark:text-gray-400">Loading orders...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8">
                                            <div className="flex flex-col items-center">
                                                <Package className="w-12 h-12 text-gray-400 mb-2" />
                                                <span className="text-gray-500 dark:text-gray-400">No orders found.</span>
                                                {(search || statusFilter !== 'all') && (
                                                    <button
                                                        onClick={() => {
                                                            setSearch("");
                                                            setStatusFilter("all");
                                                            setCurrentPage(1);
                                                        }}
                                                        className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                                                    >
                                                        Clear filters
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order) => (
                                        <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {order.orderId}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {order.user?.name}
                                                    </div>
                                                    <div className="text-xs text-gray-400 dark:text-gray-500">
                                                        {order.user?.phone}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {order?.items?.length} item{order?.items?.length !== 1 ? 's' : ''}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                                    {order?.items.map(item => item?.product?.name).join(', ')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {formatCurrency(order.total)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col gap-2">
                                                    {getStatusBadge(order.status)}
                                                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                                        <select
                                                            value=""
                                                            onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                                            className="text-xs border border-gray-300 dark:border-gray-600 rounded 
                                                                bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300
                                                                focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        >
                                                            <option value="">Update...</option>
                                                            {updateStatusOptions
                                                                .filter(opt => opt.value !== order.status)
                                                                .map(option => (
                                                                    <option key={option.value} value={option.value}>
                                                                        {option.label}
                                                                    </option>
                                                                ))
                                                            }
                                                        </select>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col gap-1">
                                                    {getPaymentStatusBadge(order.paymentStatus)}
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                                        {order.paymentMethod}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {formatDate(order.createdAt)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => openOrderDetails(order)}
                                                        className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
                                                        title="View Order Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                            Showing {((currentPage - 1) * ordersPerPage) + 1} to {Math.min(currentPage * ordersPerPage, totalOrders)} of {totalOrders} orders
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 
                                    bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                                    hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                                            currentPage === pageNum
                                                ? "bg-blue-500 text-white border-blue-500"
                                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        }`}
                                        onClick={() => setCurrentPage(pageNum)}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 
                                    bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                                    hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Order Details Modal */}
                {showModal && selectedOrder && (
                    <div className="fixed inset-0 bg-gray bg-opacity-20 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Order Details - #{selectedOrder.orderId}
                                </h2>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Order Summary */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Customer Information</h3>
                                        <div className="space-y-2">
                                            <p><strong>Name:</strong> {selectedOrder.user?.name}</p>
                                            <p><strong>Email:</strong> {selectedOrder.user?.email}</p>
                                            <p><strong>Phone:</strong> {selectedOrder.user?.phone}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Order Information</h3>
                                        <div className="space-y-2">
                                            <p><strong>Order Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
                                            <p><strong>Status:</strong> {getStatusBadge(selectedOrder.status)}</p>
                                            <p><strong>Seller:</strong> {getStatusBadge(selectedOrder.seller)}</p>
                                            <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod?.toUpperCase()}</p>
                                            <p><strong>Payment Status:</strong> {getPaymentStatusBadge(selectedOrder.paymentStatus)}</p>
                                            <p><strong>Total Amount:</strong> {formatCurrency(selectedOrder.total)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Shipping Address */}
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

                                {/* Order Items */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Order Items</h3>
                                    <div className="space-y-4">
                                        {selectedOrder.items.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                <div className="flex items-center space-x-4">
                                                    <img
                                                        src={item.product.images?.[0]?.url || "https://via.placeholder.com/60?text=No+Image"}
                                                        alt={item?.product?.name}
                                                        className="w-16 h-16 rounded-lg object-cover"
                                                    />
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 dark:text-white">{item?.product?.name}</h4>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Quantity: {item?.quantity}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(item?.price)}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total: {formatCurrency(item?.price * item?.quantity)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Order Total */}
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-medium text-gray-900 dark:text-white">Total Amount:</span>
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(selectedOrder.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrdersPage;