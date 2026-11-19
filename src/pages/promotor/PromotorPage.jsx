import { useEffect, useState, useMemo } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import PageHeader from "../../components/ui/PageHeader";
import axios from "axios";
import { FiEdit, FiTrash2, FiPlus, FiUser, FiX, FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import usePermissions from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../config/permissions";

const PromotorsPage = () => {
  const { hasPermission } = usePermissions();
  const [promotors, setPromotors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPromotor, setDeletingPromotor] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigate = useNavigate();

  const PROMOTORS_PER_PAGE = 10;

  const fetchPromotors = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api/admin/promotor`);
      setPromotors(response.data || []);
    } catch (error) {
      console.error("Error fetching promotors:", error);
      alert("Failed to fetch promotors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotors();
  }, []);

  const handleEdit = (promotor) => {
    if (!hasPermission(PERMISSIONS.PROMOTORS_EDIT)) {
      alert("You don't have permission to edit promotors");
      return;
    }
    navigate(`/admin/edit-promotor/${promotor._id}`, { state: { promotor } });
  };

  const openDeleteModal = (promotor) => {
    if (!hasPermission(PERMISSIONS.PROMOTORS_DELETE)) {
      alert("You don't have permission to delete promotors");
      return;
    }
    setDeletingPromotor(promotor);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingPromotor(null);
  };

  const handleDelete = async () => {
    if (!deletingPromotor) return;

    setDeleteLoading(true);
    try {
      await axios.delete(`${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api/admin/promotor/${deletingPromotor._id}`);
      alert("Promotor deleted successfully!");
      fetchPromotors();
      closeDeleteModal();
    } catch (error) {
      console.error("Error deleting promotor:", error);
      alert("Error deleting promotor: " + (error.response?.data?.message || error.message));
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatCommission = (promotor) => {
    return promotor.commissionType === 'percentage'
      ? `${promotor.commissionRate}%`
      : `₹${promotor.commissionRate}`;
  };

  const getStatusBadge = (active) => (
    <Badge variant={active ? "success" : "danger"}>{active ? "Active" : "Inactive"}</Badge>
  );

  // Filtering
  const filteredPromotors = useMemo(() => {
    return promotors.filter(p =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search) ||
      p.address?.city?.toLowerCase().includes(search.toLowerCase())
    );
  }, [promotors, search]);

  const totalPages = Math.ceil(filteredPromotors.length / PROMOTORS_PER_PAGE);
  const indexOfLastPromotor = currentPage * PROMOTORS_PER_PAGE;
  const indexOfFirstPromotor = indexOfLastPromotor - PROMOTORS_PER_PAGE;
  const currentPromotors = filteredPromotors.slice(indexOfFirstPromotor, indexOfLastPromotor);

  return (
    <div className="bg-gold-50 w-full min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        <PageHeader
          title="Promotors"
          subtitle={`${filteredPromotors.length} promotor${filteredPromotors.length === 1 ? "" : "s"}`}
          actions={
            hasPermission(PERMISSIONS.PROMOTORS_CREATE) && (
              <Button variant="primary" onClick={() => navigate('/admin/create-promotor')}>
                <FiPlus className="w-4 h-4" />
                Add Promotor
              </Button>
            )
          }
        />

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or city..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200
              bg-white text-gray-900 text-sm
              focus:outline-none focus:ring-2 focus:ring-gold-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <Card padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Promotor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
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
                        <span className="ml-2 text-gray-500">Loading promotors...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentPromotors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10">
                      <div className="flex flex-col items-center">
                        <FiUser className="w-10 h-10 text-gray-300 mb-2" />
                        <span className="text-gray-500">No promotors found.</span>
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
                  currentPromotors.map((promotor) => (
                    <tr key={promotor._id} className="hover:bg-gold-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {promotor.name || "-"}
                          </div>
                          <div className="text-xs text-gray-400">
                            ID: {promotor._id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {promotor.email}
                        </div>
                        <div className="text-xs text-gray-500">
                          {promotor.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {promotor.address?.city || "N/A"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {promotor.address?.state}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm font-medium text-gray-900">
                          {formatCommission(promotor)}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {promotor.commissionType}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(promotor.active)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" className="!px-3 !py-1.5 text-xs" onClick={() => handleEdit(promotor)} title="Edit Promotor">
                            <FiEdit className="w-3.5 h-3.5" /> Edit
                          </Button>
                          <Button variant="danger" className="!px-3 !py-1.5 text-xs" onClick={() => openDeleteModal(promotor)} title="Delete Promotor">
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
            <div className="text-sm text-gray-600">
              Showing {indexOfFirstPromotor + 1} to {Math.min(indexOfLastPromotor, filteredPromotors.length)} of {filteredPromotors.length} promotors
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
                      ? "bg-black text-white border-black"
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
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">
                  Delete Promotor
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
                  Are you sure you want to delete promotor <strong>{deletingPromotor?.name}</strong>? This action cannot be undone.
                </p>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={closeDeleteModal}>
                    Cancel
                  </Button>
                  <Button variant="danger" onClick={handleDelete} disabled={deleteLoading}>
                    {deleteLoading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
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

export default PromotorsPage;