import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Users, 
  Receipt,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/tables', icon: Users, label: 'Tables' },
  { to: '/admin/menu', icon: UtensilsCrossed, label: 'Menu' },
  { to: '/admin/billing', icon: Receipt, label: 'Billing' },
];

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const currentPage = navItems.find(item => 
    item.end ? location.pathname === '/admin' : location.pathname.startsWith(item.to)
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b shadow-sm safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-orange-500">DineQR</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 hidden sm:inline">{currentPage?.label || 'Admin'}</span>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-40 h-full bg-white shadow-lg transform transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'w-20' : 'w-64'}
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 md:p-5 lg:p-6 border-b flex items-center justify-between">
          <div className={`transition-all duration-300 ${sidebarCollapsed ? 'hidden lg:block' : ''}`}>
            <h1 className={`font-bold text-orange-500 ${sidebarCollapsed ? 'text-base' : 'text-xl md:text-2xl'}`}>
              {sidebarCollapsed ? 'DQ' : 'DineQR'}
            </h1>
            {!sidebarCollapsed && <p className="text-sm text-gray-500 mt-1">Admin Dashboard</p>}
          </div>
        </div>
        
        <nav className="p-3 md:p-4">
          <ul className="space-y-1 md:space-y-2">
            {navItems.map(item => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 md:px-4 py-3 rounded-lg transition-colors min-h-[48px]
                    ${isActive 
                      ? 'bg-orange-50 text-orange-500 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50'}
                    ${sidebarCollapsed ? 'justify-center' : ''}
                  `}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className={`transition-all duration-300 ${sidebarCollapsed ? 'hidden lg:hidden' : ''}`}>
                    {item.label}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Desktop Collapse Button */}
        <div className="absolute bottom-4 left-0 right-0 px-3 hidden lg:block">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`min-h-screen transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <div className="p-4 md:p-5 lg:p-6 pt-20 lg:pt-6 pb-24 lg:pb-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-30 safe-bottom">
        <div className="flex justify-around py-2 md:py-2.5 px-2">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `
                flex flex-col items-center gap-1 px-3 py-2 min-h-[52px] min-w-[52px] rounded-lg transition-colors
                ${isActive 
                  ? 'text-orange-500' 
                  : 'text-gray-500 hover:text-gray-700'}
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Safe Area Styles */}
      <style>{`
        .safe-top {
          padding-top: env(safe-area-inset-top, 0);
        }
        .safe-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
      `}</style>
    </div>
  );
}
