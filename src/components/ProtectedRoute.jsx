import { Navigate } from 'react-router-dom';
import usePermissions from '../hooks/usePermissions';

const ProtectedRoute = ({ children, requiredPermission, requireSuperAdmin }) => {
  const { hasPermission, isSuperAdmin, loading } = usePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If super admin is required, check that first
  if (requireSuperAdmin && !isSuperAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  // Super admin has access to everything
  if (isSuperAdmin()) {
    return children;
  }

  // Check if user has required permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;