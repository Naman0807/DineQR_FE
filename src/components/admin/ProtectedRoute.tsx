import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../stores/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const pathRoot = pathParts[0];
    const loginPath = pathRoot === 'admin' ? '/admin/login' : (pathRoot ? `/${pathRoot}/admin/login` : '/superadmin/login');
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (user?.role === 'superadmin') {
    return <Navigate to="/superadmin/dashboard" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/superadmin/login" replace />;
  }

  const isSluglessAdminRoute = location.pathname === '/admin' || location.pathname.startsWith('/admin/');
  if (!isSluglessAdminRoute && (!restaurantSlug || restaurantSlug.startsWith(':'))) {
    return <Navigate to="/superadmin/dashboard" replace />;
  }

  return <>{children}</>;
}
