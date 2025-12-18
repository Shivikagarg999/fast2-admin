import { useState, useEffect } from 'react';
import { FiDollarSign, FiUsers, FiRefreshCw, FiDownload, FiEye, FiX, FiCheck, FiEdit, FiPackage, FiTruck, FiNavigation, FiClock } from 'react-icons/fi';

const DriverPayouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [driverDetails, setDriverDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: 'bank_transfer',
    transactionId: '',
    notes: ''
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [summary, setSummary] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showBatchDetails, setShowBatchDetails] = useState(false);
  const [showCreatePayoutModal, setShowCreatePayoutModal] = useState(false);
  const [selectedDriverForPayout, setSelectedDriverForPayout] = useState(null);
  const [createPayoutForm, setCreatePayoutForm] = useState({
    driverId: '',
    payoutMethod: 'upi',
    notes: ''
  });

  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

  useEffect(() => {
    fetchPayoutSummary();
    fetchDriverPayouts();
  }, []);

  const fetchPayoutSummary = async () => {
    try {
      const response = await fetch('https://api.fast2.in/api/payouts/drivers/driver-payouts-summary', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch payout summary');
      const result = await response.json();
      
      if (result.success) {
        setSummary(result.data);
      }
    } catch (error) {
      console.error('Error fetching payout summary:', error);
    }
  };

  const fetchDriverPayouts = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('https://api.fast2.in/api/payouts/drivers/driver-payouts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch driver payouts');
      const result = await response.json();
      
      if (result.success) {
        setPayouts(result.data.payouts);
      }
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching driver payouts:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchDriverDetails = async (driverId) => {
    try {
      setLoadingDetails(true);
      const response = await fetch(`https://api.fast2.in/api/payouts/drivers/driver/${driverId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch driver details');
      const result = await response.json();
      
      if (result.success) {
        setDriverDetails(result.data);
      }
      setLoadingDetails(false);
    } catch (error) {
      console.error('Error fetching driver details:', error);
      setLoadingDetails(false);
    }
  };

  const fetchBatchDetails = async (payoutId) => {
    try {
      const response = await fetch(`https://api.fast2.in/api/payouts/drivers/driver-payouts/${payoutId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch batch details');
      const result = await response.json();
      
      if (result.success) {
        setSelectedBatch(result.data);
        setShowBatchDetails(true);
      }
    } catch (error) {
      console.error('Error fetching batch details:', error);
      alert('Failed to load batch details');
    }
  };

  const handleViewDetails = (driver) => {
    setSelectedDriver(driver);
    setShowDetailsModal(true);
    if (driver.driver && driver.driver._id) {
      fetchDriverDetails(driver.driver._id);
    }
  };

  const handleViewBatchDetails = (payout) => {
    fetchBatchDetails(payout._id);
  };

  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedDriver(null);
    setDriverDetails(null);
  };

  const closeBatchDetails = () => {
    setShowBatchDetails(false);
    setSelectedBatch(null);
  };

  const closeCreatePayoutModal = () => {
    setShowCreatePayoutModal(false);
    setSelectedDriverForPayout(null);
    setCreatePayoutForm({
      driverId: '',
      payoutMethod: 'upi',
      notes: ''
    });
  };

  const handleMarkAsPaid = (payout) => {
    setSelectedDriver(payout);
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedDriver(null);
    setPaymentForm({
      paymentMethod: 'bank_transfer',
      transactionId: '',
      notes: ''
    });
  };

  const handleCreatePayoutForDriver = (driver) => {
    setSelectedDriverForPayout(driver);
    setCreatePayoutForm({
      driverId: driver._id,
      payoutMethod: driver.payoutDetails?.preferredMethod || 'upi',
      notes: ''
    });
    setShowCreatePayoutModal(true);
  };

  const handlePaymentFormChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreatePayoutFormChange = (e) => {
    const { name, value } = e.target;
    setCreatePayoutForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitPayment = async () => {
    if (!selectedDriver) return;

    try {
      setSubmittingPayment(true);

      const response = await fetch(`https://api.fast2.in/api/payouts/drivers/driver-payouts/${selectedDriver._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'paid',
          paymentMethod: paymentForm.paymentMethod,
          transactionId: paymentForm.transactionId,
          notes: paymentForm.notes
        })
      });

      if (!response.ok) throw new Error('Failed to update payout status');
      const result = await response.json();

      if (result.success) {
        alert('Payout marked as paid successfully!');
        closePaymentModal();
        fetchDriverPayouts();
        fetchPayoutSummary();
      } else {
        throw new Error(result.error || 'Failed to process payment');
      }

    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Error processing payment. Please try again.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleCreatePayout = async () => {
    if (!selectedDriverForPayout) return;

    try {
      setSubmittingPayment(true);

      const response = await fetch('https://api.fast2.in/api/payouts/drivers/driver-payouts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(createPayoutForm)
      });

      if (!response.ok) throw new Error('Failed to create payout');
      const result = await response.json();

      if (result.success) {
        alert(result.message || 'Payout created successfully!');
        closeCreatePayoutModal();
        fetchDriverPayouts();
        fetchPayoutSummary();
      } else {
        throw new Error(result.error || 'Failed to create payout');
      }

    } catch (error) {
      console.error('Error creating payout:', error);
      alert('Error creating payout. Please try again.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return { backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' };
      case 'pending': return { backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308' };
      case 'processing': return { backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' };
      case 'failed': return { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' };
      default: return { backgroundColor: 'rgba(107, 114, 128, 0.1)', color: '#6b7280' };
    }
  };

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

  const totalPendingPayout = payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.totalAmount, 0);
  const totalPaidPayout = payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.totalAmount, 0);
  const totalAmount = payouts.reduce((sum, p) => sum + p.totalAmount, 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Driver Payouts</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage driver delivery earnings and payouts (₹18 per delivery)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchDriverPayouts();
                fetchPayoutSummary();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#000000' }}
              disabled={refreshing}
            >
              <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span style={{ color: '#ffffff' }}>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Payouts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(totalPendingPayout)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {payouts.filter(p => p.status === 'pending').length} batches
              </p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)' }}>
              <FiDollarSign className="w-6 h-6" style={{ color: '#eab308' }} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(totalPaidPayout)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Completed payouts
              </p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
              <FiDollarSign className="w-6 h-6" style={{ color: '#22c55e' }} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(totalAmount)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                All payout amounts
              </p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
              <FiDollarSign className="w-6 h-6" style={{ color: '#3b82f6' }} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Batches</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {payouts.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Payout records
              </p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)' }}>
              <FiUsers className="w-6 h-6" style={{ color: '#a855f7' }} />
            </div>
          </div>
        </div>
      </div>

      {summary && (
        <div className="mb-6 p-4 rounded-lg border" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: '#3b82f6' }}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Driver Payout Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Drivers</p>
              <p className="text-lg font-bold" style={{ color: '#3b82f6' }}>
                {summary.drivers?.totalDrivers || 0}
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Earnings</p>
              <p className="text-lg font-bold" style={{ color: '#eab308' }}>
                {formatCurrency(summary.drivers?.totalPending || 0)}
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
              <p className="text-lg font-bold" style={{ color: '#10b981' }}>
                {summary.payoutSummary?.totalOrders || 0}
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Batches</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {summary.payoutSummary?.totalPayouts || 0}
              </p>
            </div>
          </div>
          
          {summary.earningsSummary && summary.earningsSummary.length > 0 && (
            <div className="mt-4 pt-4 border-t border-blue-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Earnings Status</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {summary.earningsSummary.map((item) => (
                  <div key={item._id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                    <span className={`text-xs px-2 py-1 rounded-full`} style={getStatusColor(item._id)}>
                      {item._id === 'earned' ? 'Pending' : item._id === 'payout_paid' ? 'Paid' : item._id}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(item.totalAmount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Driver Payout Batches</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Showing {payouts.length} payout batches
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Batch ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Driver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No payout batches found
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {payout.batchId || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {payout.driver?.name || 'Driver'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {payout.driver?.phone || ''}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold" style={{ color: payout.status === 'paid' ? '#22c55e' : '#3b82f6' }}>
                        {formatCurrency(payout.totalAmount)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {payout.numberOfOrders} deliveries @ ₹18 each
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {payout.numberOfOrders}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full`} style={getStatusColor(payout.status)}>
                        {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                      </span>
                      {payout.paidAt && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Paid: {formatDate(payout.paidAt)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(payout.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewBatchDetails(payout)}
                          className="p-2 rounded transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          style={{ color: '#3b82f6' }}
                          title="View Batch Details"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        {payout.driver && (
                          <button
                            onClick={() => handleViewDetails(payout)}
                            className="p-2 rounded transition-colors hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            style={{ color: '#8b5cf6' }}
                            title="View Driver Details"
                          >
                            <FiUsers className="w-4 h-4" />
                          </button>
                        )}
                        {payout.status === 'pending' && (
                          <button
                            onClick={() => handleMarkAsPaid(payout)}
                            className="p-2 rounded transition-colors hover:bg-green-50 dark:hover:bg-green-900/20"
                            style={{ color: '#22c55e' }}
                            title="Mark as Paid"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPaymentModal && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Process Payout
              </h2>
              <button
                onClick={closePaymentModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                <p className="text-sm text-gray-600 dark:text-gray-400">Processing Payout For</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedDriver.driver?.name || 'Driver'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Batch: <span className="font-semibold">{selectedDriver.batchId}</span>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Amount: <span className="font-semibold" style={{ color: '#3b82f6' }}>
                    {formatCurrency(selectedDriver.totalAmount)}
                  </span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {selectedDriver.numberOfOrders} deliveries
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Method *
                </label>
                <select
                  name="paymentMethod"
                  value={paymentForm.paymentMethod}
                  onChange={handlePaymentFormChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="cash">Cash</option>
                  <option value="wallet">Wallet</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transaction ID / Reference
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
                  className="flex-1 px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#22c55e', color: 'white' }}
                  disabled={submittingPayment}
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

      {showDetailsModal && driverDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {driverDetails.driver?.name || 'Driver'} - Payout Details
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
                  <FiRefreshCw className="w-8 h-8 animate-spin mx-auto" style={{ color: '#3b82f6' }} />
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Loading details...</p>
                </div>
              ) : driverDetails ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)' }}>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Pending Payout</p>
                      <p className="text-xl font-bold" style={{ color: '#eab308' }}>
                        {formatCurrency(driverDetails.earnings?.pending || 0)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        From {driverDetails.earnings?.pendingOrders || 0} deliveries
                      </p>
                    </div>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</p>
                      <p className="text-xl font-bold" style={{ color: '#22c55e' }}>
                        {formatCurrency(driverDetails.driver?.earnings?.totalEarnings || 0)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Payouts</p>
                      <p className="text-xl font-bold" style={{ color: '#3b82f6' }}>
                        {formatCurrency(driverDetails.driver?.earnings?.totalPayouts || 0)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <FiTruck className="w-5 h-5" />
                        Driver Information
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Driver Name</p>
                          <p className="text-base font-medium text-gray-900 dark:text-white">
                            {driverDetails.driver?.name}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {driverDetails.driver?.phone}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {driverDetails.driver?.email}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Driver ID</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {driverDetails.driver?.workInfo?.driverId}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            driverDetails.driver?.workInfo?.status === 'approved' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {driverDetails.driver?.workInfo?.status?.charAt(0).toUpperCase() + driverDetails.driver?.workInfo?.status?.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <FiDollarSign className="w-5 h-5" />
                        Payout Information
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Preferred Method</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {driverDetails.driver?.payoutDetails?.preferredMethod?.toUpperCase() || 'Not Set'}
                          </p>
                        </div>
                        {driverDetails.driver?.payoutDetails?.upiId && (
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">UPI ID</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {driverDetails.driver.payoutDetails.upiId}
                            </p>
                          </div>
                        )}
                        {driverDetails.driver?.payoutDetails?.bankAccount?.accountNumber && (
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Bank Account</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {driverDetails.driver.payoutDetails.bankAccount.accountNumber}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {driverDetails.driver.payoutDetails.bankAccount.bankName}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Payout Threshold</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(driverDetails.driver?.payoutDetails?.payoutThreshold || 500)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {driverDetails.earnings?.details && driverDetails.earnings.details.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Pending Earnings Details</h3>
                      <div className="space-y-3">
                        {driverDetails.earnings.details.map((earning, index) => (
                          <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  Order {earning.orderId}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDate(earning.transactionDate)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold" style={{ color: '#3b82f6' }}>
                                  Earnings: {formatCurrency(earning.amount)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Delivery Fee
                                </p>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {earning.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400">No details available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showBatchDetails && selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Batch Details: {selectedBatch.batchId}
              </h2>
              <button
                onClick={closeBatchDetails}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                  <p className="text-xl font-bold" style={{ color: '#3b82f6' }}>
                    {formatCurrency(selectedBatch.totalAmount)}
                  </p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Number of Orders</p>
                  <p className="text-xl font-bold" style={{ color: '#22c55e' }}>
                    {selectedBatch.numberOfOrders}
                  </p>
                </div>
                <div className="p-4 rounded-lg" style={getStatusColor(selectedBatch.status)}>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <p className="text-xl font-bold" style={{ color: getStatusColor(selectedBatch.status).color }}>
                    {selectedBatch.status.charAt(0).toUpperCase() + selectedBatch.status.slice(1)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Driver Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedBatch.driver?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedBatch.driver?.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedBatch.driver?.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Payment Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Payment Method</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedBatch.payoutMethod?.toUpperCase()}
                      </p>
                    </div>
                    {selectedBatch.transactionId && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Transaction ID</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedBatch.transactionId}
                        </p>
                      </div>
                    )}
                    {selectedBatch.paidAt && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Paid Date</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(selectedBatch.paidAt)}
                        </p>
                      </div>
                    )}
                    {selectedBatch.notes && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Notes</p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedBatch.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedBatch.earnings && selectedBatch.earnings.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Earnings in this Batch</h3>
                  <div className="space-y-3">
                    {selectedBatch.earnings.map((earning, index) => (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Order {earning.orderId}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(earning.transactionDate)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold" style={{ color: '#3b82f6' }}>
                              {formatCurrency(earning.amount)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Delivery Fee
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {earning.description}
                        </div>
                        {earning.customerAddress && (
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Delivered to: {earning.customerAddress.addressLine}, {earning.customerAddress.city}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverPayouts;