import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Users,
  Receipt,
  LogOut,
  Moon,
  Sun,
  Settings,
  User as UserIcon
} from 'lucide-react';
import { Avatar, Dropdown, type MenuProps } from 'antd';
import { useAuth } from '../../stores/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import styles from './AdminLayout.module.css';

export function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
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

  const menuItems: MenuProps['items'] = [
    {
      key: 'settings',
      icon: <Settings size={16} />,
      label: 'Settings',
      onClick: () => navigate(`${adminBasePath}/settings`),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogOut size={16} />,
      label: 'Logout',
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <div className={styles.layout}>
      {/* Premium Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className="flex items-center gap-4">
            <NavLink to={adminBasePath} className={styles.logo}>
              DineQR
              <span className={styles.logoSeparator}>|</span>
              <span className={styles.logoRestaurantName}>
                {user?.restaurant_name || restaurantSlug || 'Restaurant'}
              </span>
            </NavLink>
          </div>

          <div className={styles.headerActions}>
            <button
              onClick={toggleTheme}
              className={styles.themeToggle}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
              <div className={styles.avatarWrapper}>
                <Avatar
                  size="large"
                  icon={<UserIcon size={20} />}
                  style={{ backgroundColor: 'var(--colorPrimary)', cursor: 'pointer' }}
                />
              </div>
            </Dropdown>
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
