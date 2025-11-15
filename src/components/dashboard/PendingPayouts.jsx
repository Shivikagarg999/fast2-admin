import { useState, useEffect } from 'react';
import { FiDollarSign, FiUsers, FiTrendingUp, FiRefreshCw, FiEye } from 'react-icons/fi';

const PendingPayouts = () => {
  const [payoutData, setPayoutData] = useState({
    promotors: { totalPendingPayout: 0, count: 0 },
    sellers: { totalPendingPayout: 0, count: 0 },
    combined: { totalPendingPayout: 0, totalRecipients: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPayoutSummary();
  }, []);

  const fetchPayoutSummary = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/payouts/summary`
      );
      
      if (!response.ok) throw new Error('Failed to fetch payout summary');
      const result = await response.json();
      
      if (result.success) {
        setPayoutData(result.data);
      }
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching payout summary:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <FiDollarSign className="text-green-500 mr-2" />
          Pending Payouts
        </h2>
        <button
          onClick={fetchPayoutSummary}
          className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          title="Refresh payouts"
        >
          <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Total Pending Payout */}
      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Pending Amount</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(payoutData.combined.totalPendingPayout)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {payoutData.combined.totalRecipients} recipients
            </p>
          </div>
          <div className="p-4 bg-green-100 dark:bg-green-900/40 rounded-full">
            <FiDollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-4">
        {/* Promotor Payouts */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mr-3">
                <FiUsers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Promotor Commissions
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {payoutData.promotors.count} promotors
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(payoutData.promotors.totalPendingPayout)}
              </p>
              <a
                href="/dashboard/promotors"
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center justify-end mt-1"
              >
                View Details
                <FiEye className="w-3 h-3 ml-1" />
              </a>
            </div>
          </div>
        </div>

        {/* Seller Payouts */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center mr-3">
                <FiTrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Seller Earnings
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {payoutData.sellers.count} sellers
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(payoutData.sellers.totalPendingPayout)}
              </p>
              <a
                href="/dashboard/sellers"
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center justify-end mt-1"
              >
                View Details
                <FiEye className="w-3 h-3 ml-1" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-800 dark:text-blue-300">
          💡 Payouts are calculated based on delivered and paid orders. Platform fee (10%) is deducted from seller earnings.
        </p>
      </div>
    </div>
  );
};

export default PendingPayouts;