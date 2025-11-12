import { useState, useEffect } from 'react';

export const usePermissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [role, setRole] = useState('');
  const [roleName, setRoleName] = useState('');
  const [superAdmin, setSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get admin data from localStorage
    const adminData = localStorage.getItem('adminData');
    if (adminData) {
      try {
        const parsed = JSON.parse(adminData);
        setPermissions(parsed.permissions || []);
        setRole(parsed.role || '');
        setRoleName(parsed.roleName || '');
        setSuperAdmin(parsed.isSuperAdmin || false);
      } catch (error) {
        console.error('Error parsing admin data:', error);
      }
    }
    setLoading(false);
  }, []);

  const hasPermission = (permission) => {
    // Super admin has all permissions
    if (superAdmin || role === 'super_admin') return true;
    
    // Check for wildcard permission
    if (permissions.includes('*')) return true;
    
    // Check if admin has the specific permission
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionList) => {
    // Super admin has all permissions
    if (superAdmin || role === 'super_admin') return true;
    
    // Check for wildcard permission
    if (permissions.includes('*')) return true;
    
    // Check if admin has any of the permissions
    return permissionList.some(permission => permissions.includes(permission));
  };

  const hasAllPermissions = (permissionList) => {
    // Super admin has all permissions
    if (superAdmin || role === 'super_admin') return true;
    
    // Check for wildcard permission
    if (permissions.includes('*')) return true;
    
    // Check if admin has all of the permissions
    return permissionList.every(permission => permissions.includes(permission));
  };

  const isSuperAdmin = () => {
    return superAdmin || role === 'super_admin';
  };

  return {
    permissions,
    role,
    roleName,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
  };
};

export default usePermissions;