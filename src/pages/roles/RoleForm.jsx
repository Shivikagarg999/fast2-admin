import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSave, FiX, FiCheck } from 'react-icons/fi';
import { PERMISSION_GROUPS, getPermissionLabel } from '../../config/permissions';
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import PageHeader from "../../components/ui/PageHeader";

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
        `${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api/admin/roles/${id}`
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
        ? `${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api/admin/roles/${id}`
        : `${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api/admin/roles`;

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
    <div className="p-6 bg-gold-50 min-h-screen">
      <PageHeader
        title={isEditMode ? 'Edit Role' : 'Create New Role'}
        subtitle={isEditMode ? 'Update role details and permissions' : 'Create a new role with custom permissions'}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role Name (System) *
              </label>
              <input
                type="text"
                required
                disabled={isEditMode}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-gold-400 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="e.g., staff, manager"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Lowercase, no spaces (use underscores)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name *
              </label>
              <input
                type="text"
                required
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                placeholder="e.g., Staff, Manager"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                placeholder="Brief description of this role"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-gold-600 border-gray-300 rounded focus:ring-gold-400"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Active
              </label>
            </div>
          </div>
        </Card>

        {/* Permissions */}
        <Card>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-gray-900">
              Permissions
            </h2>
            <span className="text-xs font-semibold text-gray-500">
              {formData.permissions.length} selected
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-5">
            Grouped by area — toggle a whole group at once, or pick individual permissions.
          </p>

          <div className="space-y-4">
            {Object.entries(PERMISSION_GROUPS)
              .filter(([groupKey]) => groupKey !== 'admins' && groupKey !== 'roles')
              .map(([groupKey, group]) => {
                const selectedCount = group.permissions.filter(p => formData.permissions.includes(p)).length;
                const fullySelected = isGroupFullySelected(groupKey);
                return (
                  <div key={groupKey} className="border border-gray-100 rounded-2xl p-4 bg-gold-50/40">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900">
                          {group.label}
                        </h3>
                        <Badge variant={selectedCount === 0 ? 'outline' : fullySelected ? 'gold' : 'pale'}>
                          {selectedCount}/{group.permissions.length}
                        </Badge>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectAllGroup(groupKey)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-gold-700 hover:text-gold-900 bg-white border border-gold-200 rounded-full px-3 py-1"
                      >
                        <FiCheck className="w-3 h-3" />
                        {fullySelected ? 'Deselect all' : 'Select all'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {group.permissions.map((permission) => {
                        const checked = formData.permissions.includes(permission);
                        return (
                          <label
                            key={permission}
                            className={`flex items-center space-x-2 text-sm cursor-pointer p-2 rounded-xl border transition-colors ${
                              checked ? 'bg-white border-gold-300 text-gray-900 font-medium' : 'border-transparent text-gray-600 hover:bg-white/70'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handlePermissionToggle(permission)}
                              className="w-4 h-4 text-gold-600 border-gray-300 rounded focus:ring-gold-400"
                            />
                            <span>{getPermissionLabel(permission)}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/roles')}>
            <FiX className="w-4 h-4" />
            Cancel
          </Button>
          <Button type="submit" variant="secondary" disabled={loading}>
            <FiSave className="w-4 h-4" />
            {loading ? 'Saving...' : isEditMode ? 'Update Role' : 'Create Role'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RoleForm;