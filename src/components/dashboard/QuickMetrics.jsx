import { useState, useEffect } from 'react';
import { Users, Package, ShoppingCart, Wallet } from 'lucide-react';
import { fetchUsers, fetchAllProducts, fetchOrderStats } from '../../utils/api';
import { formatNumber, formatCurrency } from '../../utils/api';

const QuickMetrics = () => {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    walletBalance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const [usersData, productsData, ordersData] = await Promise.all([
        fetchUsers(),
        fetchAllProducts(),
        fetchOrderStats('month')
      ]);

      // Calculate total wallet balance
      const totalWallet = usersData.users?.reduce((sum, user) => sum + (user.wallet || 0), 0) || 0;

      setMetrics({
        totalUsers: usersData.users?.length || 0,
        totalProducts: productsData.length || 0,
        totalOrders: ordersData.totalOrders || 0,
        walletBalance: totalWallet
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const metricCards = [
    {
      title: 'Total Users',
      value: metrics.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Total Products',
      value: metrics.totalProducts,
      icon: Package,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'Total Orders',
      value: metrics.totalOrders,
      icon: ShoppingCart,
      color: 'bg-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Wallet Balance',
      value: formatCurrency(metrics.walletBalance),
      icon: Wallet,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      isCurrency: true
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricCards.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div key={index} className={`${metric.bgColor} rounded-lg p-4 border border-gray-200 dark:border-gray-700`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metric.isCurrency ? metric.value : formatNumber(metric.value)}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${metric.color} bg-opacity-20`}>
                <Icon className={`w-6 h-6 ${metric.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuickMetrics;