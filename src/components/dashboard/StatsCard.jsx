import React from 'react';

const StatsCard = ({ title, value, change, icon, isCurrency = false }) => {
  const changeType = change >= 0 ? 'positive' : 'negative';
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-2xl">{icon}</div>
        <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
          changeType === 'positive' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-800">
          {isCurrency ? value : value.toLocaleString()}
        </div>
        <div className="text-sm text-gray-500">{title}</div>
      </div>
    </div>
  );
};

export default StatsCard;