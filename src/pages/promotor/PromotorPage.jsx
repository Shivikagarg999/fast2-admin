import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { FiEdit, FiTrash2, FiPlus, FiUser, FiX, FiDollarSign } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const PromotorsPage = () => {
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
      const response = await axios.get('http://localhost:5000/api/admin/promotor');
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
    navigate(`/admin/edit-promotor/${promotor._id}`, { state: { promotor } });
  };

  const openDeleteModal = (promotor) => {
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
      await axios.delete(`http://localhost:5000/api/admin/promotor/${deletingPromotor._id}`);
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

  const getStatusBadge = (active) => {
    return active 
      ? <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>
      : <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Inactive</span>;
  };

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
    <div className="bg-gray-100 dark:bg-gray-900 w-full min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center mb-4 sm:mb-0">
            <FiUser className="w-6 h-6 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Promotors</h1>
            <span className="ml-3 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
              {filteredPromotors.length} promotors
            </span>
          </div>
          <button 
            onClick={() => navigate('/admin/create-promotor')}
            className="flex items-center px-4 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="w-4 h-4 mr-2" />
            Add Promotor
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search promotors by name, email, phone, or city..."
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
              bg-white dark:bg-gray-800 text-gray-900 dark:text-white
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Promotor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-500 dark:text-gray-400">Loading promotors...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentPromotors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center">
                        <FiUser className="w-12 h-12 text-gray-400 mb-2" />
                        <span className="text-gray-500 dark:text-gray-400">No promotors found.</span>
                        {search && (
                          <button 
                            onClick={() => setSearch("")}
                            className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentPromotors.map((promotor) => (
                    <tr key={promotor._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {promotor.name || "-"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {promotor._id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {promotor.email}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {promotor.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {promotor.address?.city || "N/A"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {promotor.address?.state}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900 dark:text-white">
                          {formatCommission(promotor)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {promotor.commissionType}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(promotor.active)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleEdit(promotor)}
                            className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
                            title="Edit Promotor"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openDeleteModal(promotor)}
                            className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                            title="Delete Promotor"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {indexOfFirstPromotor + 1} to {Math.min(indexOfLastPromotor, filteredPromotors.length)} of {filteredPromotors.length} promotors
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                  hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed
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
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      currentPage === pageNum
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                  hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Delete Promotor
                </h2>
                <button
                  onClick={closeDeleteModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Are you sure you want to delete promotor <strong>{deletingPromotor?.name}</strong>? This action cannot be undone.
                </p>
                
                <div className="flex justify-end gap-3">
                  <button
                    onClick={closeDeleteModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                      bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
                      rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="px-4 py-2 text-sm font-medium bg-red-600 text-black
                      rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed 
                      transition-colors flex items-center gap-2"
                  >
                    {deleteLoading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    Delete
                  </button>
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