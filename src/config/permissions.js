// All available permissions in the system
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  
  // Users Management
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  
  // Products Management
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_EDIT: 'products.edit',
  PRODUCTS_DELETE: 'products.delete',
  
  // Categories Management
  CATEGORIES_VIEW: 'categories.view',
  CATEGORIES_CREATE: 'categories.create',
  CATEGORIES_EDIT: 'categories.edit',
  CATEGORIES_DELETE: 'categories.delete',
  
  // Orders Management
  ORDERS_VIEW: 'orders.view',
  ORDERS_UPDATE: 'orders.update',
  ORDERS_CANCEL: 'orders.cancel',
  
  // Drivers Management
  DRIVERS_VIEW: 'drivers.view',
  DRIVERS_CREATE: 'drivers.create',
  DRIVERS_EDIT: 'drivers.edit',
  DRIVERS_DELETE: 'drivers.delete',
  DRIVERS_APPROVE: 'drivers.approve',
  
  // Warehouses Management
  WAREHOUSES_VIEW: 'warehouses.view',
  WAREHOUSES_CREATE: 'warehouses.create',
  WAREHOUSES_EDIT: 'warehouses.edit',
  WAREHOUSES_DELETE: 'warehouses.delete',
  
  // Promotors Management
  PROMOTORS_VIEW: 'promotors.view',
  PROMOTORS_CREATE: 'promotors.create',
  PROMOTORS_EDIT: 'promotors.edit',
  PROMOTORS_DELETE: 'promotors.delete',
  
  // Sellers Management
  SELLERS_VIEW: 'sellers.view',
  SELLERS_APPROVE: 'sellers.approve',
  SELLERS_EDIT: 'sellers.edit',
  
  // Marketing
  BANNERS_VIEW: 'banners.view',
  BANNERS_CREATE: 'banners.create',
  BANNERS_EDIT: 'banners.edit',
  BANNERS_DELETE: 'banners.delete',
  
  COUPONS_VIEW: 'coupons.view',
  COUPONS_CREATE: 'coupons.create',
  COUPONS_EDIT: 'coupons.edit',
  COUPONS_DELETE: 'coupons.delete',
  
  DISCOUNTS_VIEW: 'discounts.view',
  DISCOUNTS_CREATE: 'discounts.create',
  DISCOUNTS_EDIT: 'discounts.edit',
  DISCOUNTS_DELETE: 'discounts.delete',
  
  // Terms & Conditions
  TERMS_VIEW: 'terms.view',
  TERMS_EDIT: 'terms.edit',
  
  // Admin Management (Super Admin only)
  ADMINS_VIEW: 'admins.view',
  ADMINS_CREATE: 'admins.create',
  ADMINS_EDIT: 'admins.edit',
  ADMINS_DELETE: 'admins.delete',
  
  // Role Management (Super Admin only)
  ROLES_VIEW: 'roles.view',
  ROLES_CREATE: 'roles.create',
  ROLES_EDIT: 'roles.edit',
  ROLES_DELETE: 'roles.delete',
};

