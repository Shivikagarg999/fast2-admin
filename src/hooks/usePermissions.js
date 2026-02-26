import { useState, useEffect, useCallback, useMemo } from 'react';

export const PERMISSIONS = {
  SELLERS_CREATE: 'sellers.create',
  SELLERS_APPROVE: 'sellers.approve',
  SELLERS_REJECT: 'sellers.reject',
  SELLERS_TOGGLE_STATUS: 'sellers.toggle_status',
  SHOPS_VIEW: 'shops.view',
  SHOPS_EDIT: 'shops.edit',
  SHOPS_DELETE: 'shops.delete',
};

export const usePermissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [role, setRole] = useState('');
  const [roleName, setRoleName] = useState('');
  const [superAdmin, setSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const hasPermission = useCallback((permission) => {
    if (superAdmin || role === 'super_admin') return true;
    if (permissions.includes('*')) return true;
    return permissions.includes(permission);
  }, [superAdmin, role, permissions]);

  const hasAnyPermission = useCallback((permissionList) => {
    if (superAdmin || role === 'super_admin') return true;
    if (permissions.includes('*')) return true;
    return permissionList.some(permission => permissions.includes(permission));
  }, [superAdmin, role, permissions]);

  const hasAllPermissions = useCallback((permissionList) => {
    if (superAdmin || role === 'super_admin') return true;
    if (permissions.includes('*')) return true;
    return permissionList.every(permission => permissions.includes(permission));
  }, [superAdmin, role, permissions]);

  const isSuperAdmin = useCallback(() => {
    return superAdmin || role === 'super_admin';
  }, [superAdmin, role]);

  return useMemo(() => ({
    permissions,
    role,
    roleName,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
  }), [permissions, role, roleName, loading, hasPermission, hasAnyPermission, hasAllPermissions, isSuperAdmin]);
};

export default usePermissions;