import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, RefreshCw } from 'lucide-react';
import SellerStatsCards from '../../components/sellers/SellerStatsCards';
import SellerFilters from '../../components/sellers/SellerFilters';
import SellerTable from '../../components/sellers/SellerTable';
import SellerDetailsModal from '../../components/sellers/SellerDetailsModal';
import Pagination from '../../components/sellers/Pagination';
import usePermissions from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../config/permissions';

const SellerPage = () => {
  const { hasPermission } = usePermissions();

  const [sellers, setSellers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalSellers: 0
  });

  const [filters, setFilters] = useState({
    search: '',
    approvalStatus: '',
    isActive: '',
    page: 1,
    limit: 10
  });

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchSellers();
  }, [filters]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/seller/sellers/stats`);
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching seller stats:', error);
    }
  };

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.approvalStatus) params.append('approvalStatus', filters.approvalStatus);
      if (filters.isActive) params.append('isActive', filters.isActive);
      params.append('page', filters.page);
      params.append('limit', filters.limit);

      const response = await axios.get(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/seller/sellers?${params.toString()}`);
      
      setSellers(response.data.data || []);
      setPagination(response.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalSellers: 0
      });
    } catch (error) {
      console.error('Error fetching sellers:', error);
      alert('Failed to fetch sellers');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({
      ...prev,
      page
    }));
  };

  const handleViewDetails = async (seller) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/seller/seller/${seller._id}`);
      setSelectedSeller(response.data.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching seller details:', error);
      alert('Failed to fetch seller details');
    }
  };

  const handleApprove = async (sellerId) => {
    if (!hasPermission(PERMISSIONS.SELLERS_APPROVE)) {
      alert("You don't have permission to approve sellers");
      return;
    }
    if (!window.confirm('Are you sure you want to approve this seller?')) {
      return;
    }

    try {
      await axios.patch(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/seller/seller/${sellerId}/approval`, {
        action: 'approve',
        adminId: 'admin' // You should get this from auth context
      });
      
      alert('Seller approved successfully');
      setShowDetailsModal(false);
      fetchSellers();
      fetchStats();
    } catch (error) {
      console.error('Error approving seller:', error);
      alert('Failed to approve seller: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleReject = async (sellerId) => {
    const reason = window.prompt('Please enter rejection reason:');
    if (!reason) return;

    try {
      await axios.patch(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/seller/seller/${sellerId}/approval`, {
        action: 'reject',
        adminId: 'admin', // You should get this from auth context
        rejectionReason: reason
      });
      
      alert('Seller rejected successfully');
      setShowDetailsModal(false);
      fetchSellers();
      fetchStats();
    } catch (error) {
      console.error('Error rejecting seller:', error);
      alert('Failed to reject seller: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleToggleStatus = async (sellerId, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this seller?`)) {
      return;
    }

    try {
      await axios.patch(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/seller/seller/${sellerId}/status`, {
        isActive: !currentStatus
      });
      
      alert(`Seller ${action}d successfully`);
      fetchSellers();
      fetchStats();
    } catch (error) {
      console.error('Error toggling seller status:', error);
      alert('Failed to update seller status: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRefresh = () => {
    fetchSellers();
    fetchStats();
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 w-full min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center mb-4 sm:mb-0">
            <Users className="w-6 h-6 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Seller Management</h1>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <SellerStatsCards stats={stats} />

        {/* Filters */}
        <SellerFilters filters={filters} onFilterChange={handleFilterChange} />

        {/* Sellers Table */}
        <SellerTable
          sellers={sellers}
          loading={loading}
          onViewDetails={handleViewDetails}
          onToggleStatus={handleToggleStatus}
        />

        {/* Pagination */}
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />

        {/* Seller Details Modal */}
        {showDetailsModal && (
          <SellerDetailsModal
            seller={selectedSeller}
            onClose={() => setShowDetailsModal(false)}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
      </div>
    </div>
  );
};

export default SellerPage;