import { useState, useEffect } from "react";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiPercent,
  FiDollarSign,
  FiSave,
  FiX,
  FiCalendar,
  FiUsers,
  FiShoppingCart
} from "react-icons/fi";
import usePermissions from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../config/permissions";

const CouponsPage = () => {
  const { hasPermission } = usePermissions();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [previewCoupon, setPreviewCoupon] = useState(null);

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minOrderAmount: "",
    maxDiscountAmount: "",
    startDate: "",
    endDate: "",
    usageLimit: "",
    perUserLimit: "1",
    isActive: true
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/coupon/admin/coupons`);
      const data = await response.json();
      
      if (data) {
        setCoupons(data || []);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      alert('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasPermission(editingCoupon ? PERMISSIONS.COUPONS_EDIT : PERMISSIONS.COUPONS_CREATE)) {
      alert(`You don't have permission to ${editingCoupon ? 'edit' : 'create'} coupons`);
      return;
    }
    try {
      const url = editingCoupon 
        ? `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/coupon/admin/coupons/${editingCoupon._id}`
        : `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/coupon/admin/coupons`;
      
      const method = editingCoupon ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.coupon || data.message) {
        alert(editingCoupon ? 'Coupon updated successfully!' : 'Coupon created successfully!');
        setShowModal(false);
        resetForm();
        fetchCoupons();
      } else {
        alert(data.message || 'Failed to save coupon');
      }
    } catch (error) {
      console.error('Error saving coupon:', error);
      alert('Failed to save coupon');
    }
  };

  const handleEdit = (coupon) => {
    if (!hasPermission(PERMISSIONS.COUPONS_EDIT)) {
      alert("You don't have permission to edit coupons");
      return;
    }
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscountAmount: coupon.maxDiscountAmount || "",
      startDate: coupon.startDate.split('T')[0],
      endDate: coupon.endDate.split('T')[0],
      usageLimit: coupon.usageLimit || "",
      perUserLimit: coupon.perUserLimit,
      isActive: coupon.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/coupon/admin/coupons/${deleteConfirm._id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.message) {
        alert('Coupon deleted successfully!');
        setDeleteConfirm(null);
        fetchCoupons();
      } else {
        alert(data.message || 'Failed to delete coupon');
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
      alert('Failed to delete coupon');
    }
  };

  const toggleCouponStatus = async (coupon) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/coupon/admin/coupons/${coupon._id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (data.coupon) {
        fetchCoupons();
      } else {
        alert(data.message || 'Failed to update coupon status');
      }
    } catch (error) {
      console.error('Error updating coupon status:', error);
      alert('Failed to update coupon status');
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      minOrderAmount: "",
      maxDiscountAmount: "",
      startDate: "",
      endDate: "",
      usageLimit: "",
      perUserLimit: "1",
      isActive: true
    });
    setEditingCoupon(null);
  };

  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCoupon(null);
    resetForm();
  };

  const isCouponActive = (coupon) => {
    const now = new Date();
    const start = new Date(coupon.startDate);
    const end = new Date(coupon.endDate);
    return coupon.isActive && now >= start && now <= end;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const calculateRemainingUsage = (coupon) => {
    if (!coupon.usageLimit) return '∞';
    return Math.max(0, coupon.usageLimit - coupon.usedCount);
  };

  const CouponCard = ({ coupon }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header with code and status */}
      <div className={`p-4 ${isCouponActive(coupon) ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-gray-500 to-gray-600'}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">{coupon.code}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isCouponActive(coupon) 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
          }`}>
            {isCouponActive(coupon) ? 'Active' : 'Inactive'}
          </span>
        </div>
        <p className="text-white text-opacity-90 text-sm mt-1 line-clamp-2">
          {coupon.description}
        </p>
      </div>
      
      {/* Coupon Details */}
      <div className="p-4">
        {/* Discount Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-full ${
              coupon.discountType === 'percentage' 
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                : 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
            }`}>
              {coupon.discountType === 'percentage' ? <FiPercent className="w-4 h-4" /> : <FiDollarSign className="w-4 h-4" />}
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {coupon.discountType === 'percentage' 
                  ? `${coupon.discountValue}% OFF` 
                  : `₹${coupon.discountValue} OFF`
                }
              </div>
              {coupon.maxDiscountAmount && coupon.discountType === 'percentage' && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Max: ₹{coupon.maxDiscountAmount}
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Min: ₹{coupon.minOrderAmount}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Order amount
            </div>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-1">
              <FiUsers className="w-3 h-3" />
              Usage
            </div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {coupon.usedCount} / {coupon.usageLimit || '∞'}
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-1">
              <FiShoppingCart className="w-3 h-3" />
              Per User
            </div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {coupon.perUserLimit}
            </div>
          </div>
        </div>

        {/* Validity */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
          <FiCalendar className="w-4 h-4" />
          <span>{formatDate(coupon.startDate)} - {formatDate(coupon.endDate)}</span>
        </div>

        {/* Progress Bar */}
        {coupon.usageLimit && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Usage Progress</span>
              <span>{coupon.usedCount}/{coupon.usageLimit}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(coupon.usedCount / coupon.usageLimit) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <button
              onClick={() => setPreviewCoupon(coupon)}
              className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              title="Preview"
            >
              <FiEye className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleCouponStatus(coupon)}
              className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
              title={coupon.isActive ? 'Deactivate' : 'Activate'}
            >
              {coupon.isActive ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={() => handleEdit(coupon)}
              className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors"
              title="Edit"
            >
              <FiEdit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeleteConfirm(coupon)}
              className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              title="Delete"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const CouponModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
          </h2>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Coupon Code *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., WELCOME10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Discount Type *
              </label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description *
            </label>
            <textarea
              required
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the coupon purpose..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {formData.discountType === 'percentage' ? 'Discount Percentage *' : 'Discount Amount *'}
              </label>
              <input
                type="number"
                required
                min="0"
                step={formData.discountType === 'percentage' ? "1" : "0.01"}
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={formData.discountType === 'percentage' ? "10" : "100"}
              />
            </div>

            {formData.discountType === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Discount Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.maxDiscountAmount}
                  onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Minimum Order Amount (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Usage Limit
              </label>
              <input
                type="number"
                min="1"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Leave empty for unlimited"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Per User Limit *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.perUserLimit}
                onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active Coupon</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-black dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-medium bg-blue-600 text-black rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FiSave className="w-4 h-4" />
              {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const PreviewModal = () => {
    if (!previewCoupon) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Coupon Preview</h2>
            <button
              onClick={() => setPreviewCoupon(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-6">
            <div className={`rounded-lg overflow-hidden ${
              isCouponActive(previewCoupon) 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                : 'bg-gradient-to-r from-gray-500 to-gray-600'
            } p-6 text-center text-white`}>
              <div className="text-2xl font-bold mb-2">{previewCoupon.code}</div>
              <div className="text-lg mb-4">{previewCoupon.description}</div>
              <div className="text-3xl font-bold mb-2">
                {previewCoupon.discountType === 'percentage' 
                  ? `${previewCoupon.discountValue}% OFF` 
                  : `₹${previewCoupon.discountValue} OFF`
                }
              </div>
              <div className="text-sm opacity-90">
                Min. order: ₹{previewCoupon.minOrderAmount}
              </div>
            </div>
            
            <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Valid From:</span>
                <span className="text-gray-900 dark:text-white">{formatDate(previewCoupon.startDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Valid Until:</span>
                <span className="text-gray-900 dark:text-white">{formatDate(previewCoupon.endDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Usage Limit:</span>
                <span className="text-gray-900 dark:text-white">
                  {previewCoupon.usageLimit ? `${previewCoupon.usedCount}/${previewCoupon.usageLimit}` : 'Unlimited'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Per User Limit:</span>
                <span className="text-gray-900 dark:text-white">{previewCoupon.perUserLimit}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DeleteConfirmModal = () => {
    if (!deleteConfirm) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                <FiTrash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Coupon</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete the coupon "<strong>{deleteConfirm.code}</strong>"?
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Coupon
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Coupon Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create and manage discount coupons for your customers
            </p>
          </div>
          <button
            onClick={openModal}
            className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Create Coupon
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{coupons.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Coupons</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {coupons.filter(isCouponActive).length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Active Coupons</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {coupons.filter(c => !c.isActive).length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Inactive Coupons</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {coupons.reduce((sum, coupon) => sum + coupon.usedCount, 0)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Usage</div>
          </div>
        </div>

        {coupons.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <FiPercent className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No coupons yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Create your first discount coupon to get started
            </p>
            <button
              onClick={openModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-black rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              Create Your First Coupon
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coupons.map((coupon) => (
              <CouponCard key={coupon._id} coupon={coupon} />
            ))}
          </div>
        )}
      </div>

      {showModal && <CouponModal />}
      {previewCoupon && <PreviewModal />}
      {deleteConfirm && <DeleteConfirmModal />}
    </div>
  );
};

export default CouponsPage;