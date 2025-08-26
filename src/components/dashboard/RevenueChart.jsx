import React from 'react';

const RevenueChart = ({ data, timeRange }) => {
  // Find max value for scaling
  const maxValue = Math.max(...data.map(item => item.revenue), 1);
  
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Revenue Overview</h3>
        <p className="text-sm text-gray-500">
          {timeRange === 'today' ? 'Today' : timeRange === 'week' ? 'This Week' : 'This Month'}
        </p>
      </div>
      <div className="flex items-end h-48">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1 h-full px-1">
            <div 
              className="w-full bg-blue-500 rounded-t-md transition-all duration-300"
              style={{ height: `${(item.revenue / maxValue) * 100}%` }}
              title={`$${item.revenue.toLocaleString()}`}
            ></div>
            <div className="text-xs text-gray-500 mt-2">
              {timeRange === 'today' ? item.hour : timeRange === 'week' ? item.day : item.week}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>${(maxValue / 1000).toFixed(0)}K</span>
        <span>${(maxValue / 2000).toFixed(0)}K</span>
        <span>$0</span>
      </div>
    </div>
  );
};

export default RevenueChart;