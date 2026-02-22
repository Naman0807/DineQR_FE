import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './stores/CartContext';
import { SessionProvider } from './stores/SessionContext';
import { MenuPage } from './pages/MenuPage';
import { CartPage } from './pages/CartPage';
import { OrdersPage } from './pages/OrdersPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { TablesPage } from './pages/admin/TablesPage';
import { MenuManagementPage } from './pages/admin/MenuManagementPage';
import { OrdersDashboard } from './pages/admin/OrdersDashboard';
import { BillingPage } from './pages/admin/BillingPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
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
    </BrowserRouter>
  );
}

export default App;
