import { useState, useEffect } from 'react';
import { TrendingUp, Calendar } from 'lucide-react';
import { fetchOrderStats } from '../../utils/api';
import { formatCurrency } from '../../utils/api';

const RevenueAnalytics = ({ period = 'month' }) => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRevenueData();
  }, [period]);

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      const data = await fetchOrderStats(period);
      setMonthlyData(data.monthlyRevenue || []);
    } catch (error) {
      console.error('Error loading revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (monthNum) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthNum - 1] || '';
  };

  const maxRevenue = Math.max(...monthlyData.map(item => item.revenue), 1);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
            Revenue Trends
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Monthly revenue breakdown</p>
        </div>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4 mr-1" />
          This Year
        </div>
      </div>

      {monthlyData.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No revenue data available</p>
        </div>
      ) : (
        <div>
          <div className="flex items-end justify-between h-64 gap-2">
            {monthlyData.map((item, index) => {
              const height = (item.revenue / maxRevenue) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center justify-end h-full">
                    <div className="relative group w-full">
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-500 cursor-pointer"
                        style={{ height: `${height}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                          {formatCurrency(item.revenue)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">
                    {getMonthName(item._id)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {item.orders}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(monthlyData.reduce((sum, item) => sum + item.revenue, 0))}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {monthlyData.reduce((sum, item) => sum + item.orders, 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg/Month</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(monthlyData.reduce((sum, item) => sum + item.revenue, 0) / monthlyData.length)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueAnalytics;