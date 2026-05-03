import { useEffect, useState } from "react";
import {
  FiPackage,
  FiX,
  FiSearch,
  FiEye,
  FiDownload,
  FiFileText,
  FiPrinter,
  FiTruck
} from "react-icons/fi";

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

            const response = await fetch(`${import.meta.env.VITE_BASE_URL || 'https://admin.fast2.in/proxy'}/api/admin/orders/getall?${params.toString()}`);
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
            const response = await fetch(`${import.meta.env.VITE_BASE_URL || 'https://admin.fast2.in/proxy'}/api/admin/orders/${orderId}/status`, {
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
            currency: 'INR'
        }).format(amount);
    };

    const downloadCSV = async () => {
        try {
            const params = new URLSearchParams();
            if (statusFilter !== "all") {
                params.append('status', statusFilter);
            }

            const response = await fetch(`${import.meta.env.VITE_BASE_URL || 'https://admin.fast2.in/proxy'}/api/admin/orders/download/csv?${params.toString()}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to download CSV');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `orders_${statusFilter !== 'all' ? statusFilter : 'all'}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading CSV:', error);
            alert('Error downloading CSV: ' + error.message);
        }
    };

    const handleDownloadInvoice = async (orderId) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BASE_URL || 'https://admin.fast2.in/proxy'}/api/order/${orderId}/invoice`);
            if (!response.ok) throw new Error('Failed to download invoice');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `invoice-${orderId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Invoice download error:', error);
            alert('Failed to download invoice. Please try again.');
        }
    };

    const handlePrintInvoice = (order) => {
        const COMPANY_NAME = 'FAST 2';
        const COMPANY_GSTIN = '07AABCU9603R1ZM';
        const COMPANY_ADDR = '123 Business Street, Delhi - 110001';
        const COMPANY_PAN = 'AABCU9603R';
        
        const seller = order.seller || {};
        const SELLER_NAME = seller.businessName || seller.name || 'HME';
        const SELLER_GSTIN = seller.gstNumber || '235657845768';
        const SELLER_ADDR = seller.address ? 
            `${seller.address.street || ''}, ${seller.address.city || ''}, ${seller.address.state || ''} - ${seller.address.pincode || ''}` : 
            'Gurgaon, Haryana - 201301';
        const SELLER_STATE = (seller.address?.state || 'haryana').toLowerCase();

        const addr = order.shippingAddress || {};
        const delivState = (addr.state || '').toLowerCase().trim();
        const isInterState = delivState !== SELLER_STATE;

        const itemsSubtotal = order.items?.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0) || 0;
        const totalGst = order.totalGst || order.items?.reduce((s, i) => s + (i.gstAmount || 0) * (i.quantity || 1), 0) || 0;
        const grandTotal = order.total || (itemsSubtotal + totalGst);
        const delivery = Math.max(0, grandTotal - itemsSubtotal - totalGst);
        const walletDeduct = order.walletDeduction || 0;

        const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });

        const itemRows = order.items.map(item => {
            const qty = item.quantity || 1;
            const rate = (item.price || 0).toFixed(2);
            const amt = ((item.price || 0) * qty).toFixed(2);
            const gstPct = item.gstPercent || 0;
            const gstAmt = ((item.gstAmount || 0) * qty).toFixed(2);
            const hsn = item.product?.hsn || item.hsn || '';
            const name = (item.product?.name || 'Product').substring(0, 26);
            const gstLabel = isInterState
                ? `IGST:${gstPct}%`
                : `CGST:${gstPct/2}% SGST:${gstPct/2}%`;

            return `
                <tr>
                    <td colspan="5" style="padding:4px 0 1px;font-size:12px;font-weight:bold;">${name}</td>
                </tr>
                <tr>
                    <td style="padding:1px 0;font-size:11px;width:8%">${qty}</td>
                    <td style="padding:1px 0;font-size:11px;width:23%;text-align:right">Rs ${rate}</td>
                    <td style="padding:1px 0;font-size:11px;width:23%;text-align:right">Rs ${amt}</td>
                    <td style="padding:1px 0;font-size:11px;width:23%;text-align:right">Rs ${gstAmt}</td>
                    <td style="padding:1px 0;font-size:11px;width:23%"></td>
                </tr>
                <tr>
                    <td colspan="5" style="padding:1px 0 4px;font-size:10px;color:#444;">
                        ${hsn ? `HSN:${hsn}` : ''} ${gstLabel} &nbsp; Tax: Rs ${gstAmt}
                    </td>
                </tr>`;
        }).join('');

        const gstBreakdown = isInterState
            ? `<tr><td style="font-size:11px;padding:2px 0">IGST</td><td style="font-size:11px;padding:2px 0;text-align:right">Rs ${totalGst.toFixed(2)}</td></tr>`
            : `<tr><td style="font-size:11px;padding:2px 0">CGST</td><td style="font-size:11px;padding:2px 0;text-align:right">Rs ${(totalGst/2).toFixed(2)}</td></tr>
              <tr><td style="font-size:11px;padding:2px 0">SGST</td><td style="font-size:11px;padding:2px 0;text-align:right">Rs ${(totalGst/2).toFixed(2)}</td></tr>`;

        const supplyLine = isInterState
            ? `Inter-state supply: IGST Rs ${totalGst.toFixed(2)}`
            : `Intra-state supply: CGST Rs ${(totalGst/2).toFixed(2)} + SGST Rs ${(totalGst/2).toFixed(2)}`;

        const payMethod = walletDeduct > 0 && (order.cashOnDelivery > 0)
            ? 'WALLET + COD'
            : walletDeduct > 0 ? 'WALLET'
            : (order.paymentMethod || 'COD').toUpperCase();

        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Invoice - ${order.orderId}</title>
  <style>
    @page { size: 80mm auto; margin: 4mm 3mm; }
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      font-weight: bold;
      width: 72mm;
      color: #000;
      background: #fff;
    }
    .c  { text-align: center; }
    .b  { font-weight: bold; }
    .sm { font-size: 10px; }
    p   { margin: 1px 0; line-height: 1.4; }
    .sep  { border: none; border-top: 1px dashed #000; margin: 5px 0; }
    .dsep { border: none; border-top: 2px solid #000; margin: 5px 0; }
    table { width: 100%; border-collapse: collapse; }
    .row2 { display: flex; justify-content: space-between; margin: 2px 0; font-size: 11px; }
    .row2.bold { font-weight: bold; font-size: 12px; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>

  <p class="c b" style="font-size:18px;letter-spacing:2px;">${COMPANY_NAME}</p>
  <p class="c b" style="font-size:13px;letter-spacing:1px;">TAX INVOICE</p>
  <hr class="dsep"/>
  <p class="c sm">GSTIN: ${COMPANY_GSTIN}</p>
  <p class="c sm">${COMPANY_ADDR}</p>
  <p class="c sm">PAN: ${COMPANY_PAN}</p>
  <hr class="sep"/>

  <p><span class="b">Invoice No:</span> ${order.orderId}</p>
  <p><span class="b">Date:</span> ${orderDate}</p>
  <p><span class="b">Place of Supply:</span> ${addr.state || 'N/A'}</p>
  <hr class="sep"/>

  <p class="b">SOLD BY:</p>
  <p>${SELLER_NAME}</p>
  <p class="sm">GSTIN: ${SELLER_GSTIN}</p>
  <p class="sm">${SELLER_ADDR}</p>
  <hr class="sep"/>

  <p class="b">BILL TO:</p>
  <p>${order.user?.name || addr.fullName || 'Customer'}</p>
  <p class="sm">Ph: ${order.user?.phone || addr.phone || 'N/A'}</p>
  ${addr.addressLine ? `<p class="sm">${addr.addressLine}</p>` : ''}
  <p class="sm">${addr.city || ''}${addr.state ? ', ' + addr.state : ''}${addr.pinCode ? ' - ' + addr.pinCode : ''}</p>
  ${order.user?.email ? `<p class="sm">Email: ${order.user.email}</p>` : ''}
  <hr class="sep"/>

  <table>
    <tr><th style="font-size:10px;text-align:left;width:8%">QTY</th>
      <th style="font-size:10px;text-align:right;width:23%">RATE</th>
      <th style="font-size:10px;text-align:right;width:23%">AMT</th>
      <th style="font-size:10px;text-align:right;width:23%">GST</th>
      <th style="width:23%"></th></tr>
  </table>
  <hr class="sep"/>

  <tr>${itemRows}</table>
  <hr class="sep"/>

  <div class="row2"><span>Subtotal:</span><span>Rs ${itemsSubtotal.toFixed(2)}</span></div>
  <div class="row2"><span>Delivery Charges:</span><span>Rs ${delivery.toFixed(2)}</span></div>
  ${walletDeduct > 0 ? `<div class="row2"><span>Wallet Deduction:</span><span>-Rs ${walletDeduct.toFixed(2)}</span></div>` : ''}
  <hr class="sep"/>

  <p class="b" style="font-size:11px;margin-bottom:2px;">GST BREAKDOWN:</p>
  <table>
    ${gstBreakdown}
    <tr><td style="font-size:11px;padding:2px 0;font-weight:bold;">Total GST</td>
      <td style="font-size:11px;padding:2px 0;text-align:right;font-weight:bold;">Rs ${totalGst.toFixed(2)}</td>
    </tr>
  </table>
  <hr class="sep"/>

  <div class="row2 bold"><span>GRAND TOTAL:</span><span>Rs ${grandTotal.toFixed(2)}</span></div>
  <hr class="dsep"/>

  <p class="b">PAYMENT:</p>
  <p class="sm">Method: ${payMethod}</p>
  <p class="sm">Status: ${(order.paymentStatus || 'PENDING').toUpperCase()}</p>
  ${order.secretCode ? `<p class="sm">Secret Code: ${order.secretCode}</p>` : ''}
  <hr class="sep"/>

  <p class="sm">${supplyLine}</p>
  <hr class="dsep"/>

  <p class="c sm">Computer generated invoice.</p>
  <p class="c sm">No signature required.</p>
  <p class="c sm" style="margin-top:4px;">Thank you for shopping with ${COMPANY_NAME}!</p>

<script>window.onload = function(){ window.print(); }</script>
</body>
</html>`;

        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
            accepted: { color: 'bg-blue-100 text-blue-800', label: 'Accepted' },
            'picked-up': { color: 'bg-purple-100 text-purple-800', label: 'Picked Up' },
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
            refunded: { color: 'bg-gray-100 text-gray-800', label: 'Refunded' }
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
        { value: 'accepted', label: 'Accepted' },
        { value: 'picked-up', label: 'Picked Up' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' }
    ];

    const updateStatusOptions = [
        { value: 'accepted', label: 'Accept' },
        { value: 'picked-up', label: 'Pick Up' },
        { value: 'delivered', label: 'Deliver' },
        { value: 'cancelled', label: 'Cancel' }
    ];

    return (
        <div className="bg-gray-100 dark:bg-gray-900 w-full min-h-screen">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div className="flex items-center mb-4 sm:mb-0">
                        <FiPackage className="w-6 h-6 text-blue-600 mr-2" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
                        <span className="ml-3 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                            {totalOrders} orders
                        </span>
                    </div>
                    <button
                        onClick={downloadCSV}
                        style={{ backgroundColor: "#000000" }}
                        className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors hover:opacity-90"
                        title="Download CSV"
                    >
                        <FiDownload className="w-4 h-4" />
                        Download CSV
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="mb-6 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
                            style={{ backgroundColor: "#000000" }}
                            className="px-4 py-2 text-white rounded-lg transition-colors hover:opacity-90"
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
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
                    <div>
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Order & Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Seller
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Driver
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
                                        <td colSpan={9} className="text-center py-8">
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                                <span className="ml-2 text-gray-500 dark:text-gray-400">Loading orders...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center py-8">
                                            <div className="flex flex-col items-center">
                                                <FiPackage className="w-12 h-12 text-gray-400 mb-2" />
                                                <span className="text-gray-500 dark:text-gray-400">No orders found.</span>
                                                {(search || statusFilter !== 'all') && (
                                                    <button
                                                        onClick={() => {
                                                            setSearch("");
                                                            setStatusFilter("all");
                                                            setCurrentPage(1);
                                                        }}
                                                        style={{ backgroundColor: "#000000" }}
                                                        className="mt-2 text-white px-3 py-1 rounded text-sm hover:opacity-90"
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
                                            {/* Order & Customer */}
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
                                            
                                            {/* Seller */}
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {order.seller?.businessName || order.seller?.name || 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {order.seller?.email}
                                                </div>
                                            </td>
                                            
                                            {/* Driver */}
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {order.driver?.personalInfo?.name || 'Not Assigned'}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {order.driver?.personalInfo?.phone}
                                                </div>
                                                {order.driver?.workInfo?.availability && (
                                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                                                        order.driver.workInfo.availability === 'online' 
                                                            ? 'bg-green-100 text-green-800'
                                                            : order.driver.workInfo.availability === 'on-delivery'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {order.driver.workInfo.availability}
                                                    </span>
                                                )}
                                            </td>
                                            
                                            {/* Items */}
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                                    {order.items?.map(item => item.product?.name).join(', ')}
                                                </div>
                                            </td>
                                            
                                            {/* Total */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {formatCurrency(order.total)}
                                                </div>
                                            </td>
                                            
                                            {/* Status */}
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
                                                                ))}
                                                        </select>
                                                    )}
                                                </div>
                                            </td>
                                            
                                            {/* Payment */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col gap-1">
                                                    {getPaymentStatusBadge(order.paymentStatus)}
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                                        {order.paymentMethod}
                                                    </div>
                                                </div>
                                            </td>
                                            
                                            {/* Date */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {formatDate(order.createdAt)}
                                                </div>
                                            </td>
                                            
                                            {/* Actions */}
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => openOrderDetails(order)}
                                                        style={{ color: "#10b981", padding: "4px", borderRadius: "4px" }}
                                                        className="hover:text-green-700"
                                                        title="View Order Details"
                                                    >
                                                        <FiEye style={{ width: "16px", height: "16px" }} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadInvoice(order._id)}
                                                        style={{ color: "#3b82f6", padding: "4px", borderRadius: "4px" }}
                                                        className="hover:text-blue-700"
                                                        title="Download Invoice PDF"
                                                    >
                                                        <FiFileText style={{ width: "16px", height: "16px" }} />
                                                    </button>
                                                    <button
                                                        onClick={() => handlePrintInvoice(order)}
                                                        style={{ color: "#f59e0b", padding: "4px", borderRadius: "4px" }}
                                                        className="hover:text-yellow-600"
                                                        title="Print Invoice"
                                                    >
                                                        <FiPrinter style={{ width: "16px", height: "16px" }} />
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
                                style={{ backgroundColor: "#000000" }}
                                className="px-3 py-2 text-sm text-white rounded-lg transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                        style={{ 
                                            backgroundColor: currentPage === pageNum ? "#000000" : "#e5e7eb",
                                            color: currentPage === pageNum ? "#ffffff" : "#374151"
                                        }}
                                        className="px-3 py-2 text-sm rounded-lg transition-colors hover:opacity-90"
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                style={{ backgroundColor: "#000000" }}
                                className="px-3 py-2 text-sm text-white rounded-lg transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Order Details Modal - Keeping the same as before, just with Fi icons */}
                {showModal && selectedOrder && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Order Details - #{selectedOrder.orderId}
                                </h2>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <FiX className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Order Summary */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-lg font-medium mb-4">Customer Information</h3>
                                        <div className="space-y-2">
                                            <p><strong>Name:</strong> {selectedOrder.user?.name}</p>
                                            <p><strong>Email:</strong> {selectedOrder.user?.email}</p>
                                            <p><strong>Phone:</strong> {selectedOrder.user?.phone}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium mb-4">Order Information</h3>
                                        <div className="space-y-2">
                                            <p><strong>Order Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
                                            <p><strong>Status:</strong> {getStatusBadge(selectedOrder.status)}</p>
                                            <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod?.toUpperCase()}</p>
                                            <p><strong>Payment Status:</strong> {getPaymentStatusBadge(selectedOrder.paymentStatus)}</p>
                                            <p><strong>Total Amount:</strong> {formatCurrency(selectedOrder.total)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Seller Details */}
                                {selectedOrder.seller && (
                                    <div>
                                        <h3 className="text-lg font-medium mb-4">Seller Information</h3>
                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-sm text-gray-600">Business Name</p>
                                                    <p className="font-medium">{selectedOrder.seller.businessName || selectedOrder.seller.name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Email</p>
                                                    <p className="font-medium">{selectedOrder.seller.email}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Phone</p>
                                                    <p className="font-medium">{selectedOrder.seller.phone}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">GST Number</p>
                                                    <p className="font-medium">{selectedOrder.seller.gstNumber || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">PAN Number</p>
                                                    <p className="font-medium">{selectedOrder.seller.panNumber || 'N/A'}</p>
                                                </div>
                                            </div>
                                            {selectedOrder.seller.address && (
                                                <div className="mt-3">
                                                    <p className="text-sm text-gray-600">Address</p>
                                                    <p className="font-medium">
                                                        {selectedOrder.seller.address.street}, {selectedOrder.seller.address.city}, 
                                                        {selectedOrder.seller.address.state} - {selectedOrder.seller.address.pincode}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Promotor Details */}
                                {selectedOrder.seller?.promotor && (
                                    <div>
                                        <h3 className="text-lg font-medium mb-4">Promotor Information</h3>
                                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-sm text-gray-600">Name</p>
                                                    <p className="font-medium">{selectedOrder.seller.promotor.name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Email</p>
                                                    <p className="font-medium">{selectedOrder.seller.promotor.email}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Phone</p>
                                                    <p className="font-medium">{selectedOrder.seller.promotor.phone}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Commission Rate</p>
                                                    <p className="font-medium">{selectedOrder.seller.promotor.commissionRate}%</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Total Commission Earned</p>
                                                    <p className="font-medium">{formatCurrency(selectedOrder.seller.promotor.totalCommissionEarned || 0)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Driver Information */}
                                {selectedOrder.driver && (
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <FiTruck className="w-5 h-5" />
                                            Driver Information
                                        </h3>
                                        
                                        {/* Personal Information */}
                                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-4">
                                            <h4 className="font-medium text-green-800 dark:text-green-300 mb-3">Personal Information</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Full Name</p>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {selectedOrder.driver.personalInfo?.name || 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {selectedOrder.driver.personalInfo?.email || 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {selectedOrder.driver.personalInfo?.phone || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Payout Summary */}
                                {selectedOrder.payout && (
                                    <div>
                                        <h3 className="text-lg font-medium mb-4">Payout Summary</h3>
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-sm text-gray-600">Seller Payable Amount</p>
                                                    <p className="font-medium">{formatCurrency(selectedOrder.payout.seller?.payableAmount || 0)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">GST Deduction</p>
                                                    <p className="font-medium">{formatCurrency(selectedOrder.payout.seller?.gstDeduction || 0)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">TDS Deduction</p>
                                                    <p className="font-medium">{formatCurrency(selectedOrder.payout.seller?.tdsDeduction || 0)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Net Amount to Seller</p>
                                                    <p className="font-semibold text-green-600">{formatCurrency(selectedOrder.payout.seller?.netAmount || 0)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Promotor Commission */}
                                {selectedOrder.payout?.promotor && (
                                    <div>
                                        <h3 className="text-lg font-medium mb-4">Promotor Commission</h3>
                                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-sm text-gray-600">Commission Amount</p>
                                                    <p className="font-semibold text-purple-600">{formatCurrency(selectedOrder.payout.promotor.commissionAmount)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Commission Rate</p>
                                                    <p className="font-medium">{selectedOrder.payout.promotor.commissionRate}%</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Payout Status</p>
                                                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                                        selectedOrder.payout.promotor.payoutStatus === 'paid'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {selectedOrder.payout.promotor.payoutStatus}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Shipping Address */}
                                {selectedOrder.shippingAddress && (
                                    <div>
                                        <h3 className="text-lg font-medium mb-4">Shipping Address</h3>
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
                                    <h3 className="text-lg font-medium mb-4">Order Items</h3>
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
                                                        <h4 className="font-medium">{item.product?.name}</h4>
                                                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                                                        {item.gstPercent > 0 && (
                                                            <p className="text-xs text-gray-500">GST: {item.gstPercent}%</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium">{formatCurrency(item.price)}</p>
                                                    <p className="text-sm text-gray-500">Total: {formatCurrency(item.price * item.quantity)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Prescription Image */}
                                {selectedOrder.prescriptionImage?.url && (
                                    <div>
                                        <h3 className="text-lg font-medium mb-4">Prescription</h3>
                                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                            <img 
                                                src={selectedOrder.prescriptionImage.url} 
                                                alt="Prescription" 
                                                className="max-h-96 mx-auto rounded-lg cursor-pointer"
                                                onClick={() => window.open(selectedOrder.prescriptionImage.url, '_blank')}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Order Total Actions */}
                                <div className="border-t pt-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-lg font-bold">Total Amount:</span>
                                        <span className="text-lg font-bold">{formatCurrency(selectedOrder.total)}</span>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleDownloadInvoice(selectedOrder._id)}
                                            style={{ backgroundColor: "#000000" }}
                                            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90"
                                        >
                                            <FiFileText className="w-4 h-4" />
                                            Download Invoice
                                        </button>
                                        <button
                                            onClick={() => handlePrintInvoice(selectedOrder)}
                                            style={{ backgroundColor: "#000000" }}
                                            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90"
                                        >
                                            <FiPrinter className="w-4 h-4" />
                                            Print Invoice
                                        </button>
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