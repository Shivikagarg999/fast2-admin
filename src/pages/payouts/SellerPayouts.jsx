import { useState, useEffect } from 'react';
import { FiDollarSign, FiUsers, FiRefreshCw, FiEye, FiX, FiTrendingUp, FiCheck, FiPackage, FiCreditCard, FiToggleLeft, FiToggleRight } from 'react-icons/fi';

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
    transactionId: '',
    notes: ''
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [summary, setSummary] = useState(null);
  const [aggregatedView, setAggregatedView] = useState(true);

  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

  useEffect(() => {
    fetchPayoutSummary();
    fetchSellerPayouts();
  }, []);

  useEffect(() => {
    fetchSellerPayouts();
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

  const fetchSellerPayouts = async () => {
    try {
      setRefreshing(true);
      
      const viewParam = aggregatedView ? '?view=aggregated' : '';
      const response = await fetch(`https://api.fast2.in/api/payout/seller-payouts${viewParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch seller payouts');
      const result = await response.json();
      
      console.log('API Response:', result); // Debug log to see structure
      
      if (result.payouts) {
        if (aggregatedView) {
          // Simplified transformation - backend now provides proper seller details
          const transformedPayouts = result.payouts.map(payout => ({
            // Seller Info (directly from backend)
            sellerId: payout._id || payout.sellerId,
            sellerName: payout.sellerName || 'Seller',
            businessName: payout.businessName || 'Business',
            sellerEmail: payout.sellerEmail || '',
            sellerPhone: payout.sellerPhone || '',
            bankDetails: payout.bankDetails || {},
            
            // Aggregated Totals
            totalOrders: payout.totalOrders || 0,
            pendingOrders: payout.pendingOrders || 0,
            paidOrders: payout.paidOrders || 0,
            
            // Financial Totals (using backend field names)
            orderAmount: payout.totalOrderAmount || 0,
            platformFee: payout.totalPlatformFee || 0,
            gstOnPlatformFee: payout.totalGstOnPlatformFee || 0,
            tdsDeduction: payout.totalTdsDeduction || 0,
            payableAmount: payout.totalPayableAmount || 0,
            netAmount: payout.totalNetAmount || 0,
            
            // Status-based amounts
            pendingAmount: payout.pendingAmount || 0,
            paidAmount: payout.paidAmount || 0,
            
            // Date info
            lastUpdated: payout.lastUpdated,
            earliestPayout: payout.earliestPayout,
            latestPayout: payout.latestPayout,
            
            // For status display
            status: (payout.pendingOrders || 0) > 0 ? 'pending' : 'paid',
            
            // For compatibility
            _id: payout._id,
            orderId: `AGG-${payout._id}`,
            createdAt: payout.earliestPayout || new Date().toISOString()
          }));
          
          console.log('Transformed Aggregated Payouts:', transformedPayouts); // Debug
          setPayouts(transformedPayouts);
        } else {
          // Detailed view transformation (unchanged)
          const transformedPayouts = result.payouts.map(payout => ({
            sellerId: payout.seller?._id || payout.seller,
            sellerName: payout.seller?.name || 'Seller',
            businessName: payout.seller?.businessName || 'Business',
            sellerEmail: payout.seller?.email || '',
            sellerPhone: payout.seller?.phone || '',
            orderId: payout.order?.orderId || payout.order,
            orderAmount: payout.orderAmount || 0,
            platformFee: payout.platformFee || 0,
            gstOnPlatformFee: payout.gstOnPlatformFee || 0,
            tdsDeduction: payout.tdsDeduction || 0,
            payableAmount: payout.payableAmount || 0,
            netAmount: payout.netAmount || 0,
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
      console.error('Error fetching seller payouts:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSellerDetails = async (sellerId) => {
    try {
      setLoadingDetails(true);
    
      console.log('Fetching details for sellerId:', sellerId);
      
      if (!sellerId || sellerId === 'undefined') {
        throw new Error('Invalid seller ID');
      }
      
      const response = await fetch(`https://api.fast2.in/api/payout/seller/${sellerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to fetch seller details: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        const data = result.data;
        
        const ordersWithDetails = data.payouts.map(payout => ({
          _id: payout._id,
          orderId: payout.order?.orderId || 'N/A',
          orderDate: payout.createdAt,
          totalPayout: payout.netAmount || 0,
          sellerPayable: payout.payableAmount || 0,
          gstDeduction: payout.gstOnPlatformFee || 0,
          tdsDeduction: payout.tdsDeduction || 0,
          platformFee: payout.platformFee || 0,
          status: payout.status || 'pending',
          paidAt: payout.paidAt,
          paymentMethod: payout.paymentMethod,
          transactionId: payout.transactionId,
          remarks: payout.remarks
        }));

        setSellerDetails({
          seller: data.seller,
          orders: ordersWithDetails,
          totalPendingPayout: ordersWithDetails
            .filter(o => o.status === 'pending')
            .reduce((sum, o) => sum + o.totalPayout, 0),
          totalPaidPayout: ordersWithDetails
            .filter(o => o.status === 'paid')
            .reduce((sum, o) => sum + o.totalPayout, 0),
          totalGrossPayout: ordersWithDetails
            .reduce((sum, o) => sum + o.sellerPayable, 0),
          totalGSTDeduction: ordersWithDetails
            .reduce((sum, o) => sum + o.gstDeduction, 0),
          totalTDSDeduction: ordersWithDetails
            .reduce((sum, o) => sum + o.tdsDeduction, 0),
          orderCount: ordersWithDetails.length,
          summary: data.summary || [],
          period: data.period || {}
        });
      } else {
        throw new Error(result.message || 'Invalid API response structure');
      }
      setLoadingDetails(false);
    } catch (error) {
      console.error('Error fetching seller details:', error);
      setLoadingDetails(false);
      setSellerDetails(null);
    }
  };

  const handleViewDetails = (payout) => {
    if (!payout.sellerId) {
      console.error('No sellerId found in payout:', payout);
      alert('Unable to fetch seller details: Missing seller ID');
      return;
    }
    
    setSelectedSeller(payout);
    setShowDetailsModal(true);
    fetchSellerDetails(payout.sellerId); 
  };

  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedSeller(null);
    setSellerDetails(null);
  };

  const handleMarkAsPaid = (payout) => {
    if (aggregatedView) {
      if (window.confirm(`Mark all ${payout.pendingOrders} pending orders for ${payout.sellerName} as paid?`)) {
        setSelectedSeller(payout);
        setShowPaymentModal(true);
        setPaymentForm({
          paymentMethod: 'bank_transfer',
          transactionId: '',
          notes: `Bulk payment for ${payout.pendingOrders} orders totaling ${formatCurrency(payout.pendingAmount)}`,
          sellerId: payout.sellerId
        });
      }
    } else {
      setSelectedSeller(payout);
      setShowPaymentModal(true);
      setPaymentForm({
        paymentMethod: 'bank_transfer',
        transactionId: '',
        notes: '',
        payoutId: payout._id
      });
    }
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedSeller(null);
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
    if (!selectedSeller) return;

    try {
      setSubmittingPayment(true);

      if (aggregatedView) {
        const response = await fetch(`https://api.fast2.in/api/payout/bulk-payout/${selectedSeller.sellerId}`, {
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
          fetchSellerPayouts();
          fetchPayoutSummary();
        } else {
          throw new Error(result.error || 'Failed to process bulk payment');
        }
      } else {
        const response = await fetch(`https://api.fast2.in/api/payout/seller-payouts/${selectedSeller._id}/status`, {
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
          fetchSellerPayouts();
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
    : payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.netAmount || 0), 0);
    
  const totalPaidPayout = aggregatedView
    ? payouts.reduce((sum, p) => sum + (p.paidAmount || 0), 0)
    : payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.netAmount || 0), 0);
    
  const totalOrderAmount = payouts.reduce((sum, p) => sum + (p.orderAmount || 0), 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Seller Payouts</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {aggregatedView ? 'Showing total payout per seller' : 'Showing per-order payouts'}
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
                fetchSellerPayouts();
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
                  ? `${payouts.filter(p => (p.pendingOrders || 0) > 0).length} sellers with pending payouts`
                  : `${payouts.filter(p => p.status === 'pending').length} pending payouts`
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(totalOrderAmount)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Gross order amount
              </p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
              <FiTrendingUp className="w-6 h-6" style={{ color: '#3b82f6' }} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {aggregatedView ? 'Total Sellers' : 'All Payouts'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {payouts.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {aggregatedView ? 'Active sellers' : 'Total payout records'}
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
            {aggregatedView ? 'Seller Payout Summary' : 'Seller Payout Details'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {aggregatedView 
              ? `Showing ${payouts.length} sellers with payout records`
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Seller</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gross Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Deductions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Net Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Seller</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Platform Fee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Net Amount</th>
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
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
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
                              {payout.sellerName || 'Seller'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {payout.businessName || 'Business'}
                            </div>
                            {payout.sellerEmail && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {payout.sellerEmail}
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
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatCurrency(payout.orderAmount || 0)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            Platform: {formatCurrency(payout.platformFee || 0)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            GST: {formatCurrency(payout.gstOnPlatformFee || 0)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            TDS: {formatCurrency(payout.tdsDeduction || 0)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold" style={{ color: '#9333ea' }}>
                            {formatCurrency(payout.netAmount || 0)}
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
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {payout.orderId || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {payout.sellerName || 'Seller'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {payout.businessName || 'Business'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatCurrency(payout.orderAmount || 0)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatCurrency(payout.platformFee || 0)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            +GST: {formatCurrency(payout.gstOnPlatformFee || 0)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold" style={{ color: payout.status === 'paid' ? '#10b981' : '#8b5cf6' }}>
                            {formatCurrency(payout.netAmount || 0)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            After TDS: {formatCurrency(payout.tdsDeduction || 0)}
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

      {/* Modals remain the same */}
      {showPaymentModal && selectedSeller && (
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
                  {selectedSeller.sellerName}
                </p>
                {aggregatedView ? (
                  <>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Orders: <span className="font-semibold">{selectedSeller.pendingOrders} pending orders</span>
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Total Amount: <span className="font-semibold" style={{ color: '#9333ea' }}>
                        {formatCurrency(selectedSeller.pendingAmount)}
                      </span>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Order: <span className="font-semibold">{selectedSeller.orderId}</span>
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Amount: <span className="font-semibold" style={{ color: '#9333ea' }}>
                        {formatCurrency(selectedSeller.netAmount)}
                      </span>
                    </p>
                  </>
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

      {showDetailsModal && selectedSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {selectedSeller.sellerName} - Payout Details
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
              ) : sellerDetails ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(147, 51, 234, 0.1)' }}>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Pending Payout</p>
                      <p className="text-xl font-bold" style={{ color: '#9333ea' }}>
                        {formatCurrency(sellerDetails.totalPendingPayout)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Net amount after deductions
                      </p>
                    </div>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
                      <p className="text-xl font-bold" style={{ color: '#22c55e' }}>
                        {formatCurrency(sellerDetails.totalPaidPayout)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Gross Payout</p>
                      <p className="text-xl font-bold" style={{ color: '#3b82f6' }}>
                        {formatCurrency(sellerDetails.totalGrossPayout)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Before deductions
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {sellerDetails.orderCount}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Deductions Summary</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">GST Deduction:</span>
                        <span className="ml-2 font-semibold" style={{ color: '#ef4444' }}>
                          {formatCurrency(sellerDetails.totalGSTDeduction)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">TDS Deduction (1%):</span>
                        <span className="ml-2 font-semibold" style={{ color: '#ef4444' }}>
                          {formatCurrency(sellerDetails.totalTDSDeduction)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {sellerDetails.orders && sellerDetails.orders.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Order-wise Payout Details</h3>
                      <div className="space-y-3">
                        {sellerDetails.orders.map((order) => (
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
                                    Net: {formatCurrency(order.totalPayout)}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Gross: {formatCurrency(order.sellerPayable)}
                                  </p>
                                </div>
                                {order.paidAt && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Paid: {formatDate(order.paidAt)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                              <div className="flex justify-between">
                                <span>Platform Fee (10%):</span>
                                <span>-{formatCurrency(order.platformFee)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>GST on Platform Fee (18%):</span>
                                <span>-{formatCurrency(order.gstDeduction)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>TDS Deduction (1%):</span>
                                <span>-{formatCurrency(order.tdsDeduction)}</span>
                              </div>
                              {order.transactionId && (
                                <div className="flex justify-between">
                                  <span>Transaction ID:</span>
                                  <span>{order.transactionId}</span>
                                </div>
                              )}
                              {order.paymentMethod && (
                                <div className="flex justify-between">
                                  <span>Payment Method:</span>
                                  <span>{order.paymentMethod}</span>
                                </div>
                              )}
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
    </div>
  );
};

export default SellerPayouts;