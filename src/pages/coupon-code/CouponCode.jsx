import { useEffect, useState, useCallback } from "react";
import { 
  FiEdit, 
  FiTrash2, 
  FiTag, 
  FiSearch, 
  FiPlus, 
  FiPercent,
  FiCalendar,
  FiDollarSign,
  FiX,
  FiToggleLeft,
  FiToggleRight,
  FiCopy
} from "react-icons/fi";
import usePermissions from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../config/permissions";

const showToast = (message, type = 'success') => {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 1000;
    background-color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 3000);
};

const LoadingSpinner = ({ size = 24, color = '#2563eb' }) => (
  <div
    style={{
      width: size,
      height: size,
      border: `2px solid ${color}20`,
      borderTop: `2px solid ${color}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    }}
  />
);

class CouponService {
  constructor() {
    this.baseURL = import.meta.env.VITE_BASE_URL || 'https://api.fast2.in';
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem("token");
    const url = `${this.baseURL}/api/admin/coupon${endpoint}`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async getAllCoupons() {
    return this.request('/admin/coupons');
  }

  async createCoupon(couponData) {
    return this.request('/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(couponData),
    });
  }

  async updateCoupon(couponId, couponData) {
    return this.request(`/admin/coupons/${couponId}`, {
      method: 'PUT',
      body: JSON.stringify(couponData),
    });
  }

  async deleteCoupon(couponId) {
    return this.request(`/admin/coupons/${couponId}`, {
      method: 'DELETE',
    });
  }

  async toggleCouponStatus(couponId) {
    return this.request(`/admin/coupons/${couponId}/toggle`, {
      method: 'PATCH',
    });
  }
}

const couponService = new CouponService();

const CouponsPage = () => {
  const { hasPermission } = usePermissions();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddCouponModal, setShowAddCouponModal] = useState(false);
  const [showEditCouponModal, setShowEditCouponModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [formData, setFormData] = useState(getInitialFormData());
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copiedCode, setCopiedCode] = useState("");
  const couponsPerPage = 10;

  function getInitialFormData() {
    return {
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      minOrderAmount: "",
      maxDiscountAmount: "",
      startDate: "",
      endDate: "",
      usageLimit: "",
      isActive: true
    };
  }

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await couponService.getAllCoupons();
      setCoupons(response.coupons || response.data || response || []);
    } catch (err) {
      console.error("Error fetching coupons:", err);
      setError("Failed to load coupons");
      showToast("Failed to load coupons", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      showToast("Coupon code copied to clipboard!");
      setTimeout(() => setCopiedCode(""), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      showToast("Failed to copy coupon code", "error");
    }
  };

  const openAddCouponModal = () => {
    if (!hasPermission(PERMISSIONS.COUPONS_CREATE)) {
      showToast("You don't have permission to add coupons", "error");
      return;
    }
    setFormData(getInitialFormData());
    setShowAddCouponModal(true);
    setError("");
    setSuccess("");
  };

  const closeAddCouponModal = () => {
    setShowAddCouponModal(false);
    setFormData(getInitialFormData());
    setError("");
    setSuccess("");
  };

  const handleAddCoupon = async () => {
    if (!hasPermission(PERMISSIONS.COUPONS_CREATE)) {
      setError("You don't have permission to add coupons");
      return;
    }

    // Validation
    if (!formData.code || !formData.discountValue || !formData.startDate || !formData.endDate) {
      setError("Please fill in all required fields");
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setError("End date must be after start date");
      return;
    }

    try {
      setFormLoading(true);
      setError("");
      
      const couponData = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : 0,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null
      };

      await couponService.createCoupon(couponData);
      
      setSuccess("Coupon created successfully");
      showToast("Coupon created successfully!");
      
      setTimeout(() => {
        closeAddCouponModal();
        fetchCoupons();
      }, 1000);
    } catch (err) {
      console.error("Error creating coupon:", err);
      const errorMessage = err.response?.data?.message || "Failed to create coupon";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setFormLoading(false);
    }
  };

  // Edit Coupon Functions
  const openEditCouponModal = (coupon) => {
    if (!hasPermission(PERMISSIONS.COUPONS_EDIT)) {
      showToast("You don't have permission to edit coupons", "error");
      return;
    }
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code || "",
      description: coupon.description || "",
      discountType: coupon.discountType || "percentage",
      discountValue: coupon.discountValue?.toString() || "",
      minOrderAmount: coupon.minOrderAmount?.toString() || "",
      maxDiscountAmount: coupon.maxDiscountAmount?.toString() || "",
      startDate: coupon.startDate ? coupon.startDate.split('T')[0] : "",
      endDate: coupon.endDate ? coupon.endDate.split('T')[0] : "",
      usageLimit: coupon.usageLimit?.toString() || "",
      isActive: coupon.isActive || false
    });
    setShowEditCouponModal(true);
    setError("");
    setSuccess("");
  };

  const closeEditCouponModal = () => {
    setShowEditCouponModal(false);
    setSelectedCoupon(null);
    setFormData(getInitialFormData());
    setError("");
    setSuccess("");
  };

  const handleEditCoupon = async () => {
    if (!hasPermission(PERMISSIONS.COUPONS_EDIT)) {
      setError("You don't have permission to edit coupons");
      return;
    }

    if (!formData.code || !formData.discountValue || !formData.startDate || !formData.endDate) {
      setError("Please fill in all required fields");
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setError("End date must be after start date");
      return;
    }

    try {
      setFormLoading(true);
      setError("");
      
      const updateData = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : 0,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null
      };

      await couponService.updateCoupon(selectedCoupon._id, updateData);
      
      setSuccess("Coupon updated successfully");
      showToast("Coupon updated successfully!");
      
      setTimeout(() => {
        closeEditCouponModal();
        fetchCoupons();
      }, 1000);
    } catch (err) {
      console.error("Error updating coupon:", err);
      const errorMessage = err.response?.data?.message || "Failed to update coupon";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Coupon Function
  const handleDeleteCoupon = async (couponId, couponCode) => {
    if (!hasPermission(PERMISSIONS.COUPONS_DELETE)) {
      showToast("You don't have permission to delete coupons", "error");
      return;
    }
    
    if (!confirm(`Are you sure you want to delete coupon: ${couponCode}? This action cannot be undone.`)) {
      return;
    }

    try {
      await couponService.deleteCoupon(couponId);
      showToast("Coupon deleted successfully!");
      fetchCoupons();
    } catch (err) {
      console.error("Error deleting coupon:", err);
      const errorMessage = err.response?.data?.message || "Failed to delete coupon";
      showToast(errorMessage, "error");
    }
  };

  // Toggle Coupon Status
  const handleToggleStatus = async (coupon) => {
    if (!hasPermission(PERMISSIONS.COUPONS_EDIT)) {
      showToast("You don't have permission to modify coupons", "error");
      return;
    }

    try {
      await couponService.toggleCouponStatus(coupon._id);
      showToast(`Coupon ${coupon.isActive ? 'deactivated' : 'activated'} successfully!`);
      fetchCoupons();
    } catch (err) {
      console.error("Error toggling coupon status:", err);
      const errorMessage = err.response?.data?.message || "Failed to update coupon status";
      showToast(errorMessage, "error");
    }
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Filter and pagination logic
  const statusOptions = ["active", "expired", "inactive"];
  const discountTypes = ["percentage", "fixed"];

  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch = 
      coupon.code?.toLowerCase().includes(search.toLowerCase()) ||
      coupon.description?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = !statusFilter || 
      (statusFilter === "active" && coupon.isActive && new Date(coupon.endDate) > new Date()) ||
      (statusFilter === "expired" && new Date(coupon.endDate) <= new Date()) ||
      (statusFilter === "inactive" && !coupon.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const indexOfLastCoupon = currentPage * couponsPerPage;
  const indexOfFirstCoupon = indexOfLastCoupon - couponsPerPage;
  const currentCoupons = filteredCoupons.slice(indexOfFirstCoupon, indexOfLastCoupon);
  const totalPages = Math.ceil(filteredCoupons.length / couponsPerPage);

  // Helper functions
  const getStatusBadge = (coupon) => {
    const isExpired = new Date(coupon.endDate) <= new Date();
    
    if (isExpired) {
      return {
        text: "Expired",
        backgroundColor: '#fef2f2',
        color: '#dc2626'
      };
    }
    
    if (coupon.isActive) {
      return {
        text: "Active",
        backgroundColor: '#f0fdf4',
        color: '#16a34a'
      };
    }
    
    return {
      text: "Inactive",
      backgroundColor: '#f3f4f6',
      color: '#6b7280'
    };
  };

  const getDiscountDisplay = (coupon) => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}% OFF`;
    } else {
      return `₹${coupon.discountValue} OFF`;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  // Button Styles
  const buttonStyles = {
    primary: {
      backgroundColor: '#000000',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      padding: '10px 20px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '500'
    },
    secondary: {
      backgroundColor: '#ffffff',
      color: '#374151',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      padding: '10px 20px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '500'
    }
  };

  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', width: '100%', padding: '24px' }}>
      {/* Add CSS animation for spinner */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiTag style={{ width: '24px', height: '24px', color: '#2563eb' }} />
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>All Coupons</h1>
            <span style={{
              padding: '4px 12px',
              fontSize: '12px',
              backgroundColor: '#e5e7eb',
              color: '#374151',
              borderRadius: '9999px'
            }}>
              {filteredCoupons.length} coupons
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '16px', flexDirection: 'column', width: '100%' }}>
              <div style={{ display: 'flex', gap: '16px', flexDirection: 'row' }}>
                {/* Search Input */}
                <div style={{ flex: 1, position: 'relative' }}>
                  <FiSearch style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                    width: '16px',
                    height: '16px'
                  }} />
                  <input
                    type="text"
                    placeholder="Search by code, description..."
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 40px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      fontSize: '14px'
                    }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {/* Status Filter */}
                <div style={{ width: '200px' }}>
                  <select
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      fontSize: '14px'
                    }}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    {statusOptions.map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Add Coupon Button */}
                {hasPermission(PERMISSIONS.COUPONS_CREATE) && (
                  <button 
                    onClick={openAddCouponModal}
                    style={buttonStyles.primary}
                  >
                    <FiPlus style={{ width: '16px', height: '16px' }} />
                    Add Coupon
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Coupons Table */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Code
                  </th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Description
                  </th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Discount
                  </th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Min Order
                  </th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Valid Until
                  </th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Status
                  </th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <LoadingSpinner />
                        <span style={{ color: '#6b7280' }}>Loading coupons...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <FiTag style={{ width: '48px', height: '48px', color: '#9ca3af' }} />
                        <span style={{ color: '#6b7280' }}>No coupons found.</span>
                        {search && (
                          <button 
                            onClick={() => setSearch("")}
                            style={{ color: '#2563eb', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentCoupons.map((coupon) => {
                    const status = getStatusBadge(coupon);
                    return (
                      <tr key={coupon._id} style={{ borderTop: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', fontFamily: 'monospace' }}>
                              {coupon.code}
                            </div>
                            <button
                              onClick={() => copyToClipboard(coupon.code)}
                              style={{
                                color: copiedCode === coupon.code ? '#10b981' : '#6b7280',
                                padding: '4px',
                                borderRadius: '4px',
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: 'transparent',
                                transition: 'color 0.2s'
                              }}
                              title="Copy coupon code"
                            >
                              <FiCopy style={{ width: '14px', height: '14px' }} />
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ fontSize: '14px', color: '#111827' }}>
                            {coupon.description || "No description"}
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                            {getDiscountDisplay(coupon)}
                          </div>
                          {coupon.maxDiscountAmount && coupon.discountType === 'percentage' && (
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              Max: ₹{coupon.maxDiscountAmount}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ fontSize: '14px', color: '#111827' }}>
                            {coupon.minOrderAmount ? `₹${coupon.minOrderAmount}` : "No minimum"}
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ fontSize: '14px', color: '#111827' }}>
                            {formatDate(coupon.endDate)}
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{
                            padding: '4px 12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            borderRadius: '9999px',
                            backgroundColor: status.backgroundColor,
                            color: status.color
                          }}>
                            {status.text}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <button 
                              style={{
                                color: status.text === 'Active' ? '#dc2626' : '#16a34a',
                                padding: '8px',
                                borderRadius: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: 'transparent'
                              }}
                              title={status.text === 'Active' ? 'Deactivate' : 'Activate'}
                              onClick={() => handleToggleStatus(coupon)}
                              disabled={new Date(coupon.endDate) <= new Date()}
                            >
                              {status.text === 'Active' ? <FiToggleRight style={{ width: '16px', height: '16px' }} /> : <FiToggleLeft style={{ width: '16px', height: '16px' }} />}
                            </button>
                            {hasPermission(PERMISSIONS.COUPONS_EDIT) && (
                              <button 
                                style={{
                                  color: '#2563eb',
                                  padding: '8px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  backgroundColor: 'transparent'
                                }}
                                title="Edit Coupon"
                                onClick={() => openEditCouponModal(coupon)}
                              >
                                <FiEdit style={{ width: '16px', height: '16px' }} />
                              </button>
                            )}
                            {hasPermission(PERMISSIONS.COUPONS_DELETE) && (
                              <button 
                                style={{
                                  color: '#dc2626',
                                  padding: '8px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  backgroundColor: 'transparent'
                                }}
                                title="Delete Coupon"
                                onClick={() => handleDeleteCoupon(coupon._id, coupon.code)}
                              >
                                <FiTrash2 style={{ width: '16px', height: '16px' }} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginTop: '24px'
          }}>
            <div style={{ fontSize: '14px', color: '#374151' }}>
              Showing {indexOfFirstCoupon + 1} to {Math.min(indexOfLastCoupon, filteredCoupons.length)} of {filteredCoupons.length} coupons
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  ...buttonStyles.secondary,
                  opacity: currentPage === 1 ? 0.5 : 1,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    style={{
                      padding: '8px 12px',
                      fontSize: '14px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      backgroundColor: currentPage === pageNum ? '#000000' : '#ffffff',
                      color: currentPage === pageNum ? '#ffffff' : '#374151',
                      cursor: 'pointer'
                    }}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  ...buttonStyles.secondary,
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Add Coupon Modal */}
        {showAddCouponModal && (
          <div style={{
            position: 'fixed',
            inset: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '50',
            padding: '16px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '24px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827' }}>
                  Add New Coupon
                </h2>
                <button
                  onClick={closeAddCouponModal}
                  style={{ color: '#9ca3af', padding: '4px', borderRadius: '4px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
                >
                  <FiX style={{ width: '24px', height: '24px' }} />
                </button>
              </div>
              
              <div style={{ padding: '24px' }}>
                {error && (
                  <div style={{
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    fontSize: '14px'
                  }}>
                    {error}
                  </div>
                )}
                
                {success && (
                  <div style={{
                    backgroundColor: '#dcfce7',
                    border: '1px solid #bbf7d0',
                    color: '#16a34a',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    fontSize: '14px'
                  }}>
                    {success}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Coupon Code *
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleFormChange}
                      placeholder="Enter coupon code"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#ffffff',
                        color: '#111827',
                        fontSize: '14px',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      placeholder="Enter coupon description"
                      rows="3"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#ffffff',
                        color: '#111827',
                        fontSize: '14px',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Discount Type
                      </label>
                      <select
                        name="discountType"
                        value={formData.discountType}
                        onChange={handleFormChange}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          backgroundColor: '#ffffff',
                          color: '#111827',
                          fontSize: '14px'
                        }}
                      >
                        {discountTypes.map(type => (
                          <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Discount Value *
                      </label>
                      <div style={{ position: 'relative' }}>
                        {formData.discountType === 'percentage' ? (
                          <FiPercent style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#9ca3af',
                            width: '16px',
                            height: '16px'
                          }} />
                        ) : (
                          <FiDollarSign style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#9ca3af',
                            width: '16px',
                            height: '16px'
                          }} />
                        )}
                        <input
                          type="number"
                          name="discountValue"
                          value={formData.discountValue}
                          onChange={handleFormChange}
                          placeholder={formData.discountType === 'percentage' ? "Enter percentage" : "Enter amount"}
                          min="0"
                          step={formData.discountType === 'percentage' ? "1" : "0.01"}
                          style={{
                            width: '100%',
                            padding: '10px 40px 10px 12px',
                            borderRadius: '6px',
                            border: '1px solid #d1d5db',
                            backgroundColor: '#ffffff',
                            color: '#111827',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {formData.discountType === 'percentage' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Maximum Discount Amount (Optional)
                      </label>
                      <div style={{ position: 'relative' }}>
                        <FiDollarSign style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#9ca3af',
                          width: '16px',
                          height: '16px'
                        }} />
                        <input
                          type="number"
                          name="maxDiscountAmount"
                          value={formData.maxDiscountAmount}
                          onChange={handleFormChange}
                          placeholder="Enter maximum discount amount"
                          min="0"
                          step="0.01"
                          style={{
                            width: '100%',
                            padding: '10px 12px 10px 40px',
                            borderRadius: '6px',
                            border: '1px solid #d1d5db',
                            backgroundColor: '#ffffff',
                            color: '#111827',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Minimum Order Amount (Optional)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <FiDollarSign style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9ca3af',
                        width: '16px',
                        height: '16px'
                      }} />
                      <input
                        type="number"
                        name="minOrderAmount"
                        value={formData.minOrderAmount}
                        onChange={handleFormChange}
                        placeholder="Enter minimum order amount"
                        min="0"
                        step="0.01"
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 40px',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          backgroundColor: '#ffffff',
                          color: '#111827',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Start Date *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <FiCalendar style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#9ca3af',
                          width: '16px',
                          height: '16px'
                        }} />
                        <input
                          type="date"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleFormChange}
                          style={{
                            width: '100%',
                            padding: '10px 12px 10px 40px',
                            borderRadius: '6px',
                            border: '1px solid #d1d5db',
                            backgroundColor: '#ffffff',
                            color: '#111827',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        End Date *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <FiCalendar style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#9ca3af',
                          width: '16px',
                          height: '16px'
                        }} />
                        <input
                          type="date"
                          name="endDate"
                          value={formData.endDate}
                          onChange={handleFormChange}
                          style={{
                            width: '100%',
                            padding: '10px 12px 10px 40px',
                            borderRadius: '6px',
                            border: '1px solid #d1d5db',
                            backgroundColor: '#ffffff',
                            color: '#111827',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Usage Limit (Optional)
                    </label>
                    <input
                      type="number"
                      name="usageLimit"
                      value={formData.usageLimit}
                      onChange={handleFormChange}
                      placeholder="Enter maximum number of uses"
                      min="1"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#ffffff',
                        color: '#111827',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px'
                      }}
                    />
                    <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Active Coupon
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    onClick={closeAddCouponModal}
                    style={{
                      ...buttonStyles.secondary,
                      flex: 1
                    }}
                    disabled={formLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCoupon}
                    disabled={formLoading || !formData.code || !formData.discountValue || !formData.startDate || !formData.endDate}
                    style={{
                      ...buttonStyles.primary,
                      flex: 1,
                      opacity: (formLoading || !formData.code || !formData.discountValue || !formData.startDate || !formData.endDate) ? 0.5 : 1,
                      cursor: (formLoading || !formData.code || !formData.discountValue || !formData.startDate || !formData.endDate) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {formLoading ? (
                      <>
                        <LoadingSpinner size={16} color="#ffffff" />
                        Creating...
                      </>
                    ) : (
                      "Add Coupon"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Coupon Modal */}
        {showEditCouponModal && (
          <div style={{
            position: 'fixed',
            inset: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '50',
            padding: '16px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '24px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827' }}>
                  Edit Coupon
                </h2>
                <button
                  onClick={closeEditCouponModal}
                  style={{ color: '#9ca3af', padding: '4px', borderRadius: '4px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
                >
                  <FiX style={{ width: '24px', height: '24px' }} />
                </button>
              </div>
              
              <div style={{ padding: '24px' }}>
                {error && (
                  <div style={{
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    fontSize: '14px'
                  }}>
                    {error}
                  </div>
                )}
                
                {success && (
                  <div style={{
                    backgroundColor: '#dcfce7',
                    border: '1px solid #bbf7d0',
                    color: '#16a34a',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    fontSize: '14px'
                  }}>
                    {success}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Coupon Code *
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleFormChange}
                      placeholder="Enter coupon code"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#ffffff',
                        color: '#111827',
                        fontSize: '14px',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      placeholder="Enter coupon description"
                      rows="3"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#ffffff',
                        color: '#111827',
                        fontSize: '14px',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Discount Type
                      </label>
                      <select
                        name="discountType"
                        value={formData.discountType}
                        onChange={handleFormChange}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          backgroundColor: '#ffffff',
                          color: '#111827',
                          fontSize: '14px'
                        }}
                      >
                        {discountTypes.map(type => (
                          <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Discount Value *
                      </label>
                      <div style={{ position: 'relative' }}>
                        {formData.discountType === 'percentage' ? (
                          <FiPercent style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#9ca3af',
                            width: '16px',
                            height: '16px'
                          }} />
                        ) : (
                          <FiDollarSign style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#9ca3af',
                            width: '16px',
                            height: '16px'
                          }} />
                        )}
                        <input
                          type="number"
                          name="discountValue"
                          value={formData.discountValue}
                          onChange={handleFormChange}
                          placeholder={formData.discountType === 'percentage' ? "Enter percentage" : "Enter amount"}
                          min="0"
                          step={formData.discountType === 'percentage' ? "1" : "0.01"}
                          style={{
                            width: '100%',
                            padding: '10px 40px 10px 12px',
                            borderRadius: '6px',
                            border: '1px solid #d1d5db',
                            backgroundColor: '#ffffff',
                            color: '#111827',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {formData.discountType === 'percentage' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Maximum Discount Amount (Optional)
                      </label>
                      <div style={{ position: 'relative' }}>
                        <FiDollarSign style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#9ca3af',
                          width: '16px',
                          height: '16px'
                        }} />
                        <input
                          type="number"
                          name="maxDiscountAmount"
                          value={formData.maxDiscountAmount}
                          onChange={handleFormChange}
                          placeholder="Enter maximum discount amount"
                          min="0"
                          step="0.01"
                          style={{
                            width: '100%',
                            padding: '10px 12px 10px 40px',
                            borderRadius: '6px',
                            border: '1px solid #d1d5db',
                            backgroundColor: '#ffffff',
                            color: '#111827',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Minimum Order Amount (Optional)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <FiDollarSign style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9ca3af',
                        width: '16px',
                        height: '16px'
                      }} />
                      <input
                        type="number"
                        name="minOrderAmount"
                        value={formData.minOrderAmount}
                        onChange={handleFormChange}
                        placeholder="Enter minimum order amount"
                        min="0"
                        step="0.01"
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 40px',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          backgroundColor: '#ffffff',
                          color: '#111827',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Start Date *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <FiCalendar style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#9ca3af',
                          width: '16px',
                          height: '16px'
                        }} />
                        <input
                          type="date"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleFormChange}
                          style={{
                            width: '100%',
                            padding: '10px 12px 10px 40px',
                            borderRadius: '6px',
                            border: '1px solid #d1d5db',
                            backgroundColor: '#ffffff',
                            color: '#111827',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        End Date *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <FiCalendar style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#9ca3af',
                          width: '16px',
                          height: '16px'
                        }} />
                        <input
                          type="date"
                          name="endDate"
                          value={formData.endDate}
                          onChange={handleFormChange}
                          style={{
                            width: '100%',
                            padding: '10px 12px 10px 40px',
                            borderRadius: '6px',
                            border: '1px solid #d1d5db',
                            backgroundColor: '#ffffff',
                            color: '#111827',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Usage Limit (Optional)
                    </label>
                    <input
                      type="number"
                      name="usageLimit"
                      value={formData.usageLimit}
                      onChange={handleFormChange}
                      placeholder="Enter maximum number of uses"
                      min="1"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#ffffff',
                        color: '#111827',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px'
                      }}
                    />
                    <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Active Coupon
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    onClick={closeEditCouponModal}
                    style={{
                      ...buttonStyles.secondary,
                      flex: 1
                    }}
                    disabled={formLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditCoupon}
                    disabled={formLoading || !formData.code || !formData.discountValue || !formData.startDate || !formData.endDate}
                    style={{
                      ...buttonStyles.primary,
                      flex: 1,
                      opacity: (formLoading || !formData.code || !formData.discountValue || !formData.startDate || !formData.endDate) ? 0.5 : 1,
                      cursor: (formLoading || !formData.code || !formData.discountValue || !formData.startDate || !formData.endDate) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {formLoading ? (
                      <>
                        <LoadingSpinner size={16} color="#ffffff" />
                        Updating...
                      </>
                    ) : (
                      "Update Coupon"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CouponsPage;