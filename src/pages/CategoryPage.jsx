import { useEffect, useState } from "react";
import { Edit, Trash2, Plus, Tag, X, Upload } from "lucide-react";

const CategoriesPage = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        hsnCode: "",
        gstPercent: "",
        taxType: "inclusive",
        defaultUOM: "",
        isActive: true,
        sortOrder: "",
        image: null
    });

    const categoriesPerPage = 10;

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/category/getall`);
            if (!response.ok) throw new Error('Failed to fetch categories');
            const data = await response.json();
            setCategories(data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching categories:", err);
            setLoading(false);
        }
    };

    const filteredCategories = categories.filter((category) => {
        return category.name?.toLowerCase().includes(search.toLowerCase());
    });

    const indexOfLastCategory = currentPage * categoriesPerPage;
    const indexOfFirstCategory = indexOfLastCategory - categoriesPerPage;
    const currentCategories = filteredCategories.slice(indexOfFirstCategory, indexOfLastCategory);

    const totalPages = Math.ceil(filteredCategories.length / categoriesPerPage);

    const resetForm = () => {
        setFormData({
            name: "",
            hsnCode: "",
            gstPercent: "",
            taxType: "inclusive",
            defaultUOM: "",
            isActive: true,
            sortOrder: "",
            image: null
        });
        setImagePreview("");
    };

    const openAddModal = () => {
        resetForm();
        setEditingCategory(null);
        setShowModal(true);
    };

    const openEditModal = (category) => {
        setFormData({
            name: category.name || "",
            hsnCode: category.hsnCode || "",
            gstPercent: category.gstPercent || "",
            taxType: category.taxType || "inclusive",
            defaultUOM: category.defaultUOM || "",
            isActive: category.isActive !== undefined ? category.isActive : true,
            sortOrder: category.sortOrder || "",
            image: null
        });
        setImagePreview(category.image || "");
        setEditingCategory(category);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCategory(null);
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
            
            // Append all form fields
            submitData.append('name', formData.name);
            submitData.append('hsnCode', formData.hsnCode);
            submitData.append('gstPercent', formData.gstPercent);
            submitData.append('taxType', formData.taxType);
            submitData.append('defaultUOM', formData.defaultUOM);
            submitData.append('isActive', formData.isActive);
            submitData.append('sortOrder', formData.sortOrder);

            if (formData.image) {
                submitData.append('image', formData.image);
            }

            let response;
            if (editingCategory) {
                // Update category - adjust the endpoint as needed
                response = await fetch(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/category/update/${editingCategory._id}`, {
                    method: 'PUT',
                    body: submitData,
                });
            } else {
                // Create category
                response = await fetch(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/category/create`, {
                    method: 'POST',
                    body: submitData,
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save category');
            }

            alert(editingCategory ? 'Category updated successfully!' : 'Category created successfully!');
            closeModal();
            fetchCategories(); // Refresh the categories list
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Error saving category: ' + error.message);
        } finally {
            setModalLoading(false);
        }
    };

    const handleDelete = async (categoryId, categoryName) => {
        if (window.confirm(`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`)) {
            try {
                const response = await fetch(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/category/delete/${categoryId}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to delete category');
                }

                alert('Category deleted successfully!');
                fetchCategories(); // Refresh the categories list
            } catch (error) {
                console.error('Error deleting category:', error);
                alert('Error deleting category: ' + error.message);
            }
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="bg-gray-100 dark:bg-gray-900 w-full min-h-screen">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div className="flex items-center mb-4 sm:mb-0">
                        <Tag className="w-6 h-6 text-blue-600 mr-2" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
                        <span className="ml-3 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                            {filteredCategories.length} items
                        </span>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="flex items-center px-4 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Category
                    </button>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="max-w-md">
                        <input
                            type="text"
                            placeholder="Search categories by name..."
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        HSN Code
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        GST %
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
                                                <span className="ml-2 text-gray-500 dark:text-gray-400">Loading categories...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : currentCategories.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8">
                                            <div className="flex flex-col items-center">
                                                <Tag className="w-12 h-12 text-gray-400 mb-2" />
                                                <span className="text-gray-500 dark:text-gray-400">No categories found.</span>
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
                                    currentCategories.map((category) => (
                                        <tr key={category._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <img
                                                        src={category.image}
                                                        alt={category.name}
                                                        className="w-12 h-12 rounded-lg object-cover mr-4"
                                                        onError={(e) => {
                                                            e.target.src = "https://via.placeholder.com/48?text=No+Image";
                                                        }}
                                                    />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {category.name || "-"}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            UOM: {category.defaultUOM || "N/A"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {category.hsnCode || "-"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {category.gstPercent ? `${category.gstPercent}%` : "-"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    category.isActive 
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                                                        : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                                                }`}>
                                                    {category.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {formatDate(category.createdAt)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => openEditModal(category)}
                                                        className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
                                                        title="Edit Category"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(category._id, category.name)}
                                                        className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                                                        title="Delete Category"
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
                            Showing {indexOfFirstCategory + 1} to {Math.min(indexOfLastCategory, filteredCategories.length)} of {filteredCategories.length} categories
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                  hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                                            currentPage === pageNum
                                                ? "bg-blue-500 text-white border-blue-500"
                                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        }`}
                                        onClick={() => setCurrentPage(pageNum)}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                  hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                                    {editingCategory ? 'Edit Category' : 'Add New Category'}
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
                                    {/* Category Name */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Category Name *
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
                                            placeholder="Enter category name"
                                        />
                                    </div>

                                    {/* HSN Code */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            HSN Code *
                                        </label>
                                        <input
                                            type="text"
                                            name="hsnCode"
                                            value={formData.hsnCode}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                        focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                            placeholder="Enter HSN code"
                                        />
                                    </div>

                                    {/* GST Percentage */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            GST Percentage *
                                        </label>
                                        <input
                                            type="number"
                                            name="gstPercent"
                                            value={formData.gstPercent}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                        focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                            placeholder="Enter GST percentage"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                        />
                                    </div>

                                    {/* Tax Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Tax Type *
                                        </label>
                                        <select
                                            name="taxType"
                                            value={formData.taxType}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                        focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="inclusive">Inclusive</option>
                                            <option value="exclusive">Exclusive</option>
                                        </select>
                                    </div>

                                    {/* Default UOM */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Default UOM *
                                        </label>
                                        <input
                                            type="text"
                                            name="defaultUOM"
                                            value={formData.defaultUOM}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                        focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                            placeholder="e.g., piece, pack, kg"
                                        />
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
                                            Active Category
                                        </label>
                                    </div>

                                    {/* Image Upload */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Category Image
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
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
      bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
      rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={modalLoading}
                                        className="px-4 py-2 text-sm font-medium text-black bg-blue-600 
      rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed 
      transition-colors flex items-center gap-2"
                                    >
                                        {modalLoading && (
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        )}
                                        {editingCategory ? 'Update Category' : 'Create Category'}
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

export default CategoriesPage;