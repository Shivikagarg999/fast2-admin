import { useState, useEffect, useCallback } from 'react';
import {
    Building2, RefreshCw, Search, X,
    MapPin, CheckCircle, XCircle, Trash2,
    Eye, Star, BadgeCheck,
    Loader2, Plus, Edit2, Save,
    Image, Video, Camera, Upload
} from 'lucide-react';
import usePermissions from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../config/permissions';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://api.fast2.in';

const getToken = () =>
    localStorage.getItem('adminToken') || localStorage.getItem('token') || '';

const authHeaders = () => ({
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
});

const ShopsPage = () => {
    const { hasPermission } = usePermissions();

    // ─── State ────────────────────────────────────────────────────────────────────
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        isVerified: '',
        isActive: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalShops: 0,
    });
    const [selectedShop, setSelectedShop] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [sellers, setSellers] = useState([]);
    const [sellersLoading, setSellersLoading] = useState(false);
    const [formData, setFormData] = useState({
        seller: '',
        shopName: '',
        tagline: '',
        description: '',
        contactEmail: '',
        contactPhone: '',
        address: { street: '', city: '', state: '', pincode: '', country: 'India' },
        isVerified: false,
        isActive: true,
        isOpen: true,
        shopType: 'general',
        timings: {
            monday: { open: '09:00', close: '18:00', closed: false },
            tuesday: { open: '09:00', close: '18:00', closed: false },
            wednesday: { open: '09:00', close: '18:00', closed: false },
            thursday: { open: '09:00', close: '18:00', closed: false },
            friday: { open: '09:00', close: '18:00', closed: false },
            saturday: { open: '09:00', close: '18:00', closed: false },
            sunday: { open: '09:00', close: '18:00', closed: false },
            timezone: 'Asia/Kolkata'
        }
    });
    const [actionLoading, setActionLoading] = useState(null);
    const [formError, setFormError] = useState('');
    const [logoPreview, setLogoPreview] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);

    // ─── Fetch Shops ──────────────────────────────────────────────────────────────
    const fetchShops = useCallback(async (page = pagination.currentPage) => {
        try {
            setLoading(true);
            setError('');

            const queryParams = new URLSearchParams({
                page,
                limit: 10,
                ...(searchTerm && { search: searchTerm }),
                ...(filters.isVerified !== '' && { isVerified: filters.isVerified }),
                ...(filters.isActive !== '' && { isActive: filters.isActive }),
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder,
            });

            const response = await fetch(`${BASE_URL}/api/admin/shops?${queryParams}`, {
                headers: authHeaders(),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || `Server error ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setShops(data.data || []);
                setPagination(prev => ({
                    ...prev,
                    currentPage: page,
                    totalPages: data.pagination?.totalPages || 1,
                    totalShops: data.pagination?.totalShops || 0,
                }));
            } else {
                throw new Error(data.message || 'Failed to load shops');
            }
        } catch (err) {
            console.error('fetchShops error:', err);
            setError(err.message || 'Failed to load shops');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [pagination.currentPage, filters, searchTerm]);

    // ─── Fetch ALL Sellers for dropdown ──────────────────────────────────────────
    const fetchSellers = async () => {
        try {
            setSellersLoading(true);
            // Use a large limit to get all sellers for the dropdown
            const response = await fetch(
                `${BASE_URL}/api/admin/seller/sellers?limit=1000&sortBy=name&sortOrder=asc`,
                { headers: authHeaders() }
            );
            if (!response.ok) throw new Error('Failed to fetch sellers');
            const data = await response.json();

            const list = data.data || (Array.isArray(data) ? data : []);
            const sorted = [...list].sort((a, b) =>
                String(a.name || a.businessName || '').localeCompare(
                    String(b.name || b.businessName || '')
                )
            );
            setSellers(sorted);
        } catch (err) {
            console.error('fetchSellers error:', err);
            setSellers([]);
        } finally {
            setSellersLoading(false);
        }
    };

    // ─── Open Shop Detail Modal ───────────────────────────────────────────────────
    const openShopDetail = async (shopId) => {
        try {
            setActionLoading(shopId + '_view');
            const response = await fetch(`${BASE_URL}/api/admin/shops/${shopId}`, {
                headers: authHeaders(),
            });
            if (!response.ok) throw new Error('Failed to fetch shop details');
            const data = await response.json();
            if (data.success) {
                setSelectedShop(data.data);
                setIsDetailModalOpen(true);
            } else {
                throw new Error(data.message || 'Could not load shop details');
            }
        } catch (err) {
            console.error('openShopDetail error:', err);
            alert(err.message || 'Could not load shop details. Please try again.');
        } finally {
            setActionLoading(null);
        }
    };

    // ─── Open Create / Edit Form ──────────────────────────────────────────────────
    const handleOpenForm = (shop = null) => {
        setFormError('');
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
                    country: shop.address?.country || 'India',
                },
                isVerified: shop.isVerified || false,
                isActive: shop.isActive !== undefined ? shop.isActive : true,
                isOpen: shop.isOpen !== undefined ? shop.isOpen : true,
                shopType: shop.shopType || 'general',
                seller: shop.seller?._id || shop.seller || '',
                timings: shop.timings || {
                    monday: { open: '09:00', close: '18:00', closed: false },
                    tuesday: { open: '09:00', close: '18:00', closed: false },
                    wednesday: { open: '09:00', close: '18:00', closed: false },
                    thursday: { open: '09:00', close: '18:00', closed: false },
                    friday: { open: '09:00', close: '18:00', closed: false },
                    saturday: { open: '09:00', close: '18:00', closed: false },
                    sunday: { open: '09:00', close: '18:00', closed: false },
                    timezone: 'Asia/Kolkata'
                }
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
                address: { street: '', city: '', state: '', pincode: '', country: 'India' },
                isVerified: false,
                isActive: true,
                isOpen: true,
                shopType: 'general',
                timings: {
                    monday: { open: '09:00', close: '18:00', closed: false },
                    tuesday: { open: '09:00', close: '18:00', closed: false },
                    wednesday: { open: '09:00', close: '18:00', closed: false },
                    thursday: { open: '09:00', close: '18:00', closed: false },
                    friday: { open: '09:00', close: '18:00', closed: false },
                    saturday: { open: '09:00', close: '18:00', closed: false },
                    sunday: { open: '09:00', close: '18:00', closed: false },
                    timezone: 'Asia/Kolkata'
                }
            });
        }
        setLogoPreview(shop?.logo?.url || null);
        setCoverPreview(shop?.coverImage?.url || null);
        setVideoPreview(shop?.video?.url || null);
        setIsFormModalOpen(true);
    };

    // ─── Submit Create / Edit ─────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!isEditing && !formData.seller) {
            setFormError('Please select a seller.');
            return;
        }
        if (!formData.shopName.trim()) {
            setFormError('Shop Name is required.');
            return;
        }

        try {
            setActionLoading('submit');
            const url = isEditing
                ? `${BASE_URL}/api/admin/shops/${selectedShop._id}`
                : `${BASE_URL}/api/admin/shops`;

            const formDataToSend = new FormData();
            
            // Append all non-file fields
            Object.keys(formData).forEach(key => {
                if (key === 'address' || key === 'socialLinks' || key === 'timings') {
                    formDataToSend.append(key, JSON.stringify(formData[key]));
                } else {
                    formDataToSend.append(key, formData[key]);
                }
            });

            // Append files
            const logoInput = document.getElementById('shop-logo-input');
            const coverInput = document.getElementById('shop-cover-input');
            const videoInput = document.getElementById('shop-video-input');

            if (logoInput?.files[0]) formDataToSend.append('logo', logoInput.files[0]);
            if (coverInput?.files[0]) formDataToSend.append('coverImage', coverInput.files[0]);
            if (videoInput?.files[0]) formDataToSend.append('video', videoInput.files[0]);

            // Create custom headers (no Content-Type for FormData as browser sets boundary)
            const headers = {
                'Authorization': `Bearer ${getToken()}`
            };

            const response = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                headers,
                body: formDataToSend,
            });

            const result = await response.json();

            if (response.ok && result.success) {
                await fetchShops(pagination.currentPage);
                setIsFormModalOpen(false);
            } else {
                throw new Error(result.message || 'Error processing request');
            }
        } catch (err) {
            console.error('handleSubmit error:', err);
            setFormError(err.message || 'Error processing request. Please try again.');
        } finally {
            setActionLoading(null);
        }
    };

    // ─── Toggle Verification ──────────────────────────────────────────────────────
    const handleToggleVerify = async (shopId) => {
        try {
            setActionLoading(shopId + '_verify');
            const response = await fetch(
                `${BASE_URL}/api/admin/shops/${shopId}/verify`,
                { method: 'PATCH', headers: authHeaders() }
            );
            const result = await response.json();
            if (response.ok && result.success) {
                setShops(prev =>
                    prev.map(s => s._id === shopId ? { ...s, isVerified: result.isVerified } : s)
                );
            } else {
                alert(result.message || 'Failed to update verification');
            }
        } catch (err) {
            console.error('handleToggleVerify error:', err);
        } finally {
            setActionLoading(null);
        }
    };

    // ─── Toggle Active Status ─────────────────────────────────────────────────────
    const handleToggleStatus = async (shopId) => {
        try {
            setActionLoading(shopId + '_status');
            const response = await fetch(
                `${BASE_URL}/api/admin/shops/${shopId}/status`,
                { method: 'PATCH', headers: authHeaders() }
            );
            const result = await response.json();
            if (response.ok && result.success) {
                setShops(prev =>
                    prev.map(s => s._id === shopId ? { ...s, isActive: result.isActive } : s)
                );
            } else {
                alert(result.message || 'Failed to update status');
            }
        } catch (err) {
            console.error('handleToggleStatus error:', err);
        } finally {
            setActionLoading(null);
        }
    };

    // ─── Delete Shop ──────────────────────────────────────────────────────────────
    const handleDeleteShop = async (shopId) => {
        if (!window.confirm('Are you sure you want to delete this shop? This action is irreversible.')) return;
        try {
            setActionLoading(shopId + '_delete');
            const response = await fetch(`${BASE_URL}/api/admin/shops/${shopId}`, {
                method: 'DELETE',
                headers: authHeaders(),
            });
            const result = await response.json();
            if (response.ok && result.success) {
                setShops(prev => prev.filter(s => s._id !== shopId));
                setPagination(prev => ({ ...prev, totalShops: prev.totalShops - 1 }));
            } else {
                alert(result.message || 'Failed to delete shop');
            }
        } catch (err) {
            console.error('handleDeleteShop error:', err);
        } finally {
            setActionLoading(null);
        }
    };

    // ─── Handle File Change ───────────────────────────────────────────────────────
    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const preview = reader.result;
            switch (type) {
                case 'logo':
                    setLogoPreview(preview);
                    break;
                case 'coverImage':
                    setCoverPreview(preview);
                    break;
                case 'video':
                    setVideoPreview(preview);
                    break;
            }
        };
        reader.readAsDataURL(file);
    };

    // ─── Effects ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        fetchShops(1);
    }, [filters, searchTerm]);

    useEffect(() => {
        if (pagination.currentPage > 1) {
            fetchShops(pagination.currentPage);
        }
    }, [pagination.currentPage]);

    useEffect(() => {
        fetchSellers();
    }, []);

    // ─── Render ───────────────────────────────────────────────────────────────────
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
                            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors shadow-sm"
                            style={{ backgroundColor: 'black' }}
                        >
                            <Plus className="w-4 h-4" />
                            Create Shop
                        </button>
                    )}
                    <button
                        onClick={() => { setRefreshing(true); fetchShops(pagination.currentPage); }}
                        className="flex items-center gap-2 px-4 py-2 text-white border border-gray-200 rounded-lg hover:opacity-90 transition-colors"
                        style={{ backgroundColor: 'black' }}
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
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Active Shops</p>
                    <div className="flex items-center justify-between mt-2">
                        <h3 className="text-2xl font-bold text-green-600">
                            {shops.filter(s => s.isActive).length}
                        </h3>
                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Verified Shops</p>
                    <div className="flex items-center justify-between mt-2">
                        <h3 className="text-2xl font-bold text-blue-600">
                            {shops.filter(s => s.isVerified).length}
                        </h3>
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <BadgeCheck className="w-5 h-5" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Currently Open</p>
                    <div className="flex items-center justify-between mt-2">
                        <h3 className="text-2xl font-bold text-orange-600">
                            {shops.filter(s => s.isOpen).length}
                        </h3>
                        <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                            <Star className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                    <XCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                    <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
                </div>
            )}

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
                            onChange={(e) => setFilters(f => ({ ...f, isVerified: e.target.value }))}
                        >
                            <option value="">All Verification</option>
                            <option value="true">Verified</option>
                            <option value="false">Unverified</option>
                        </select>
                        <select
                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filters.isActive}
                            onChange={(e) => setFilters(f => ({ ...f, isActive: e.target.value }))}
                        >
                            <option value="">All Status</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                        <select
                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filters.sortOrder}
                            onChange={(e) => setFilters(f => ({ ...f, sortOrder: e.target.value }))}
                        >
                            <option value="desc">Newest First</option>
                            <option value="asc">Oldest First</option>
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
                                                        {shop.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                                                        {shop.shopType === 'medical' && (
                                                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded leading-none border border-emerald-200">
                                                                MEDICAL
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-gray-500 font-mono">/{shop.shopSlug}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-gray-700">{shop.seller?.businessName || shop.seller?.name || 'N/A'}</p>
                                            <p className="text-xs text-gray-500">{shop.seller?.phone || 'No phone'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                {shop.address?.city || '—'}{shop.address?.pincode ? `, ${shop.address.pincode}` : ''}
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
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${shop.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {shop.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${shop.isOpen ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {shop.isOpen ? 'Open' : 'On Vacation'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* View */}
                                                <button
                                                    onClick={() => openShopDetail(shop._id)}
                                                    disabled={actionLoading === shop._id + '_view'}
                                                    className="p-1.5 text-white rounded-lg hover:opacity-90 transition-colors"
                                                    style={{ backgroundColor: 'black' }}
                                                    title="View Details"
                                                >
                                                    {actionLoading === shop._id + '_view'
                                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                                        : <Eye className="w-4 h-4" />}
                                                </button>

                                                {hasPermission(PERMISSIONS.SHOPS_EDIT) && (
                                                    <>
                                                        {/* Edit */}
                                                        <button
                                                            onClick={() => handleOpenForm(shop)}
                                                            className="p-1.5 text-white rounded-lg hover:opacity-90 transition-colors"
                                                            style={{ backgroundColor: 'black' }}
                                                            title="Edit Shop"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>

                                                        {/* Verify Toggle */}
                                                        <button
                                                            onClick={() => handleToggleVerify(shop._id)}
                                                            disabled={actionLoading === shop._id + '_verify'}
                                                            className={`p-1.5 rounded-lg transition-colors text-white hover:opacity-90`}
                                                            style={{ backgroundColor: 'black' }}
                                                            title={shop.isVerified ? 'Unverify Shop' : 'Verify Shop'}
                                                        >
                                                            {actionLoading === shop._id + '_verify'
                                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                                : <BadgeCheck className="w-4 h-4" />}
                                                        </button>

                                                        {/* Active Toggle */}
                                                        <button
                                                            onClick={() => handleToggleStatus(shop._id)}
                                                            disabled={actionLoading === shop._id + '_status'}
                                                            className={`p-1.5 rounded-lg transition-colors text-white hover:opacity-90`}
                                                            style={{ backgroundColor: 'black' }}
                                                            title={shop.isActive ? 'Deactivate Shop' : 'Activate Shop'}
                                                        >
                                                            {actionLoading === shop._id + '_status'
                                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                                : shop.isActive
                                                                    ? <CheckCircle className="w-4 h-4" />
                                                                    : <XCircle className="w-4 h-4" />}
                                                        </button>
                                                    </>
                                                )}

                                                {hasPermission(PERMISSIONS.SHOPS_DELETE) && (
                                                    <button
                                                        onClick={() => handleDeleteShop(shop._id)}
                                                        disabled={actionLoading === shop._id + '_delete'}
                                                        className="p-1.5 text-white rounded-lg hover:opacity-90 transition-colors"
                                                        style={{ backgroundColor: 'black' }}
                                                        title="Delete Shop"
                                                    >
                                                        {actionLoading === shop._id + '_delete'
                                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                                            : <Trash2 className="w-4 h-4" />}
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
                            Showing <span className="font-semibold text-gray-900">{shops.length}</span> of{' '}
                            <span className="font-semibold text-gray-900">{pagination.totalShops}</span> shops
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagination(p => ({ ...p, currentPage: Math.max(1, p.currentPage - 1) }))}
                                disabled={pagination.currentPage === 1 || loading}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-white hover:opacity-90 disabled:opacity-50 transition-colors"
                                style={{ backgroundColor: 'black' }}
                            >
                                Previous
                            </button>
                            <span className="text-sm font-medium text-gray-700 px-4">
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => setPagination(p => ({ ...p, currentPage: Math.min(p.totalPages, p.currentPage + 1) }))}
                                disabled={pagination.currentPage === pagination.totalPages || loading}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-white hover:opacity-90 disabled:opacity-50 transition-colors"
                                style={{ backgroundColor: 'black' }}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Create / Edit Form Modal ── */}
            {isFormModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    {isEditing ? <Edit2 className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
                                    {isEditing ? 'Edit Shop Details' : 'Create New Shop'}
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setIsFormModalOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-5">

                                {/* Form Error */}
                                {formError && (
                                    <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                                        <XCircle className="w-4 h-4 flex-shrink-0" />
                                        {formError}
                                    </div>
                                )}

                                {/* Seller selector */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">
                                        Select Seller *
                                    </label>
                                    <select
                                        required
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.seller}
                                        onChange={(e) => setFormData(d => ({ ...d, seller: e.target.value }))}
                                    >
                                        <option value="">
                                            {sellersLoading ? 'Loading sellers...' : 'Choose a seller...'}
                                        </option>
                                        {sellers.map(s => (
                                            <option key={s._id} value={s._id}>
                                                {s.name}{s.businessName ? ` — ${s.businessName}` : ''} ({s.email})
                                            </option>
                                        ))}
                                    </select>
                                    {sellers.length === 0 && !sellersLoading && (
                                        <p className="text-xs text-orange-600">No sellers found. Make sure sellers exist before creating a shop.</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Shop Name *</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.shopName}
                                            onChange={(e) => setFormData(d => ({ ...d, shopName: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Tagline</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.tagline}
                                            onChange={(e) => setFormData(d => ({ ...d, tagline: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Shop Type *</label>
                                        <select
                                            required
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.shopType}
                                            onChange={(e) => setFormData(d => ({ ...d, shopType: e.target.value }))}
                                        >
                                            <option value="general">General Shop</option>
                                            <option value="medical">Medical Shop</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Description</label>
                                    <textarea
                                        rows="3"
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData(d => ({ ...d, description: e.target.value }))}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Contact Email</label>
                                        <input
                                            type="email"
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.contactEmail}
                                            onChange={(e) => setFormData(d => ({ ...d, contactEmail: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Contact Phone</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.contactPhone}
                                            onChange={(e) => setFormData(d => ({ ...d, contactPhone: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-5">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Location Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Street Address</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={formData.address.street}
                                                onChange={(e) => setFormData(d => ({ ...d, address: { ...d.address, street: e.target.value } }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">City</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={formData.address.city}
                                                onChange={(e) => setFormData(d => ({ ...d, address: { ...d.address, city: e.target.value } }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">State</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={formData.address.state}
                                                onChange={(e) => setFormData(d => ({ ...d, address: { ...d.address, state: e.target.value } }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Pincode</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={formData.address.pincode}
                                                onChange={(e) => setFormData(d => ({ ...d, address: { ...d.address, pincode: e.target.value } }))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-5">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Shop Timings</h3>
                                    <div className="space-y-3">
                                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                                            <div key={day} className="grid grid-cols-12 gap-3 items-center">
                                                <div className="col-span-3">
                                                    <label className="text-sm font-semibold text-gray-700 capitalize">{day}</label>
                                                </div>
                                                <div className="col-span-3">
                                                    <input
                                                        type="time"
                                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                        value={formData.timings[day].open}
                                                        onChange={(e) => setFormData(d => ({ 
                                                            ...d, 
                                                            timings: { 
                                                                ...d.timings, 
                                                                [day]: { ...d.timings[day], open: e.target.value }
                                                            } 
                                                        }))}
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <input
                                                        type="time"
                                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                        value={formData.timings[day].close}
                                                        onChange={(e) => setFormData(d => ({ 
                                                            ...d, 
                                                            timings: { 
                                                                ...d.timings, 
                                                                [day]: { ...d.timings[day], close: e.target.value }
                                                            } 
                                                        }))}
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 text-red-600 rounded"
                                                            checked={formData.timings[day].closed}
                                                            onChange={(e) => setFormData(d => ({ 
                                                                ...d, 
                                                                timings: { 
                                                                    ...d.timings, 
                                                                    [day]: { ...d.timings[day], closed: e.target.checked }
                                                                } 
                                                            }))}
                                                        />
                                                        <span className="text-sm font-medium text-gray-700">Closed</span>
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="grid grid-cols-12 gap-3 items-center pt-2">
                                            <div className="col-span-3">
                                                <label className="text-sm font-semibold text-gray-700">Timezone</label>
                                            </div>
                                            <div className="col-span-9">
                                                <select
                                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                    value={formData.timings.timezone}
                                                    onChange={(e) => setFormData(d => ({ 
                                                        ...d, 
                                                        timings: { 
                                                            ...d.timings, 
                                                            timezone: e.target.value 
                                                        } 
                                                    }))}
                                                >
                                                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                                                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                                                    <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                                                    <option value="Europe/London">Europe/London (GMT)</option>
                                                    <option value="America/New_York">America/New_York (EST)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-5">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Shop Media</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Logo Upload */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Shop Logo</label>
                                            <div 
                                                className="relative group w-32 h-32 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden hover:border-blue-500 transition-colors bg-gray-50 cursor-pointer"
                                                onClick={() => document.getElementById('shop-logo-input').click()}
                                            >
                                                {logoPreview ? (
                                                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="text-center">
                                                        <Camera className="w-8 h-8 text-gray-400 mx-auto" />
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 block">Upload Logo</span>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Upload className="w-6 h-6 text-white" />
                                                </div>
                                            </div>
                                            <input 
                                                id="shop-logo-input"
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden" 
                                                onChange={(e) => handleFileChange(e, 'logo')} 
                                            />
                                        </div>

                                        {/* Cover Image Upload */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Cover Image</label>
                                            <div 
                                                className="relative group w-full h-32 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden hover:border-blue-500 transition-colors bg-gray-50 cursor-pointer"
                                                onClick={() => document.getElementById('shop-cover-input').click()}
                                            >
                                                {coverPreview ? (
                                                    <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="text-center">
                                                        <Image className="w-8 h-8 text-gray-400 mx-auto" />
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 block">Upload Cover</span>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Upload className="w-6 h-6 text-white" />
                                                </div>
                                            </div>
                                            <input 
                                                id="shop-cover-input"
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden" 
                                                onChange={(e) => handleFileChange(e, 'coverImage')} 
                                            />
                                        </div>

                                        {/* Video Upload */}
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-semibold text-gray-700">Introduction Video</label>
                                            <div 
                                                className="relative group w-full h-40 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden hover:border-blue-500 transition-colors bg-gray-50 cursor-pointer"
                                                onClick={() => document.getElementById('shop-video-input').click()}
                                            >
                                                {videoPreview ? (
                                                    <div className="w-full h-full relative">
                                                        <video src={videoPreview} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                            <Video className="w-10 h-10 text-white opacity-80" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center">
                                                        <Video className="w-10 h-10 text-gray-400 mx-auto" />
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 block">Upload Promo Video</span>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Upload className="w-8 h-8 text-white" />
                                                </div>
                                            </div>
                                            <input 
                                                id="shop-video-input"
                                                type="file" 
                                                accept="video/*" 
                                                className="hidden" 
                                                onChange={(e) => handleFileChange(e, 'video')} 
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-6 pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-blue-600 rounded"
                                            checked={formData.isVerified}
                                            onChange={(e) => setFormData(d => ({ ...d, isVerified: e.target.checked }))}
                                        />
                                        <span className="text-sm font-medium text-gray-700">Verified Shop</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-green-600 rounded"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData(d => ({ ...d, isActive: e.target.checked }))}
                                        />
                                        <span className="text-sm font-medium text-gray-700">Active Status</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-blue-600 rounded"
                                            checked={formData.isOpen}
                                            onChange={(e) => setFormData(d => ({ ...d, isOpen: e.target.checked }))}
                                        />
                                        <span className="text-sm font-medium text-gray-700">Shop Open</span>
                                    </label>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsFormModalOpen(false)}
                                    className="px-6 py-2 border border-gray-200 rounded-xl font-bold text-sm text-white hover:opacity-90 shadow-sm"
                                    style={{ backgroundColor: 'black' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading === 'submit'}
                                    className="px-8 py-2 text-white rounded-xl font-bold text-sm hover:opacity-90 shadow-lg flex items-center gap-2 disabled:opacity-70"
                                    style={{ backgroundColor: 'black' }}
                                >
                                    {actionLoading === 'submit' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {isEditing ? 'Save Changes' : 'Create Shop'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Detail Modal ── */}
            {isDetailModalOpen && selectedShop && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-blue-600" />
                                Shop Details
                            </h2>
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <section>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Core Information</h4>
                                    <div className="space-y-4">
                                        <div className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                                            <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden bg-white flex-shrink-0">
                                                {selectedShop.logo?.url
                                                    ? <img src={selectedShop.logo.url} alt="logo" className="w-full h-full object-cover" />
                                                    : <Building2 className="w-full h-full p-3 text-gray-300" />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{selectedShop.shopName}</h3>
                                                <p className="text-sm text-gray-500">/{selectedShop.shopSlug}</p>
                                                <div className="mt-2 flex gap-2 flex-wrap">
                                                    {selectedShop.isVerified && (
                                                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">VERIFIED</span>
                                                    )}
                                                    {selectedShop.isActive
                                                        ? <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">ACTIVE</span>
                                                        : <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold">DEACTIVATED</span>}
                                                    {selectedShop.isOpen
                                                        ? <span className="bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded text-[10px] font-bold">OPEN</span>
                                                        : <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-bold">ON VACATION</span>}
                                                    {selectedShop.shopType === 'medical' && (
                                                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">MEDICAL</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-white border border-gray-100 rounded-xl space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Tagline</span>
                                                <span className="font-medium text-gray-900 italic">{selectedShop.tagline || 'No tagline'}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Contact Email</span>
                                                <span className="font-medium text-gray-900">{selectedShop.contactEmail || '—'}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Contact Phone</span>
                                                <span className="font-medium text-gray-900">{selectedShop.contactPhone || '—'}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Followers</span>
                                                <span className="font-medium text-gray-900">{selectedShop.followersCount || 0}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Rating</span>
                                                <span className="font-medium text-gray-900">
                                                    ⭐ {selectedShop.rating?.average || 0} ({selectedShop.rating?.totalReviews || 0} reviews)
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Shop Type</span>
                                                <span className="font-medium text-gray-900 capitalize">{selectedShop.shopType || 'General'}</span>
                                            </div>
                                            {selectedShop.video?.url && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Introduction Video</span>
                                                    <a href={selectedShop.video.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                                        View Video
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Seller / Business Info</h4>
                                    <div className="p-4 bg-gray-900 rounded-xl text-white space-y-4 shadow-lg">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Registered Name</p>
                                            <p className="font-semibold">{selectedShop.seller?.name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Business Name</p>
                                            <p className="font-semibold">{selectedShop.seller?.businessName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Business Contact</p>
                                            <p className="text-sm">{selectedShop.seller?.email}</p>
                                            <p className="text-sm">{selectedShop.seller?.phone}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 p-4 bg-white border border-gray-100 rounded-xl space-y-3">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Analytics</h4>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Total Orders</span>
                                            <span className="font-bold text-gray-900">{selectedShop.analytics?.totalOrders || 0}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Total Revenue</span>
                                            <span className="font-bold text-gray-900">₹{(selectedShop.analytics?.totalRevenue || 0).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Products Listed</span>
                                            <span className="font-bold text-gray-900">{selectedShop.analytics?.totalProductsListed || 0}</span>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="mt-6">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Location & Address</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-white border border-gray-100 rounded-xl">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">City / Area</p>
                                        <p className="text-sm font-semibold">{selectedShop.address?.city || '—'}</p>
                                        <p className="text-xs text-gray-500">{selectedShop.address?.state || ''}</p>
                                    </div>
                                    <div className="p-4 bg-white border border-gray-100 rounded-xl">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Pincode</p>
                                        <p className="text-sm font-semibold">{selectedShop.address?.pincode || '—'}</p>
                                    </div>
                                    <div className="p-4 bg-white border border-gray-100 rounded-xl">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Street</p>
                                        <p className="text-sm font-semibold">{selectedShop.address?.street || '—'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Shop Timings</h4>
                                <div className="p-4 bg-white border border-gray-100 rounded-xl">
                                    <div className="grid grid-cols-7 gap-2 text-xs">
                                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                                            <div key={day} className="text-center">
                                                <p className="font-bold text-gray-700 capitalize mb-1">{day.slice(0, 3)}</p>
                                                {selectedShop.timings?.[day]?.closed ? (
                                                    <p className="text-red-600 font-medium">Closed</p>
                                                ) : (
                                                    <div>
                                                        <p className="text-gray-900">{selectedShop.timings?.[day]?.open || '09:00'}</p>
                                                        <p className="text-gray-500">to</p>
                                                        <p className="text-gray-900">{selectedShop.timings?.[day]?.close || '18:00'}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                        <p className="text-xs text-gray-500">
                                            Timezone: <span className="font-medium text-gray-700">{selectedShop.timings?.timezone || 'Asia/Kolkata'}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            {hasPermission(PERMISSIONS.SHOPS_EDIT) && (
                                <button
                                    onClick={() => { setIsDetailModalOpen(false); handleOpenForm(selectedShop); }}
                                    className="px-6 py-2 text-white rounded-xl font-bold text-sm hover:opacity-90 flex items-center gap-2"
                                    style={{ backgroundColor: 'black' }}
                                >
                                    <Edit2 className="w-4 h-4" /> Edit Shop
                                </button>
                            )}
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="px-6 py-2 border border-gray-200 rounded-xl font-bold text-sm text-white hover:opacity-90 shadow-sm"
                                style={{ backgroundColor: 'black' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShopsPage;
