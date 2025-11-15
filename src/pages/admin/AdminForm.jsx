import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSave, FiX } from 'react-icons/fi';

const AdminForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
    isActive: true,
  });
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRoles();
    if (isEditMode) {
      fetchAdmin();
    }
  }, [id]);

  const fetchRoles = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/roles`
      );
      const data = await response.json();
      
      if (data.success) {
        setRoles(data.roles.filter(role => role.isActive));
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchAdmin = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/${id}`
      );
      const data = await response.json();
      
      setFormData({
        name: data.name,
        email: data.email,
        password: '',
        roleId: data.role?._id || '',
        isActive: data.isActive,
      });
    } catch (error) {
      console.error('Error fetching admin:', error);
      setError('Failed to load admin data');
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
        ? `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/${id}`
        : `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/register`;

      const method = isEditMode ? 'PUT' : 'POST';

      const payload = { ...formData };
      
      // Don't send password if it's empty in edit mode
      if (isEditMode && !payload.password) {
        delete payload.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/admin/admins');
      } else {
        setError(data.message || 'Failed to save admin');
      }
    } catch (error) {
      console.error('Error saving admin:', error);
      setError('Failed to save admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {isEditMode ? 'Edit Admin' : 'Create New Admin'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isEditMode ? 'Update admin details and role' : 'Add a new admin user to the system'}
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Admin Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter admin name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password {isEditMode ? '(leave blank to keep current)' : '*'}
              </label>
              <input
                type="password"
                required={!isEditMode}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role *
              </label>
              <select
                required
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.displayName} ({role.permissions.includes('*') ? 'All Permissions' : `${role.permissions.length} permissions`})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Permissions are managed through roles. <button type="button" onClick={() => navigate('/admin/roles')} className="text-blue-600 hover:underline">Manage Roles</button>
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Active (admin can login)
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/admins')}
            className="flex items-center gap-2 px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <FiX className="w-4 h-4" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            <FiSave className="w-4 h-4" />
            {loading ? 'Saving...' : isEditMode ? 'Update Admin' : 'Create Admin'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminForm;