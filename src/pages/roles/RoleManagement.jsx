import { useState, useEffect } from 'react';
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import PageHeader from "../../components/ui/PageHeader";
import { useNavigate } from 'react-router-dom';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiShield,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiUsers
} from 'react-icons/fi';

const RoleManagement = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api/admin/roles`);
      const data = await response.json();

      if (data.success) {
        setRoles(data.roles);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roleId) => {
    try {
      const response = await fetch(
        `${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api/admin/roles/${roleId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (response.ok) {
        fetchRoles();
        setShowDeleteModal(false);
        setRoleToDelete(null);
      } else {
        alert(data.message || 'Failed to delete role');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      alert('Failed to delete role');
    }
  };

  const filteredRoles = roles.filter(role =>
    role.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return (
        <Badge variant="success">
          <FiCheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    }
    return (
      <Badge variant="danger">
        <FiXCircle className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const getSystemBadge = (isSystem) => {
    if (isSystem) {
      return (
        <Badge variant="dark">
          <FiShield className="w-3 h-3 mr-1" />
          System
        </Badge>
      );
    }
    return null;
  };

  const DeleteConfirmModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Confirm Delete
          </h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete role "{roleToDelete?.displayName}"? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setRoleToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" className="bg-red-600 !text-white hover:bg-red-700 border-red-600" onClick={() => handleDelete(roleToDelete._id)}>
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gold-50 min-h-screen">
      <PageHeader
        title="Role Management"
        subtitle="Create and manage roles with custom permissions"
      />

      <Card padded={false}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-full bg-white text-gray-900 focus:ring-2 focus:ring-gold-400 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={fetchRoles}>
                <FiRefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button variant="primary" onClick={() => navigate('/admin/create-role')}>
                <FiPlus className="w-4 h-4" />
                Add Role
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
            <p className="mt-4 text-gray-500">Loading roles...</p>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="p-12 text-center">
            <FiShield className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No roles found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gold-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Role Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredRoles.map((role) => (
                  <tr key={role._id} className="hover:bg-gold-50/60">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {role.displayName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {role.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {role.description || 'No description'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {role.permissions.includes('*')
                          ? 'All Permissions'
                          : `${role.permissions.length} permissions`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getSystemBadge(role.isSystem)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(role.isActive)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {new Date(role.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" className="!px-3 !py-1.5 text-xs" onClick={() => navigate(`/admin/edit-role/${role._id}`)} title="Edit Role">
                          <FiEdit2 className="w-3.5 h-3.5" /> Edit
                        </Button>
                        {!role.isSystem && (
                          <Button variant="danger" className="!px-3 !py-1.5 text-xs" onClick={() => {
                              setRoleToDelete(role);
                              setShowDeleteModal(true);
                            }} title="Delete Role">
                            <FiTrash2 className="w-3.5 h-3.5" /> Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showDeleteModal && <DeleteConfirmModal />}
    </div>
  );
};

export default RoleManagement;