// Permission groups for easier management
export const PERMISSION_GROUPS = {
  dashboard: {
    label: 'Dashboard',
    permissions: [PERMISSIONS.DASHBOARD_VIEW],
  },
  users: {
    label: 'Users Management',
    permissions: [
      PERMISSIONS.USERS_VIEW,
      PERMISSIONS.USERS_CREATE,
      PERMISSIONS.USERS_EDIT,
      PERMISSIONS.USERS_DELETE,
    ],
  },
  products: {
    label: 'Products Management',
    permissions: [
      PERMISSIONS.PRODUCTS_VIEW,
      PERMISSIONS.PRODUCTS_CREATE,
      PERMISSIONS.PRODUCTS_EDIT,
      PERMISSIONS.PRODUCTS_DELETE,
    ],
  },
  categories: {
    label: 'Categories Management',
    permissions: [
      PERMISSIONS.CATEGORIES_VIEW,
      PERMISSIONS.CATEGORIES_CREATE,
      PERMISSIONS.CATEGORIES_EDIT,
      PERMISSIONS.CATEGORIES_DELETE,
    ],
  },
  orders: {
    label: 'Orders Management',
    permissions: [
      PERMISSIONS.ORDERS_VIEW,
      PERMISSIONS.ORDERS_UPDATE,
      PERMISSIONS.ORDERS_CANCEL,
    ],
  },
  drivers: {
    label: 'Drivers Management',
    permissions: [
      PERMISSIONS.DRIVERS_VIEW,
      PERMISSIONS.DRIVERS_CREATE,
      PERMISSIONS.DRIVERS_EDIT,
      PERMISSIONS.DRIVERS_DELETE,
      PERMISSIONS.DRIVERS_APPROVE,
    ],
  },
  warehouses: {
    label: 'Warehouses Management',
    permissions: [
      PERMISSIONS.WAREHOUSES_VIEW,
      PERMISSIONS.WAREHOUSES_CREATE,
      PERMISSIONS.WAREHOUSES_EDIT,
      PERMISSIONS.WAREHOUSES_DELETE,
    ],
  },
  promotors: {
    label: 'Promotors Management',
    permissions: [
      PERMISSIONS.PROMOTORS_VIEW,
      PERMISSIONS.PROMOTORS_CREATE,
      PERMISSIONS.PROMOTORS_EDIT,
      PERMISSIONS.PROMOTORS_DELETE,
    ],
  },
  sellers: {
    label: 'Sellers Management',
    permissions: [
      PERMISSIONS.SELLERS_VIEW,
      PERMISSIONS.SELLERS_APPROVE,
      PERMISSIONS.SELLERS_EDIT,
    ],
  },
  marketing: {
    label: 'Marketing',
    permissions: [
      PERMISSIONS.BANNERS_VIEW,
      PERMISSIONS.BANNERS_CREATE,
      PERMISSIONS.BANNERS_EDIT,
      PERMISSIONS.BANNERS_DELETE,
      PERMISSIONS.COUPONS_VIEW,
      PERMISSIONS.COUPONS_CREATE,
      PERMISSIONS.COUPONS_EDIT,
      PERMISSIONS.COUPONS_DELETE,
      PERMISSIONS.DISCOUNTS_VIEW,
      PERMISSIONS.DISCOUNTS_CREATE,
      PERMISSIONS.DISCOUNTS_EDIT,
      PERMISSIONS.DISCOUNTS_DELETE,
    ],
  },
  terms: {
    label: 'Terms & Conditions',
    permissions: [
      PERMISSIONS.TERMS_VIEW,
      PERMISSIONS.TERMS_EDIT,
    ],
  },
  admins: {
    label: 'Admin Management',
    permissions: [
      PERMISSIONS.ADMINS_VIEW,
      PERMISSIONS.ADMINS_CREATE,
      PERMISSIONS.ADMINS_EDIT,
      PERMISSIONS.ADMINS_DELETE,
    ],
  },
  roles: {
    label: 'Role Management',
    permissions: [
      PERMISSIONS.ROLES_VIEW,
      PERMISSIONS.ROLES_CREATE,
      PERMISSIONS.ROLES_EDIT,
      PERMISSIONS.ROLES_DELETE,
    ],
  },
};

// Get all permissions as array
export const getAllPermissions = () => {
  return Object.values(PERMISSIONS);
};

