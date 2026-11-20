import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSave, FiX } from 'react-icons/fi';
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";

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
        `${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api/admin/roles`
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
        `${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api/admin/${id}`
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
        ? `${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api/admin/${id}`
        : `${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api/admin/register`;

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
    <div className="p-6 bg-gold-50 min-h-screen">
      <PageHeader
        title={isEditMode ? 'Edit Admin' : 'Create New Admin'}
        subtitle={isEditMode ? 'Update admin details and role' : 'Add a new admin user to the system'}
      />

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Admin Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                placeholder="Enter admin name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password {isEditMode ? '(leave blank to keep current)' : '*'}
              </label>
              <input
                type="password"
                required={!isEditMode}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                placeholder="Enter password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                required
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-gold-400 focus:border-transparent"
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.displayName} ({role.permissions.includes('*') ? 'All Permissions' : `${role.permissions.length} permissions`})
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-gray-500">
                Permissions are managed through roles. <button type="button" onClick={() => navigate('/admin/roles')} className="text-gold-700 font-semibold hover:underline">Manage Roles</button>
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-gold-600 border-gray-300 rounded focus:ring-gold-400"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Active (admin can login)
                </span>
              </label>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/admins')}>
            <FiX className="w-4 h-4" />
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            <FiSave className="w-4 h-4" />
            {loading ? 'Saving...' : isEditMode ? 'Update Admin' : 'Create Admin'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminForm;