import { useState, useEffect } from 'react';
import { TrendingUp, Package } from 'lucide-react';
import { fetchAllOrders, fetchAllProducts } from '../../utils/api';
import { formatCurrency, formatNumber } from '../../utils/api';

const TopSellingProducts = () => {
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopProducts();
  }, []);

  const loadTopProducts = async () => {
    try {
      setLoading(true);
      const [ordersData, productsData] = await Promise.all([
        fetchAllOrders({ limit: 1000 }),
        fetchAllProducts()
      ]);

      // Calculate sales per product
      const productSales = {};
      
      ordersData.orders?.forEach(order => {
        if (order.status !== 'cancelled') {
          order.items?.forEach(item => {
            const productId = item.product?._id || item.product;
            if (productId) {
              if (!productSales[productId]) {
                productSales[productId] = {
                  id: productId,
                  name: item.product?.name || 'Unknown Product',
                  quantity: 0,
                  revenue: 0,
                  image: item.product?.images?.[0]?.url
                };
              }
              productSales[productId].quantity += item.quantity || 0;
              productSales[productId].revenue += (item.price * item.quantity) || 0;
            }
          });
        }
      });

      // Sort by revenue and get top 5
      const sorted = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setTopProducts(sorted);
    } catch (error) {
      console.error('Error loading top products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
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
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
        Top Selling Products
      </h3>
      
      {topProducts.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No sales data available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topProducts.map((product, index) => (
            <div key={product.id} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3 text-white font-bold">
                #{index + 1}
              </div>
              {product.image && (
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-12 h-12 rounded-lg object-cover mr-3"
                  onError={(e) => e.target.style.display = 'none'}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {product.name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {formatNumber(product.quantity)} units sold
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatCurrency(product.revenue)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopSellingProducts;