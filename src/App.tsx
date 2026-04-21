import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { CartProvider } from './stores/CartContext';
import { SessionProvider } from './stores/SessionContext';
import { AuthProvider } from './stores/AuthContext';
import { MenuPage } from './pages/MenuPage';
import { CartPage } from './pages/CartPage';
import { OrdersPage } from './pages/OrdersPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { ProtectedRoute } from './components/admin/ProtectedRoute';
import { useAuth } from './stores/AuthContext';
import { LoginPage } from './pages/admin/LoginPage';
import { RegisterPage } from './pages/admin/RegisterPage';
import { TablesPage } from './pages/admin/TablesPage';
import { MenuManagementPage } from './pages/admin/MenuManagementPage';
import { OrdersDashboard } from './pages/admin/OrdersDashboard';
import { BillingPage } from './pages/admin/BillingPage';
import SettingsPage from './pages/admin/SettingsPage';
import { LandingPage } from './pages/LandingPage';
import BillHistoryPage from './pages/admin/BillHistoryPage';
import CustomerRegister from './pages/CustomerRegister';
import { ThankYouPage } from './pages/ThankYouPage';

import { SuperAdminDashboard } from './pages/SuperAdminDashboard';

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="fullPageLoading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user || user.role !== 'superadmin') {
    return <Navigate to="/superadmin/login" replace />;
  }

  return <>{children}</>;
}

function RestaurantSlugRedirect() {
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  if (!restaurantSlug) {
    return <Navigate to="/superadmin/login" replace />;
  }
  return <Navigate to={`/${restaurantSlug}/menu`} replace />;
}

function LegacyAdminRouteRedirect() {
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const location = useLocation();
  if (!restaurantSlug) {
    return <Navigate to="/superadmin/login" replace />;
  }

  const tail = location.pathname.replace(/^\/admin\/[^/]+/, '');
  return <Navigate to={`/${restaurantSlug}/admin${tail}`} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/api/auth/register" element={<Navigate to="/admin/register" replace />} />
          <Route path="/api/auth/login" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin/register" element={<RegisterPage />} />
          <Route path="/admin/:restaurantSlug/*" element={<LegacyAdminRouteRedirect />} />

          <Route path="/superadmin/login" element={<LoginPage />} />
          <Route path="/superadmin/register" element={<Navigate to="/superadmin/login" replace />} />
          <Route path="/superadmin/dashboard" element={
            <SuperAdminRoute>
              <SuperAdminDashboard />
            </SuperAdminRoute>
          } />

          <Route path="/:restaurantSlug/admin/login" element={<LoginPage />} />
          <Route path="/:restaurantSlug/admin/register" element={<RegisterPage />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OrdersDashboard />} />
            <Route path="tables" element={<TablesPage />} />
            <Route path="menu" element={<MenuManagementPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="history" element={<BillHistoryPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route
            path="/:restaurantSlug/admin/*"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OrdersDashboard />} />
            <Route path="tables" element={<TablesPage />} />
            <Route path="menu" element={<MenuManagementPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="history" element={<BillHistoryPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route
            path="/*"
            element={
              <CartProvider>
                <SessionProvider>
                  <Routes>
                    <Route path="/menu" element={<MenuPage />} />
                    <Route path="/:restaurantSlug/menu" element={<MenuPage />} />
                    <Route path="/:restaurantSlug/cart" element={<CartPage />} />
                    <Route path="/:restaurantSlug/orders" element={<OrdersPage />} />
                    <Route path="/:restaurantSlug/register" element={<CustomerRegister />} />
                    <Route path="/:restaurantSlug/thank-you" element={<ThankYouPage />} />
                    <Route path="/:restaurantSlug" element={<RestaurantSlugRedirect />} />
                    <Route path="/" element={<LandingPage />} />
                    <Route path="*" element={<Navigate to="/menu" replace />} />
                  </Routes>
                </SessionProvider>
              </CartProvider>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
