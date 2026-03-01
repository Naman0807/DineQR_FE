import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Users,
  Receipt,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../stores/AuthContext';
import styles from './AdminLayout.module.css';

export function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const adminBasePath = restaurantSlug ? `/${restaurantSlug}/admin` : '/admin';

  const navItems = [
    { to: adminBasePath, icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: `${adminBasePath}/tables`, icon: Users, label: 'Tables' },
    { to: `${adminBasePath}/menu`, icon: UtensilsCrossed, label: 'Menu' },
    { to: `${adminBasePath}/billing`, icon: Receipt, label: 'Billing' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className={styles.layout}>
      {/* Premium Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <NavLink to={adminBasePath} className={styles.logo}>
            DineQR
          </NavLink>

          <div className={styles.headerActions}>
            <div className={styles.userInfo}>
              <span className={styles.username}>{user?.username || 'Admin'}</span>
              <span className={styles.userRole}>{user?.role || 'Staff'}</span>
            </div>
            <button
              onClick={handleLogout}
              className={styles.logoutBtn}
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.contentContainer}>
          <Outlet />
        </div>
      </main>

      {/* Premium Floating Bottom Navigation */}
      <nav className={styles.bottomNav}>
        <ul className={styles.navList}>
          {navItems.map(item => (
            <li key={item.to} className={styles.navItem}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                <item.icon className={styles.navIcon} />
                <span className={styles.navLabel}>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
