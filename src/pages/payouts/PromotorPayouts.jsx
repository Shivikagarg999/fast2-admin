import { useState, useEffect } from 'react';
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";
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
        'https://admin.gmkart.com/proxy/api/payout/summary',
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
      const response = await fetch(`https://admin.gmkart.com/proxy/api/payout/promotor-payouts${viewParam}`, {
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
      const response = await fetch(`https://admin.gmkart.com/proxy/api/payout/promotor/${promotorId}`, {
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
        const response = await fetch(`https://admin.gmkart.com/proxy/api/payout/bulk-promotor-payout/${selectedPromotor.promotorId}`, {
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
        const response = await fetch(`https://admin.gmkart.com/proxy/api/payout/promotor-payouts/${selectedPromotor._id}/status`, {
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
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
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
    <div className="p-6 bg-gold-50 min-h-screen">
      <PageHeader
        title="Promotor Payouts"
        subtitle={aggregatedView ? 'Showing total payout per promotor' : 'Showing per-order payouts'}
        actions={
          <>
            <div className="flex items-center gap-2 bg-white rounded-full border border-gray-200 px-3 py-1.5">
              <span className="text-sm text-gray-600">Aggregated View</span>
              <button
                onClick={() => setAggregatedView(!aggregatedView)}
                className="flex items-center"
              >
                {aggregatedView ? (
                  <FiToggleRight className="w-7 h-7 text-gold-600" />
                ) : (
                  <FiToggleLeft className="w-7 h-7 text-gray-400" />
                )}
              </button>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                fetchPromotorPayouts();
                fetchPayoutSummary();
              }}
              disabled={refreshing}
            >
              <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard
          highlight
          label="Total Pending"
          value={formatCurrency(totalPendingPayout)}
          icon={<FiDollarSign className="w-5 h-5" />}
          hint={aggregatedView
            ? `${payouts.filter(p => (p.pendingOrders || 0) > 0).length} promotors with pending payouts`
            : `${payouts.filter(p => p.status === 'pending').length} pending payouts`
          }
        />
        <StatCard
          label="Total Paid"
          value={formatCurrency(totalPaidPayout)}
          icon={<FiDollarSign className="w-5 h-5" />}
          hint="Completed payouts"
        />
        <StatCard
          label="Total Commission"
          value={formatCurrency(totalCommission)}
          icon={<FiUsers className="w-5 h-5" />}
          hint="All commission"
        />
        <StatCard
          label={aggregatedView ? 'Total Promotors' : 'All Payouts'}
          value={payouts.length}
          icon={<FiUsers className="w-5 h-5" />}
          hint={aggregatedView ? 'Active promotors' : 'Total payout records'}
        />
      </div>

      {summary && (
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Platform Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600">Platform Fees</p>
              <p className="text-lg font-bold text-gold-700">
                {formatCurrency(summary.platformEarnings?.serviceFee || 0)}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600">GST Collection</p>
              <p className="text-lg font-bold text-emerald-600">
                {formatCurrency(summary.platformEarnings?.gstCollection || 0)}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600">Pending Payouts</p>
              <p className="text-lg font-bold text-amber-600">
                {formatCurrency(summary.sellerPayouts?.totalAmount || 0)}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-lg font-bold text-gray-900">
                {summary.sellerPayouts?.totalOrders || 0}
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card padded={false} className="overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {aggregatedView ? 'Promotor Payout Summary' : 'Promotor Payout Details'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {aggregatedView
              ? `Showing ${payouts.length} promotors with payout records`
              : `Showing ${payouts.length} payout records`
            }
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {aggregatedView ? (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Promotor</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Commission</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Promotor</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Commission Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={aggregatedView ? "6" : "6"} className="px-6 py-8 text-center text-gray-500">
                    No payout records found
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout._id} className="hover:bg-gold-50/60 transition-colors">
                    {aggregatedView ? (
                      <>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {payout.promotorName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {payout.promotorEmail}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {payout.totalOrders || 0} orders
                          </div>
                          <div className="text-xs text-gray-500">
                            {(payout.pendingOrders || 0)} pending
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gold-700">
                            {formatCurrency(payout.commissionAmount || 0)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Pending: {formatCurrency(payout.pendingAmount || 0)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={(payout.pendingOrders || 0) > 0 ? 'gold' : 'success'}>
                            {(payout.pendingOrders || 0) > 0 ? 'Pending' : 'Paid'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {formatDate(payout.earliestPayout)}
                          </div>
                          <div className="text-xs text-gray-500">
                            to {formatDate(payout.latestPayout)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button variant="primary" className="!px-3 !py-1.5 text-xs" onClick={() => handleViewDetails(payout)} title="View Details"><FiEye className="w-3.5 h-3.5" /> View</Button>
                            {(payout.pendingOrders || 0) > 0 && (
                              <button
                                onClick={() => handleMarkAsPaid(payout)}
                                className="p-2 rounded-full transition-colors hover:bg-emerald-50 text-emerald-600"
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
                            <div className="text-sm font-semibold text-gray-900">
                              {payout.promotorName}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{payout.promotorEmail}</div>
                          <div className="text-xs text-gray-500">{payout.promotorPhone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold" style={{ color: payout.status === 'paid' ? '#10b981' : '#b3860f' }}>
                            {formatCurrency(payout.commissionAmount)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={payout.status === 'paid' ? 'success' : payout.status === 'processing' ? 'pale' : 'gold'}>
                            {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {formatDate(payout.createdAt)}
                          </div>
                          {payout.paidAt && (
                            <div className="text-xs text-gray-500">
                              Paid: {formatDate(payout.paidAt)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button variant="primary" className="!px-3 !py-1.5 text-xs" onClick={() => handleViewDetails(payout)} title="View Details"><FiEye className="w-3.5 h-3.5" /> View</Button>
                            {payout.status === 'pending' && (
                              <button
                                onClick={() => handleMarkAsPaid(payout)}
                                className="p-2 rounded-full transition-colors hover:bg-emerald-50 text-emerald-600"
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
      </Card>

      {/* Modals remain mostly the same, just update the aggregated view parts */}
      {showPaymentModal && selectedPromotor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {aggregatedView ? 'Process Bulk Payout' : 'Process Payout'}
              </h2>
              <button
                onClick={closePaymentModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-gold-50 rounded-xl">
                <p className="text-sm text-gray-600">
                  {aggregatedView ? 'Processing Bulk Payout For' : 'Processing Payout For'}
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedPromotor.promotorName}
                </p>
                {aggregatedView ? (
                  <>
                    <p className="text-sm text-gray-500 mt-1">
                      Orders: <span className="font-semibold">{selectedPromotor.pendingOrders} pending orders</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Total Amount: <span className="font-semibold text-emerald-600">
                        {formatCurrency(selectedPromotor.pendingAmount)}
                      </span>
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">
                    Amount: <span className="font-semibold text-emerald-600">
                      {formatCurrency(selectedPromotor.commissionAmount)}
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  name="paymentMethod"
                  value={paymentForm.paymentMethod}
                  onChange={handlePaymentFormChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold-400"
                  required
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Transaction ID / Reference
                </label>
                <input
                  type="text"
                  name="transactionId"
                  value={paymentForm.transactionId}
                  onChange={handlePaymentFormChange}
                  placeholder="Enter transaction ID"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={paymentForm.notes}
                  onChange={handlePaymentFormChange}
                  placeholder="Add any additional notes"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={closePaymentModal}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-full hover:bg-gray-50 transition-colors font-semibold text-sm"
                  disabled={submittingPayment}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitPayment}
                  className="flex-1 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {promotorDetails.promotor?.name || selectedPromotor.promotorName} - Payout Details
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {loadingDetails ? (
                <div className="text-center py-8">
                  <FiRefreshCw className="w-8 h-8 animate-spin mx-auto text-gold-500" />
                  <p className="text-gray-600 mt-2">Loading details...</p>
                </div>
              ) : promotorDetails ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gold-50 rounded-xl">
                      <p className="text-sm text-gray-600">Pending Payout</p>
                      <p className="text-xl font-bold text-amber-600">
                        {formatCurrency(promotorDetails.totalPendingPayout)}
                      </p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-xl">
                      <p className="text-sm text-gray-600">Total Paid</p>
                      <p className="text-xl font-bold text-emerald-600">
                        {formatCurrency(promotorDetails.totalPaidPayout)}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-600">Total Orders</p>
                      <p className="text-xl font-bold text-gray-900">
                        {promotorDetails.orderCount}
                      </p>
                    </div>
                  </div>

                  {promotorDetails.promotor && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h3 className="font-semibold text-gray-900 mb-3">Promotor Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Name</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {promotorDetails.promotor.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {promotorDetails.promotor.email}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {promotorDetails.promotor.phone}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Commission Rate</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {promotorDetails.promotor.commissionRate || 'N/A'}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {promotorDetails.orders && promotorDetails.orders.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Payout Details</h3>
                      <div className="space-y-3">
                        {promotorDetails.orders.map((order) => (
                          <div key={order.orderId} className="p-4 bg-gray-50 rounded-xl">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  Order {order.orderId}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(order.orderDate)}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className={`px-2 py-1 text-xs rounded-full ${order.status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-gold-100 text-gold-800'
                                  }`}>
                                  {order.status === 'paid' ? 'Paid' : 'Pending'}
                                </span>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-gold-700">
                                    Commission: {formatCurrency(order.totalCommission)}
                                  </p>
                                </div>
                                {order.paidAt && (
                                  <p className="text-xs text-gray-500">
                                    Paid: {formatDate(order.paidAt)}
                                  </p>
                                )}
                              </div>
                            </div>
                            {order.paymentMethod && (
                              <div className="space-y-1 text-xs text-gray-600">
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
                <p className="text-center text-gray-500">No details available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotorPayouts;