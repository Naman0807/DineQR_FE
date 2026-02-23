import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './stores/CartContext';
import { SessionProvider } from './stores/SessionContext';
import { AuthProvider } from './stores/AuthContext';
import { MenuPage } from './pages/MenuPage';
import { CartPage } from './pages/CartPage';
import { OrdersPage } from './pages/OrdersPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { ProtectedRoute } from './components/admin/ProtectedRoute';
import { LoginPage } from './pages/admin/LoginPage';
import { RegisterPage } from './pages/admin/RegisterPage';
import { TablesPage } from './pages/admin/TablesPage';
import { MenuManagementPage } from './pages/admin/MenuManagementPage';
import { OrdersDashboard } from './pages/admin/OrdersDashboard';
import { BillingPage } from './pages/admin/BillingPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin/register" element={<RegisterPage />} />
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
          </Route>
          <Route
            path="/*"
            element={
              <CartProvider>
                <SessionProvider>
                  <Routes>
                    <Route path="/menu" element={<MenuPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/" element={<Navigate to="/menu" replace />} />
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
