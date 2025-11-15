import { useState, useEffect } from 'react';
import { Package, CheckCircle, Clock, Truck, XCircle } from 'lucide-react';
import { fetchOrderStats } from '../../utils/api';
import { formatNumber } from '../../utils/api';

const OrderStatusBreakdown = () => {
  const [statusData, setStatusData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatusData();
  }, []);

  const loadStatusData = async () => {
    try {
      setLoading(true);
      const data = await fetchOrderStats('month');
      setStatusData(data.ordersByStatus || {});
    } catch (error) {
      console.error('Error loading status data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    pending: {
      label: 'Pending',
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      textColor: 'text-yellow-700 dark:text-yellow-300'
    },
    confirmed: {
      label: 'Confirmed',
      icon: CheckCircle,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-700 dark:text-blue-300'
    },
    'picked-up': {
      label: 'Picked Up',
      icon: Truck,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      textColor: 'text-indigo-700 dark:text-indigo-300'
    },
    delivered: {
      label: 'Delivered',
      icon: Package,
      color: 'bg-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-700 dark:text-green-300'
    },
    cancelled: {
      label: 'Cancelled',
      icon: XCircle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-700 dark:text-red-300'
    }
  };

  const totalOrders = Object.values(statusData).reduce((sum, count) => sum + count, 0);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Status Breakdown</h3>
      
      <div className="space-y-3">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = statusData[status] || 0;
          const percentage = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
          const Icon = config.icon;

          return (
            <div key={status} className={`${config.bgColor} rounded-lg p-4 transition-all hover:shadow-md`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${config.color} bg-opacity-20 mr-3`}>
                    <Icon className={`w-5 h-5 ${config.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{config.label}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{percentage.toFixed(1)}% of total</p>
                  </div>
                </div>
                <div className={`text-2xl font-bold ${config.textColor}`}>
                  {formatNumber(count)}
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`${config.color} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</span>
          <span className="text-xl font-bold text-gray-900 dark:text-white">{formatNumber(totalOrders)}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusBreakdown;