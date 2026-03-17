import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiClock, FiImage, FiTarget, FiZap, FiX, FiCheck, FiAlertCircle } from "react-icons/fi";

const PopupManagement = () => {
  const [popups, setPopups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPopup, setEditingPopup] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    imageUrl: '',
    startTime: '',
    endTime: '',
    isActive: true,
    type: 'info',
    position: 'top-center',
    showCloseButton: true,
    autoCloseAfter: '',
    targetPages: '',
    targetUsers: '',
    priority: 1
  });
  const [errors, setErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchPopups();
  }, []);

  const fetchPopups = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://api.fast2.in/api/popups', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (result.success) {
        setPopups(result.data);
      }
    } catch (error) {
      console.error('Error fetching popups:', error);
      showMessage('Failed to fetch popups', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setSuccessMessage('');

    // Format target pages and users
    const popupData = {
      ...formData,
      targetPages: formData.targetPages ? formData.targetPages.split(',').map(p => p.trim()) : [],
      targetUsers: formData.targetUsers ? formData.targetUsers.split(',').map(u => u.trim()) : [],
      autoCloseAfter: formData.autoCloseAfter ? parseInt(formData.autoCloseAfter) : null
    };

    // Validate data
    const validationErrors = validatePopupData(popupData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Format data for API
    const formattedData = formatPopupData(popupData);

    try {
      const token = localStorage.getItem('token');
      let response;
      
      if (editingPopup) {
        response = await fetch(`https://api.fast2.in/api/popups/${editingPopup._id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formattedData)
        });
      } else {
        response = await fetch('https://api.fast2.in/api/popups', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formattedData)
        });
      }

      const result = await response.json();
      
      if (result.success) {
        await fetchPopups();
        resetForm();
        setShowForm(false);
        showMessage(editingPopup ? 'Popup updated successfully!' : 'Popup created successfully!', 'success');
      } else {
        setErrors([result.message || 'Failed to save popup']);
      }
    } catch (error) {
      console.error('Error saving popup:', error);
      setErrors(['Failed to save popup. Please try again.']);
    }
  };

  const handleEdit = (popup) => {
    setEditingPopup(popup);
    setFormData({
      title: popup.title,
      message: popup.message,
      imageUrl: popup.imageUrl || '',
      startTime: new Date(popup.startTime).toISOString().slice(0, 16),
      endTime: new Date(popup.endTime).toISOString().slice(0, 16),
      isActive: popup.isActive,
      type: popup.type,
      position: popup.position,
      showCloseButton: popup.showCloseButton,
      autoCloseAfter: popup.autoCloseAfter || '',
      targetPages: popup.targetPages ? popup.targetPages.join(', ') : '',
      targetUsers: popup.targetUsers ? popup.targetUsers.join(', ') : '',
      priority: popup.priority
    });
    setShowForm(true);
    setErrors([]);
    setSuccessMessage('');
  };

  const handleDelete = async (popupId) => {
    if (!confirm('Are you sure you want to delete this popup?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://api.fast2.in/api/popups/${popupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchPopups();
        showMessage('Popup deleted successfully!', 'success');
      } else {
        showMessage('Failed to delete popup', 'error');
      }
    } catch (error) {
      console.error('Error deleting popup:', error);
      showMessage('Failed to delete popup. Please try again.', 'error');
    }
  };

  const handleToggle = async (popupId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://api.fast2.in/api/popups/${popupId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchPopups();
        showMessage('Popup status updated successfully!', 'success');
      } else {
        showMessage('Failed to toggle popup', 'error');
      }
    } catch (error) {
      console.error('Error toggling popup:', error);
      showMessage('Failed to toggle popup. Please try again.', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      imageUrl: '',
      startTime: '',
      endTime: '',
      isActive: true,
      type: 'info',
      position: 'top-center',
      showCloseButton: true,
      autoCloseAfter: '',
      targetPages: '',
      targetUsers: '',
      priority: 1
    });
    setEditingPopup(null);
    setErrors([]);
    setSuccessMessage('');
  };

  const showMessage = (message, type) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const validatePopupData = (data) => {
    const errors = [];

    if (!data.title || data.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (!data.message || data.message.trim().length === 0) {
      errors.push('Message is required');
    }

    if (data.title && data.title.length > 100) {
      errors.push('Title must be less than 100 characters');
    }

    if (data.message && data.message.length > 500) {
      errors.push('Message must be less than 500 characters');
    }

    if (!data.startTime) {
      errors.push('Start time is required');
    }

    if (!data.endTime) {
      errors.push('End time is required');
    }

    if (data.startTime && data.endTime && new Date(data.endTime) <= new Date(data.startTime)) {
      errors.push('End time must be after start time');
    }

    if (data.autoCloseAfter && (data.autoCloseAfter < 1 || data.autoCloseAfter > 300)) {
      errors.push('Auto-close time must be between 1 and 300 seconds');
    }

    if (data.priority && (data.priority < 1 || data.priority > 10)) {
      errors.push('Priority must be between 1 and 10');
    }

    return errors;
  };

  const formatPopupData = (data) => {
    return {
      title: data.title?.trim(),
      message: data.message?.trim(),
      imageUrl: data.imageUrl || null,
      startTime: new Date(data.startTime).toISOString(),
      endTime: new Date(data.endTime).toISOString(),
      isActive: data.isActive !== undefined ? data.isActive : true,
      type: data.type || 'info',
      position: data.position || 'top-center',
      showCloseButton: data.showCloseButton !== undefined ? data.showCloseButton : true,
      autoCloseAfter: data.autoCloseAfter || null,
      targetPages: Array.isArray(data.targetPages) ? data.targetPages : [],
      targetUsers: Array.isArray(data.targetUsers) ? data.targetUsers : [],
      priority: data.priority || 1,
    };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const isPopupActive = (popup) => {
    const now = new Date();
    const start = new Date(popup.startTime);
    const end = new Date(popup.endTime);
    return popup.isActive && start <= now && end >= now;
  };

  const getPopupTypeColor = (type) => {
    const colors = {
      'info': 'bg-blue-100 text-blue-800',
      'success': 'bg-green-100 text-green-800',
      'warning': 'bg-yellow-100 text-yellow-800',
      'error': 'bg-red-100 text-red-800'
    };
    return colors[type] || colors['info'];
  };

  const getStatusColor = (popup) => {
    if (isPopupActive(popup)) {
      return 'bg-green-100 text-green-800';
    } else if (popup.isActive) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (popup) => {
    if (isPopupActive(popup)) {
      return 'Active Now';
    } else if (popup.isActive) {
      return 'Scheduled';
    } else {
      return 'Inactive';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Popup Management</h1>
          <p className="text-gray-600 mt-1">Manage time-based popup notifications for users</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          Create New Popup
        </button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
          successMessage.includes('success') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {successMessage.includes('success') ? <FiCheck className="w-5 h-5" /> : <FiAlertCircle className="w-5 h-5" />}
          {successMessage}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingPopup ? 'Edit Popup' : 'Create New Popup'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                <ul className="list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    maxLength={100}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Max 100 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Popup Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="info">Info (Blue)</option>
                    <option value="success">Success (Green)</option>
                    <option value="warning">Warning (Yellow)</option>
                    <option value="error">Error (Red)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  maxLength={500}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Max 500 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiImage className="inline w-4 h-4 mr-1" />
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">Optional: Add an image to the popup</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiClock className="inline w-4 h-4 mr-1" />
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiClock className="inline w-4 h-4 mr-1" />
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="top-left">Top Left</option>
                    <option value="top-center">Top Center</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-center">Bottom Center</option>
                    <option value="bottom-right">Bottom Right</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Higher number = higher priority</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiZap className="inline w-4 h-4 mr-1" />
                    Auto Close (seconds)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={formData.autoCloseAfter}
                    onChange={(e) => setFormData({ ...formData, autoCloseAfter: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Leave empty for manual close"
                  />
                  <p className="text-xs text-gray-500 mt-1">1-300 seconds</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiTarget className="inline w-4 h-4 mr-1" />
                    Target Pages (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.targetPages}
                    onChange={(e) => setFormData({ ...formData, targetPages: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="/home, /products, /about"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for all pages</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiTarget className="inline w-4 h-4 mr-1" />
                    Target Users (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.targetUsers}
                    onChange={(e) => setFormData({ ...formData, targetUsers: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="premium, new, vip"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for all users</p>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showCloseButton}
                    onChange={(e) => setFormData({ ...formData, showCloseButton: e.target.checked })}
                    className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Show Close Button</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingPopup ? 'Update Popup' : 'Create Popup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popups List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All Popups</h3>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading popups...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title & Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {popups.map((popup) => (
                  <tr key={popup._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{popup.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {popup.message}
                        </div>
                        {popup.imageUrl && (
                          <div className="flex items-center mt-1 text-xs text-blue-600">
                            <FiImage className="w-3 h-3 mr-1" />
                            Has image
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPopupTypeColor(popup.type)}`}>
                        {popup.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <FiClock className="w-3 h-3 mr-1" />
                        <div>
                          <div>{formatDate(popup.startTime)}</div>
                          <div className="text-xs">to {formatDate(popup.endTime)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(popup)}`}>
                        {getStatusText(popup)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {popup.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(popup)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggle(popup._id)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title={popup.isActive ? 'Disable' : 'Enable'}
                        >
                          {popup.isActive ? <FiToggleRight className="w-4 h-4" /> : <FiToggleLeft className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(popup._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {popups.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FiAlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p>No popups found.</p>
                <p className="text-sm">Create your first popup to get started!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">
          <FiAlertCircle className="inline w-5 h-5 mr-2" />
          How Popup Scheduling Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">Time-based Display:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Popups only appear during the specified time window</li>
              <li>Set start and end times in your local timezone</li>
              <li>System automatically checks and shows/hides popups</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Best Practices:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Use clear, concise messages (max 500 characters)</li>
              <li>Set appropriate auto-close times (5-30 seconds)</li>
              <li>Target specific pages for better user experience</li>
              <li>Use priority to handle multiple overlapping popups</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopupManagement;
