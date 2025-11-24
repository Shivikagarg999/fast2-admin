import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { fetchAllOrders } from '../../utils/api';
import { formatCurrency, formatNumber } from '../../utils/api';

const PaymentStatusCard = () => {
  const [paymentStats, setPaymentStats] = useState({
    paid: { count: 0, amount: 0 },
    pending: { count: 0, amount: 0 },
    failed: { count: 0, amount: 0 },
    refunded: { count: 0, amount: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentStats();
  }, []);

  const loadPaymentStats = async () => {
    try {
      setLoading(true);
      const data = await fetchAllOrders({ limit: 1000 });
      
      const stats = {
        paid: { count: 0, amount: 0 },
        pending: { count: 0, amount: 0 },
        failed: { count: 0, amount: 0 },
        refunded: { count: 0, amount: 0 }
      };

      data.orders?.forEach(order => {
        const status = order.paymentStatus || 'pending';
        if (stats[status]) {
          stats[status].count++;
          stats[status].amount += order.total || 0;
        }
      });

      setPaymentStats(stats);
    } catch (error) {
      console.error('Error loading payment stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const paymentConfig = {
    paid: {
      label: 'Paid',
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-700 dark:text-green-300'
    },
    pending: {
      label: 'Pending',
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      textColor: 'text-yellow-700 dark:text-yellow-300'
    },
    failed: {
      label: 'Failed',
      icon: XCircle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-700 dark:text-red-300'
    },
    refunded: {
      label: 'Refunded',
      icon: RefreshCw,
      color: 'bg-gray-500',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
      textColor: 'text-gray-700 dark:text-gray-300'
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <CreditCard className="w-5 h-5 mr-2 text-blue-500" />
        Payment Status
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(paymentConfig).map(([status, config]) => {
          const stats = paymentStats[status];
          const Icon = config.icon;

          return (
            <div key={status} className={`${config.bgColor} rounded-lg p-4 transition-all hover:shadow-md`}>
              <div className="flex items-center mb-2">
                <div className={`p-2 rounded-lg ${config.color} bg-opacity-20 mr-2`}>
                  <Icon className={`w-4 h-4 ${config.color.replace('bg-', 'text-')}`} />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{config.label}</p>
              </div>
              <p className={`text-xl font-bold ${config.textColor}`}>
                {formatNumber(stats.count)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {formatCurrency(stats.amount)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentStatusCard;