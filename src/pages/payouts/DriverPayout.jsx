import { useState, useEffect } from 'react';
import { FiDollarSign, FiUsers, FiRefreshCw, FiEye, FiX, FiCheck, FiPackage, FiToggleLeft, FiToggleRight, FiTruck } from 'react-icons/fi';

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
  const [aggregatedView, setAggregatedView] = useState(true); 

  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

  useEffect(() => {
    fetchPayoutSummary();
    fetchDriverPayouts();
  }, []);

  useEffect(() => {
    fetchDriverPayouts();
  }, [aggregatedView]);

  const fetchPayoutSummary = async () => {
    try {
      const response = await fetch('https://api.fast2.in/api/payout/summary', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch payout summary');
      const result = await response.json();
      
      setSummary(result);
    } catch (error) {
      console.error('Error fetching payout summary:', error);
    }
  };

  const fetchDriverPayouts = async () => {
    try {
      setRefreshing(true);
      
      const viewParam = aggregatedView ? '?view=aggregated' : '';
      const response = await fetch(`https://api.fast2.in/api/payout/driver-payouts${viewParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch driver payouts');
      const result = await response.json();
      
      if (result.payouts) {
        if (aggregatedView) {
          const transformedPayouts = result.payouts.map(payout => ({
            driverId: payout._id || payout.driverId,
            driverName: payout.driverName || 'Driver',
            driverEmail: payout.driverEmail || '',
            driverPhone: payout.driverPhone || '',
            vehicleNumber: payout.vehicleNumber || '',
            totalOrders: payout.totalOrders || 0,
            pendingOrders: payout.pendingOrders || 0,
            paidOrders: payout.paidOrders || 0,
            totalAmount: payout.totalAmount || 0,
            pendingAmount: payout.pendingAmount || 0,
            paidAmount: payout.paidAmount || 0,
            status: (payout.pendingOrders || 0) > 0 ? 'pending' : 'paid',
            _id: payout._id,
            batchId: `AGG-${payout._id}`,
            createdAt: new Date().toISOString()
          }));
          setPayouts(transformedPayouts);
        } else {
          const transformedPayouts = result.payouts.map(payout => ({
            driverId: payout.driver?._id || payout.driver,
            driverName: payout.driver?.name || 'Driver',
            driverEmail: payout.driver?.email || '',
            driverPhone: payout.driver?.phone || '',
            batchId: payout.batchId || 'N/A',
            totalAmount: payout.totalAmount || 0,
            numberOfOrders: payout.numberOfOrders || 0,
            status: payout.status || 'pending',
            payoutMethod: payout.payoutMethod || 'cash',
            transactionId: payout.transactionId || '',
            paidAt: payout.paidAt,
            createdAt: payout.createdAt,
            notes: payout.notes || '',
            _id: payout._id
          }));
          setPayouts(transformedPayouts);
        }
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
      
      const response = await fetch(`https://api.fast2.in/api/payout/driver/${driverId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch driver details');
      const result = await response.json();
      
      if (result.earnings) {
        const earningsWithDetails = result.earnings.map(earning => ({
          _id: earning._id,
          orderId: earning.order?.orderId || earning.order,
          amount: earning.amount || 0,
          type: earning.type || 'delivery',
          description: earning.description || '',
          status: earning.status || 'earned',
          transactionDate: earning.transactionDate,
          createdAt: earning.createdAt
        }));

        setDriverDetails({
          driver: result.driver,
          earnings: earningsWithDetails,
          totalPendingEarnings: earningsWithDetails
            .filter(e => e.status === 'earned')
            .reduce((sum, e) => sum + e.amount, 0),
          totalPaidEarnings: earningsWithDetails
            .filter(e => e.status === 'paid')
            .reduce((sum, e) => sum + e.amount, 0),
          totalEarnings: earningsWithDetails.reduce((sum, e) => sum + e.amount, 0),
          earningCount: earningsWithDetails.length,
          summary: result.summary || []
        });
      }
      setLoadingDetails(false);
    } catch (error) {
      console.error('Error fetching driver details:', error);
      setLoadingDetails(false);
      setDriverDetails(null);
    }
  };

  const handleViewDetails = (driver) => {
    if (!driver.driverId) {
      console.error('No driverId found:', driver);
      alert('Unable to fetch driver details: Missing driver ID');
      return;
    }
    
    setSelectedDriver(driver);
    setShowDetailsModal(true);
    fetchDriverDetails(driver.driverId);
  };

  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedDriver(null);
    setDriverDetails(null);
  };

  const handleMarkAsPaid = (driver) => {
    if (aggregatedView) {
      if (window.confirm(`Mark all pending earnings (${driver.pendingOrders} orders) for ${driver.driverName} as paid?`)) {
        setSelectedDriver(driver);
        setShowPaymentModal(true);
        setPaymentForm({
          paymentMethod: 'bank_transfer',
          transactionId: '',
          notes: `Bulk payment for ${driver.pendingOrders} orders totaling ₹${driver.pendingAmount}`,
          driverId: driver.driverId
        });
      }
    } else {
      setSelectedDriver(driver);
      setShowPaymentModal(true);
      setPaymentForm({
        paymentMethod: 'bank_transfer',
        transactionId: '',
        notes: '',
        payoutId: driver._id
      });
    }
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

  const handlePaymentFormChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitPayment = async () => {
    if (!selectedDriver) return;

    try {
      setSubmittingPayment(true);

      if (aggregatedView) {
        const response = await fetch(`https://api.fast2.in/api/payout/bulk-driver-payout/${selectedDriver.driverId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'paid',
            paymentMethod: paymentForm.paymentMethod,
            transactionId: paymentForm.transactionId,
            remarks: paymentForm.notes
          })
        });

        if (!response.ok) throw new Error('Failed to process bulk payment');
        const result = await response.json();

        if (result.success) {
          alert(`Successfully marked ${result.processedCount || 'all'} pending earnings as paid!`);
          closePaymentModal();
          fetchDriverPayouts();
          fetchPayoutSummary();
        } else {
          throw new Error(result.error || 'Failed to process bulk payment');
        }
      } else {
        const response = await fetch(`https://api.fast2.in/api/payout/driver-payouts/${selectedDriver._id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'paid',
            paymentMethod: paymentForm.paymentMethod,
            transactionId: paymentForm.transactionId,
            remarks: paymentForm.notes
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
      }

    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Error processing payment. Please try again.');
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
      day: 'numeric'
    });
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

  const totalPendingPayout = aggregatedView 
    ? payouts.reduce((sum, p) => sum + (p.pendingAmount || 0), 0)
    : payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.totalAmount, 0);
    
  const totalPaidPayout = aggregatedView
    ? payouts.reduce((sum, p) => sum + (p.paidAmount || 0), 0)
    : payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.totalAmount, 0);
    
  const totalPayoutAmount = payouts.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Driver Payouts</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {aggregatedView ? 'Showing total payout per driver' : 'Showing per-batch payouts'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Aggregated View</span>
              <button
                onClick={() => setAggregatedView(!aggregatedView)}
                className="flex items-center"
              >
                {aggregatedView ? (
                  <FiToggleRight className="w-8 h-8" style={{ color: '#9333ea' }} />
                ) : (
                  <FiToggleLeft className="w-8 h-8 text-gray-400" />
                )}
              </button>
            </div>
            <button
              onClick={() => {
                fetchDriverPayouts();
                fetchPayoutSummary();
              }}
              className="flex items-center text-white gap-2 px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#000000' }}
              disabled={refreshing}
            >
              <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(totalPendingPayout)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {aggregatedView 
                  ? `${payouts.filter(p => (p.pendingOrders || 0) > 0).length} drivers with pending payouts`
                  : `${payouts.filter(p => p.status === 'pending').length} pending batches`
                }
              </p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(147, 51, 234, 0.1)' }}>
              <FiDollarSign className="w-6 h-6" style={{ color: '#9333ea' }} />
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Payouts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(totalPayoutAmount)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                All driver earnings
              </p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
              <FiTruck className="w-6 h-6" style={{ color: '#3b82f6' }} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {aggregatedView ? 'Total Drivers' : 'All Payouts'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {payouts.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {aggregatedView ? 'Active drivers' : 'Total payout batches'}
              </p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)' }}>
              <FiUsers className="w-6 h-6" style={{ color: '#eab308' }} />
            </div>
          </div>
        </div>
      </div>

      {summary && (
        <div className="mb-6 p-4 rounded-lg border" style={{ backgroundColor: 'rgba(237, 233, 254, 0.5)', borderColor: '#c4b5fd' }}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Platform Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Platform Fees</p>
              <p className="text-lg font-bold" style={{ color: '#3b82f6' }}>
                {formatCurrency(summary.platformEarnings?.serviceFee || 0)}
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">GST Collection</p>
              <p className="text-lg font-bold" style={{ color: '#10b981' }}>
                {formatCurrency(summary.platformEarnings?.gstCollection || 0)}
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Payouts</p>
              <p className="text-lg font-bold" style={{ color: '#8b5cf6' }}>
                {formatCurrency(summary.sellerPayouts?.totalAmount || 0)}
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {summary.sellerPayouts?.totalOrders || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {aggregatedView ? 'Driver Payout Summary' : 'Driver Payout Details'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {aggregatedView 
              ? `Showing ${payouts.length} drivers with payout records`
              : `Showing ${payouts.length} payout batches`
            }
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {aggregatedView ? (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Batch ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={aggregatedView ? "5" : "7"} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No payout records found
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {aggregatedView ? (
                      <>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {payout.driverName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {payout.driverPhone}
                            </div>
                            {payout.vehicleNumber && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Vehicle: {payout.vehicleNumber}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {payout.totalOrders || 0} orders
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {(payout.pendingOrders || 0)} pending
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold" style={{ color: '#9333ea' }}>
                            {formatCurrency(payout.totalAmount || 0)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Pending: {formatCurrency(payout.pendingAmount || 0)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            (payout.pendingOrders || 0) > 0 
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {(payout.pendingOrders || 0) > 0 ? 'Pending' : 'Paid'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetails(payout)}
                              className="p-2 rounded transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              style={{ color: '#3b82f6' }}
                              title="View Details"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            {(payout.pendingOrders || 0) > 0 && (
                              <button
                                onClick={() => handleMarkAsPaid(payout)}
                                className="p-2 rounded transition-colors hover:bg-green-50 dark:hover:bg-green-900/20"
                                style={{ color: '#10b981' }}
                                title="Mark All as Paid"
                              >
                                <FiCheck className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {payout.batchId}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {payout.driverName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {payout.driverPhone}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {payout.numberOfOrders || 0} orders
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold" style={{ color: payout.status === 'paid' ? '#10b981' : '#8b5cf6' }}>
                            {formatCurrency(payout.totalAmount || 0)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            @ ₹18 per order
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            payout.status === 'paid' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          }`}>
                            {payout.status ? payout.status.charAt(0).toUpperCase() + payout.status.slice(1) : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(payout.createdAt)}
                          </div>
                          {payout.paidAt && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Paid: {formatDate(payout.paidAt)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetails(payout)}
                              className="p-2 rounded transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              style={{ color: '#3b82f6' }}
                              title="View Details"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            {payout.status === 'pending' && (
                              <button
                                onClick={() => handleMarkAsPaid(payout)}
                                className="p-2 rounded transition-colors hover:bg-green-50 dark:hover:bg-green-900/20"
                                style={{ color: '#10b981' }}
                                title="Mark as Paid"
                              >
                                <FiCheck className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {aggregatedView ? 'Process Bulk Payout' : 'Process Payout'}
              </h2>
              <button
                onClick={closePaymentModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(147, 51, 234, 0.1)' }}>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {aggregatedView ? 'Processing Bulk Payout For' : 'Processing Payout For'}
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedDriver.driverName}
                </p>
                {aggregatedView ? (
                  <>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Orders: <span className="font-semibold">{selectedDriver.pendingOrders} pending orders</span>
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Total Amount: <span className="font-semibold" style={{ color: '#9333ea' }}>
                        {formatCurrency(selectedDriver.pendingAmount)}
                      </span>
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Amount: <span className="font-semibold" style={{ color: '#9333ea' }}>
                      {formatCurrency(selectedDriver.totalAmount)}
                    </span>
                  </p>
                )}
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
                  style={{ backgroundColor: '#10b981', color: 'white' }}
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
                      {aggregatedView ? 'Mark All as Paid' : 'Mark as Paid'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {selectedDriver.driverName} - Payout Details
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
                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(147, 51, 234, 0.1)' }}>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Pending Earnings</p>
                      <p className="text-xl font-bold" style={{ color: '#9333ea' }}>
                        {formatCurrency(driverDetails.totalPendingEarnings)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        @ ₹18 per delivered order
                      </p>
                    </div>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
                      <p className="text-xl font-bold" style={{ color: '#22c55e' }}>
                        {formatCurrency(driverDetails.totalPaidEarnings)}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {driverDetails.earningCount}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Delivered orders
                      </p>
                    </div>
                  </div>

                  {driverDetails.driver && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Driver Information</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {driverDetails.driver.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {driverDetails.driver.phone}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Vehicle</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {driverDetails.driver.vehicleNumber || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {driverDetails.earnings && driverDetails.earnings.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Earnings Details</h3>
                      <div className="space-y-3">
                        {driverDetails.earnings.map((earning) => (
                          <div key={earning._id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  Order {earning.orderId}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDate(earning.transactionDate || earning.createdAt)}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  earning.status === 'paid' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                }`}>
                                  {earning.status === 'paid' ? 'Paid' : 'Pending'}
                                </span>
                                <div className="text-right">
                                  <p className="text-sm font-semibold" style={{ color: '#9333ea' }}>
                                    ₹18.00
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {earning.type || 'delivery'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            {earning.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {earning.description}
                              </p>
                            )}
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
    </div>
  );
};

export default DriverPayouts;