import { useState, useEffect } from 'react';
import { FiDollarSign, FiUsers, FiRefreshCw, FiEye, FiX, FiCheck, FiPackage, FiToggleLeft, FiToggleRight, FiTruck, FiFilter } from 'react-icons/fi';

const DriverPayouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [driverDetails, setDriverDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: 'upi',
    transactionId: '',
    notes: '',
    paymentProof: ''
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [summary, setSummary] = useState(null);
  const [aggregatedView, setAggregatedView] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    type: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false,
    limit: 20
  });
  const [driverCache, setDriverCache] = useState({});

  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

  const BASE_URL = 'https://api.fast2.in/api/driver-earnings';

  useEffect(() => {
    fetchEarningsSummary();
    fetchAllEarnings();
  }, []);

  useEffect(() => {
    fetchAllEarnings();
  }, [aggregatedView, pagination.currentPage, filters]);

 const fetchDriverDetails = async (driverId) => {
  console.log('Fetching driver details for:', driverId);
  
  if (driverCache[driverId]) {
    console.log('Found in cache:', driverCache[driverId]);
    return driverCache[driverId];
  }

  try {
    console.log('Making API call for driver details:', driverId);
    // Try the driver earnings detail endpoint first
    const response = await fetch(`${BASE_URL}/admin/earnings/driver/${driverId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('Driver details API Response:', result);
      
      if (result.success && result.data && result.data.driver) {
        const driverData = result.data.driver;
        console.log('Driver data from earnings detail API:', driverData);
        
        const processedDriverData = {
          name: driverData.name || 'Unknown Driver',
          phone: driverData.phone || '',
          email: driverData.email || '',
          vehicleNumber: driverData.vehicleNumber || ''
        };
        
        console.log('Processed driver data:', processedDriverData);
        
        setDriverCache(prev => ({
          ...prev,
          [driverId]: processedDriverData
        }));
        
        return processedDriverData;
      }
    }
    
    // If the earnings detail endpoint doesn't work, try the regular driver endpoint
    console.log('Trying regular driver API endpoint...');
    const driverResponse = await fetch(`https://api.fast2.in/api/admin/drivers/${driverId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (driverResponse.ok) {
      const driverResult = await driverResponse.json();
      console.log('Regular driver API Response:', driverResult);
      
      if (driverResult.success && driverResult.driver) {
        const driverData = driverResult.driver;
        const processedDriverData = {
          name: driverData.personalInfo?.name || driverData.name || 'Unknown Driver',
          phone: driverData.personalInfo?.phone || driverData.phone || '',
          email: driverData.personalInfo?.email || driverData.email || '',
          vehicleNumber: driverData.vehicle?.registrationNumber || driverData.vehicleNumber || ''
        };
        
        console.log('Processed driver data from regular API:', processedDriverData);
        
        setDriverCache(prev => ({
          ...prev,
          [driverId]: processedDriverData
        }));
        
        return processedDriverData;
      }
    }
  } catch (error) {
    console.error('Error fetching driver details:', error);
  }

  console.log('Returning fallback data');
  return {
    name: 'Unknown Driver',
    phone: '',
    email: '',
    vehicleNumber: ''
  };
};

  const fetchEarningsSummary = async () => {
    try {
      const response = await fetch(`${BASE_URL}/admin/earnings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch earnings summary');
      const result = await response.json();
      
      if (result.success && result.data && result.data.summary) {
        setSummary(result.data.summary);
      }
    } catch (error) {
      console.error('Error fetching earnings summary:', error);
    }
  };

  const fetchAllEarnings = async () => {
  try {
    setRefreshing(true);
    
    let url;
    let isPendingEndpoint = false;
    
    if (aggregatedView) {
      url = `${BASE_URL}/admin/earnings/pending?`;
      isPendingEndpoint = true;
    } else {
      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...(filters.status && { status: filters.status }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.type && { type: filters.type }),
        ...(filters.search && { search: filters.search })
      }).toString();
      url = `${BASE_URL}/admin/earnings?${queryParams}`;
    }
    
    console.log('Fetching earnings from:', url);
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Earnings response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Earnings API error:', errorText);
      throw new Error('Failed to fetch earnings');
    }
    
    const result = await response.json();
    console.log('Earnings API result:', result);
    
    if (result.success) {
      if (aggregatedView) {
        // Handle pending earnings endpoint (different structure)
        const earningsData = isPendingEndpoint ? 
          (result.data?.pendingEarnings || []) : 
          (result.data?.earnings || []);
        
        console.log(`Found ${earningsData.length} earnings for aggregation`);
        
        const driverMap = new Map();
        
        for (const earning of earningsData) {
          console.log('Processing earning for aggregation:', earning);
          const driverId = earning.driver?._id || earning.driver?.id || earning.driver;
          console.log('Driver ID from earning:', driverId);
          
          if (!driverId) {
            console.log('No driver ID found for earning:', earning);
            continue;
          }
          
          if (!driverMap.has(driverId)) {
            // Extract driver data based on API structure
            let driverData = {};
            
            if (isPendingEndpoint) {
              // For pending endpoint, driver might be populated differently
              driverData = earning.driver || {};
            } else {
              // For regular earnings endpoint
              driverData = earning.driver || {};
            }
            
            console.log('Driver data extracted:', driverData);
            
            // If driver data is incomplete, fetch it separately
            if (!driverData.name && !driverData.email && !driverData.phone) {
              console.log('Driver data incomplete, fetching separately...');
              try {
                const detailedDriverInfo = await fetchDriverDetails(driverId);
                driverData = { ...driverData, ...detailedDriverInfo };
              } catch (fetchError) {
                console.log('Failed to fetch driver details:', fetchError);
              }
            }
            
            driverMap.set(driverId, {
              driverId,
              driverName: driverData.name || driverData.fullName || driverData.personalInfo?.name || 'Unknown Driver',
              driverPhone: driverData.phone || driverData.phoneNumber || driverData.personalInfo?.phone || '',
              driverEmail: driverData.email || driverData.personalInfo?.email || '',
              vehicleNumber: driverData.vehicleNumber || driverData.vehicle?.registrationNumber || '',
              totalOrders: 0,
              pendingOrders: 0,
              paidOrders: 0,
              totalAmount: 0,
              pendingAmount: 0,
              paidAmount: 0,
              earnings: []
            });
          }
          
          const driverEntry = driverMap.get(driverId);
          driverEntry.totalOrders++;
          driverEntry.totalAmount += earning.amount || 0;
          
          if (earning.status === 'earned' || earning.status === 'pending') {
            driverEntry.pendingOrders++;
            driverEntry.pendingAmount += earning.amount || 0;
          } else if (earning.status === 'paid') {
            driverEntry.paidOrders++;
            driverEntry.paidAmount += earning.amount || 0;
          }
          
          driverEntry.earnings.push(earning);
        }
        
        const aggregatedPayouts = Array.from(driverMap.values()).map(driver => ({
          ...driver,
          status: driver.pendingOrders > 0 ? 'pending' : 'paid',
          _id: driver.driverId,
          batchId: `AGG-${driver.driverId}`
        }));
        
        console.log('Aggregated payouts:', aggregatedPayouts);
        setPayouts(aggregatedPayouts);
      } else {
        // Non-aggregated view
        const earningsData = result.data?.earnings || [];
        console.log('Non-aggregated view - processing earnings:', earningsData);
        
        const transformedPayouts = earningsData.map((earning) => {
          console.log('Processing earning for non-aggregated:', earning);
          const driverData = earning.driver || {};
          
          console.log('Driver data from earning:', driverData);
          
          return {
            _id: earning.id,
            driverId: driverData.id || earning.driver?.id || earning.driver?._id,
            driverName: driverData.name || 'Unknown Driver',
            driverPhone: driverData.phone || '',
            driverEmail: driverData.email || '',
            vehicleNumber: driverData.vehicleNumber || '',
            orderId: earning.orderId,
            amount: earning.amount,
            type: earning.type,
            description: earning.description,
            status: earning.status,
            transactionDate: earning.date,
            payoutMethod: earning.payoutMethod || 'upi',
            transactionId: earning.transactionId || '',
            deliveryAddress: earning.deliveryAddress,
            orderAmount: earning.orderAmount,
            orderDate: earning.orderDate,
            batchId: `EARN-${earning.id ? earning.id.slice(-6) : 'N/A'}`
          };
        });
        
        console.log('Transformed payouts:', transformedPayouts);
        setPayouts(transformedPayouts);
        setPagination(result.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          hasNext: false,
          hasPrev: false,
          limit: 20
        });
      }
    }
    setLoading(false);
    setRefreshing(false);
  } catch (error) {
    console.error('Error fetching earnings:', error);
    setLoading(false);
    setRefreshing(false);
  }
};

  const fetchDriverEarningsDetail = async (driverId) => {
    try {
      setLoadingDetails(true);
      
      const response = await fetch(`${BASE_URL}/admin/earnings/driver/${driverId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch driver details');
      const result = await response.json();
      
      if (result.success) {
        setDriverDetails(result.data);
      }
      setLoadingDetails(false);
    } catch (error) {
      console.error('Error fetching driver details:', error);
      
      try {
        const driverInfo = await fetchDriverDetails(driverId);
        const earningsForDriver = payouts.filter(p => p.driverId === driverId);
        
        setDriverDetails({
          driver: driverInfo,
          earnings: earningsForDriver,
          summary: {
            totalEarnings: earningsForDriver.reduce((sum, e) => sum + e.amount, 0),
            pendingPayout: earningsForDriver.filter(e => e.status === 'earned').reduce((sum, e) => sum + e.amount, 0),
            totalDeliveries: earningsForDriver.length
          }
        });
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        setDriverDetails(null);
      }
      
      setLoadingDetails(false);
    }
  };

  const handleViewDetails = (driver) => {
    if (!driver.driverId) {
      console.error('No driverId found:', driver);
      alert('Unable to fetch driver details: Missing driver ID');
      return;
    }
    
    setSelectedDriver(driver);
    setShowDetailsModal(true);
    fetchDriverEarningsDetail(driver.driverId);
  };

  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedDriver(null);
    setDriverDetails(null);
  };

  const handleMarkAsPaid = (earning) => {
    if (aggregatedView) {
      const pendingEarnings = earning.earnings?.filter(e => e.status === 'earned') || [];
      if (pendingEarnings.length === 0) {
        alert('No pending earnings to mark as paid');
        return;
      }
      
      if (window.confirm(`Mark ${pendingEarnings.length} pending earnings (₹${earning.pendingAmount}) for ${earning.driverName} as paid?`)) {
        setSelectedDriver(earning);
        setShowPaymentModal(true);
        setPaymentForm({
          paymentMethod: 'upi',
          transactionId: '',
          notes: `Bulk payment for ${pendingEarnings.length} pending earnings`,
          paymentProof: '',
          driverId: earning.driverId,
          earningIds: pendingEarnings.map(e => e._id)
        });
      }
    } else {
      setSelectedDriver(earning);
      setShowPaymentModal(true);
      setPaymentForm({
        paymentMethod: 'upi',
        transactionId: '',
        notes: '',
        paymentProof: '',
        earningId: earning._id
      });
    }
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedDriver(null);
    setPaymentForm({
      paymentMethod: 'upi',
      transactionId: '',
      notes: '',
      paymentProof: ''
    });
  };

  const handlePaymentFormChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitPayment = async () => {
    if (!selectedDriver) return;

    try {
      setSubmittingPayment(true);

      if (aggregatedView) {
        if (!paymentForm.earningIds || paymentForm.earningIds.length === 0) {
          alert('No earnings selected for payment');
          return;
        }

        const response = await fetch(`${BASE_URL}/admin/earnings/bulk-mark-paid`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            earningIds: paymentForm.earningIds,
            payoutMethod: paymentForm.paymentMethod,
            transactionId: paymentForm.transactionId,
            paymentProof: paymentForm.paymentProof,
            notes: paymentForm.notes
          })
        });

        if (!response.ok) throw new Error('Failed to process bulk payment');
        const result = await response.json();

        if (result.success) {
          alert(result.message || 'Bulk payment processed successfully!');
          closePaymentModal();
          fetchAllEarnings();
          fetchEarningsSummary();
        } else {
          throw new Error(result.message || 'Failed to process bulk payment');
        }
      } else {
        const response = await fetch(`${BASE_URL}/admin/earnings/${paymentForm.earningId}/mark-paid`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            payoutMethod: paymentForm.paymentMethod,
            transactionId: paymentForm.transactionId,
            paymentProof: paymentForm.paymentProof,
            notes: paymentForm.notes
          })
        });

        if (!response.ok) throw new Error('Failed to mark as paid');
        const result = await response.json();

        if (result.success) {
          alert('Earning marked as paid successfully!');
          closePaymentModal();
          fetchAllEarnings();
          fetchEarningsSummary();
        } else {
          throw new Error(result.message || 'Failed to process payment');
        }
      }

    } catch (error) {
      console.error('Error processing payment:', error);
      alert(error.message || 'Error processing payment. Please try again.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
      type: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      earned: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', text: 'Pending' },
      paid: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', text: 'Paid' },
      cancelled: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', text: 'Cancelled' },
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', text: 'Pending' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      delivery: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', text: 'Delivery' },
      bonus: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', text: 'Bonus' },
      penalty: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', text: 'Penalty' },
      other: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', text: 'Other' }
    };
    
    const config = typeConfig[type] || typeConfig.other;
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const totalPendingPayout = aggregatedView 
    ? payouts.reduce((sum, p) => sum + (p.pendingAmount || 0), 0)
    : payouts.filter(p => p.status === 'earned').reduce((sum, p) => sum + p.amount, 0);
    
  const totalPaidPayout = aggregatedView
    ? payouts.reduce((sum, p) => sum + (p.paidAmount || 0), 0)
    : payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    
  const totalPayoutAmount = payouts.reduce((sum, p) => sum + (p.amount || p.totalAmount || 0), 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Driver Earnings & Payouts</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {aggregatedView ? 'Showing earnings aggregated by driver' : 'Showing all individual earnings'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Aggregated View</span>
              <button
                onClick={() => {
                  setAggregatedView(!aggregatedView);
                  setPagination(prev => ({ ...prev, currentPage: 1 }));
                }}
                className="flex items-center"
              >
                {aggregatedView ? (
                  <FiToggleRight className="w-8 h-8" style={{ color: '#9333ea' }} />
                ) : (
                  <FiToggleLeft className="w-8 h-8 text-gray-400" />
                )}
              </button>
            </div>
            {!aggregatedView && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <FiFilter className="w-4 h-4" />
                Filters
              </button>
            )}
            <button
              onClick={() => {
                fetchAllEarnings();
                fetchEarningsSummary();
              }}
              className="flex items-center text-white gap-2 px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#000000' }}
              disabled={refreshing}
            >
              <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {showFilters && !aggregatedView && (
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="earned">Pending</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Types</option>
                <option value="delivery">Delivery</option>
                <option value="bonus">Bonus</option>
                <option value="penalty">Penalty</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From Date
              </label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To Date
              </label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by driver name, email, phone, or order ID..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={resetFilters}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => {
                  setPagination(prev => ({ ...prev, currentPage: 1 }));
                  setShowFilters(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(totalPendingPayout)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {aggregatedView 
                  ? `${payouts.filter(p => (p.pendingAmount || 0) > 0).length} drivers`
                  : `${payouts.filter(p => p.status === 'earned').length} earnings`
                }
              </p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(147, 51, 234, 0.1)' }}>
              <FiDollarSign className="w-6 h-6" style={{ color: '#9333ea' }} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(totalPaidPayout)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Completed payments
              </p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
              <FiDollarSign className="w-6 h-6" style={{ color: '#22c55e' }} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(totalPayoutAmount)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                All driver earnings
              </p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
              <FiTruck className="w-6 h-6" style={{ color: '#3b82f6' }} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {aggregatedView ? 'Total Drivers' : 'Total Records'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {payouts.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {aggregatedView ? 'With pending earnings' : 'Earnings found'}
              </p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)' }}>
              <FiUsers className="w-6 h-6" style={{ color: '#eab308' }} />
            </div>
          </div>
        </div>
      </div>

      {summary && (
        <div className="mb-6 p-4 rounded-lg border" style={{ backgroundColor: 'rgba(237, 233, 254, 0.5)', borderColor: '#c4b5fd' }}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Platform Earnings Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</p>
              <p className="text-lg font-bold" style={{ color: '#9333ea' }}>
                {formatCurrency(summary.totalEarnings || 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {summary.totalTransactions || 0} transactions
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Payout</p>
              <p className="text-lg font-bold" style={{ color: '#3b82f6' }}>
                {formatCurrency(summary.pendingPayout || 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {summary.totalDrivers || 0} drivers
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Today's Earnings</p>
              <p className="text-lg font-bold" style={{ color: '#10b981' }}>
                {formatCurrency(summary.todayEarnings || 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Today's total
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Paid Out</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(summary.completedPayout || 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Completed payouts
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {aggregatedView ? 'Driver Earnings Summary' : 'All Driver Earnings'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {aggregatedView 
                  ? `Showing ${payouts.length} drivers with earnings`
                  : `Page ${pagination.currentPage} of ${pagination.totalPages} - ${pagination.totalItems} total records`
                }
              </p>
            </div>
            {!aggregatedView && pagination.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {pagination.currentPage} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  disabled={!pagination.hasNext}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {aggregatedView ? (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Earnings Summary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order/Earning</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={aggregatedView ? "5" : "7"} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No earnings records found
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {aggregatedView ? (
                      <>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {payout.driverName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {payout.driverPhone} {payout.driverEmail && `• ${payout.driverEmail}`}
                            </div>
                            {payout.vehicleNumber && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Vehicle: {payout.vehicleNumber}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {payout.totalOrders || 0} total earnings
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {payout.pendingOrders || 0} pending • {payout.paidOrders || 0} paid
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold" style={{ color: '#9333ea' }}>
                            Total: {formatCurrency(payout.totalAmount || 0)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Pending: {formatCurrency(payout.pendingAmount || 0)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Paid: {formatCurrency(payout.paidAmount || 0)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(payout.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetails(payout)}
                              className="p-2 rounded transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              style={{ color: '#3b82f6' }}
                              title="View Details"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            {(payout.pendingAmount || 0) > 0 && (
                              <button
                                onClick={() => handleMarkAsPaid(payout)}
                                className="p-2 rounded transition-colors hover:bg-green-50 dark:hover:bg-green-900/20"
                                style={{ color: '#10b981' }}
                                title="Mark All Pending as Paid"
                              >
                                <FiCheck className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {payout.orderId || payout.batchId}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {payout.description}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {payout.driverName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {payout.driverPhone}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold" style={{ color: payout.status === 'paid' ? '#10b981' : '#8b5cf6' }}>
                            {formatCurrency(payout.amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getTypeBadge(payout.type)}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(payout.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(payout.transactionDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetails(payout)}
                              className="p-2 rounded transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              style={{ color: '#3b82f6' }}
                              title="View Details"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            {payout.status === 'earned' && (
                              <button
                                onClick={() => handleMarkAsPaid(payout)}
                                className="p-2 rounded transition-colors hover:bg-green-50 dark:hover:bg-green-900/20"
                                style={{ color: '#10b981' }}
                                title="Mark as Paid"
                              >
                                <FiCheck className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {aggregatedView ? 'Mark Earnings as Paid' : 'Mark Earning as Paid'}
              </h2>
              <button
                onClick={closePaymentModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(147, 51, 234, 0.1)' }}>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {aggregatedView ? 'Processing Payment For' : 'Processing Payment'}
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedDriver.driverName}
                </p>
                {aggregatedView ? (
                  <>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Earnings: <span className="font-semibold">{selectedDriver.pendingOrders} pending</span>
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Total: <span className="font-semibold" style={{ color: '#9333ea' }}>
                        {formatCurrency(selectedDriver.pendingAmount)}
                      </span>
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Amount: <span className="font-semibold" style={{ color: '#9333ea' }}>
                      {formatCurrency(selectedDriver.amount)}
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Method *
                </label>
                <select
                  name="paymentMethod"
                  value={paymentForm.paymentMethod}
                  onChange={handlePaymentFormChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="wallet">Wallet</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transaction ID / Reference
                </label>
                <input
                  type="text"
                  name="transactionId"
                  value={paymentForm.transactionId}
                  onChange={handlePaymentFormChange}
                  placeholder="Enter transaction ID"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Proof URL (Optional)
                </label>
                <input
                  type="text"
                  name="paymentProof"
                  value={paymentForm.paymentProof}
                  onChange={handlePaymentFormChange}
                  placeholder="Enter screenshot/URL"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={paymentForm.notes}
                  onChange={handlePaymentFormChange}
                  placeholder="Add any additional notes"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={closePaymentModal}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  disabled={submittingPayment}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitPayment}
                  className="flex-1 px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#10b981', color: 'white' }}
                  disabled={submittingPayment}
                >
                  {submittingPayment ? (
                    <>
                      <FiRefreshCw className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-4 h-4" />
                      {aggregatedView ? 'Mark All as Paid' : 'Mark as Paid'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {selectedDriver.driverName} - Earnings Details
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {loadingDetails ? (
                <div className="text-center py-8">
                  <FiRefreshCw className="w-8 h-8 animate-spin mx-auto" style={{ color: '#3b82f6' }} />
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Loading details...</p>
                </div>
              ) : driverDetails ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(147, 51, 234, 0.1)' }}>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Pending Earnings</p>
                      <p className="text-xl font-bold" style={{ color: '#9333ea' }}>
                        {formatCurrency(driverDetails.summary?.pendingPayout || 0)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        To be paid
                      </p>
                    </div>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</p>
                      <p className="text-xl font-bold" style={{ color: '#22c55e' }}>
                        {formatCurrency(driverDetails.summary?.totalEarnings || 0)}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {driverDetails.summary?.totalDeliveries || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Delivered orders
                      </p>
                    </div>
                  </div>

                  {driverDetails.driver && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Driver Information</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {driverDetails.driver.name || driverDetails.driver.fullName || 'Unknown'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {driverDetails.driver.phone || driverDetails.driver.phoneNumber || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Vehicle</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {driverDetails.driver.vehicleNumber || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {driverDetails.earnings && driverDetails.earnings.length > 0 ? (
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Earnings Details ({driverDetails.earnings.length})</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Order ID</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Amount</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Type</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {driverDetails.earnings.map((earning) => (
                              <tr key={earning._id || earning.id}>
                                <td className="px-4 py-3">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {earning.orderId}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-sm font-semibold" style={{ color: '#9333ea' }}>
                                    {formatCurrency(earning.amount)}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  {getTypeBadge(earning.type)}
                                </td>
                                <td className="px-4 py-3">
                                  {getStatusBadge(earning.status)}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-sm text-gray-900 dark:text-white">
                                    {formatDateTime(earning.date || earning.transactionDate)}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">No earnings found for this driver</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400">No details available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverPayouts;