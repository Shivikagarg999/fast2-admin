import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSave, FiX } from 'react-icons/fi';
import { PERMISSION_GROUPS, getPermissionLabel } from '../../config/permissions';

const RoleForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: [],
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditMode) {
      fetchRole();
    }
  }, [id]);

  const fetchRole = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/roles/${id}`
      );
      const data = await response.json();
      
      if (data.success) {
        setFormData({
          name: data.role.name,
          displayName: data.role.displayName,
          description: data.role.description || '',
          permissions: data.role.permissions || [],
          isActive: data.role.isActive,
        });
      }
    } catch (error) {
      console.error('Error fetching role:', error);
      setError('Failed to load role');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = isEditMode
        ? `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/roles/${id}`
        : `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/roles`;

      const response = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/admin/roles');
      } else {
        setError(data.message || 'Failed to save role');
      }
    } catch (error) {
      console.error('Error saving role:', error);
      setError('Failed to save role');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleSelectAllGroup = (groupKey) => {
    const group = PERMISSION_GROUPS[groupKey];
    const allSelected = group.permissions.every(p => formData.permissions.includes(p));

    if (allSelected) {
      // Deselect all in group
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => !group.permissions.includes(p)),
      }));
    } else {
      // Select all in group
      const newPermissions = [...formData.permissions];
      group.permissions.forEach(p => {
        if (!newPermissions.includes(p)) {
          newPermissions.push(p);
        }
      });
      setFormData(prev => ({
        ...prev,
        permissions: newPermissions,
      }));
    }
  };

  const isGroupFullySelected = (groupKey) => {
    const group = PERMISSION_GROUPS[groupKey];
    return group.permissions.every(p => formData.permissions.includes(p));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {isEditMode ? 'Edit Role' : 'Create New Role'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isEditMode ? 'Update role details and permissions' : 'Create a new role with custom permissions'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Basic Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role Name (System) *
              </label>
              <input
                type="text"
                required
                disabled={isEditMode}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
                placeholder="e.g., staff, manager"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Lowercase, no spaces (use underscores)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Display Name *
              </label>
              <input
                type="text"
                required
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Staff, Manager"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of this role"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Active
              </label>
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Permissions
          </h2>

          <div className="space-y-6">
            {Object.entries(PERMISSION_GROUPS)
              .filter(([groupKey]) => groupKey !== 'admins' && groupKey !== 'roles')
              .map(([groupKey, group]) => (
              <div key={groupKey} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {group.label}
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleSelectAllGroup(groupKey)}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {isGroupFullySelected(groupKey) ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.permissions.map((permission) => (
                    <label
                      key={permission}
                      className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission)}
                        onChange={() => handlePermissionToggle(permission)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span>{getPermissionLabel(permission)}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/roles')}
            className="flex items-center gap-2 px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <FiX className="w-4 h-4" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
            style= {{backgroundColor: 'black'}}
         >
            <FiSave className="w-4 h-4" />
            {loading ? 'Saving...' : isEditMode ? 'Update Role' : 'Create Role'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoleForm;