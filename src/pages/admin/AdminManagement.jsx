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
  FiUser,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw
} from 'react-icons/fi';
import { PERMISSIONS } from '../../config/permissions';
import usePermissions from '../../hooks/usePermissions';

const AdminManagement = () => {
  const navigate = useNavigate();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api/admin/all`);
      const data = await response.json();

      if (data.success) {
        setAdmins(data.admins);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (adminId) => {
    try {
      const response = await fetch(
        `${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api/admin/${adminId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        fetchAdmins();
        setShowDeleteModal(false);
        setAdminToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role) => {
    if (!role) return null;

    if (role.name === 'super_admin') {
      return (
        <Badge variant="dark">
          <FiShield className="w-3 h-3 mr-1" />
          {role.displayName}
        </Badge>
      );
    }
    return (
      <Badge variant="pale">
        <FiUser className="w-3 h-3 mr-1" />
        {role.displayName}
      </Badge>
    );
  };

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

  const DeleteConfirmModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Confirm Delete
          </h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete admin "{adminToDelete?.name}"? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setAdminToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" className="bg-red-600 !text-white hover:bg-red-700 border-red-600" onClick={() => handleDelete(adminToDelete._id)}>
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
        title="Admin Management"
        subtitle="Manage admin users and their permissions"
      />

      <Card padded={false}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search admins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-full bg-white text-gray-900 focus:ring-2 focus:ring-gold-400 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={fetchAdmins}>
                <FiRefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button variant="primary" onClick={() => navigate('/admin/create-admin')}>
                <FiPlus className="w-4 h-4" />
                Add Admin
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
            <p className="mt-4 text-gray-500">Loading admins...</p>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="p-12 text-center">
            <FiUser className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No admins found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gold-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Permissions
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
                {filteredAdmins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-gold-50/60">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {admin.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {admin.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(admin.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(admin.isActive)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {admin.role?.permissions?.includes('*')
                          ? 'All Permissions'
                          : `${admin.role?.permissions?.length || 0} permissions`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" className="!px-3 !py-1.5 text-xs" onClick={() => navigate(`/admin/edit-admin/${admin._id}`)} title="Edit Admin">
                          <FiEdit2 className="w-3.5 h-3.5" /> Edit
                        </Button>
                        {admin.role?.name !== 'super_admin' && (
                          <Button variant="danger" className="!px-3 !py-1.5 text-xs" onClick={() => {
                              setAdminToDelete(admin);
                              setShowDeleteModal(true);
                            }} title="Delete Admin">
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

export default AdminManagement;