// Get permission label
export const getPermissionLabel = (permission) => {
  const labels = {
    [PERMISSIONS.DASHBOARD_VIEW]: 'View Dashboard',
    [PERMISSIONS.USERS_VIEW]: 'View Users',
    [PERMISSIONS.USERS_CREATE]: 'Create Users',
    [PERMISSIONS.USERS_EDIT]: 'Edit Users',
    [PERMISSIONS.USERS_DELETE]: 'Delete Users',
    [PERMISSIONS.PRODUCTS_VIEW]: 'View Products',
    [PERMISSIONS.PRODUCTS_CREATE]: 'Create Products',
    [PERMISSIONS.PRODUCTS_EDIT]: 'Edit Products',
    [PERMISSIONS.PRODUCTS_DELETE]: 'Delete Products',
    [PERMISSIONS.CATEGORIES_VIEW]: 'View Categories',
    [PERMISSIONS.CATEGORIES_CREATE]: 'Create Categories',
    [PERMISSIONS.CATEGORIES_EDIT]: 'Edit Categories',
    [PERMISSIONS.CATEGORIES_DELETE]: 'Delete Categories',
    [PERMISSIONS.ORDERS_VIEW]: 'View Orders',
    [PERMISSIONS.ORDERS_UPDATE]: 'Update Orders',
    [PERMISSIONS.ORDERS_CANCEL]: 'Cancel Orders',
    [PERMISSIONS.DRIVERS_VIEW]: 'View Drivers',
    [PERMISSIONS.DRIVERS_CREATE]: 'Create Drivers',
    [PERMISSIONS.DRIVERS_EDIT]: 'Edit Drivers',
    [PERMISSIONS.DRIVERS_DELETE]: 'Delete Drivers',
    [PERMISSIONS.DRIVERS_APPROVE]: 'Approve Drivers',
    [PERMISSIONS.WAREHOUSES_VIEW]: 'View Warehouses',
    [PERMISSIONS.WAREHOUSES_CREATE]: 'Create Warehouses',
    [PERMISSIONS.WAREHOUSES_EDIT]: 'Edit Warehouses',
    [PERMISSIONS.WAREHOUSES_DELETE]: 'Delete Warehouses',
    [PERMISSIONS.PROMOTORS_VIEW]: 'View Promotors',
    [PERMISSIONS.PROMOTORS_CREATE]: 'Create Promotors',
    [PERMISSIONS.PROMOTORS_EDIT]: 'Edit Promotors',
    [PERMISSIONS.PROMOTORS_DELETE]: 'Delete Promotors',
    [PERMISSIONS.SELLERS_VIEW]: 'View Sellers',
    [PERMISSIONS.SELLERS_APPROVE]: 'Approve Sellers',
    [PERMISSIONS.SELLERS_EDIT]: 'Edit Sellers',
    [PERMISSIONS.BANNERS_VIEW]: 'View Banners',
    [PERMISSIONS.BANNERS_CREATE]: 'Create Banners',
    [PERMISSIONS.BANNERS_EDIT]: 'Edit Banners',
    [PERMISSIONS.BANNERS_DELETE]: 'Delete Banners',
    [PERMISSIONS.COUPONS_VIEW]: 'View Coupons',
    [PERMISSIONS.COUPONS_CREATE]: 'Create Coupons',
    [PERMISSIONS.COUPONS_EDIT]: 'Edit Coupons',
    [PERMISSIONS.COUPONS_DELETE]: 'Delete Coupons',
    [PERMISSIONS.DISCOUNTS_VIEW]: 'View Discounts',
    [PERMISSIONS.DISCOUNTS_CREATE]: 'Create Discounts',
    [PERMISSIONS.DISCOUNTS_EDIT]: 'Edit Discounts',
    [PERMISSIONS.DISCOUNTS_DELETE]: 'Delete Discounts',
    [PERMISSIONS.TERMS_VIEW]: 'View Terms',
    [PERMISSIONS.TERMS_EDIT]: 'Edit Terms',
    [PERMISSIONS.ADMINS_VIEW]: 'View Admins',
    [PERMISSIONS.ADMINS_CREATE]: 'Create Admins',
    [PERMISSIONS.ADMINS_EDIT]: 'Edit Admins',
    [PERMISSIONS.ADMINS_DELETE]: 'Delete Admins',
    [PERMISSIONS.ROLES_VIEW]: 'View Roles',
    [PERMISSIONS.ROLES_CREATE]: 'Create Roles',
    [PERMISSIONS.ROLES_EDIT]: 'Edit Roles',
    [PERMISSIONS.ROLES_DELETE]: 'Delete Roles',
  };
  return labels[permission] || permission;
};