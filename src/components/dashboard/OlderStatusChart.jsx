import React from 'react';

const OrderStatusChart = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Status</h3>
      <div className="flex items-center">
        <div className="relative w-32 h-32 mr-6">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {data.reduce((acc, item, index) => {
              const percentage = (item.count / total) * 100;
              const offset = acc.offset;
              acc.elements.push(
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r="45"
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="10"
                  strokeDasharray={`${percentage} ${100 - percentage}`}
                  strokeDashoffset={100 - offset + 25}
                  transform="rotate(-90 50 50)"
                />
              );
              acc.offset += percentage;
              return acc;
            }, { elements: [], offset: 0 }).elements}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold">{total}</span>
          </div>
        </div>
        <div className="flex-1">
          {data.map((item, index) => (
            <div key={index} className="flex items-center mb-2">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-sm text-gray-700">{item.status}</span>
              <span className="text-sm font-semibold ml-2">({item.count})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderStatusChart;