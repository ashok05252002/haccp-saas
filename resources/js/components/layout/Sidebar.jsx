import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
  LayoutDashboard,
  ClipboardCheck,
  FileBarChart,
  ShieldCheck,
  ChefHat,
  Calculator,
  CalendarDays,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  ArrowLeftRight,
  Store,
} from 'lucide-react';
import { useAuth } from '../../features/auth/hooks/AuthContext';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/manager-hub', label: 'Manager Hub', icon: Settings },
];

const Sidebar = () => {
  const { user, logout, selectedRestaurant, switchRestaurant } = useAuth();
  const { url } = usePage();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const handleSwitchRestaurant = () => {
    switchRestaurant();
    router.visit('/client/restaurants');
  };

  const toggleMobile = () => setMobileOpen(!mobileOpen);
  const closeMobile = () => setMobileOpen(false);

  const restaurantLabel = selectedRestaurant
    ? `${selectedRestaurant.restaurantName}${selectedRestaurant.branchName ? ` - ${selectedRestaurant.branchName}` : ''}`
    : '';

  const sidebarContent = (
    <>
      {/* Logo */}
      <div style={styles.logoSection}>
        <div style={styles.logoIcon}>
          <ChefHat size={22} color="#fff" />
        </div>
        <div>
          <div style={styles.logoText}>Chef2Comply</div>
          <div style={styles.logoSubtext}>HACCP & Planning</div>
        </div>
      </div>

      {/* Selected restaurant context */}
      {restaurantLabel && (
        <div style={styles.restaurantBar}>
          <Store size={14} color="rgba(255,255,255,0.7)" />
          <span style={styles.restaurantName}>{restaurantLabel}</span>
        </div>
      )}

      {/* Navigation */}
      <nav style={styles.nav}>
        {menuItems.map((item) => {
          const isActive = url === item.path || url.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={closeMobile}
              style={{
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
              }}
            >
              <item.icon size={18} style={{ opacity: isActive ? 1 : 0.8 }} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Switch Restaurant */}
        {user?.role === 'client' && (
          <button onClick={handleSwitchRestaurant} style={styles.switchBtn}>
            <ArrowLeftRight size={18} style={{ opacity: 0.8 }} />
            <span>Switch Restaurant</span>
          </button>
        )}
      </nav>

      {/* User footer */}
      <div style={styles.userSection}>
        <div style={styles.userInfo}>
          <div style={styles.userAvatar}>
            <User size={18} color="rgba(255,255,255,0.8)" />
          </div>
          <div>
            <div style={styles.userName}>{user?.name || 'User'}</div>
            <div style={styles.userRole}>
              {user?.role === 'super_admin' ? 'Super Admin' : (user?.role === 'client' ? 'Client Admin' : 'Branch Manager')}
            </div>
          </div>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button style={styles.hamburger} onClick={toggleMobile} className="mobile-only">
        <Menu size={24} color="var(--color-text-primary)" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={styles.mobileOverlay} onClick={closeMobile}>
          <div style={styles.mobileDrawer} onClick={(e) => e.stopPropagation()}>
            <button style={styles.drawerClose} onClick={closeMobile}>
              <X size={20} color="#fff" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside style={styles.sidebar} className="sidebar-desktop">
        {sidebarContent}
      </aside>
    </>
  );
};

const styles = {
  sidebar: {
    width: 'var(--sidebar-width)',
    minWidth: 'var(--sidebar-width)',
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
    backgroundColor: '#1A6B4F',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    overflowY: 'auto',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '24px 20px 16px',
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: '10px',
    backgroundColor: 'rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoText: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#fff',
  },
  logoSubtext: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.6)',
    marginTop: '1px',
  },
  restaurantBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 20px 12px',
    margin: '0 12px 4px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  restaurantName: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.7)',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  nav: {
    flex: 1,
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '10px',
    color: 'rgba(255,255,255,0.8)',
    fontSize: '14px',
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'all 150ms ease',
  },
  navItemActive: {
    backgroundColor: '#14573F',
    color: '#fff',
  },
  switchBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '10px',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '13px',
    fontWeight: 500,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    marginTop: '8px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    paddingTop: '14px',
    textAlign: 'left',
    width: '100%',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#fff',
  },
  userRole: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.55)',
  },
  logoutBtn: {
    width: 32,
    height: 32,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255,255,255,0.6)',
    cursor: 'pointer',
    border: 'none',
    backgroundColor: 'transparent',
    transition: 'all 150ms',
  },
  hamburger: {
    position: 'fixed',
    top: '14px',
    left: '14px',
    zIndex: 90,
    width: 44,
    height: 44,
    borderRadius: '10px',
    backgroundColor: '#fff',
    border: '1px solid var(--color-border)',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-md)',
    cursor: 'pointer',
  },
  mobileOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 200,
    animation: 'fadeIn 0.2s ease',
  },
  mobileDrawer: {
    width: '280px',
    height: '100vh',
    backgroundColor: '#1A6B4F',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  drawerClose: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    width: 32,
    height: 32,
    borderRadius: '8px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
};

export default Sidebar;
