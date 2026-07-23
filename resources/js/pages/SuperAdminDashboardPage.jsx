import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ChefHat, LogOut } from 'lucide-react';
import { useAuth } from '../features/auth/hooks/AuthContext';

const SuperAdminDashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <div style={styles.pageWrapper}>
      <Head title="Super Admin Dashboard" />
      
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerLogo}>
            <ChefHat size={20} color="#fff" />
          </div>
          <div>
            <div style={styles.headerTitle}>Chef2Comply</div>
            <div style={styles.headerSub}>Super Admin</div>
          </div>
          <nav style={styles.navbar}>
            <Link href="/dashboard" style={{ ...styles.navLink, opacity: 1, fontWeight: 600 }}>Dashboard</Link>
            <Link href="/tenants" style={styles.navLink}>Tenants</Link>
          </nav>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.headerUser}>{user?.name || 'Super Admin'}</span>
          <button onClick={logout} style={styles.logoutBtn} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={styles.main}>
        <h1 style={styles.pageTitle}>Welcome to the Super Admin Portal</h1>
        <p style={styles.pageSubtitle}>
          You are successfully logged in. Select an option from the navigation bar above to manage tenants and subscriptions.
        </p>
      </main>
    </div>
  );
};

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    backgroundColor: 'var(--color-page-bg)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 32px',
    backgroundColor: '#1A6B4F',
    color: '#fff',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerLogo: {
    width: 36,
    height: 36,
    borderRadius: '8px',
    backgroundColor: 'rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#fff',
  },
  headerSub: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.6)',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerUser: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.85)',
  },
  logoutBtn: {
    width: 34,
    height: 34,
    borderRadius: '8px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.7)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 150ms',
  },
  main: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '48px 32px',
    textAlign: 'center',
  },
  pageTitle: {
    fontSize: 'var(--font-size-3xl)',
    fontWeight: 'var(--font-weight-bold)',
    color: 'var(--color-text-primary)',
    marginBottom: '8px',
  },
  pageSubtitle: {
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-text-secondary)',
  },
  navbar: {
    display: 'flex',
    gap: '24px',
    marginLeft: '48px',
  },
  navLink: {
    color: '#fff',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
    opacity: 0.7,
    transition: 'opacity 0.2s',
  },
};

export default SuperAdminDashboardPage;
