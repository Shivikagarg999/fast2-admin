import React, { useState, useEffect, useRef } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiClock, FiImage, FiX, FiCheck, FiAlertCircle, FiChevronLeft, FiChevronRight } from "react-icons/fi";

const BASE_URL = `${import.meta.env.VITE_BASE_URL || 'https://admin.fast2.in/proxy'}/api/admin/popups`;
const LIMIT = 10;

const defaultForm = { startTime: '', endTime: '', isActive: true };

const PopupManagement = () => {
  const [popups, setPopups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filterActive, setFilterActive] = useState(''); // '' | 'true' | 'false'
  const [showForm, setShowForm] = useState(false);
  const [editingPopup, setEditingPopup] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState([]);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const imageInputRef = useRef(null);

  useEffect(() => { fetchPopups(page, filterActive); }, [page, filterActive]);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchPopups = async (p = 1, activeFilter = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (activeFilter !== '') params.append('isActive', activeFilter);
      const res = await fetch(`${BASE_URL}?${params}`, {
        headers: { ...getHeaders(), 'Content-Type': 'application/json' }
      });
      const result = await res.json();
      if (result.success) {
        setPopups(result.data || []);
        const pagination = result.pagination || {};
        setTotalPages(pagination.totalPages || 1);
        setTotalCount(pagination.total ?? (result.data?.length ?? 0));
      } else {
        setPopups([]);
      }
    } catch (err) {
      console.error(err);
      setPopups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (val) => {
    setFilterActive(val);
    setPage(1);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const errs = [];
    if (!formData.startTime) errs.push('Start time is required');
    if (!formData.endTime) errs.push('End time is required');
    if (formData.startTime && formData.endTime && new Date(formData.endTime) <= new Date(formData.startTime))
      errs.push('End time must be after start time');
    if (!editingPopup && !imageFile) errs.push('Image is required');
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    const errs = validate();
    if (errs.length > 0) { setErrors(errs); return; }

    const body = new FormData();
    body.append('startTime', new Date(formData.startTime).toISOString());
    body.append('endTime', new Date(formData.endTime).toISOString());
    body.append('isActive', formData.isActive);
    if (imageFile) body.append('image', imageFile);

    setSubmitting(true);
    try {
      const url = editingPopup ? `${BASE_URL}/${editingPopup._id}` : BASE_URL;
      const res = await fetch(url, {
        method: editingPopup ? 'PUT' : 'POST',
        headers: getHeaders(),
        body
      });
      const result = await res.json();
      if (result.success) {
        await fetchPopups(page, filterActive);
        closeForm();
        showToast(editingPopup ? 'Popup updated successfully!' : 'Popup created successfully!');
      } else {
        setErrors([result.message || 'Failed to save popup']);
      }
    } catch {
      setErrors(['Failed to save popup. Please try again.']);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (popup) => {
    setEditingPopup(popup);
    setFormData({
      startTime: new Date(popup.startTime).toISOString().slice(0, 16),
      endTime: new Date(popup.endTime).toISOString().slice(0, 16),
      isActive: popup.isActive
    });
    setImageFile(null);
    setImagePreview(popup.imageUrl || null);
    setErrors([]);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this popup?')) return;
    try {
      const res = await fetch(`${BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' }
      });
      const result = await res.json();
      if (result.success) {
        // if last item on page > 1, go back
        const newPage = popups.length === 1 && page > 1 ? page - 1 : page;
        setPage(newPage);
        await fetchPopups(newPage, filterActive);
        showToast('Popup deleted successfully!');
      } else {
        showToast('Failed to delete popup', 'error');
      }
    } catch { showToast('Failed to delete popup.', 'error'); }
  };

  const handleToggle = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/${id}/toggle`, {
        method: 'PATCH',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' }
      });
      const result = await res.json();
      if (result.success) {
        await fetchPopups(page, filterActive);
        showToast('Popup status updated!');
      } else {
        showToast('Failed to toggle popup', 'error');
      }
    } catch { showToast('Failed to toggle popup.', 'error'); }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingPopup(null);
    setFormData(defaultForm);
    setImageFile(null);
    setImagePreview(null);
    setErrors([]);
  };

  const isLive = (popup) => {
    const now = new Date();
    return popup.isActive && new Date(popup.startTime) <= now && new Date(popup.endTime) >= now;
  };

  const getStatusBadge = (popup) => {
    if (isLive(popup)) return { label: 'Live', cls: 'bg-green-100 text-green-800' };
    if (popup.isActive) return { label: 'Scheduled', cls: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Inactive', cls: 'bg-gray-100 text-gray-600' };
  };

  const fmt = (d) => new Date(d).toLocaleString();

  const filterTabs = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'true' },
    { label: 'Inactive', value: 'false' },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Popup Management</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage image-based popups shown to users during a scheduled time window</p>
        </div>
        <button
          onClick={() => { closeForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: 'black' }}
        >
          <FiPlus className="w-4 h-4" />
          Create Popup
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${toast.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
          {toast.type === 'error' ? <FiAlertCircle className="w-4 h-4" /> : <FiCheck className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingPopup ? 'Edit Popup' : 'Create Popup'}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiImage className="inline w-4 h-4 mr-1" />
                  Popup Image {!editingPopup && <span className="text-red-500">*</span>}
                </label>
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="mx-auto max-h-40 object-contain rounded" />
                  ) : (
                    <div className="py-4 text-gray-400">
                      <FiImage className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">Click to upload image</p>
                    </div>
                  )}
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                {editingPopup && (
                  <p className="text-xs text-gray-500 mt-1">Leave empty to keep the current image</p>
                )}
              </div>

              {/* Start & End Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiClock className="inline w-4 h-4 mr-1" />
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiClock className="inline w-4 h-4 mr-1" />
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                    required
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>

              <div className="flex justify-end gap-3 pt-2 border-t">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm text-white rounded-lg transition-colors disabled:opacity-60"
                  style={{ backgroundColor: 'black' }}
                >
                  {submitting ? 'Saving...' : editingPopup ? 'Update Popup' : 'Create Popup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {/* Table header with filter tabs */}
        <div className="px-6 py-4 border-b flex items-center justify-between gap-4 flex-wrap">
          <h3 className="text-base font-semibold text-gray-900">
            All Popups
            {totalCount > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">({totalCount})</span>
            )}
          </h3>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {filterTabs.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => handleFilterChange(value)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  filterActive === value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
            <p className="mt-3 text-sm text-gray-500">Loading popups...</p>
          </div>
        ) : popups.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FiImage className="w-12 h-12 mx-auto mb-3" />
            <p className="font-medium">No popups found</p>
            <p className="text-sm mt-1">
              {filterActive !== '' ? 'Try changing the filter' : 'Create your first popup to get started'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {popups.map((popup) => {
                    const { label, cls } = getStatusBadge(popup);
                    return (
                      <tr key={popup._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          {popup.imageUrl ? (
                            <img
                              src={popup.imageUrl}
                              alt="Popup"
                              className="h-14 w-24 object-cover rounded-lg border border-gray-200"
                            />
                          ) : (
                            <div className="h-14 w-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                              <FiImage className="w-5 h-5" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-start gap-1">
                            <FiClock className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                            <div>
                              <div>{fmt(popup.startTime)}</div>
                              <div className="text-xs text-gray-400 mt-0.5">→ {fmt(popup.endTime)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${cls}`}>
                            {label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleEdit(popup)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggle(popup._id)}
                              className={popup.isActive ? 'text-green-600 hover:text-green-800' : 'text-gray-400 hover:text-gray-600'}
                              title={popup.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {popup.isActive ? <FiToggleRight className="w-5 h-5" /> : <FiToggleLeft className="w-5 h-5" />}
                            </button>
                            <button
                              onClick={() => handleDelete(popup._id)}
                              className="text-red-500 hover:text-red-700"
                              title="Delete"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t flex items-center justify-between text-sm text-gray-600">
                <span>
                  Page {page} of {totalPages}
                  {totalCount > 0 && ` · ${totalCount} total`}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">…</span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => setPage(item)}
                          className={`w-8 h-8 rounded-md text-xs font-medium border transition-colors ${
                            page === item
                              ? 'text-white border-transparent'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                          style={page === item ? { backgroundColor: 'black' } : {}}
                        >
                          {item}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PopupManagement;
