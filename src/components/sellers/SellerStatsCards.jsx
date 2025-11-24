import { Users, CheckCircle, XCircle, Clock } from 'lucide-react';

const SellerStatsCards = ({ stats }) => {
  const statsConfig = [
    {
      title: 'Total Sellers',
      value: stats?.total || 0,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Approved',
      value: stats?.approvalStatus?.approved || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Pending',
      value: stats?.approvalStatus?.pending || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
    },
    {
      title: 'Rejected',
      value: stats?.approvalStatus?.rejected || 0,
      icon: XCircle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {statsConfig.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className={`${stat.bgColor} rounded-lg p-6 border border-gray-200 dark:border-gray-700`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color} bg-opacity-20`}>
                <Icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SellerStatsCards;