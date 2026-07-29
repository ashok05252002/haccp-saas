import React, { useState, useEffect } from 'react';
import { router, Link, Head } from '@inertiajs/react';
import {
  ChefHat,
  LogOut,
  Plus,
  Search,
  ArrowLeft,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../features/auth/hooks/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import Loader from '../components/common/Loader';
import { getTenants, createTenant, updateTenant, deleteTenant, toggleTenantStatus } from '../services/TenantService';

const SuperAdminTenantsPage = () => {
  const { user, logout } = useAuth();
  const [Tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    TenantName: '', businessName: '', email: '', phone: '',
    password: '', confirmPassword: '', restaurantLimit: 1,
    subscriptionPlan: 'Standard', status: 'Active',
  });
  const [statusConfirmModalOpen, setStatusConfirmModalOpen] = useState(false);
  const [statusConfirmTenant, setStatusConfirmTenant] = useState(null);
  const [statusConfirmSaving, setStatusConfirmSaving] = useState(false);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const data = await getTenants();
      setTenants(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTenants(); }, []);

  const handleLogout = async () => {
    await logout();
  };

  const resetForm = () => {
    setForm({ TenantName: '', businessName: '', email: '', phone: '', password: '', confirmPassword: '', restaurantLimit: 1, subscriptionPlan: 'Standard', status: 'Active' });
    setEditId(null);
    setError('');
    setShowPassword(false);
  };

  const handleOpenCreate = () => { resetForm(); setModalOpen(true); };

  const handleOpenEdit = (Tenant) => {
    setEditId(Tenant.real_id);
    setForm({
      TenantName: Tenant.TenantName,
      businessName: Tenant.businessName || '',
      email: Tenant.email,
      phone: Tenant.phone || '',
      password: '',
      confirmPassword: '',
      restaurantLimit: Tenant.restaurantLimit,
      subscriptionPlan: Tenant.subscriptionPlan,
      status: Tenant.status,
    });
    setError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    setError('');
    if (!form.TenantName.trim()) { setError('Tenant name is required.'); return; }
    if (!form.email.trim()) { setError('Email is required.'); return; }
    if (!editId && !form.password) { setError('Password is required.'); return; }
    if (form.password && form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (!form.restaurantLimit || form.restaurantLimit < 1) { setError('Restaurant limit must be at least 1.'); return; }

    setSaving(true);
    try {
      const payload = {
        TenantName: form.TenantName,
        businessName: form.businessName,
        email: form.email,
        phone: form.phone,
        restaurantLimit: parseInt(form.restaurantLimit),
        subscriptionPlan: form.subscriptionPlan,
        status: form.status,
      };
      if (form.password) payload.password = form.password;

      if (editId) {
        await updateTenant(editId, payload);
        setSuccess('Tenant updated successfully!');
      } else {
        await createTenant(payload);
        setSuccess('Tenant created successfully!');
      }
      setModalOpen(false);
      setTimeout(() => setSuccess(''), 3000);
      fetchTenants();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = (tenant) => {
    setStatusConfirmTenant(tenant);
    setStatusConfirmModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!statusConfirmTenant) return;
    setStatusConfirmSaving(true);
    try {
      await toggleTenantStatus(statusConfirmTenant.real_id);
      setStatusConfirmModalOpen(false);
      setSuccess(`Tenant status changed to ${statusConfirmTenant.status === 'Active' ? 'Suspended' : 'Active'} successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      fetchTenants();
    } catch (err) {
      console.error(err);
      setError('Failed to toggle status.');
    } finally {
      setStatusConfirmSaving(false);
      setStatusConfirmTenant(null);
    }
  };

  const handleDelete = async (tenant) => {
    if (!window.confirm(`Are you sure you want to delete the tenant "${tenant.businessName}"?`)) return;
    try {
      await deleteTenant(tenant.real_id);
      setSuccess('Tenant deleted successfully.');
      setTimeout(() => setSuccess(''), 3000);
      fetchTenants();
    } catch (err) {
      console.error(err);
      setError('Failed to delete tenant.');
    }
  };

  // Filtering
  const filtered = Tenants.filter((c) => {
    const matchesSearch = !search || c.TenantName.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()) || (c.businessName || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesPlan = planFilter === 'all' || c.subscriptionPlan === planFilter;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  return (
    <div style={styles.pageWrapper}>
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
        {/* Title */}
        <h1 style={styles.pageTitle}>Tenants</h1>
        <p style={styles.pageSubtitle}>Create and manage Tenant access for Chef2Comply</p>

        {success && (
          <div style={styles.successBox}><CheckCircle size={16} /><span>{success}</span></div>
        )}

        {/* Toolbar */}
        <div style={styles.toolbar}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '340px' }}>
            <Search size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input className="form-input" placeholder="Search Tenants..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
          </div>
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '150px' }}>
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
          </select>
          <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>Create Tenant</Button>
        </div>

        {/* Tenant List */}
        {loading ? (
          <Loader message="Loading Tenants..." />
        ) : filtered.length === 0 ? (
          <Card><EmptyState message="No Tenants found" submessage="Try adjusting filters or create a new Tenant." /></Card>
        ) : (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Tenant Name</th>
                    <th style={styles.th}>Business</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Rest. Limit</th>
                    <th style={styles.th}>Phone</th>
                    <th style={styles.th}>Created</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((Tenant) => (
                    <tr key={Tenant.id}>
                      <td style={styles.td}><code style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{Tenant.id}</code></td>
                      <td style={{ ...styles.td, fontWeight: 600 }}>{Tenant.TenantName}</td>
                      <td style={styles.td}>{Tenant.businessName || '—'}</td>
                      <td style={styles.td}>{Tenant.email}</td>
                      <td style={styles.td}>
                        <StatusBadge label={Tenant.status} type={Tenant.status === 'Active' ? 'success' : 'warning'} />
                      </td>
                      <td style={styles.td}>{Tenant.restaurantsCreated || 0} / {Tenant.restaurantLimit}</td>
                      <td style={styles.td}>{Tenant.phone || '—'}</td>
                      <td style={styles.td}>{Tenant.createdAt}</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <div style={styles.actions}>
                          <button onClick={() => router.visit(`/tenants/${Tenant.real_id}`)} style={styles.actionBtn} title="View"><Eye size={14} /></button>
                          <button onClick={() => handleOpenEdit(Tenant)} style={styles.actionBtn} title="Edit"><Pencil size={14} /></button>
                          <button onClick={() => handleToggleStatus(Tenant)} style={styles.actionBtn} title={Tenant.status === 'Active' ? 'Suspend' : 'Activate'}>
                            {Tenant.status === 'Active' ? <ToggleRight size={14} color="var(--color-primary)" /> : <ToggleLeft size={14} color="var(--color-warning)" />}
                          </button>
                          <button onClick={() => handleDelete(Tenant)} style={{ ...styles.actionBtn, color: 'var(--color-danger)' }} title="Delete"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Edit Tenant' : 'Create Tenant'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editId ? 'Update Tenant' : 'Create Tenant'}
            </Button>
          </>
        }
      >
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-red-pale)', border: '1px solid var(--color-red-border)', color: 'var(--color-danger)', fontSize: '13px', marginBottom: '16px' }}>
            <AlertCircle size={14} /><span>{error}</span>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Tenant Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
          <input className="form-input" value={form.TenantName} onChange={(e) => setForm({ ...form, TenantName: e.target.value })} placeholder="e.g. Aoife Restaurant Group" />
        </div>
        <div className="form-group">
          <label className="form-label">Business Name</label>
          <input className="form-input" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder="e.g. Aoife Foods Ltd" />
        </div>
        <div className="form-group">
          <label className="form-label">Email <span style={{ color: 'var(--color-danger)' }}>*</span></label>
          <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Tenant@example.com" disabled={!!editId} />
        </div>
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input className="form-input" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+353 123456789" />
        </div>
        {!editId && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Password <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <input className="form-input" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" style={{ paddingRight: 36 }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  {showPassword ? <EyeOff size={14} color="var(--color-text-muted)" /> : <Eye size={14} color="var(--color-text-muted)" />}
                </button>
              </div>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Confirm <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input className="form-input" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Confirm" />
            </div>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Restaurant Limit <span style={{ color: 'var(--color-danger)' }}>*</span></label>
          <input className="form-input" type="number" min="1" value={form.restaurantLimit} onChange={(e) => setForm({ ...form, restaurantLimit: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </Modal>

      {/* Status Toggle Confirmation Modal */}
      <Modal
        isOpen={statusConfirmModalOpen}
        onClose={() => setStatusConfirmModalOpen(false)}
        title="Confirm Status Change"
        footer={
          <>
            <Button variant="secondary" onClick={() => setStatusConfirmModalOpen(false)} disabled={statusConfirmSaving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmToggleStatus} disabled={statusConfirmSaving}>
              {statusConfirmSaving ? 'Saving...' : 'Yes, Confirm'}
            </Button>
          </>
        }
      >
        {statusConfirmTenant && (
          <div style={{ fontSize: '14px', color: 'var(--color-text-primary)', lineHeight: '1.5' }}>
            <p style={{ marginBottom: '12px' }}>
              Are you sure you want to <strong>{statusConfirmTenant.status === 'Active' ? 'suspend' : 'activate'}</strong> the tenant <strong>{statusConfirmTenant.businessName}</strong>?
            </p>
            {statusConfirmTenant.status === 'Active' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-red-pale)', border: '1px solid var(--color-red-border)', color: 'var(--color-danger)', fontSize: '13px' }}>
                <AlertCircle size={14} />
                <span>Suspending this tenant will immediately block access for all users under this account.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-pale)', border: '1px solid #B8DBCA', color: 'var(--color-primary)', fontSize: '13px' }}>
                <CheckCircle size={14} />
                <span>Activating this tenant will restore system access for all users under this account.</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

const planColors = {
  Basic: { bg: '#F3F4F6', text: '#374151' },
  Standard: { bg: '#EFF6FF', text: '#2563EB' },
  Premium: { bg: '#FDF4FF', text: '#9333EA' },
  Enterprise: { bg: '#FFFBEB', text: '#D97706' },
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
  backBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', fontSize: '13px', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px', padding: 0 },
  pageTitle: { fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', marginBottom: '4px' },
  pageSubtitle: { fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', marginBottom: '24px' },
  successBox: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-pale)', border: '1px solid #B8DBCA', color: 'var(--color-primary)', fontSize: '14px', fontWeight: 500, marginBottom: '20px' },
  toolbar: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', borderBottom: '2px solid var(--color-border-light)', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.5px' },
  td: { padding: '12px 16px', fontSize: '14px', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-light)', whiteSpace: 'nowrap' },
  planBadge: { display: 'inline-block', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: 600 },
  actions: { display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' },
  actionBtn: { width: 30, height: 30, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: '1px solid var(--color-border-light)', cursor: 'pointer', color: 'var(--color-text-secondary)', transition: 'all 150ms' },
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

export default SuperAdminTenantsPage;
