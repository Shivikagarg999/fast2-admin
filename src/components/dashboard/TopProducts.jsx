import React from 'react';

const TopProducts = ({ products }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Selling Products</h3>
      <div className="space-y-4">
        {products.map((product, index) => (
          <div key={product.id} className="flex items-center">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-sm font-bold">#{index + 1}</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-800">{product.name}</div>
              <div className="text-xs text-gray-500">{product.sales} sold</div>
            </div>
            <div className="text-sm font-bold text-gray-800">${product.revenue}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopProducts;