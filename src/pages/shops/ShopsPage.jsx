import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Building2, RefreshCw, Filter, Search, X,
    MapPin, Shield, CheckCircle, XCircle, Trash2,
    Eye, Star, MoreVertical, BadgeCheck, BadgeAlert,
    Loader2, AlertCircle, Plus, Edit2, Save
} from 'lucide-react';
import usePermissions from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../config/permissions';

const ShopsPage = () => {
    const { hasPermission } = usePermissions();
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(false); // Changed to false by default to handle initial state better
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        isVerified: '',
        isActive: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalShops: 0
    });
    const [selectedShop, setSelectedShop] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [sellers, setSellers] = useState([]);
    const [formData, setFormData] = useState({
        seller: '',
        shopName: '',
        tagline: '',
        description: '',
        contactEmail: '',
        contactPhone: '',
        address: {
            street: '',
            city: '',
            state: '',
            pincode: '',
            country: 'India'
        },
        isVerified: false,
        isActive: true,
        isOpen: true
    });
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchShops();
    }, [pagination.currentPage, filters, searchTerm]);

    useEffect(() => {
        fetchSellers();
    }, []);

    const fetchSellers = async () => {
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
            const baseUrl = import.meta.env.VITE_BASE_URL || 'https://api.fast2.in';
            const response = await fetch(`${baseUrl}/api/admin/seller/sellers`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to fetch sellers');
            const data = await response.json();
            const fetchedArray = data.data || (Array.isArray(data) ? data : []);

            const sortedSellers = [...fetchedArray].sort((a, b) => {
                const nameA = String(a.name || a.businessName || '');
                const nameB = String(b.name || b.businessName || '');
                return nameA.localeCompare(nameB);
            });

            console.log("Fetched sellers:", sortedSellers.length);
            setSellers(sortedSellers);
        } catch (error) {
            console.error('Error fetching sellers:', error);
            setSellers([]);
        }
    };

    const fetchShops = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
            const baseUrl = import.meta.env.VITE_BASE_URL || 'https://api.fast2.in';

            const queryParams = new URLSearchParams({
                page: pagination.currentPage,
                limit: 10,
                search: searchTerm || '',
                isVerified: filters.isVerified,
                isActive: filters.isActive,
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder
            });

            const response = await fetch(`${baseUrl}/api/admin/shops?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to fetch shops');
            const data = await response.json();

            if (data.success) {
                setShops(data.data || []);
                setPagination(prev => ({
                    ...prev,
                    totalPages: data.pagination?.totalPages || 1,
                    totalShops: data.pagination?.totalShops || 0
                }));
            } else {
                setShops(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
            }
        } catch (error) {
            console.error('Error fetching shops:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleToggleVerify = async (shopId) => {
        try {
            setActionLoading(shopId + '_verify');
            const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
            const response = await axios.patch(
                `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/shops/${shopId}/verify`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                setShops(shops.map(s => s._id === shopId ? { ...s, isVerified: response.data.isVerified } : s));
            }
        } catch (error) {
            console.error('Error toggling verification:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleStatus = async (shopId) => {
        try {
            setActionLoading(shopId + '_status');
            const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
            const response = await axios.patch(
                `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/shops/${shopId}/status`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                setShops(shops.map(s => s._id === shopId ? { ...s, isActive: response.data.isActive } : s));
            }
        } catch (error) {
            console.error('Error toggling status:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteShop = async (shopId) => {
        if (!window.confirm('Are you sure you want to delete this shop? This action is irreversible.')) return;
        try {
            setActionLoading(shopId + '_delete');
            const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
            const response = await axios.delete(
                `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/shops/${shopId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                setShops(shops.filter(s => s._id !== shopId));
            }
        } catch (error) {
            console.error('Error deleting shop:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleOpenForm = (shop = null) => {
        if (shop) {
            setIsEditing(true);
            setSelectedShop(shop);
            setFormData({
                shopName: shop.shopName || '',
                tagline: shop.tagline || '',
                description: shop.description || '',
                contactEmail: shop.contactEmail || '',
                contactPhone: shop.contactPhone || '',
                address: {
                    street: shop.address?.street || '',
                    city: shop.address?.city || '',
                    state: shop.address?.state || '',
                    pincode: shop.address?.pincode || '',
                    country: shop.address?.country || 'India'
                },
                isVerified: shop.isVerified || false,
                isActive: shop.isActive || false,
                isOpen: shop.isOpen || false
            });
        } else {
            setIsEditing(false);
            setSelectedShop(null);
            setFormData({
                seller: '',
                shopName: '',
                tagline: '',
                description: '',
                contactEmail: '',
                contactPhone: '',
                address: {
                    street: '',
                    city: '',
                    state: '',
                    pincode: '',
                    country: 'India'
                },
                isVerified: false,
                isActive: true,
                isOpen: true
            });
        }
        setIsFormModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setActionLoading('submit');
            const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
            const url = `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/shops${isEditing ? `/${selectedShop._id}` : ''}`;
            const method = isEditing ? 'put' : 'post';

            const response = await axios({
                method,
                url,
                data: formData,
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                fetchShops();
                setIsFormModalOpen(false);
                alert(isEditing ? 'Shop updated successfully' : 'Shop created successfully');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert(error.response?.data?.message || 'Error processing request');
        } finally {
            setActionLoading(null);
        }
    };



    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Building2 className="w-8 h-8 text-blue-600" />
                        Shop Management
                    </h1>
                    <p className="text-gray-500 mt-1">Monitor and manage all seller shops across the platform</p>
                </div>
                <div className="flex items-center gap-2">
                    {hasPermission(PERMISSIONS.SHOPS_EDIT) && (
                        <button
                            onClick={() => handleOpenForm()}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            style={{ backgroundColor: 'blue' }}
                        >
                            <Plus className="w-4 h-4" />
                            Create Shop
                        </button>
                    )}
                    <button
                        onClick={() => { setRefreshing(true); fetchShops(); }}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        style={{ backgroundColor: 'blue', color: 'white' }}
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Total Shops</p>
                    <div className="flex items-center justify-between mt-2">
                        <h3 className="text-2xl font-bold">{pagination.totalShops}</h3>
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Building2 className="w-5 h-5" />
                        </div>
                    </div>
                </div>
                {/* Simplified stats for now */}
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by shop name or slug..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filters.isVerified}
                            onChange={(e) => setFilters({ ...filters, isVerified: e.target.value })}
                        >
                            <option value="">All Verification</option>
                            <option value="true">Verified</option>
                            <option value="false">Unverified</option>
                        </select>
                        <select
                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filters.isActive}
                            onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
                        >
                            <option value="">All Status</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Shop Info</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Seller Details</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Location</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Performance</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && !shops.length ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                            <p>Loading shops...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : shops.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        No shops found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                shops.map((shop) => (
                                    <tr key={shop._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                                                    {shop.logo?.url ? (
                                                        <img src={shop.logo.url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Building2 className="w-full h-full p-2 text-gray-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 flex items-center gap-1">
                                                        {shop.shopName}
                                                        {shop.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-50" />}
                                                    </p>
                                                    <p className="text-xs text-gray-500 font-mono">/{shop.shopSlug}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-gray-700">{shop.seller?.businessName || 'N/A'}</p>
                                            <p className="text-xs text-gray-500">{shop.seller?.phone || 'No phone'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                {shop.address?.city}, {shop.address?.pincode}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                                    <span className="text-sm font-bold text-gray-700">{shop.rating?.average || 0}</span>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    <span className="font-semibold text-gray-700">{shop.analytics?.totalOrders || 0}</span> orders
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${shop.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {shop.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${shop.isOpen ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {shop.isOpen ? 'Open' : 'On Vacation'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openShopDetail(shop._id)}
                                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View Details"
                                                    style={{ backgroundColor: 'blue', color: 'white' }}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>

                                                {hasPermission(PERMISSIONS.SHOPS_EDIT) && (
                                                    <button
                                                        onClick={() => handleOpenForm(shop)}
                                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit Shop"
                                                        style={{ backgroundColor: 'blue', color: 'white' }}
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                )}

                                                {hasPermission(PERMISSIONS.SHOPS_EDIT) && (
                                                    <>
                                                        <button
                                                            onClick={() => handleToggleVerify(shop._id)}
                                                            disabled={actionLoading === shop._id + '_verify'}
                                                            className={`p-1.5 rounded-lg transition-colors ${shop.isVerified ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-gray-400 hover:bg-gray-100'
                                                                }`}
                                                            title={shop.isVerified ? "Unverify Shop" : "Verify Shop"}
                                                            style={{ backgroundColor: 'blue', color: 'white' }}
                                                        >
                                                            {actionLoading === shop._id + '_verify' ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <BadgeCheck className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleStatus(shop._id)}
                                                            disabled={actionLoading === shop._id + '_status'}
                                                            className={`p-1.5 rounded-lg transition-colors ${shop.isActive ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-red-600 bg-red-50 hover:bg-red-100'
                                                                }`}
                                                            title={shop.isActive ? "Deactivate Shop" : "Activate Shop"}
                                                            style={{ backgroundColor: 'blue', color: 'white' }}
                                                        >
                                                            {actionLoading === shop._id + '_status' ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : shop.isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                        </button>
                                                    </>
                                                )}

                                                {hasPermission(PERMISSIONS.SHOPS_DELETE) && (
                                                    <button
                                                        onClick={() => handleDeleteShop(shop._id)}
                                                        disabled={actionLoading === shop._id + '_delete'}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete Shop"
                                                        style={{ backgroundColor: 'blue', color: 'white' }}
                                                    >
                                                        {actionLoading === shop._id + '_delete' ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <Trash2 className="w-4 h-4" />}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <p className="text-sm text-gray-500">
                            Showing <span className="font-semibold text-gray-900">{shops.length}</span> of <span className="font-semibold text-gray-900">{pagination.totalShops}</span> shops
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagination({ ...pagination, currentPage: Math.max(1, pagination.currentPage - 1) })}
                                disabled={pagination.currentPage === 1}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                style={{ backgroundColor: 'blue', color: 'white' }}
                            >
                                Previous
                            </button>
                            <span className="text-sm font-medium text-gray-700 px-4">Page {pagination.currentPage} of {pagination.totalPages}</span>
                            <button
                                onClick={() => setPagination({ ...pagination, currentPage: Math.min(pagination.totalPages, pagination.currentPage + 1) })}
                                disabled={pagination.currentPage === pagination.totalPages}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                style={{ backgroundColor: 'blue', color: 'white' }}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Form Modal */}
            {isFormModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    {isEditing ? <Edit2 className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
                                    {isEditing ? 'Edit Shop Details' : 'Create New Shop'}
                                </h2>
                                <button type="button" onClick={() => setIsFormModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" style={{ backgroundColor: 'blue', color: 'white' }}>
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
                                {!isEditing && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Select Seller *</label>
                                        <select
                                            required
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.seller}
                                            onChange={(e) => setFormData({ ...formData, seller: e.target.value })}
                                        >
                                            <option value="">Choose a seller...</option>
                                            {sellers.map(s => (
                                                <option key={s._id} value={s._id}>
                                                    {s.name} - {s.businessName} ({s.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Shop Name *</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.shopName}
                                            onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Tagline</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.tagline}
                                            onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Description</label>
                                    <textarea
                                        rows="3"
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Contact Email</label>
                                        <input
                                            type="email"
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.contactEmail}
                                            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Contact Phone</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.contactPhone}
                                            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-6">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Location Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Street Address</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={formData.address.street}
                                                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">City</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={formData.address.city}
                                                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">State</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={formData.address.state}
                                                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Pincode</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={formData.address.pincode}
                                                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-6 pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            checked={formData.isVerified}
                                            onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                                        />
                                        <span className="text-sm font-medium text-gray-700">Verified Shop</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        />
                                        <span className="text-sm font-medium text-gray-700">Active Status</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            checked={formData.isOpen}
                                            onChange={(e) => setFormData({ ...formData, isOpen: e.target.checked })}
                                        />
                                        <span className="text-sm font-medium text-gray-700">Shop Open</span>
                                    </label>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsFormModalOpen(false)}
                                    className="px-6 py-2 bg-white border border-gray-200 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-50 shadow-sm"
                                    style={{ backgroundColor: 'blue', color: 'white' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading === 'submit'}
                                    className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2 disabled:opacity-70"
                                    style={{ backgroundColor: 'blue', color: 'white' }}
                                >
                                    {actionLoading === 'submit' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {isEditing ? 'Save Changes' : 'Create Shop'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isDetailModalOpen && selectedShop && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-blue-600" />
                                Shop Details
                            </h2>
                            <button onClick={() => setIsDetailModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" style={{ backgroundColor: 'blue', color: 'white' }}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            {/* Detailed view of shop info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <section>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Core Information</h4>
                                    <div className="space-y-4">
                                        <div className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                                            <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden bg-white">
                                                {selectedShop.logo?.url ? <img src={selectedShop.logo.url} className="w-full h-full object-cover" /> : <Building2 className="w-full h-full p-3 text-gray-300" />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{selectedShop.shopName}</h3>
                                                <p className="text-sm text-gray-500">/{selectedShop.shopSlug}</p>
                                                <div className="mt-2 flex gap-2">
                                                    {selectedShop.isVerified && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">VERIFIED</span>}
                                                    {selectedShop.isActive ? <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">ACTIVE</span> : <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold">DEACTIVATED</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-white border border-gray-100 rounded-xl space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Tagline</span>
                                                <span className="font-medium text-gray-900 italic">{selectedShop.tagline || 'No tagline'}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Followers</span>
                                                <span className="font-medium text-gray-900">{selectedShop.followersCount || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Seller/Business Info</h4>
                                    <div className="p-4 bg-gray-900 rounded-xl text-white space-y-4 shadow-lg shadow-gray-200">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Registered Name</p>
                                            <p className="font-semibold">{selectedShop.seller?.name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Business Contact</p>
                                            <p className="text-sm">{selectedShop.seller?.email}</p>
                                            <p className="text-sm">{selectedShop.seller?.phone}</p>
                                        </div>
                                        <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
                                            <span className="text-xs text-gray-400 font-medium">Auto-Created Shop</span>
                                            <span className="text-xs px-2 py-0.5 bg-gray-800 rounded text-gray-300">Fast2 Seller Network</span>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="mt-8">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Location & Logistics</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-white border border-gray-100 rounded-xl">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">City/Area</p>
                                        <p className="text-sm font-semibold">{selectedShop.address?.city}</p>
                                        <p className="text-xs text-gray-500">{selectedShop.address?.state}</p>
                                    </div>
                                    <div className="p-4 bg-white border border-gray-100 rounded-xl">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Pincode</p>
                                        <p className="text-sm font-semibold">{selectedShop.address?.pincode}</p>
                                    </div>
                                    <div className="p-4 bg-white border border-gray-100 rounded-xl">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Shipping Policy</p>
                                        <p className="text-xs">Est: {selectedShop.shippingPolicy?.estimatedDeliveryDays} days</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="px-6 py-2 bg-white border border-gray-200 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-50 shadow-sm"
                                style={{ backgroundColor: 'blue', color: 'white' }}
                            >
                                Close View
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShopsPage;
