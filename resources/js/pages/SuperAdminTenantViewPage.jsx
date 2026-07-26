import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ChefHat, LogOut, Shield, Calendar, Phone, Mail, Award } from 'lucide-react';
import { useAuth } from '../features/auth/hooks/AuthContext';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';

const SuperAdminTenantViewPage = ({ tenant }) => {
  const { user, logout } = useAuth();
  
  const handleLogout = async () => {
    await logout();
  };

  const owner = tenant.users && tenant.users.length > 0 ? tenant.users[0] : null;

  return (
    <div style={styles.pageWrapper}>
      <Head title={`Tenant Details - ${tenant.name}`} />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerLogo}><ChefHat size={20} color="#fff" /></div>
          <div>
            <div style={styles.headerTitle}>Chef2Comply</div>
            <div style={styles.headerSub}>Super Admin</div>
          </div>
          <nav style={styles.navbar}>
            <Link href="/dashboard" style={styles.navLink}>Dashboard</Link>
            <Link href="/tenants" style={{ ...styles.navLink, opacity: 1, fontWeight: 600 }}>Tenants</Link>
          </nav>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.headerUser}>{user?.name}</span>
          <button onClick={handleLogout} style={styles.logoutBtn} title="Logout"><LogOut size={18} /></button>
        </div>
      </header>

      <main style={styles.main}>
        {/* Back navigation */}
        <button onClick={() => router.visit('/tenants')} style={styles.backBtn}>
          <ArrowLeft size={16} />
          <span>Back to Tenants</span>
        </button>

        {/* Title area */}
        <div style={styles.titleRow}>
          <div>
            <h1 style={styles.pageTitle}>{tenant.name}</h1>
            <p style={styles.pageSubtitle}>Tenant Profile and System Limits</p>
          </div>
          <StatusBadge label={tenant.status} type={tenant.status === 'Active' ? 'success' : 'warning'} />
        </div>

        {/* Info Grid */}
        <div style={styles.grid}>
          {/* Card 1: Business Details */}
          <Card style={styles.card}>
            <div style={styles.cardHeader}>
              <Shield size={18} color="var(--color-primary)" />
              <h2 style={styles.cardTitle}>Tenant Profile</h2>
            </div>
            <div style={styles.infoList}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Tenant ID</span>
                <span style={styles.infoValue}><code style={styles.codeSnippet}>TN-{tenant.id}</code></span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Business Name</span>
                <span style={styles.infoValue}>{tenant.name}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Status</span>
                <span style={styles.infoValue}>
                  <StatusBadge label={tenant.status} type={tenant.status === 'Active' ? 'success' : 'warning'} />
                </span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Joined Date</span>
                <span style={styles.infoValue}>
                  <div style={styles.inlineVal}>
                    <Calendar size={14} color="var(--color-text-muted)" />
                    <span>{new Date(tenant.created_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                </span>
              </div>
            </div>
          </Card>

          {/* Card 2: Contact Info */}
          <Card style={styles.card}>
            <div style={styles.cardHeader}>
              <Phone size={18} color="var(--color-primary)" />
              <h2 style={styles.cardTitle}>Contact Details</h2>
            </div>
            <div style={styles.infoList}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Owner Name</span>
                <span style={styles.infoValue}>{owner ? owner.name : '—'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Email Address</span>
                <span style={styles.infoValue}>
                  <div style={styles.inlineVal}>
                    <Mail size={14} color="var(--color-text-muted)" />
                    <span>{owner ? owner.email : '—'}</span>
                  </div>
                </span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Phone Number</span>
                <span style={styles.infoValue}>
                  <div style={styles.inlineVal}>
                    <Phone size={14} color="var(--color-text-muted)" />
                    <span>{tenant.phone || '—'}</span>
                  </div>
                </span>
              </div>
            </div>
          </Card>

          {/* Card 3: Subscription & Limits */}
          <Card style={styles.card}>
            <div style={styles.cardHeader}>
              <Award size={18} color="var(--color-primary)" />
              <h2 style={styles.cardTitle}>Quota & Account Settings</h2>
            </div>
            <div style={styles.infoList}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Subscription Plan</span>
                <span style={styles.infoValue}>
                  <span style={styles.planBadge}>{tenant.subscription_plan || 'Standard'}</span>
                </span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Location Quota</span>
                <span style={styles.infoValue}>{tenant.restaurant_limit} Location(s)</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Created By</span>
                <span style={styles.infoValue}>System Setup</span>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

const styles = {
  pageWrapper: { minHeight: '100vh', backgroundColor: 'var(--color-page-bg)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', backgroundColor: '#1A6B4F', color: '#fff', position: 'sticky', top: 0, zIndex: 50 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  headerLogo: { width: 36, height: 36, borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: '15px', fontWeight: 700, color: '#fff' },
  headerSub: { fontSize: '11px', color: 'rgba(255,255,255,0.6)' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  headerUser: { fontSize: '13px', color: 'rgba(255,255,255,0.85)' },
  logoutBtn: { width: 34, height: 34, borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '24px 32px' },
  backBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', fontSize: '14px', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginBottom: '24px', padding: 0 },
  titleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' },
  pageTitle: { fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', marginBottom: '4px' },
  pageSubtitle: { fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' },
  card: { padding: '24px' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '12px' },
  cardTitle: { fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 },
  infoList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  infoItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dotted var(--color-border-light)', paddingBottom: '8px' },
  infoLabel: { fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 },
  infoValue: { fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: 600 },
  codeSnippet: { fontSize: '12px', padding: '2px 6px', backgroundColor: 'var(--color-gray-100)', borderRadius: '4px', border: '1px solid var(--color-border)' },
  planBadge: { display: 'inline-block', padding: '2px 8px', backgroundColor: '#EFF6FF', color: '#2563EB', borderRadius: '4px', fontSize: '12px', fontWeight: 600 },
  inlineVal: { display: 'flex', alignItems: 'center', gap: '6px' },
  navbar: { display: 'flex', gap: '24px', marginLeft: '48px' },
  navLink: { color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 500, opacity: 0.7, transition: 'opacity 0.2s' },
};

export default SuperAdminTenantViewPage;
