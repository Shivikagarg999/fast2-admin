import { useState, useEffect } from 'react';
import { FiDollarSign, FiUsers, FiRefreshCw, FiEye, FiX, FiTrendingUp, FiCheck } from 'react-icons/fi';

const SellerPayouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [sellerDetails, setSellerDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: 'bank_transfer',
    paymentDate: new Date().toISOString().split('T')[0],
    transactionId: '',
    notes: ''
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  useEffect(() => {
    fetchSellerPayouts();
  }, []);

  const fetchSellerPayouts = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/payouts/sellers`
      );
      
      if (!response.ok) throw new Error('Failed to fetch seller payouts');
      const result = await response.json();
      
      if (result.success) {
        setPayouts(result.data.sellers);
      }
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching seller payouts:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSellerDetails = async (sellerId) => {
    try {
      setLoadingDetails(true);
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/payouts/seller/${sellerId}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch seller details');
      const result = await response.json();
      
      if (result.success) {
        setSellerDetails(result.data);
      }
      setLoadingDetails(false);
    } catch (error) {
      console.error('Error fetching seller details:', error);
      setLoadingDetails(false);
    }
  };

  const handleViewDetails = (seller) => {
    setSelectedSeller(seller);
    setShowDetailsModal(true);
    fetchSellerDetails(seller.sellerId);
  };

  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedSeller(null);
    setSellerDetails(null);
  };

  const handleMarkAsPaid = (seller) => {
    setSelectedSeller(seller);
    setShowPaymentModal(true);
    setPaymentForm({
      paymentMethod: 'bank_transfer',
      paymentDate: new Date().toISOString().split('T')[0],
      transactionId: '',
      notes: ''
    });
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedSeller(null);
    setPaymentForm({
      paymentMethod: 'bank_transfer',
      paymentDate: new Date().toISOString().split('T')[0],
      transactionId: '',
      notes: ''
    });
  };

  const handlePaymentFormChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitPayment = async () => {
    try {
      setSubmittingPayment(true);

      // First, create a payout record
      const createResponse = await fetch(
        `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/payouts/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipientType: 'seller',
            recipientId: selectedSeller.sellerId,
            amount: selectedSeller.totalPendingPayout,
            orderIds: selectedSeller.orders?.map(o => o.orderId) || [],
            bankDetails: selectedSeller.bankDetails
          })
        }
      );

      if (!createResponse.ok) throw new Error('Failed to create payout record');
      const createResult = await createResponse.json();

      // Then mark it as paid
      const markPaidResponse = await fetch(
        `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/payouts/records/${createResult.data._id}/mark-paid`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...paymentForm,
            adminId: localStorage.getItem('adminId') // Assuming admin ID is stored
          })
        }
      );

      if (!markPaidResponse.ok) throw new Error('Failed to mark payout as paid');

      alert('Payout marked as paid successfully!');
      closePaymentModal();
      fetchSellerPayouts(); // Refresh the list

    } catch (error) {
      console.error('Error submitting payment:', error);
      alert('Error processing payment. Please try again.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalPendingPayout = payouts.reduce((sum, p) => sum + p.totalPendingPayout, 0);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Seller Payouts</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage and track seller earnings and payouts
            </p>
          </div>
          <button
            onClick={fetchSellerPayouts}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            disabled={refreshing}
            style={{backgroundColor:"black"}}
          >
            <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(totalPendingPayout)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-full">
              <FiDollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Sellers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {payouts.length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-full">
              <FiUsers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Payout</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(payouts.length > 0 ? totalPendingPayout / payouts.length : 0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-full">
              <FiTrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Seller Payout Details</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Note: Platform fee (10%) is already deducted from seller earnings
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Seller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Business Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pending Payout
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No pending payouts found
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout.sellerId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {payout.sellerName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {payout.sellerId.slice(-8)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {payout.businessName}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">{payout.sellerEmail}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{payout.sellerPhone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {payout.orderCount}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                        {formatCurrency(payout.totalPendingPayout)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(payout)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded transition-colors"
                          title="View Details"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMarkAsPaid(payout)}
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 p-2 rounded transition-colors"
                          title="Mark as Paid"
                        >
                          <FiCheck className="w-4 h-4" />
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

      {/* Payment Modal */}
      {showPaymentModal && selectedSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Mark Payout as Paid
              </h2>
              <button
                onClick={closePaymentModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Payout Summary */}
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Payout Amount</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(selectedSeller.totalPendingPayout)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  To: {selectedSeller.sellerName} ({selectedSeller.businessName})
                </p>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Method *
                </label>
                <select
                  name="paymentMethod"
                  value={paymentForm.paymentMethod}
                  onChange={handlePaymentFormChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Date *
                </label>
                <input
                  type="date"
                  name="paymentDate"
                  value={paymentForm.paymentDate}
                  onChange={handlePaymentFormChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Transaction ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transaction ID / Reference Number
                </label>
                <input
                  type="text"
                  name="transactionId"
                  value={paymentForm.transactionId}
                  onChange={handlePaymentFormChange}
                  placeholder="Enter transaction ID"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={paymentForm.notes}
                  onChange={handlePaymentFormChange}
                  placeholder="Add any additional notes"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Bank Details */}
              {selectedSeller.bankDetails && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Bank Details</p>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <p>Holder: {selectedSeller.bankDetails.accountHolder}</p>
                    <p>Account: {selectedSeller.bankDetails.accountNumber}</p>
                    <p>IFSC: {selectedSeller.bankDetails.ifscCode}</p>
                    <p>Bank: {selectedSeller.bankDetails.bankName}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={closePaymentModal}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  disabled={submittingPayment}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitPayment}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={submittingPayment}
                  style={{backgroundColor:"green"}}
                >
                  {submittingPayment ? (
                    <>
                      <FiRefreshCw className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-4 h-4" />
                      Mark as Paid
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Payout Details - {selectedSeller.sellerName}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {loadingDetails ? (
                <div className="text-center py-8">
                  <FiRefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Loading details...</p>
                </div>
              ) : sellerDetails ? (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Payout</p>
                      <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        {formatCurrency(sellerDetails.totalPendingPayout)}
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {sellerDetails.orderCount}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Avg. per Order</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(sellerDetails.totalPendingPayout / sellerDetails.orderCount)}
                      </p>
                    </div>
                  </div>

                  {/* Bank Details */}
                  {sellerDetails.seller?.bankDetails && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">Bank Details</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Account Holder:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {sellerDetails.seller.bankDetails.accountHolder || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Account:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {sellerDetails.seller.bankDetails.accountNumber || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">IFSC:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {sellerDetails.seller.bankDetails.ifscCode || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Bank:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {sellerDetails.seller.bankDetails.bankName || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Orders List */}
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">Order Details</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {sellerDetails.orders?.map((order) => (
                        <div key={order.orderId} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Order #{order.orderId.toString().slice(-8)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(order.orderDate)} • {order.customerName}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                              {formatCurrency(order.totalPayout)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex justify-between">
                                <span>{item.productName} (x{item.quantity})</span>
                                <span className="text-purple-600 dark:text-purple-400">
                                  +{formatCurrency(item.sellerShare)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400">No details available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerPayouts;