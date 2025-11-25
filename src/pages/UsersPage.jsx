import { useEffect, useState } from "react";
import axios from "axios";
import { 
  FiEdit, 
  FiTrash2, 
  FiUsers, 
  FiSearch, 
  FiUserPlus, 
  FiDollarSign, 
  FiX,
  FiMail,
  FiPhone,
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff
} from "react-icons/fi";
import usePermissions from "../hooks/usePermissions";
import { PERMISSIONS } from "../config/permissions";

const UsersPage = () => {
  const { hasPermission } = usePermissions();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletNote, setWalletNote] = useState("");
  const [walletLoading, setWalletLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "user",
    password: ""
  });
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const usersPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/users`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(res.data.users);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // Add User Functions
  const openAddUserModal = () => {
    if (!hasPermission(PERMISSIONS.USERS_CREATE)) {
      alert("You don't have permission to add users");
      return;
    }
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "user",
      password: ""
    });
    setShowAddUserModal(true);
    setError("");
    setSuccess("");
  };

  const closeAddUserModal = () => {
    setShowAddUserModal(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "user",
      password: ""
    });
    setError("");
    setSuccess("");
  };

  const handleAddUser = async () => {
    if (!hasPermission(PERMISSIONS.USERS_CREATE)) {
      setError("You don't have permission to add users");
      return;
    }

    if (!formData.name || !formData.email || !formData.password) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setFormLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/users`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setSuccess("User created successfully");
        setTimeout(() => {
          closeAddUserModal();
          fetchUsers();
        }, 1000);
      }
    } catch (err) {
      console.error("Error creating user:", err);
      setError(err.response?.data?.message || "Failed to create user");
    } finally {
      setFormLoading(false);
    }
  };

  // Edit User Functions
  const openEditUserModal = (user) => {
    if (!hasPermission(PERMISSIONS.USERS_EDIT)) {
      alert("You don't have permission to edit users");
      return;
    }
    setSelectedUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "user",
      password: ""
    });
    setShowEditUserModal(true);
    setError("");
    setSuccess("");
  };

  const closeEditUserModal = () => {
    setShowEditUserModal(false);
    setSelectedUser(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "user",
      password: ""
    });
    setError("");
    setSuccess("");
  };

  const handleEditUser = async () => {
    if (!hasPermission(PERMISSIONS.USERS_EDIT)) {
      setError("You don't have permission to edit users");
      return;
    }

    if (!formData.name || !formData.email) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setFormLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role
      };
      
      if (formData.password) {
        updateData.password = formData.password;
      }

      const res = await axios.put(
        `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/users/${selectedUser._id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setSuccess("User updated successfully");
        setTimeout(() => {
          closeEditUserModal();
          fetchUsers();
        }, 1000);
      }
    } catch (err) {
      console.error("Error updating user:", err);
      setError(err.response?.data?.message || "Failed to update user");
    } finally {
      setFormLoading(false);
    }
  };

  // Delete User Function
  const handleDeleteUser = async (userId, userName) => {
    if (!hasPermission(PERMISSIONS.USERS_DELETE)) {
      alert("You don't have permission to delete users");
      return;
    }
    
    if (!confirm(`Are you sure you want to delete user: ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(
        `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/users/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        alert("User deleted successfully");
        fetchUsers();
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  // Wallet Functions
  const handleAddMoney = async () => {
    if (!hasPermission(PERMISSIONS.USERS_EDIT)) {
      alert("You don't have permission to modify user wallets");
      return;
    }
    if (!walletAmount || parseFloat(walletAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      setWalletLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/users/${selectedUser._id}/wallet/add`,
        {
          amount: parseFloat(walletAmount),
          note: walletNote || "Admin credit"
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        alert(res.data.message);
        setShowWalletModal(false);
        setWalletAmount("");
        setWalletNote("");
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (err) {
      console.error("Error adding money to wallet:", err);
      alert(err.response?.data?.message || "Failed to add money to wallet");
    } finally {
      setWalletLoading(false);
    }
  };

  const openWalletModal = (user) => {
    if (!hasPermission(PERMISSIONS.USERS_EDIT)) {
      alert("You don't have permission to modify user wallets");
      return;
    }
    setSelectedUser(user);
    setShowWalletModal(true);
    setWalletAmount("");
    setWalletNote("");
  };

  const closeWalletModal = () => {
    setShowWalletModal(false);
    setSelectedUser(null);
    setWalletAmount("");
    setWalletNote("");
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const roles = [...new Set(users.map(u => u.role))].filter(Boolean).sort();

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search);
    
    const matchesRole = !roleFilter || u.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const getRoleBadge = (role) => {
    const roleColors = {
      admin: { backgroundColor: '#e9d5ff', color: '#6b21a8' },
      user: { backgroundColor: '#dbeafe', color: '#1e40af' },
      customer: { backgroundColor: '#dcfce7', color: '#166534' },
      moderator: { backgroundColor: '#fed7aa', color: '#9a3412' },
    };
    
    const style = roleColors[role?.toLowerCase()] || { backgroundColor: '#f3f4f6', color: '#374151' };
    
    return (
      <span style={{
        padding: '4px 12px',
        fontSize: '12px',
        fontWeight: '500',
        borderRadius: '9999px',
        ...style
      }}>
        {role || "N/A"}
      </span>
    );
  };

  // Button Styles
  const buttonStyles = {
    primary: {
      backgroundColor: '#000000',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      padding: '10px 20px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '500'
    },
    secondary: {
      backgroundColor: '#ffffff',
      color: '#374151',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      padding: '10px 20px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '500'
    },
    danger: {
      backgroundColor: '#dc2626',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      padding: '8px 16px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    success: {
      backgroundColor: '#16a34a',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      padding: '10px 20px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '500'
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#3b82f6',
      border: '1px solid #3b82f6',
      borderRadius: '8px',
      padding: '8px 16px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }
  };

  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', width: '100%', padding: '24px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiUsers style={{ width: '24px', height: '24px', color: '#2563eb' }} />
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>All Users</h1>
            <span style={{
              padding: '4px 12px',
              fontSize: '12px',
              backgroundColor: '#e5e7eb',
              color: '#374151',
              borderRadius: '9999px'
            }}>
              {filteredUsers.length} users
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '16px', flexDirection: 'column', width: '100%' }}>
              <div style={{ display: 'flex', gap: '16px', flexDirection: 'row' }}>
                {/* Search Input */}
                <div style={{ flex: 1, position: 'relative' }}>
                  <FiSearch style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                    width: '16px',
                    height: '16px'
                  }} />
                  <input
                    type="text"
                    placeholder="Search by name, email, phone..."
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 40px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      fontSize: '14px'
                    }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {/* Role Filter */}
                {roles.length > 0 && (
                  <div style={{ width: '200px' }}>
                    <select
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#ffffff',
                        color: '#111827',
                        fontSize: '14px'
                      }}
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                    >
                      <option value="">All Roles</option>
                      {roles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Add User Button */}
                {hasPermission(PERMISSIONS.USERS_CREATE) && (
                  <button 
                    onClick={openAddUserModal}
                    style={buttonStyles.primary}
                  >
                    <FiUserPlus style={{ width: '16px', height: '16px' }} />
                    Add User
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Name
                  </th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Email
                  </th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Phone
                  </th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Role
                  </th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Wallet
                  </th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <div style={{
                          animation: 'spin 1s linear infinite',
                          borderRadius: '9999px',
                          width: '24px',
                          height: '24px',
                          borderBottom: '2px solid #2563eb'
                        }}></div>
                        <span style={{ color: '#6b7280' }}>Loading users...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <FiUsers style={{ width: '48px', height: '48px', color: '#9ca3af' }} />
                        <span style={{ color: '#6b7280' }}>No users found.</span>
                        {search && (
                          <button 
                            onClick={() => setSearch("")}
                            style={{ color: '#2563eb', fontSize: '14px' }}
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((user) => (
                    <tr key={user._id} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                          {user.name || "N/A"}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontSize: '14px', color: '#111827' }}>
                          {user.email || "N/A"}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontSize: '14px', color: '#111827' }}>
                          {user.phone || "N/A"}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        {getRoleBadge(user.role)}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                          ₹{user.wallet || 0}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <button 
                            style={{
                              color: '#16a34a',
                              padding: '8px',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              backgroundColor: 'transparent'
                            }}
                            title="Add Money to Wallet"
                            onClick={() => openWalletModal(user)}
                          >
                            <FiDollarSign style={{ width: '16px', height: '16px' }} />
                          </button>
                          {hasPermission(PERMISSIONS.USERS_EDIT) && (
                            <button 
                              style={{
                                color: '#2563eb',
                                padding: '8px',
                                borderRadius: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: 'transparent'
                              }}
                              title="Edit User"
                              onClick={() => openEditUserModal(user)}
                            >
                              <FiEdit style={{ width: '16px', height: '16px' }} />
                            </button>
                          )}
                          {hasPermission(PERMISSIONS.USERS_DELETE) && (
                            <button 
                              style={{
                                color: '#dc2626',
                                padding: '8px',
                                borderRadius: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: 'transparent'
                              }}
                              title="Delete User"
                              onClick={() => handleDeleteUser(user._id, user.name)}
                            >
                              <FiTrash2 style={{ width: '16px', height: '16px' }} />
                            </button>
                          )}
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
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginTop: '24px'
          }}>
            <div style={{ fontSize: '14px', color: '#374151' }}>
              Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  ...buttonStyles.secondary,
                  opacity: currentPage === 1 ? 0.5 : 1,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
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
                    style={{
                      padding: '8px 12px',
                      fontSize: '14px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      backgroundColor: currentPage === pageNum ? '#000000' : '#ffffff',
                      color: currentPage === pageNum ? '#ffffff' : '#374151',
                      cursor: 'pointer'
                    }}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  ...buttonStyles.secondary,
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Wallet Modal */}
        {showWalletModal && (
          <div style={{
            position: 'fixed',
            inset: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '50',
            padding: '16px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              width: '100%',
              maxWidth: '400px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '24px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827' }}>
                  Add Money to Wallet
                </h2>
                <button
                  onClick={closeWalletModal}
                  style={{ color: '#9ca3af', padding: '4px', borderRadius: '4px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
                >
                  <FiX style={{ width: '24px', height: '24px' }} />
                </button>
              </div>
              
              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>User</p>
                  <p style={{ fontSize: '16px', fontWeight: '500', color: '#111827' }}>{selectedUser?.name || "N/A"}</p>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>{selectedUser?.phone || "N/A"}</p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Current Wallet Balance</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
                    ₹{selectedUser?.wallet || 0}
                  </p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Amount to Add (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={walletAmount}
                    onChange={(e) => setWalletAmount(e.target.value)}
                    placeholder="Enter amount"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Note (Optional)
                  </label>
                  <textarea
                    value={walletNote}
                    onChange={(e) => setWalletNote(e.target.value)}
                    placeholder="Add a note for this transaction"
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={closeWalletModal}
                    style={{
                      ...buttonStyles.secondary,
                      flex: 1
                    }}
                    disabled={walletLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMoney}
                    disabled={walletLoading || !walletAmount || parseFloat(walletAmount) <= 0}
                    style={{
                      ...buttonStyles.success,
                      flex: 1,
                      opacity: (walletLoading || !walletAmount || parseFloat(walletAmount) <= 0) ? 0.5 : 1,
                      cursor: (walletLoading || !walletAmount || parseFloat(walletAmount) <= 0) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {walletLoading ? (
                      <>
                        <div style={{
                          animation: 'spin 1s linear infinite',
                          borderRadius: '9999px',
                          width: '16px',
                          height: '16px',
                          borderBottom: '2px solid #ffffff'
                        }}></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiDollarSign style={{ width: '16px', height: '16px' }} />
                        Add Money
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add User Modal */}
        {showAddUserModal && (
          <div style={{
            position: 'fixed',
            inset: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '50',
            padding: '16px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              width: '100%',
              maxWidth: '500px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '24px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827' }}>
                  Add New User
                </h2>
                <button
                  onClick={closeAddUserModal}
                  style={{ color: '#9ca3af', padding: '4px', borderRadius: '4px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
                >
                  <FiX style={{ width: '24px', height: '24px' }} />
                </button>
              </div>
              
              <div style={{ padding: '24px' }}>
                {error && (
                  <div style={{
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    fontSize: '14px'
                  }}>
                    {error}
                  </div>
                )}
                
                {success && (
                  <div style={{
                    backgroundColor: '#dcfce7',
                    border: '1px solid #bbf7d0',
                    color: '#16a34a',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    fontSize: '14px'
                  }}>
                    {success}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Name *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <FiUser style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9ca3af',
                        width: '16px',
                        height: '16px'
                      }} />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        placeholder="Enter user name"
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 40px',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          backgroundColor: '#ffffff',
                          color: '#111827',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Email *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <FiMail style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9ca3af',
                        width: '16px',
                        height: '16px'
                      }} />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleFormChange}
                        placeholder="Enter user email"
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 40px',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          backgroundColor: '#ffffff',
                          color: '#111827',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Phone
                    </label>
                    <div style={{ position: 'relative' }}>
                      <FiPhone style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9ca3af',
                        width: '16px',
                        height: '16px'
                      }} />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleFormChange}
                        placeholder="Enter user phone"
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 40px',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          backgroundColor: '#ffffff',
                          color: '#111827',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Role
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleFormChange}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#ffffff',
                        color: '#111827',
                        fontSize: '14px'
                      }}
                    >
                      <option value="user">User</option>
                      <option value="customer">Customer</option>
                      <option value="moderator">Moderator</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Password *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <FiLock style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9ca3af',
                        width: '16px',
                        height: '16px'
                      }} />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleFormChange}
                        placeholder="Enter password"
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 40px',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          backgroundColor: '#ffffff',
                          color: '#111827',
                          fontSize: '14px'
                        }}
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          color: '#9ca3af'
                        }}
                      >
                        {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    onClick={closeAddUserModal}
                    style={{
                      ...buttonStyles.secondary,
                      flex: 1
                    }}
                    disabled={formLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddUser}
                    disabled={formLoading || !formData.name || !formData.email || !formData.password}
                    style={{
                      ...buttonStyles.primary,
                      flex: 1,
                      opacity: (formLoading || !formData.name || !formData.email || !formData.password) ? 0.5 : 1,
                      cursor: (formLoading || !formData.name || !formData.email || !formData.password) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {formLoading ? (
                      <>
                        <div style={{
                          animation: 'spin 1s linear infinite',
                          borderRadius: '9999px',
                          width: '16px',
                          height: '16px',
                          borderBottom: '2px solid #ffffff'
                        }}></div>
                        Creating...
                      </>
                    ) : (
                      "Add User"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditUserModal && (
          <div style={{
            position: 'fixed',
            inset: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '50',
            padding: '16px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              width: '100%',
              maxWidth: '500px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '24px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827' }}>
                  Edit User
                </h2>
                <button
                  onClick={closeEditUserModal}
                  style={{ color: '#9ca3af', padding: '4px', borderRadius: '4px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
                >
                  <FiX style={{ width: '24px', height: '24px' }} />
                </button>
              </div>
              
              <div style={{ padding: '24px' }}>
                {error && (
                  <div style={{
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    fontSize: '14px'
                  }}>
                    {error}
                  </div>
                )}
                
                {success && (
                  <div style={{
                    backgroundColor: '#dcfce7',
                    border: '1px solid #bbf7d0',
                    color: '#16a34a',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    fontSize: '14px'
                  }}>
                    {success}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Name *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <FiUser style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9ca3af',
                        width: '16px',
                        height: '16px'
                      }} />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        placeholder="Enter user name"
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 40px',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          backgroundColor: '#ffffff',
                          color: '#111827',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Email *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <FiMail style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9ca3af',
                        width: '16px',
                        height: '16px'
                      }} />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleFormChange}
                        placeholder="Enter user email"
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 40px',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          backgroundColor: '#ffffff',
                          color: '#111827',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Phone
                    </label>
                    <div style={{ position: 'relative' }}>
                      <FiPhone style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9ca3af',
                        width: '16px',
                        height: '16px'
                      }} />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleFormChange}
                        placeholder="Enter user phone"
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 40px',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          backgroundColor: '#ffffff',
                          color: '#111827',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Role
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleFormChange}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#ffffff',
                        color: '#111827',
                        fontSize: '14px'
                      }}
                    >
                      <option value="user">User</option>
                      <option value="customer">Customer</option>
                      <option value="moderator">Moderator</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      New Password (Leave blank to keep current)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <FiLock style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9ca3af',
                        width: '16px',
                        height: '16px'
                      }} />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleFormChange}
                        placeholder="Enter new password"
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 40px',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          backgroundColor: '#ffffff',
                          color: '#111827',
                          fontSize: '14px'
                        }}
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          color: '#9ca3af'
                        }}
                      >
                        {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    onClick={closeEditUserModal}
                    style={{
                      ...buttonStyles.secondary,
                      flex: 1
                    }}
                    disabled={formLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditUser}
                    disabled={formLoading || !formData.name || !formData.email}
                    style={{
                      ...buttonStyles.primary,
                      flex: 1,
                      opacity: (formLoading || !formData.name || !formData.email) ? 0.5 : 1,
                      cursor: (formLoading || !formData.name || !formData.email) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {formLoading ? (
                      <>
                        <div style={{
                          animation: 'spin 1s linear infinite',
                          borderRadius: '9999px',
                          width: '16px',
                          height: '16px',
                          borderBottom: '2px solid #ffffff'
                        }}></div>
                        Updating...
                      </>
                    ) : (
                      "Update User"
                    )}
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

export default UsersPage;