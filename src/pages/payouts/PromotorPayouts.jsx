import { useState, useEffect } from 'react';
import { FiDollarSign, FiUsers, FiRefreshCw, FiDownload, FiEye, FiX, FiCheck, FiEdit, FiPackage, FiToggleLeft, FiToggleRight } from 'react-icons/fi';

const PromotorPayouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPromotor, setSelectedPromotor] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [promotorDetails, setPromotorDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: 'bank_transfer',
    transactionId: '',
    notes: ''
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [summary, setSummary] = useState(null);
  const [aggregatedView, setAggregatedView] = useState(true); // Toggle for aggregated view

  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

  useEffect(() => {
    fetchPayoutSummary();
    fetchPromotorPayouts();
  }, []);

  useEffect(() => {
    fetchPromotorPayouts();
  }, [aggregatedView]);

  const fetchPayoutSummary = async () => {
    try {
      const response = await fetch(
        'https://api.fast2.in/api/payout/summary',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch payout summary');
      const result = await response.json();
      
      setSummary(result);
    } catch (error) {
      console.error('Error fetching payout summary:', error);
    }
  };

  const fetchPromotorPayouts = async () => {
    try {
      setRefreshing(true);
      const viewParam = aggregatedView ? '?view=aggregated' : '';
      const response = await fetch(`https://api.fast2.in/api/payout/promotor-payouts${viewParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch promotor payouts');
      const result = await response.json();
      
      if (result.payouts) {
        if (aggregatedView) {
          const transformedPayouts = result.payouts.map(payout => ({
            promotorId: payout._id || payout.promotorId,
            promotorName: payout.promotorName || 'Promotor',
            promotorEmail: payout.promotorEmail || '',
            promotorPhone: payout.promotorPhone || '',
            bankDetails: payout.bankDetails || {},
            totalOrders: payout.totalOrders || 0,
            pendingOrders: payout.pendingOrders || 0,
            paidOrders: payout.paidOrders || 0,
            commissionAmount: payout.totalCommissionAmount || 0,
            pendingAmount: payout.pendingAmount || 0,
            paidAmount: payout.paidAmount || 0,
            lastUpdated: payout.lastUpdated,
            earliestPayout: payout.earliestPayout,
            latestPayout: payout.latestPayout,
            status: (payout.pendingOrders || 0) > 0 ? 'pending' : 'paid',
            _id: payout._id,
            orderId: `AGG-${payout._id}`,
            createdAt: payout.earliestPayout || new Date().toISOString()
          }));
          setPayouts(transformedPayouts);
        } else {
          const transformedPayouts = result.payouts.map(payout => ({
            promotorId: payout.promotor?._id || payout.promotor,
            promotorName: payout.promotor?.name || 'Promotor',
            promotorEmail: payout.promotor?.email || '',
            promotorPhone: payout.promotor?.phone || '',
            commissionAmount: payout.commissionAmount || 0,
            status: payout.status || 'pending',
            createdAt: payout.createdAt,
            paidAt: payout.paidAt,
            paymentMethod: payout.paymentMethod,
            transactionId: payout.transactionId,
            remarks: payout.remarks,
            _id: payout._id
          }));
          setPayouts(transformedPayouts);
        }
      }
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching promotor payouts:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPromotorDetails = async (promotorId) => {
    try {
      setLoadingDetails(true);
      const response = await fetch(`https://api.fast2.in/api/payout/promotor/${promotorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch promotor details');
      const result = await response.json();
      
      if (result.payouts) {
        const ordersWithDetails = result.payouts.map(payout => ({
          orderId: payout.order?.orderId || payout.order,
          orderDate: payout.createdAt,
          totalCommission: payout.commissionAmount || 0,
          status: payout.status || 'pending',
          paidAt: payout.paidAt,
          paymentMethod: payout.paymentMethod,
          transactionId: payout.transactionId,
          remarks: payout.remarks
        }));

        setPromotorDetails({
          promotor: result.promotor,
          orders: ordersWithDetails,
          totalPendingPayout: ordersWithDetails
            .filter(o => o.status === 'pending')
            .reduce((sum, o) => sum + o.totalCommission, 0),
          totalPaidPayout: ordersWithDetails
            .filter(o => o.status === 'paid')
            .reduce((sum, o) => sum + o.totalCommission, 0),
          orderCount: ordersWithDetails.length,
          summary: result.summary || []
        });
      }
      setLoadingDetails(false);
    } catch (error) {
      console.error('Error fetching promotor details:', error);
      setLoadingDetails(false);
    }
  };

  const handleViewDetails = (promotor) => {
    if (!promotor.promotorId) {
      console.error('No promotorId found in payout:', promotor);
      alert('Unable to fetch promotor details: Missing promotor ID');
      return;
    }
    
    setSelectedPromotor(promotor);
    setShowDetailsModal(true);
    fetchPromotorDetails(promotor.promotorId);
  };

  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedPromotor(null);
    setPromotorDetails(null);
  };

  const handleMarkAsPaid = (promotor) => {
    if (aggregatedView) {
      // For aggregated view, ask for confirmation since it will mark ALL pending payouts
      if (window.confirm(`Mark all ${promotor.pendingOrders} pending orders for ${promotor.promotorName} as paid?`)) {
        setSelectedPromotor(promotor);
        setShowPaymentModal(true);
        setPaymentForm({
          paymentMethod: 'bank_transfer',
          transactionId: '',
          notes: `Bulk payment for ${promotor.pendingOrders} orders totaling ${formatCurrency(promotor.pendingAmount)}`,
          promotorId: promotor.promotorId
        });
      }
    } else {
      // Original per-order payment
      setSelectedPromotor(promotor);
      setShowPaymentModal(true);
      setPaymentForm({
        paymentMethod: 'bank_transfer',
        transactionId: '',
        notes: '',
        payoutId: promotor._id
      });
    }
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPromotor(null);
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
    if (!selectedPromotor) return;

    try {
      setSubmittingPayment(true);

      if (aggregatedView) {
        // Bulk payment for all pending orders of this promotor
        const response = await fetch(`https://api.fast2.in/api/payout/bulk-promotor-payout/${selectedPromotor.promotorId}`, {
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
          alert(`Successfully marked ${result.processedCount || 'all'} pending payouts as paid!`);
          closePaymentModal();
          fetchPromotorPayouts();
          fetchPayoutSummary();
        } else {
          throw new Error(result.error || 'Failed to process bulk payment');
        }
      } else {
        // Original single payout payment
        const response = await fetch(`https://api.fast2.in/api/payout/promotor-payouts/${selectedPromotor._id}/status`, {
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

        if (result) {
          alert('Payout marked as paid successfully!');
          closePaymentModal();
          fetchPromotorPayouts();
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
    : payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.commissionAmount, 0);
    
  const totalPaidPayout = aggregatedView
    ? payouts.reduce((sum, p) => sum + (p.paidAmount || 0), 0)
    : payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.commissionAmount, 0);
    
  const totalCommission = payouts.reduce((sum, p) => sum + (p.commissionAmount || 0), 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Promotor Payouts</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {aggregatedView ? 'Showing total payout per promotor' : 'Showing per-order payouts'}
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
                fetchPromotorPayouts();
                fetchPayoutSummary();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              style={{backgroundColor: "black"}}
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
                  ? `${payouts.filter(p => (p.pendingOrders || 0) > 0).length} promotors with pending payouts`
                  : `${payouts.filter(p => p.status === 'pending').length} pending payouts`
                }
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded-full">
              <FiDollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
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
            <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-full">
              <FiDollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Commission</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(totalCommission)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                All commission
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
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {aggregatedView ? 'Total Promotors' : 'All Payouts'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {payouts.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {aggregatedView ? 'Active promotors' : 'Total payout records'}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-full">
              <FiUsers className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {summary && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-blue-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Platform Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Platform Fees</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(summary.platformEarnings?.serviceFee || 0)}
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">GST Collection</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatCurrency(summary.platformEarnings?.gstCollection || 0)}
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Payouts</p>
              <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
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
            {aggregatedView ? 'Promotor Payout Summary' : 'Promotor Payout Details'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {aggregatedView 
              ? `Showing ${payouts.length} promotors with payout records`
              : `Showing ${payouts.length} payout records`
            }
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {aggregatedView ? (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Promotor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Commission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Promotor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Commission Amount</th>
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
                  <td colSpan={aggregatedView ? "6" : "6"} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
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
                              {payout.promotorName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {payout.promotorEmail}
                            </div>
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
                            {formatCurrency(payout.commissionAmount || 0)}
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
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(payout.earliestPayout)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            to {formatDate(payout.latestPayout)}
                          </div>
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
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {payout.promotorName}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">{payout.promotorEmail}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{payout.promotorPhone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold" style={{ color: payout.status === 'paid' ? '#10b981' : '#8b5cf6' }}>
                            {formatCurrency(payout.commissionAmount)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            payout.status === 'paid' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : payout.status === 'processing'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          }`}>
                            {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
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

      {/* Modals remain mostly the same, just update the aggregated view parts */}
      {showPaymentModal && selectedPromotor && (
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
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {aggregatedView ? 'Processing Bulk Payout For' : 'Processing Payout For'}
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedPromotor.promotorName}
                </p>
                {aggregatedView ? (
                  <>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Orders: <span className="font-semibold">{selectedPromotor.pendingOrders} pending orders</span>
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Total Amount: <span className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(selectedPromotor.pendingAmount)}
                      </span>
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Amount: <span className="font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(selectedPromotor.commissionAmount)}
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
                  <option value="cheque">Cheque</option>
                  <option value="cash">Cash</option>
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
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

      {showDetailsModal && selectedPromotor && promotorDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {promotorDetails.promotor?.name || selectedPromotor.promotorName} - Payout Details
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
              ) : promotorDetails ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Pending Payout</p>
                      <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                        {formatCurrency(promotorDetails.totalPendingPayout)}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(promotorDetails.totalPaidPayout)}
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {promotorDetails.orderCount}
                      </p>
                    </div>
                  </div>

                  {promotorDetails.promotor && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Promotor Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {promotorDetails.promotor.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {promotorDetails.promotor.email}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {promotorDetails.promotor.phone}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Commission Rate</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {promotorDetails.promotor.commissionRate || 'N/A'}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {promotorDetails.orders && promotorDetails.orders.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Payout Details</h3>
                      <div className="space-y-3">
                        {promotorDetails.orders.map((order) => (
                          <div key={order.orderId} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  Order {order.orderId}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDate(order.orderDate)}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  order.status === 'paid' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                }`}>
                                  {order.status === 'paid' ? 'Paid' : 'Pending'}
                                </span>
                                <div className="text-right">
                                  <p className="text-sm font-semibold" style={{ color: '#9333ea' }}>
                                    Commission: {formatCurrency(order.totalCommission)}
                                  </p>
                                </div>
                                {order.paidAt && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Paid: {formatDate(order.paidAt)}
                                  </p>
                                )}
                              </div>
                            </div>
                            {order.paymentMethod && (
                              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                <div className="flex justify-between">
                                  <span>Payment Method:</span>
                                  <span>{order.paymentMethod}</span>
                                </div>
                                {order.transactionId && (
                                  <div className="flex justify-between">
                                    <span>Transaction ID:</span>
                                    <span>{order.transactionId}</span>
                                  </div>
                                )}
                                {order.remarks && (
                                  <div className="flex justify-between">
                                    <span>Remarks:</span>
                                    <span>{order.remarks}</span>
                                  </div>
                                )}
                              </div>
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

export default PromotorPayouts;