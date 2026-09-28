import { useEffect, useState } from "react";
import { Edit, Trash2, Plus, Layers, X } from "lucide-react";
import usePermissions from "../hooks/usePermissions";
import { PERMISSIONS } from "../config/permissions";

const BASE_URL = (import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy';

const SubcategoriesPage = () => {
    const { hasPermission } = usePermissions();
    const [subcategories, setSubcategories] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editingSubcategory, setEditingSubcategory] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState("");
    const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'inactive'
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [bulkDeleting, setBulkDeleting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        category: "",
        isActive: true,
        sortOrder: "",
        image: null
    });

    const subcategoriesPerPage = 10;

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchSubcategories(statusFilter);
        setCurrentPage(1);
        setSelectedIds(new Set());
    }, [statusFilter]);

    useEffect(() => {
        setSelectedIds(new Set());
    }, [search, currentPage, categoryFilter]);

    const isActiveParam = (filter) => (filter === 'active' ? 'true' : filter === 'inactive' ? 'false' : 'all');

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/category/getall?isActive=all`);
            if (!response.ok) throw new Error('Failed to fetch categories');
            const data = await response.json();
            setCategories(data);
        } catch (err) {
            console.error("Error fetching categories:", err);
        }
    };

    const fetchSubcategories = async (filter = statusFilter) => {
        try {
            setLoading(true);
            const response = await fetch(`${BASE_URL}/api/subcategory/getall?isActive=${isActiveParam(filter)}`);
            if (!response.ok) throw new Error('Failed to fetch subcategories');
            const data = await response.json();
            setSubcategories(data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching subcategories:", err);
            setLoading(false);
        }
    };

    const filteredSubcategories = subcategories.filter((subcategory) => {
        const matchesSearch = subcategory.name?.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = categoryFilter === "all" || subcategory.category?._id === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const indexOfLastSubcategory = currentPage * subcategoriesPerPage;
    const indexOfFirstSubcategory = indexOfLastSubcategory - subcategoriesPerPage;
    const currentSubcategories = filteredSubcategories.slice(indexOfFirstSubcategory, indexOfLastSubcategory);

    const totalPages = Math.ceil(filteredSubcategories.length / subcategoriesPerPage);

    const resetForm = () => {
        setFormData({
            name: "",
            category: "",
            isActive: true,
            sortOrder: "",
            image: null
        });
        setImagePreview("");
    };

    const openAddModal = () => {
        if (!hasPermission(PERMISSIONS.SUBCATEGORIES_CREATE)) {
            alert("You don't have permission to create subcategories");
            return;
        }
        resetForm();
        setEditingSubcategory(null);
        setShowModal(true);
    };

    const openEditModal = (subcategory) => {
        if (!hasPermission(PERMISSIONS.SUBCATEGORIES_EDIT)) {
            alert("You don't have permission to edit subcategories");
            return;
        }
        setFormData({
            name: subcategory.name || "",
            category: subcategory.category?._id || "",
            isActive: subcategory.isActive !== undefined ? subcategory.isActive : true,
            sortOrder: subcategory.sortOrder || "",
            image: null
        });
        setImagePreview(subcategory.image || "");
        setEditingSubcategory(subcategory);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingSubcategory(null);
        resetForm();
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                image: file
            }));

            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setModalLoading(true);

        try {
            const submitData = new FormData();

            submitData.append('name', formData.name);
            submitData.append('category', formData.category);
            submitData.append('isActive', formData.isActive);
            submitData.append('sortOrder', formData.sortOrder);

            if (formData.image) {
                submitData.append('image', formData.image);
            }

            let response;
            if (editingSubcategory) {
                response = await fetch(`${BASE_URL}/api/subcategory/update/${editingSubcategory._id}`, {
                    method: 'PUT',
                    body: submitData,
                });
            } else {
                response = await fetch(`${BASE_URL}/api/subcategory/create`, {
                    method: 'POST',
                    body: submitData,
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save subcategory');
            }

            alert(editingSubcategory ? 'Subcategory updated successfully!' : 'Subcategory created successfully!');
            closeModal();
            fetchSubcategories();
        } catch (error) {
            console.error('Error saving subcategory:', error);
            alert('Error saving subcategory: ' + error.message);
        } finally {
            setModalLoading(false);
        }
    };

    const handleDelete = async (subcategoryId, subcategoryName) => {
        if (!hasPermission(PERMISSIONS.SUBCATEGORIES_DELETE)) {
            alert("You don't have permission to delete subcategories");
            return;
        }
        if (window.confirm(`Are you sure you want to delete "${subcategoryName}"? This action cannot be undone.`)) {
            try {
                const response = await fetch(`${BASE_URL}/api/subcategory/delete/${subcategoryId}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to delete subcategory');
                }

                alert('Subcategory deleted successfully!');
                fetchSubcategories();
            } catch (error) {
                console.error('Error deleting subcategory:', error);
                alert('Error deleting subcategory: ' + error.message);
            }
        }
    };

    const toggleSelected = (subcategoryId) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(subcategoryId)) next.delete(subcategoryId);
            else next.add(subcategoryId);
            return next;
        });
    };

    const toggleSelectAllVisible = () => {
        const visibleIds = currentSubcategories.map(c => c._id);
        const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (allSelected) {
                visibleIds.forEach(id => next.delete(id));
            } else {
                visibleIds.forEach(id => next.add(id));
            }
            return next;
        });
    };

    const handleBulkDeleteSelected = async () => {
        if (!hasPermission(PERMISSIONS.SUBCATEGORIES_DELETE)) {
            alert("You don't have permission to delete subcategories");
            return;
        }
        if (selectedIds.size === 0) return;

        if (!window.confirm(`Delete ${selectedIds.size} selected subcategory(ies)? This cannot be undone.`)) {
            return;
        }

        setBulkDeleting(true);
        try {
            const response = await fetch(`${BASE_URL}/api/subcategory/bulk-delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subcategoryIds: Array.from(selectedIds) }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to delete subcategories');
            }
            alert(data.message);
            setSelectedIds(new Set());
            fetchSubcategories();
        } catch (error) {
            console.error('Error bulk deleting subcategories:', error);
            alert('Error deleting subcategories: ' + error.message);
        } finally {
            setBulkDeleting(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const buttonStyles = {
        primary: {
            backgroundColor: "#000000",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            padding: "8px 16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
        },
        secondary: {
            backgroundColor: "#ffffff",
            color: "#374151",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            padding: "8px 16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
        },
        danger: {
            backgroundColor: "#dc2626",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            padding: "8px 16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
        },
    };

    return (
        <div className="bg-gray-100 dark:bg-gray-900 w-full min-h-screen">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div className="flex items-center mb-4 sm:mb-0">
                        <Layers className="w-6 h-6 text-blue-600 mr-2" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subcategories</h1>
                        <span className="ml-3 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                            {filteredSubcategories.length} items
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={openAddModal} style={buttonStyles.primary}>
                            <Plus className="w-4 h-4" />
                            Add Subcategory
                        </button>
                    </div>
                </div>

                {/* Search & filters */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="max-w-md flex-1">
                        <input
                            type="text"
                            placeholder="Search subcategories by name..."
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
              bg-white dark:bg-gray-800 text-gray-900 dark:text-white
              focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Categories</option>
                        {categories.map((category) => (
                            <option key={category._id} value={category._id}>{category.name}</option>
                        ))}
                    </select>
                    <div style={{ display: "flex", gap: "8px" }}>
                        {[
                            { value: "all", label: "All" },
                            { value: "active", label: "Active" },
                            { value: "inactive", label: "Inactive" },
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setStatusFilter(option.value)}
                                style={{
                                    ...buttonStyles.secondary,
                                    backgroundColor: statusFilter === option.value ? "#000000" : "#ffffff",
                                    color: statusFilter === option.value ? "#ffffff" : "#374151",
                                }}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bulk actions toolbar */}
                {selectedIds.size > 0 && (
                    <div className="mb-4 flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{selectedIds.size} selected</span>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <button
                                onClick={handleBulkDeleteSelected}
                                disabled={bulkDeleting}
                                style={{
                                    ...buttonStyles.danger,
                                    opacity: bulkDeleting ? 0.6 : 1,
                                    cursor: bulkDeleting ? "not-allowed" : "pointer",
                                }}
                            >
                                {bulkDeleting ? "Deleting..." : `Delete Selected (${selectedIds.size})`}
                            </button>
                            <button onClick={() => setSelectedIds(new Set())} style={buttonStyles.secondary}>
                                Clear
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={currentSubcategories.length > 0 && currentSubcategories.every(c => selectedIds.has(c._id))}
                                            onChange={toggleSelectAllVisible}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Subcategory
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Created Date
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8">
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                                <span className="ml-2 text-gray-500 dark:text-gray-400">Loading subcategories...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : currentSubcategories.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8">
                                            <div className="flex flex-col items-center">
                                                <Layers className="w-12 h-12 text-gray-400 mb-2" />
                                                <span className="text-gray-500 dark:text-gray-400">No subcategories found.</span>
                                                {search && (
                                                    <button
                                                        onClick={() => setSearch("")}
                                                        className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                                                    >
                                                        Clear search
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    currentSubcategories.map((subcategory) => (
                                        <tr key={subcategory._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-4 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(subcategory._id)}
                                                    onChange={() => toggleSelected(subcategory._id)}
                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <img
                                                        src={subcategory.image}
                                                        alt={subcategory.name}
                                                        className="w-12 h-12 rounded-lg object-cover mr-4"
                                                        onError={(e) => {
                                                            e.target.src = "https://via.placeholder.com/48?text=No+Image";
                                                        }}
                                                    />
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {subcategory.name || "-"}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {subcategory.category?.name || "-"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${subcategory.isActive
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                                                    }`}>
                                                    {subcategory.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {formatDate(subcategory.createdAt)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => openEditModal(subcategory)}
                                                        className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
                                                        title="Edit Subcategory"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(subcategory._id, subcategory.name)}
                                                        className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                                                        title="Delete Subcategory"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                            Showing {indexOfFirstSubcategory + 1} to {Math.min(indexOfLastSubcategory, filteredSubcategories.length)} of {filteredSubcategories.length} subcategories
                        </div>
                        <div style={{ display: "flex", gap: "4px" }}>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                style={{
                                    ...buttonStyles.secondary,
                                    opacity: currentPage === 1 ? 0.5 : 1,
                                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
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
                                        onClick={() => setCurrentPage(pageNum)}
                                        style={{
                                            ...buttonStyles.secondary,
                                            backgroundColor: currentPage === pageNum ? "#000000" : "#ffffff",
                                            color: currentPage === pageNum ? "#ffffff" : "#374151",
                                            borderColor: currentPage === pageNum ? "#000000" : "#d1d5db",
                                        }}
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
                                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                                }}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    {editingSubcategory ? 'Edit Subcategory' : 'Add New Subcategory'}
                                </h2>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Subcategory Name */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Subcategory Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                        focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                            placeholder="Enter subcategory name"
                                        />
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Category *
                                        </label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                        focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select a category</option>
                                            {categories.map((category) => (
                                                <option key={category._id} value={category._id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Sort Order */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Sort Order *
                                        </label>
                                        <input
                                            type="number"
                                            name="sortOrder"
                                            value={formData.sortOrder}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                        focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                            placeholder="Enter sort order"
                                            min="0"
                                        />
                                    </div>

                                    {/* Active Status */}
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="isActive"
                                            checked={formData.isActive}
                                            onChange={handleInputChange}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500
                        dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                        />
                                        <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Active Subcategory
                                        </label>
                                    </div>

                                    {/* Image Upload */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Subcategory Image
                                        </label>
                                        <div className="space-y-4">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                          focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Recommended: 500×500px, square, transparent or white background.
                                            </p>
                                            {imagePreview && (
                                                <div className="flex justify-center">
                                                    <img
                                                        src={imagePreview}
                                                        alt="Preview"
                                                        className="w-32 h-32 rounded-lg object-cover border border-gray-300"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        style={buttonStyles.secondary}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={modalLoading}
                                        style={{
                                            ...buttonStyles.primary,
                                            opacity: modalLoading ? 0.5 : 1,
                                            cursor: modalLoading ? "not-allowed" : "pointer",
                                        }}
                                    >
                                        {modalLoading && (
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        )}
                                        {editingSubcategory ? 'Update Subcategory' : 'Create Subcategory'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubcategoriesPage;
