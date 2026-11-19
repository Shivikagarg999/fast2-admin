import { useEffect, useState, useMemo } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import PageHeader from "../../components/ui/PageHeader";
import axios from "axios";
import { FiEdit, FiTrash2, FiPlus, FiPackage, FiX, FiMapPin, FiThermometer } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import usePermissions from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../config/permissions";

const WarehouseList = () => {
  const { hasPermission } = usePermissions();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingWarehouse, setDeletingWarehouse] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigate = useNavigate();

  const WAREHOUSES_PER_PAGE = 10;

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api/admin/warehouse`);
      setWarehouses(response.data || []);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      alert("Failed to fetch warehouses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleEdit = (warehouse) => {
    if (!hasPermission(PERMISSIONS.WAREHOUSES_EDIT)) {
      alert("You don't have permission to edit warehouses");
      return;
    }
    navigate(`/admin/edit-warehouse/${warehouse._id}`, { state: { warehouse } });
  };

  const openDeleteModal = (warehouse) => {
    if (!hasPermission(PERMISSIONS.WAREHOUSES_DELETE)) {
      alert("You don't have permission to delete warehouses");
      return;
    }
    setDeletingWarehouse(warehouse);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingWarehouse(null);
  };

  const handleDelete = async () => {
    if (!deletingWarehouse) return;

    setDeleteLoading(true);
    try {
      await axios.delete(`${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api/admin/warehouse/${deletingWarehouse._id}`);
      alert("Warehouse deleted successfully!");
      fetchWarehouses();
      closeDeleteModal();
    } catch (error) {
      console.error("Error deleting warehouse:", error);
      alert("Error deleting warehouse: " + (error.response?.data?.message || error.message));
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStorageTypeIcon = (type) => {
    switch (type) {
      case 'cold-storage':
        return <FiThermometer className="w-4 h-4 text-blue-500" />;
      case 'frozen':
        return <FiThermometer className="w-4 h-4 text-cyan-500" />;
      default:
        return <FiPackage className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStorageTypeBadge = (type) => {
    const badgeVariant = {
      'ambient': 'success',
      'cold-storage': 'pale',
      'frozen': 'outline'
    };

    return (
      <Badge variant={badgeVariant[type] || 'success'}>
        {type?.replace('-', ' ') || 'ambient'}
      </Badge>
    );
  };

  const getCapacityUtilization = (current, capacity) => {
    if (!capacity) return 0;
    return Math.round((current / capacity) * 100);
  };

  // Filtering
  const filteredWarehouses = useMemo(() => {
    return warehouses.filter(w =>
      w.name?.toLowerCase().includes(search.toLowerCase()) ||
      w.code?.toLowerCase().includes(search.toLowerCase()) ||
      w.location?.city?.toLowerCase().includes(search.toLowerCase()) ||
      w.promotor?.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [warehouses, search]);

  const totalPages = Math.ceil(filteredWarehouses.length / WAREHOUSES_PER_PAGE);
  const indexOfLastWarehouse = currentPage * WAREHOUSES_PER_PAGE;
  const indexOfFirstWarehouse = indexOfLastWarehouse - WAREHOUSES_PER_PAGE;
  const currentWarehouses = filteredWarehouses.slice(indexOfFirstWarehouse, indexOfLastWarehouse);

  return (
    <div className="bg-gold-50 w-full min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <FiPackage className="w-6 h-6 text-gold-600" />
              Warehouses
              <span className="text-xs font-semibold px-2.5 py-1 bg-gold-100 text-gold-800 rounded-full">
                {filteredWarehouses.length}
              </span>
            </span>
          }
          subtitle="Storage locations, capacity, and the promotors who run them"
          actions={
            <Button variant="primary" onClick={() => navigate('/admin/create-warehouse')}>
              <FiPlus className="w-4 h-4" /> Add Warehouse
            </Button>
          }
        />

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search warehouses by name, code, city, or promotor..."
            className="w-full px-4 py-2.5 rounded-full border border-gray-200
              bg-white text-gray-900
              focus:outline-none focus:ring-2 focus:ring-gold-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <Card padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gold-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Promotor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Storage Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gold-500"></div>
                        <span className="ml-2 text-gray-500">Loading warehouses...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentWarehouses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10">
                      <div className="flex flex-col items-center">
                        <FiPackage className="w-12 h-12 text-gray-300 mb-2" />
                        <span className="text-gray-500">No warehouses found.</span>
                        {search && (
                          <button
                            onClick={() => setSearch("")}
                            className="mt-2 text-gold-700 hover:text-gold-900 text-sm font-semibold"
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentWarehouses.map((warehouse) => (
                    <tr key={warehouse._id} className="hover:bg-gold-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {warehouse.name || "-"}
                          </div>
                          <div className="text-xs text-gray-500">
                            Code: {warehouse.code || "N/A"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {warehouse.promotor?.name || "N/A"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {warehouse.promotor?.email || ""}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <FiMapPin className="w-3 h-3 mr-1 text-gray-400" />
                          {warehouse.location?.city || "N/A"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {warehouse.location?.state}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStorageTypeIcon(warehouse.storageType)}
                          {getStorageTypeBadge(warehouse.storageType)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {warehouse.currentStock || 0} / {warehouse.capacity || 0}
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5">
                          <div
                            className="bg-gold-500 h-1.5 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(getCapacityUtilization(warehouse.currentStock, warehouse.capacity), 100)}%`
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {getCapacityUtilization(warehouse.currentStock, warehouse.capacity)}% utilized
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" className="!px-3 !py-1.5 text-xs" onClick={() => handleEdit(warehouse)} title="Edit Warehouse">
                            <FiEdit className="w-3.5 h-3.5" /> Edit
                          </Button>
                          <Button variant="danger" className="!px-3 !py-1.5 text-xs" onClick={() => openDeleteModal(warehouse)} title="Delete Warehouse">
                            <FiTrash2 className="w-3.5 h-3.5" /> Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
            <div className="text-sm text-gray-500">
              Showing {indexOfFirstWarehouse + 1} to {Math.min(indexOfLastWarehouse, filteredWarehouses.length)} of {filteredWarehouses.length} warehouses
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm rounded-full border border-gray-200
                  bg-white text-gray-700
                  hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors"
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
                    className={`w-9 h-9 text-sm rounded-full border transition-colors ${currentPage === pageNum
                      ? "bg-black text-white border-black font-semibold"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
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
                className="px-3 py-2 text-sm rounded-full border border-gray-200
                  bg-white text-gray-700
                  hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">
                  Delete Warehouse
                </h2>
                <button
                  onClick={closeDeleteModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <p className="text-gray-600 mb-5">
                  Are you sure you want to delete warehouse <strong>{deletingWarehouse?.name}</strong>? This action cannot be undone.
                </p>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={closeDeleteModal}>
                    Cancel
                  </Button>
                  <Button variant="danger" onClick={handleDelete} disabled={deleteLoading} className="bg-red-600 !text-white hover:bg-red-700 border-red-600">
                    {deleteLoading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehouseList;