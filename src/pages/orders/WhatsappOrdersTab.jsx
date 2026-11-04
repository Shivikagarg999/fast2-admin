import { useEffect, useState, useCallback } from "react";
import { FiMessageCircle } from "react-icons/fi";

const BASE_URL = `${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api`;

const ADDRESS_STEP_STATUSES = ["awaiting_name", "awaiting_address_line", "awaiting_city", "awaiting_state", "awaiting_pincode"];

const STATUS_BADGES = {
  awaiting_payment_method: { label: "Awaiting payment choice", color: "bg-yellow-100 text-yellow-800" },
  pending: { label: "Payment link sent", color: "bg-blue-100 text-blue-800" },
  paid: { label: "Paid (Online)", color: "bg-green-100 text-green-800" },
  cod_confirmed: { label: "Confirmed (COD)", color: "bg-green-100 text-green-800" },
  expired: { label: "Expired", color: "bg-gray-100 text-gray-800" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" }
};

const getStatusBadge = (status) => {
  if (ADDRESS_STEP_STATUSES.includes(status)) {
    return { label: "Collecting address", color: "bg-orange-100 text-orange-800" };
  }
  return STATUS_BADGES[status] || { label: status, color: "bg-gray-100 text-gray-800" };
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount || 0);

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const WhatsappOrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token') || ''}`,
    'Content-Type': 'application/json',
  });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(statusFilter !== "all" && { status: statusFilter })
      });
      const res = await fetch(`${BASE_URL}/admin/whatsapp/orders?${params.toString()}`, { headers: getHeaders() });
      const data = await res.json();
      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
      setTotalOrders(data.total || 0);
    } catch (error) {
      console.error("Error fetching WhatsApp orders:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "awaiting_payment_method", label: "Awaiting payment choice" },
    { value: "pending", label: "Payment link sent" },
    { value: "paid", label: "Paid (Online)" },
    { value: "cod_confirmed", label: "Confirmed (COD)" },
    { value: "cancelled", label: "Cancelled" },
    { value: "expired", label: "Expired" }
  ];

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
            bg-white dark:bg-gray-800 text-gray-900 dark:text-white
            focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Items</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Linked Order</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-500 dark:text-gray-400">Loading WhatsApp orders...</span>
                  </div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center">
                    <FiMessageCircle className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-gray-500 dark:text-gray-400">No WhatsApp orders found.</span>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const badge = getStatusBadge(order.status);
                return (
                  <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {order.shippingAddress?.name || order.user?.name || "WhatsApp Customer"}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">{order.whatsappPhone}</div>
                    </td>
                    <td className="px-6 py-4" style={{ maxWidth: "240px" }}>
                      {order.shippingAddress?.addressLine ? (
                        <>
                          <div className="text-sm text-gray-900 dark:text-white truncate" title={order.shippingAddress.addressLine}>
                            {order.shippingAddress.addressLine}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.pinCode].filter(Boolean).join(", ")}
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">Not collected yet</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {order.items?.map((item) => item.product?.name).filter(Boolean).join(", ")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(order.subtotal)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{formatDate(order.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{order.order?.orderId || "—"}</div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">{totalOrders} WhatsApp orders</div>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{ backgroundColor: "#000000" }}
              className="px-3 py-2 text-sm text-white rounded-lg transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{ backgroundColor: "#000000" }}
              className="px-3 py-2 text-sm text-white rounded-lg transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsappOrdersTab;
