import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { FiEdit, FiTrash2, FiPlus, FiUser, FiX, FiMapPin, FiPhone, FiMail, FiCheckCircle, FiClock, FiSlash } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const DriverList = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingDriver, setDeletingDriver] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigate = useNavigate();

  const DRIVERS_PER_PAGE = 10;

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://api.fast2.in/api/admin/drivers/getall', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDrivers(response.data.data?.drivers || []);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      alert("Failed to fetch drivers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleEdit = (driver) => {
    navigate(`/admin/edit-driver/${driver._id}`, { state: { driver } });
  };

  const openDeleteModal = (driver) => {
    setDeletingDriver(driver);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingDriver(null);
  };

  const handleDelete = async () => {
    if (!deletingDriver) return;
    
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`http://api.fast2.in/api/admin/drivers/${deletingDriver._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Driver deleted successfully!");
      fetchDrivers();
      closeDeleteModal();
    } catch (error) {
      console.error("Error deleting driver:", error);
      alert("Error deleting driver: " + (error.response?.data?.message || error.message));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStatusUpdate = async (driverId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`http://api.fast2.in/api/admin/drivers/${driverId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Driver status updated successfully!");
      fetchDrivers();
    } catch (error) {
      console.error("Error updating driver status:", error);
      alert("Error updating driver status: " + (error.response?.data?.message || error.message));
    }
  };

  const getStatusBadge = (status) => {
    const badgeClasses = {
      'approved': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'rejected': 'bg-red-100 text-red-800',
      'suspended': 'bg-orange-100 text-orange-800',
      'inactive': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badgeClasses[status] || badgeClasses.pending}`}>
        {status?.toUpperCase() || 'PENDING'}
      </span>
    );
  };

  const getAvailabilityBadge = (availability) => {
    const badgeClasses = {
      'online': 'bg-green-100 text-green-800',
      'offline': 'bg-gray-100 text-gray-800',
      'on-delivery': 'bg-blue-100 text-blue-800',
      'break': 'bg-orange-100 text-orange-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badgeClasses[availability] || badgeClasses.offline}`}>
        {availability?.replace('-', ' ').toUpperCase() || 'OFFLINE'}
      </span>
    );
  };

  const getVehicleIcon = (type) => {
    switch(type) {
      case 'bike':
        return "🏍️";
      case 'scooter':
        return "🛵";
      case 'bicycle':
        return "🚲";
      case 'car':
        return "🚗";
      default:
        return "🚗";
    }
  };

  // Filtering
  const filteredDrivers = useMemo(() => {
    return drivers.filter(driver => {
      const matchesSearch = 
        driver.personalInfo?.name?.toLowerCase().includes(search.toLowerCase()) ||
        driver.personalInfo?.phone?.includes(search) ||
        driver.personalInfo?.email?.toLowerCase().includes(search.toLowerCase()) ||
        driver.workInfo?.driverId?.toLowerCase().includes(search.toLowerCase()) ||
        driver.vehicle?.registrationNumber?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "all" || driver.workInfo?.status === statusFilter;
      const matchesAvailability = availabilityFilter === "all" || driver.workInfo?.availability === availabilityFilter;

      return matchesSearch && matchesStatus && matchesAvailability;
    });
  }, [drivers, search, statusFilter, availabilityFilter]);

  const totalPages = Math.ceil(filteredDrivers.length / DRIVERS_PER_PAGE);
  const indexOfLastDriver = currentPage * DRIVERS_PER_PAGE;
  const indexOfFirstDriver = indexOfLastDriver - DRIVERS_PER_PAGE;
  const currentDrivers = filteredDrivers.slice(indexOfFirstDriver, indexOfLastDriver);

  return (
    <div className="bg-gray-100 dark:bg-gray-900 w-full min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center mb-4 sm:mb-0">
            <FiUser className="w-6 h-6 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Delivery Boys</h1>
            <span className="ml-3 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
              {filteredDrivers.length} drivers
            </span>
          </div>
          <button 
            onClick={() => navigate('/admin/create-driver')}
            className="flex items-center px-4 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="w-4 h-4 mr-2" />
            Add Driver
          </button>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search drivers by name, phone, email, ID or vehicle number..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Availability</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="on-delivery">On Delivery</option>
              <option value="break">On Break</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Availability
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-500 dark:text-gray-400">Loading drivers...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center">
                        <FiUser className="w-12 h-12 text-gray-400 mb-2" />
                        <span className="text-gray-500 dark:text-gray-400">No drivers found.</span>
                        {(search || statusFilter !== "all" || availabilityFilter !== "all") && (
                          <button 
                            onClick={() => {
                              setSearch("");
                              setStatusFilter("all");
                              setAvailabilityFilter("all");
                            }}
                            className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentDrivers.map((driver) => (
                    <tr key={driver._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {driver.personalInfo?.name || "-"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {driver.workInfo?.driverId || "N/A"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900 dark:text-white mb-1">
                          <FiPhone className="w-3 h-3 mr-1 text-gray-400" />
                          {driver.personalInfo?.phone || "N/A"}
                        </div>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <FiMail className="w-3 h-3 mr-1 text-gray-400" />
                          {driver.personalInfo?.email || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getVehicleIcon(driver.vehicle?.type)}</span>
                          <div>
                            <div className="text-sm text-gray-900 dark:text-white">
                              {driver.vehicle?.type?.toUpperCase() || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {driver.vehicle?.registrationNumber || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(driver.workInfo?.status)}
                          {driver.workInfo?.status === 'pending' && (
                            <button
                              onClick={() => handleStatusUpdate(driver._id, 'approved')}
                              className="text-xs text-green-600 hover:text-green-700"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getAvailabilityBadge(driver.workInfo?.availability)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          ⭐ {driver.deliveryStats?.averageRating?.toFixed(1) || "0.0"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {driver.deliveryStats?.completedOrders || 0} deliveries
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleEdit(driver)}
                            className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
                            title="Edit Driver"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => navigate(`/admin/driver-orders/${driver._id}`)}
                            className="text-green-500 hover:text-green-700 p-1 rounded transition-colors"
                            title="View Orders"
                          >
                            <FiCheckCircle className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openDeleteModal(driver)}
                            className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                            title="Delete Driver"
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
              Showing {indexOfFirstDriver + 1} to {Math.min(indexOfLastDriver, filteredDrivers.length)} of {filteredDrivers.length} drivers
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
                  Delete Driver
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
                  Are you sure you want to delete driver <strong>{deletingDriver?.personalInfo?.name}</strong>? This action cannot be undone.
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

export default DriverList;