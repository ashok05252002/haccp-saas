import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ChefHat, LogOut, Building2, Users, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../features/auth/hooks/AuthContext';
import IrelandGreetingBanner from '../components/common/IrelandGreetingBanner';

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
            <div style={styles.headerSub}>Super Admin Portal</div>
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

      {/* Main Content */}
      <main style={styles.main}>
        {/* Ireland Time Greeting Banner */}
        <IrelandGreetingBanner />

        <div style={styles.adminGrid}>
          <div style={styles.adminCard} onClick={() => window.location.href = '/tenants'}>
            <div style={{ ...styles.cardIconBox, backgroundColor: '#ECFDF5', color: '#10B981' }}>
              <Building2 size={24} />
            </div>
            <div>
              <h3 style={styles.cardTitle}>Tenant Management</h3>
              <p style={styles.cardDesc}>Manage multi-restaurant subscriptions, branches, and tenant provisioning.</p>
            </div>
            <div style={styles.cardAction}>
              <span>Manage Tenants</span>
              <ArrowRight size={16} />
            </div>
          </div>

          <div style={styles.adminCard} onClick={() => window.location.href = '/haccp-logs'}>
            <div style={{ ...styles.cardIconBox, backgroundColor: '#EFF6FF', color: '#3B82F6' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 style={styles.cardTitle}>HACCP Logs & Oversight</h3>
              <p style={styles.cardDesc}>View global compliance logs, food safety audits, and temperature checks.</p>
            </div>
            <div style={styles.cardAction}>
              <span>View Logs</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </div>
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
    gap: '16px',
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
  navbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginLeft: '20px',
  },
  navLink: {
    fontSize: '14px',
    color: '#fff',
    opacity: 0.8,
    textDecoration: 'none',
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
  },
  main: {
    padding: '32px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  adminGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
    marginTop: '10px',
  },
  adminCard: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid var(--color-border)',
    padding: '24px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '16px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
  },
  cardIconBox: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
    margin: '0 0 6px 0',
  },
  cardDesc: {
    fontSize: '13px',
    color: 'var(--color-text-secondary)',
    margin: 0,
    lineHeight: 1.4,
  },
  cardAction: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '14px',
    borderTop: '1px solid var(--color-border-light)',
    color: 'var(--color-primary)',
    fontWeight: 700,
    fontSize: '13.5px',
  }
};

export default SuperAdminDashboardPage;
