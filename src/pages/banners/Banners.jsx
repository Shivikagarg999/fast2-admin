import { useState, useEffect } from "react";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiArrowUp,
  FiArrowDown,
  FiImage,
  FiSave,
  FiX
} from "react-icons/fi";

const BannersPage = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [previewBanner, setPreviewBanner] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    image: "",
    fallbackImage: "",
    cta: "",
    ctaColor: "#3B82F6",
    gradient: "from-blue-500 to-purple-600",
    accentColor: "#FFFFFF",
    isActive: true,
    order: 0
  });

  const gradientOptions = [
    { value: "from-blue-500 to-purple-600", label: "Blue to Purple", preview: "bg-gradient-to-r from-blue-500 to-purple-600" },
    { value: "from-green-500 to-blue-600", label: "Green to Blue", preview: "bg-gradient-to-r from-green-500 to-blue-600" },
    { value: "from-orange-500 to-red-600", label: "Orange to Red", preview: "bg-gradient-to-r from-orange-500 to-red-600" },
    { value: "from-pink-500 to-rose-600", label: "Pink to Rose", preview: "bg-gradient-to-r from-pink-500 to-rose-600" },
    { value: "from-teal-500 to-cyan-600", label: "Teal to Cyan", preview: "bg-gradient-to-r from-teal-500 to-cyan-600" },
    { value: "from-indigo-500 to-purple-600", label: "Indigo to Purple", preview: "bg-gradient-to-r from-indigo-500 to-purple-600" }
  ];

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://api.fast2.in/api/admin/banners/getall');
      const data = await response.json();
      
      if (data.success) {
        setBanners(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
      alert('Failed to fetch banners');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingBanner 
        ? `https://api.fast2.in/api/admin/banners/update/${editingBanner._id}`
        : 'https://api.fast2.in/api/admin/banners/create';
      
      const method = editingBanner ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(editingBanner ? 'Banner updated successfully!' : 'Banner created successfully!');
        setShowModal(false);
        resetForm();
        fetchBanners();
      } else {
        alert(data.message || 'Failed to save banner');
      }
    } catch (error) {
      console.error('Error saving banner:', error);
      alert('Failed to save banner');
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle,
      description: banner.description,
      image: banner.image,
      fallbackImage: banner.fallbackImage,
      cta: banner.cta,
      ctaColor: banner.ctaColor,
      gradient: banner.gradient,
      accentColor: banner.accentColor,
      isActive: banner.isActive,
      order: banner.order
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      const response = await fetch(`https://api.fast2.in/api/admin/banners/delete/${deleteConfirm._id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Banner deleted successfully!');
        setDeleteConfirm(null);
        fetchBanners();
      } else {
        alert(data.message || 'Failed to delete banner');
      }
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Failed to delete banner');
    }
  };

  const toggleBannerStatus = async (banner) => {
    try {
      const response = await fetch(`https://api.fast2.in/api/admin/banners/update/${banner._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !banner.isActive })
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchBanners();
      } else {
        alert(data.message || 'Failed to update banner status');
      }
    } catch (error) {
      console.error('Error updating banner status:', error);
      alert('Failed to update banner status');
    }
  };

  const updateBannerOrder = async (bannerId, direction) => {
    const currentBanner = banners.find(b => b._id === bannerId);
    const currentOrder = currentBanner.order;
    const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
    
    const swapBanner = banners.find(b => b.order === newOrder);
    
    if (!swapBanner) return;
    
    try {
      const response = await fetch('https://api.fast2.in/api/admin/banners/update-order/update-order', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          banners: [
            { id: bannerId, order: newOrder },
            { id: swapBanner._id, order: currentOrder }
          ]
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchBanners();
      } else {
        alert(data.message || 'Failed to update banner order');
      }
    } catch (error) {
      console.error('Error updating banner order:', error);
      alert('Failed to update banner order');
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      description: "",
      image: "",
      fallbackImage: "",
      cta: "",
      ctaColor: "#3B82F6",
      gradient: "from-blue-500 to-purple-600",
      accentColor: "#FFFFFF",
      isActive: true,
      order: 0
    });
    setEditingBanner(null);
  };

  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBanner(null);
    resetForm();
  };

  const BannerCard = ({ banner }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className={`h-32 ${banner.gradient} relative`}>
        <img
          src={banner.image}
          alt={banner.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = banner.fallbackImage;
          }}
        />
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={() => updateBannerOrder(banner._id, 'up')}
            disabled={banner.order === 0}
            className="p-1 bg-black bg-opacity-50 text-white rounded disabled:opacity-30"
          >
            <FiArrowUp className="w-3 h-3" />
          </button>
          <button
            onClick={() => updateBannerOrder(banner._id, 'down')}
            disabled={banner.order === banners.length - 1}
            className="p-1 bg-black bg-opacity-50 text-white rounded disabled:opacity-30"
          >
            <FiArrowDown className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {banner.title}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            #{banner.order + 1}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
          {banner.subtitle}
        </p>
        
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
          <span>CTA: {banner.cta}</span>
          <span className={`px-2 py-1 rounded-full ${banner.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'}`}>
            {banner.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <button
              onClick={() => setPreviewBanner(banner)}
              className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              title="Preview"
            >
              <FiEye className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleBannerStatus(banner)}
              className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
              title={banner.isActive ? 'Deactivate' : 'Activate'}
            >
              {banner.isActive ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={() => handleEdit(banner)}
              className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors"
              title="Edit"
            >
              <FiEdit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeleteConfirm(banner)}
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

  const BannerModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            {editingBanner ? 'Edit Banner' : 'Create New Banner'}
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
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subtitle *
              </label>
              <input
                type="text"
                required
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description *
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Image URL *
              </label>
              <input
                type="url"
                required
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fallback Image URL *
              </label>
              <input
                type="url"
                required
                value={formData.fallbackImage}
                onChange={(e) => setFormData({ ...formData, fallbackImage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                CTA Text *
              </label>
              <input
                type="text"
                required
                value={formData.cta}
                onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                CTA Color *
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.ctaColor}
                  onChange={(e) => setFormData({ ...formData, ctaColor: e.target.value })}
                  className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600"
                />
                <input
                  type="text"
                  value={formData.ctaColor}
                  onChange={(e) => setFormData({ ...formData, ctaColor: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gradient Background *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {gradientOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, gradient: option.value })}
                  className={`p-3 rounded-lg border-2 ${
                    formData.gradient === option.value 
                      ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <div className={`h-8 rounded ${option.preview} mb-1`}></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
              {editingBanner ? 'Update Banner' : 'Create Banner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const PreviewModal = () => {
    if (!previewBanner) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Banner Preview</h2>
            <button
              onClick={() => setPreviewBanner(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-6">
            <div className={`rounded-lg overflow-hidden ${previewBanner.gradient} h-64 relative`}>
              <img
                src={previewBanner.image}
                alt={previewBanner.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = previewBanner.fallbackImage;
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <div className="text-center text-white p-6">
                  <h3 className="text-3xl font-bold mb-2">{previewBanner.title}</h3>
                  <p className="text-xl mb-4">{previewBanner.subtitle}</p>
                  <p className="text-lg mb-6">{previewBanner.description}</p>
                  <button 
                    className="px-8 py-3 rounded-lg font-semibold text-lg transition-transform hover:scale-105"
                    style={{ backgroundColor: previewBanner.ctaColor, color: previewBanner.accentColor }}
                  >
                    {previewBanner.cta}
                  </button>
                </div>
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Banner</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete the banner "<strong>{deleteConfirm.title}</strong>"?
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
                Delete Banner
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Banner Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create and manage promotional banners for your store
            </p>
          </div>
          <button
            onClick={openModal}
            className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Create Banner
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{banners.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Banners</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {banners.filter(b => b.isActive).length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Active Banners</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {banners.filter(b => !b.isActive).length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Inactive Banners</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {banners.length > 0 ? Math.max(...banners.map(b => b.order)) + 1 : 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Max Order</div>
          </div>
        </div>

        {/* Banners Grid */}
        {banners.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <FiImage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No banners yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Create your first promotional banner to get started
            </p>
            <button
              onClick={openModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              Create Your First Banner
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <BannerCard key={banner._id} banner={banner} />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && <BannerModal />}
      {previewBanner && <PreviewModal />}
      {deleteConfirm && <DeleteConfirmModal />}
    </div>
  );
};

export default BannersPage;