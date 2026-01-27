import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { FiEdit, FiTrash2, FiPlus, FiUser, FiX, FiPhone, FiMail, FiCheckCircle, FiDollarSign, FiEye, FiDownload, FiFileText } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import usePermissions from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../config/permissions";

const DriverList = () => {
  const { hasPermission } = usePermissions();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingDriver, setDeletingDriver] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const navigate = useNavigate();

  const DRIVERS_PER_PAGE = 10;
  const API_BASE_URL = `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/drivers`;

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_BASE_URL}/getall`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const driversData = response.data.data?.drivers || response.data.data || [];
      setDrivers(driversData);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      alert("Failed to fetch drivers: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleEdit = (driver) => {
    if (!hasPermission(PERMISSIONS.DRIVERS_EDIT)) {
      alert("You don't have permission to edit drivers");
      return;
    }
    navigate(`/admin/edit-driver/${driver._id}`, { state: { driver } });
  };

  const openDeleteModal = (driver) => {
    if (!hasPermission(PERMISSIONS.DRIVERS_DELETE)) {
      alert("You don't have permission to delete drivers");
      return;
    }
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
      await axios.delete(`${API_BASE_URL}/${deletingDriver._id}`, {
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
    if (!hasPermission(PERMISSIONS.DRIVERS_APPROVE)) {
      alert("You don't have permission to update driver status");
      return;
    }
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`${API_BASE_URL}/${driverId}/status`,
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

  const openDetailsModal = (driver) => {
    setSelectedDriver(driver);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedDriver(null);
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
    switch (type?.toLowerCase()) {
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

  const calculatePerformance = (driver) => {
    const completedOrders = driver.earnings?.totalEarnings > 0 ? Math.floor(driver.earnings.totalEarnings / 50) : 0;
    const rating = 4.5;

    return {
      rating,
      completedOrders
    };
  };

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center mb-4 sm:mb-0">
            <FiUser className="w-6 h-6 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Delivery Drivers</h1>
            <span className="ml-3 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
              {filteredDrivers.length} drivers
            </span>
          </div>
          <button
            onClick={() => navigate('/admin/create-driver')}
            className="flex items-center px-4 py-2 text-black rounded-lg"
            style={{ backgroundColor: '#2563eb' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
          >
            <FiPlus className="w-4 h-4 mr-2" />
            Add Driver
          </button>
        </div>

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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Driver
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Contact
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Vehicle
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Availability
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Earnings
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
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
                  currentDrivers.map((driver) => {
                    const performance = calculatePerformance(driver);

                    return (
                      <tr key={driver._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-3 py-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                              {driver.personalInfo?.name || "-"}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              ID: {driver.workInfo?.driverId || "N/A"}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center text-sm text-gray-900 dark:text-white mb-1">
                            <FiPhone className="w-3 h-3 mr-1 text-gray-400 flex-shrink-0" />
                            <span className="truncate max-w-[120px]">{driver.personalInfo?.phone || "N/A"}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <FiMail className="w-3 h-3 mr-1 text-gray-400 flex-shrink-0" />
                            <span className="truncate max-w-[120px]">{driver.personalInfo?.email || "N/A"}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg flex-shrink-0">{getVehicleIcon(driver.vehicle?.type)}</span>
                            <div>
                              <div className="text-sm text-gray-900 dark:text-white">
                                {driver.vehicle?.type ? driver.vehicle.type.toUpperCase() : "N/A"}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px]">
                                {driver.vehicle?.registrationNumber || "N/A"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
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
                        <td className="px-3 py-3">
                          {getAvailabilityBadge(driver.workInfo?.availability)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center text-sm text-gray-900 dark:text-white mb-1">
                            <FiDollarSign className="w-3 h-3 mr-1 text-green-500 flex-shrink-0" />
                            <span className="truncate">₹{driver.earnings?.totalEarnings?.toFixed(2) || "0.00"}</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {performance.completedOrders} deliveries
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openDetailsModal(driver)}
                              className="text-purple-500 hover:text-purple-700 p-1 rounded transition-colors"
                              title="View Details"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(driver)}
                              className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
                              title="Edit Driver"
                            >
                              <FiEdit className="w-4 h-4" />
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

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
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${currentPage === pageNum
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
                    className="px-4 py-2 text-sm font-medium text-white
                      rounded-md disabled:opacity-50 disabled:cursor-not-allowed 
                      transition-colors flex items-center gap-2"
                    style={{ backgroundColor: '#dc2626' }}
                    onMouseEnter={(e) => !deleteLoading && (e.target.style.backgroundColor = '#b91c1c')}
                    onMouseLeave={(e) => !deleteLoading && (e.target.style.backgroundColor = '#dc2626')}
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

        {/* Driver Details/Review Modal */}
        {showDetailsModal && selectedDriver && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl my-8">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Driver Details & Documents
                </h2>
                <button
                  onClick={closeDetailsModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Personal Information */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <FiUser className="w-5 h-5 mr-2" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</label>
                      <p className="text-gray-900 dark:text-white font-medium">{selectedDriver.personalInfo?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                      <p className="text-gray-900 dark:text-white">{selectedDriver.personalInfo?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
                      <p className="text-gray-900 dark:text-white">{selectedDriver.personalInfo?.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth</label>
                      <p className="text-gray-900 dark:text-white">
                        {selectedDriver.personalInfo?.dateOfBirth
                          ? new Date(selectedDriver.personalInfo.dateOfBirth).toLocaleDateString('en-IN')
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender</label>
                      <p className="text-gray-900 dark:text-white capitalize">{selectedDriver.personalInfo?.gender || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Blood Group</label>
                      <p className="text-gray-900 dark:text-white">{selectedDriver.personalInfo?.bloodGroup || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                {selectedDriver.personalInfo?.address && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Street Address</label>
                        <p className="text-gray-900 dark:text-white">{selectedDriver.personalInfo.address.street || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">City</label>
                        <p className="text-gray-900 dark:text-white">{selectedDriver.personalInfo.address.city || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">State</label>
                        <p className="text-gray-900 dark:text-white">{selectedDriver.personalInfo.address.state || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">PIN Code</label>
                        <p className="text-gray-900 dark:text-white">{selectedDriver.personalInfo.address.pinCode || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Country</label>
                        <p className="text-gray-900 dark:text-white">{selectedDriver.personalInfo.address.country || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Work Information */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Work Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Driver ID</label>
                      <p className="text-gray-900 dark:text-white font-medium">{selectedDriver.workInfo?.driverId || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedDriver.workInfo?.status)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Availability</label>
                      <div className="mt-1">{getAvailabilityBadge(selectedDriver.workInfo?.availability)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Join Date</label>
                      <p className="text-gray-900 dark:text-white">
                        {selectedDriver.workInfo?.joinDate
                          ? new Date(selectedDriver.workInfo.joinDate).toLocaleDateString('en-IN')
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Earnings</label>
                      <p className="text-gray-900 dark:text-white font-semibold text-green-600">
                        ₹{selectedDriver.earnings?.totalEarnings?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                {selectedDriver.vehicle && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Vehicle Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Vehicle Type</label>
                        <p className="text-gray-900 dark:text-white capitalize">{selectedDriver.vehicle.type || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Registration Number</label>
                        <p className="text-gray-900 dark:text-white font-medium">{selectedDriver.vehicle.registrationNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Model</label>
                        <p className="text-gray-900 dark:text-white">{selectedDriver.vehicle.model || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Color</label>
                        <p className="text-gray-900 dark:text-white capitalize">{selectedDriver.vehicle.color || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Year</label>
                        <p className="text-gray-900 dark:text-white">{selectedDriver.vehicle.year || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Documents Section */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <FiFileText className="w-5 h-5 mr-2" />
                      Documents
                    </h3>
                  </div>

                  {/* Document Status Summary */}
                  <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Upload Status:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${selectedDriver.documents?.aadharCard?.frontImage ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-gray-700 dark:text-gray-300">Aadhaar Card</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${selectedDriver.documents?.drivingLicense?.frontImage ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-gray-700 dark:text-gray-300">Driving License</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${selectedDriver.vehicle?.rcDocument ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-gray-700 dark:text-gray-300">Vehicle RC</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${selectedDriver.personalInfo?.profilePhoto ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-gray-700 dark:text-gray-300">Profile Photo</span>
                      </div>
                    </div>
                  </div>

                  {selectedDriver.documents && Object.keys(selectedDriver.documents).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Aadhaar Card */}
                      {(selectedDriver.documents?.aadharCard?.frontImage || selectedDriver.documents?.aadharCard?.backImage) && (
                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Aadhaar Card</h4>
                          {selectedDriver.documents.aadharCard.number && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                              Number: {selectedDriver.documents.aadharCard.number}
                            </p>
                          )}
                          {selectedDriver.documents.aadharCard.frontImage && (
                            <div className="mb-3">
                              <label className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Front Side</label>
                              <div className="relative group">
                                <img
                                  src={selectedDriver.documents.aadharCard.frontImage}
                                  alt="Aadhaar Front"
                                  className="w-full h-48 object-contain bg-gray-100 dark:bg-gray-800 rounded cursor-pointer"
                                  onClick={() => window.open(selectedDriver.documents.aadharCard.frontImage, '_blank')}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://via.placeholder.com/400x250?text=Image+Not+Available';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
                                  <a
                                    href={selectedDriver.documents.aadharCard.frontImage}
                                    download
                                    className="opacity-0 group-hover:opacity-100 bg-white dark:bg-gray-800 p-2 rounded-full"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <FiDownload className="w-5 h-5 text-gray-900 dark:text-white" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          )}
                          {selectedDriver.documents.aadharCard.backImage && (
                            <div>
                              <label className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Back Side</label>
                              <div className="relative group">
                                <img
                                  src={selectedDriver.documents.aadharCard.backImage}
                                  alt="Aadhaar Back"
                                  className="w-full h-48 object-contain bg-gray-100 dark:bg-gray-800 rounded cursor-pointer"
                                  onClick={() => window.open(selectedDriver.documents.aadharCard.backImage, '_blank')}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://via.placeholder.com/400x250?text=Image+Not+Available';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
                                  <a
                                    href={selectedDriver.documents.aadharCard.backImage}
                                    download
                                    className="opacity-0 group-hover:opacity-100 bg-white dark:bg-gray-800 p-2 rounded-full"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <FiDownload className="w-5 h-5 text-gray-900 dark:text-white" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Driving License */}
                      {(selectedDriver.documents?.drivingLicense?.frontImage || selectedDriver.documents?.drivingLicense?.backImage) && (
                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Driving License</h4>
                          {selectedDriver.documents.drivingLicense.number && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                              Number: {selectedDriver.documents.drivingLicense.number}
                            </p>
                          )}
                          {selectedDriver.documents.drivingLicense.expiryDate && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                              Expiry: {new Date(selectedDriver.documents.drivingLicense.expiryDate).toLocaleDateString('en-IN')}
                            </p>
                          )}
                          {selectedDriver.documents.drivingLicense.frontImage && (
                            <div className="mb-3">
                              <label className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Front Side</label>
                              <div className="relative group">
                                <img
                                  src={selectedDriver.documents.drivingLicense.frontImage}
                                  alt="License Front"
                                  className="w-full h-48 object-contain bg-gray-100 dark:bg-gray-800 rounded cursor-pointer"
                                  onClick={() => window.open(selectedDriver.documents.drivingLicense.frontImage, '_blank')}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://via.placeholder.com/400x250?text=Image+Not+Available';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
                                  <a
                                    href={selectedDriver.documents.drivingLicense.frontImage}
                                    download
                                    className="opacity-0 group-hover:opacity-100 bg-white dark:bg-gray-800 p-2 rounded-full"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <FiDownload className="w-5 h-5 text-gray-900 dark:text-white" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          )}
                          {selectedDriver.documents.drivingLicense.backImage && (
                            <div>
                              <label className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Back Side</label>
                              <div className="relative group">
                                <img
                                  src={selectedDriver.documents.drivingLicense.backImage}
                                  alt="License Back"
                                  className="w-full h-48 object-contain bg-gray-100 dark:bg-gray-800 rounded cursor-pointer"
                                  onClick={() => window.open(selectedDriver.documents.drivingLicense.backImage, '_blank')}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://via.placeholder.com/400x250?text=Image+Not+Available';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
                                  <a
                                    href={selectedDriver.documents.drivingLicense.backImage}
                                    download
                                    className="opacity-0 group-hover:opacity-100 bg-white dark:bg-gray-800 p-2 rounded-full"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <FiDownload className="w-5 h-5 text-gray-900 dark:text-white" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Vehicle RC Document */}
                      {selectedDriver.vehicle?.rcDocument && (
                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Vehicle RC</h4>
                          <div className="relative group">
                            <img
                              src={selectedDriver.vehicle.rcDocument}
                              alt="Vehicle RC"
                              className="w-full h-48 object-contain bg-gray-100 dark:bg-gray-800 rounded cursor-pointer"
                              onClick={() => window.open(selectedDriver.vehicle.rcDocument, '_blank')}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/400x250?text=Image+Not+Available';
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
                              <a
                                href={selectedDriver.vehicle.rcDocument}
                                download
                                className="opacity-0 group-hover:opacity-100 bg-white dark:bg-gray-800 p-2 rounded-full"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FiDownload className="w-5 h-5 text-gray-900 dark:text-white" />
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Profile Photo */}
                      {selectedDriver.personalInfo?.profilePhoto && (
                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Profile Photo</h4>
                          <div className="relative group">
                            <img
                              src={selectedDriver.personalInfo.profilePhoto}
                              alt="Profile"
                              className="w-full h-48 object-contain bg-gray-100 dark:bg-gray-800 rounded cursor-pointer"
                              onClick={() => window.open(selectedDriver.personalInfo.profilePhoto, '_blank')}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/400x250?text=Image+Not+Available';
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
                              <a
                                href={selectedDriver.personalInfo.profilePhoto}
                                download
                                className="opacity-0 group-hover:opacity-100 bg-white dark:bg-gray-800 p-2 rounded-full"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FiDownload className="w-5 h-5 text-gray-900 dark:text-white" />
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FiFileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 text-lg">No documents uploaded yet</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Documents will appear here once the driver uploads them</p>
                    </div>
                  )}
                </div>

                {/* Bank Details */}
                {selectedDriver.bankDetails && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bank Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Holder Name</label>
                        <p className="text-gray-900 dark:text-white">{selectedDriver.bankDetails.accountHolderName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Number</label>
                        <p className="text-gray-900 dark:text-white font-mono">{selectedDriver.bankDetails.accountNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">IFSC Code</label>
                        <p className="text-gray-900 dark:text-white font-mono">{selectedDriver.bankDetails.ifscCode || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Bank Name</label>
                        <p className="text-gray-900 dark:text-white">{selectedDriver.bankDetails.bankName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Branch</label>
                        <p className="text-gray-900 dark:text-white">{selectedDriver.bankDetails.branch || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <button
                  onClick={closeDetailsModal}
                  className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
                {selectedDriver.workInfo?.status === 'pending' && (
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedDriver._id, 'approved');
                      closeDetailsModal();
                    }}
                    className="px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                    style={{ backgroundColor: '#10b981' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                  >
                    Approve Driver
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverList;