const API_BASE_URL = `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api`;

// Fetch order statistics
export const fetchOrderStats = async (period = 'month') => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/orders/stats?period=${period}`);
    if (!response.ok) throw new Error('Failed to fetch order stats');
    return await response.json();
  } catch (error) {
    console.error('Error fetching order stats:', error);
    throw error;
  }
};

// Fetch all orders
export const fetchAllOrders = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/admin/orders/getall?${queryParams}`);
    if (!response.ok) throw new Error('Failed to fetch orders');
    return await response.json();
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

// Fetch product statistics
export const fetchProductStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/product/admin/stats`);
    if (!response.ok) throw new Error('Failed to fetch product stats');
    return await response.json();
  } catch (error) {
    console.error('Error fetching product stats:', error);
    throw error;
  }
};

// Fetch all products
export const fetchAllProducts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/products/getall`);
    if (!response.ok) throw new Error('Failed to fetch products');
    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Fetch users
export const fetchUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Format currency in INR
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

// Format number with commas
export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-IN').format(num || 0);
};

// Calculate percentage change
export const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

// Fetch all admins
export const fetchAllAdmins = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/all`);
    if (!response.ok) throw new Error('Failed to fetch admins');
    return await response.json();
  } catch (error) {
    console.error('Error fetching admins:', error);
    throw error;
  }
};

// Create admin
export const createAdmin = async (adminData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminData),
    });
    if (!response.ok) throw new Error('Failed to create admin');
    return await response.json();
  } catch (error) {
    console.error('Error creating admin:', error);
    throw error;
  }
};

// Update admin
export const updateAdmin = async (adminId, adminData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/${adminId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminData),
    });
    if (!response.ok) throw new Error('Failed to update admin');
    return await response.json();
  } catch (error) {
    console.error('Error updating admin:', error);
    throw error;
  }
};

// Delete admin
export const deleteAdmin = async (adminId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/${adminId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete admin');
    return await response.json();
  } catch (error) {
    console.error('Error deleting admin:', error);
    throw error;
  }
};