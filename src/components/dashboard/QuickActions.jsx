import React from 'react';

const QuickActions = () => {
  const actions = [
    { icon: '➕', label: 'Add Product', path: '/products/add' },
    { icon: '📊', label: 'View Reports', path: '/reports' },
    { icon: '📋', label: 'Manage Categories', path: '/categories' },
    { icon: '🛒', label: 'Process Orders', path: '/orders' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl mb-2">{action.icon}</span>
            <span className="text-sm text-gray-700">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;