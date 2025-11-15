import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, CreditCard } from 'lucide-react';
import { fetchOrderStats } from '../../utils/api';
import { formatCurrency, formatNumber, calculatePercentageChange } from '../../utils/api';

const SalesOverview = ({ period = 'month' }) => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    recentOrders: 0,
    revenue: { totalRevenue: 0, averageOrderValue: 0 },
    ordersByStatus: {}
  });
  const [loading, setLoading] = useState(true);
  const [previousStats, setPreviousStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await fetchOrderStats(period);
      
      // Calculate changes if we have previous data
      if (stats.totalOrders > 0) {
        setPreviousStats({
          totalOrders: stats.totalOrders,
          revenue: stats.revenue.totalRevenue
        });
      }
      
      setStats(data);
    } catch (error) {
      console.error('Error loading sales stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOrdersChange = () => {
    if (!previousStats) return 0;
    return calculatePercentageChange(stats.recentOrders, previousStats.totalOrders);
  };

  const getRevenueChange = () => {
    if (!previousStats) return 0;
    return calculatePercentageChange(stats.revenue.totalRevenue, previousStats.revenue);
  };

  const MetricCard = ({ title, value, icon: Icon, change, color, isCurrency = false }) => {
    const isPositive = change >= 0;
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
            <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
          </div>
          {change !== 0 && (
            <div className={`flex items-center text-sm font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {isCurrency ? formatCurrency(value) : formatNumber(value)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{title}</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total Revenue"
        value={stats.revenue.totalRevenue}
        icon={DollarSign}
        change={getRevenueChange()}
        color="bg-green-500"
        isCurrency={true}
      />
      <MetricCard
        title="Total Orders"
        value={stats.totalOrders}
        icon={ShoppingCart}
        change={getOrdersChange()}
        color="bg-blue-500"
      />
      <MetricCard
        title="Average Order Value"
        value={stats.revenue.averageOrderValue}
        icon={CreditCard}
        change={0}
        color="bg-purple-500"
        isCurrency={true}
      />
      <MetricCard
        title={`Orders (${period})`}
        value={stats.recentOrders}
        icon={Package}
        change={0}
        color="bg-orange-500"
      />
    </div>
  );
};

export default SalesOverview;