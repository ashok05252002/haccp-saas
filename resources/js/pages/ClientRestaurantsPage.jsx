import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import {
  ChefHat,
  LogOut,
  Plus,
  Store,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Calendar,
  ArrowRight,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Building2,
} from 'lucide-react';
import { useAuth } from '../features/auth/hooks/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import Loader from '../components/common/Loader';
import { getRestaurantsByClient, createRestaurant } from '../services/restaurantService';
import { getClients } from '../services/clientService';

const ClientRestaurantsPage = () => {
  const { user, logout, selectRestaurant } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [clientInfo, setClientInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    restaurantName: '', branchName: '', registrationNumber: '',
    addressLine1: '', addressLine2: '', city: '', county: '',
    postalCode: '', country: 'Ireland', contactPerson: '',
    phone: '', email: '', foodBusinessType: 'Restaurant',
    openingTime: '09:00', closingTime: '22:00',
    haccpResponsiblePerson: '', notes: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rests, clients] = await Promise.all([
        getRestaurantsByClient(user.id),
        getClients(),
      ]);
      setRestaurants(rests);
      const myClient = clients.find((c) => c.id === user.id);
      setClientInfo(myClient || null);
    } catch (err) {
      console.error('Failed to load restaurants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user?.id]);

  const handleLogout = async () => {
    await logout();
  };

  const canAdd = clientInfo && restaurants.length < clientInfo.restaurantLimit;
  const remaining = clientInfo ? clientInfo.restaurantLimit - restaurants.length : 0;

  const resetForm = () => {
    setForm({
      restaurantName: '', branchName: '', registrationNumber: '',
      addressLine1: '', addressLine2: '', city: '', county: '',
      postalCode: '', country: 'Ireland', contactPerson: '',
      phone: '', email: '', foodBusinessType: 'Restaurant',
      openingTime: '09:00', closingTime: '22:00',
      haccpResponsiblePerson: '', notes: '',
    });
    setError('');
  };

  const handleOpenModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleSaveRestaurant = async () => {
    setError('');
    if (!form.restaurantName.trim()) { setError('Restaurant name is required.'); return; }
    if (!form.addressLine1.trim()) { setError('Address is required.'); return; }
    if (!form.city.trim()) { setError('City is required.'); return; }
    if (!form.country.trim()) { setError('Country is required.'); return; }
    if (!form.contactPerson.trim()) { setError('Contact person is required.'); return; }
    if (!form.phone.trim()) { setError('Phone is required.'); return; }
    if (!form.email.trim()) { setError('Email is required.'); return; }

    setSaving(true);
    try {
      await createRestaurant(user.id, form);
      setModalOpen(false);
      setSuccess('Restaurant added successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEnterDashboard = (restaurant) => {
    selectRestaurant(restaurant);
    router.visit('/dashboard');
  };

  return (
    <div style={styles.pageWrapper}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerLogo}><ChefHat size={20} color="#fff" /></div>
          <div>
            <div style={styles.headerTitle}>Chef2Comply</div>
            <div style={styles.headerSub}>HACCP & Planning</div>
          </div>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.headerUser}>{user?.name}</span>
          <button onClick={handleLogout} style={styles.logoutBtn} title="Logout"><LogOut size={18} /></button>
        </div>
      </header>

      <main style={styles.main}>
        <h1 style={styles.pageTitle}>Restaurants</h1>
        <p style={styles.pageSubtitle}>Add and manage your restaurant locations</p>

        {success && (
          <div style={styles.successBox}><CheckCircle size={16} /><span>{success}</span></div>
        )}

        {loading ? (
          <Loader message="Loading restaurants..." />
        ) : (
          <>
            {/* Client Info Card */}
            {clientInfo && (
              <Card style={{ marginBottom: '24px' }}>
                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}>
                    <div style={styles.infoLabel}>Client</div>
                    <div style={styles.infoValue}>{clientInfo.clientName}</div>
                  </div>
                  <div style={styles.infoItem}>
                    <div style={styles.infoLabel}>Plan</div>
                    <div style={styles.infoValue}>{clientInfo.subscriptionPlan}</div>
                  </div>
                  <div style={styles.infoItem}>
                    <div style={styles.infoLabel}>Restaurant Limit</div>
                    <div style={styles.infoValue}>{clientInfo.restaurantLimit}</div>
                  </div>
                  <div style={styles.infoItem}>
                    <div style={styles.infoLabel}>Created</div>
                    <div style={{ ...styles.infoValue, color: 'var(--color-primary)' }}>{restaurants.length}</div>
                  </div>
                  <div style={styles.infoItem}>
                    <div style={styles.infoLabel}>Remaining</div>
                    <div style={{ ...styles.infoValue, color: remaining > 0 ? 'var(--color-primary)' : 'var(--color-danger)' }}>{remaining}</div>
                  </div>
                </div>
              </Card>
            )}

            {/* Add Button / Limit Warning */}
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <Button variant="primary" icon={Plus} onClick={handleOpenModal} disabled={!canAdd}>
                Add Restaurant
              </Button>
              {!canAdd && (
                <div style={styles.limitWarning}>
                  <AlertTriangle size={14} />
                  <span>Restaurant limit reached. Please contact Chef2Comply Super Admin to increase your restaurant limit.</span>
                </div>
              )}
            </div>

            {/* Restaurant Cards */}
            {restaurants.length === 0 ? (
              <Card>
                <EmptyState icon={Store} message="No restaurants yet" submessage="Click 'Add Restaurant' to get started with your first location." />
              </Card>
            ) : (
              <div style={styles.cardsGrid}>
                {restaurants.map((rest) => (
                  <Card key={rest.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <h3 style={styles.restName}>{rest.restaurantName}</h3>
                        <StatusBadge label={rest.haccpStatus} type={rest.haccpStatus === 'Active' ? 'success' : 'warning'} />
                      </div>
                      {rest.branchName && (
                        <div style={styles.branchName}>{rest.branchName}</div>
                      )}
                      <div style={styles.detailRow}><MapPin size={14} /> <span>{rest.addressLine1}, {rest.city}, {rest.country}</span></div>
                      <div style={styles.detailRow}><Phone size={14} /> <span>{rest.phone}</span></div>
                      <div style={styles.detailRow}><Mail size={14} /> <span>{rest.email}</span></div>
                      <div style={styles.detailRow}><ShieldCheck size={14} /> <span>HACCP: {rest.haccpResponsiblePerson}</span></div>
                      <div style={styles.detailRow}><Calendar size={14} /> <span>Created: {rest.createdAt}</span></div>
                    </div>
                    <Button
                      variant="primary"
                      icon={ArrowRight}
                      onClick={() => handleEnterDashboard(rest)}
                      style={{ marginTop: '20px', width: '100%' }}
                    >
                      Enter Dashboard
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Add Restaurant Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Restaurant"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveRestaurant} disabled={saving}>
              {saving ? 'Saving...' : 'Add Restaurant'}
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
          <label className="form-label">Restaurant Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
          <input className="form-input" value={form.restaurantName} onChange={(e) => setForm({ ...form, restaurantName: e.target.value })} placeholder="e.g. Aoife Bistro" />
        </div>
        <div className="form-group">
          <label className="form-label">Branch / Location Name</label>
          <input className="form-input" value={form.branchName} onChange={(e) => setForm({ ...form, branchName: e.target.value })} placeholder="e.g. Dublin Central" />
        </div>
        <div className="form-group">
          <label className="form-label">Registration Number</label>
          <input className="form-input" value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} placeholder="e.g. CRO123456" />
        </div>
        <div className="form-group">
          <label className="form-label">Address Line 1 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
          <input className="form-input" value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} placeholder="Street address" />
        </div>
        <div className="form-group">
          <label className="form-label">Address Line 2</label>
          <input className="form-input" value={form.addressLine2} onChange={(e) => setForm({ ...form, addressLine2: e.target.value })} placeholder="Apt, suite, etc." />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">City / Town <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input className="form-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Dublin" />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">County / State</label>
            <input className="form-input" value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })} placeholder="Dublin" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Postal Code</label>
            <input className="form-input" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} placeholder="D01 AB12" />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Country <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input className="form-input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Ireland" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Contact Person <span style={{ color: 'var(--color-danger)' }}>*</span></label>
          <input className="form-input" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} placeholder="Manager name" />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Phone <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input className="form-input" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+353 123456789" />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Email <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="manager@restaurant.com" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Food Business Type</label>
          <select className="form-select" value={form.foodBusinessType} onChange={(e) => setForm({ ...form, foodBusinessType: e.target.value })}>
            <option value="Restaurant">Restaurant</option>
            <option value="Cafe">Cafe</option>
            <option value="Cloud Kitchen">Cloud Kitchen</option>
            <option value="Catering Unit">Catering Unit</option>
            <option value="Hotel Kitchen">Hotel Kitchen</option>
            <option value="Bakery">Bakery</option>
            <option value="Takeaway">Takeaway</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Opening Time</label>
            <input className="form-input" type="time" value={form.openingTime} onChange={(e) => setForm({ ...form, openingTime: e.target.value })} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Closing Time</label>
            <input className="form-input" type="time" value={form.closingTime} onChange={(e) => setForm({ ...form, closingTime: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">HACCP Responsible Person</label>
          <input className="form-input" value={form.haccpResponsiblePerson} onChange={(e) => setForm({ ...form, haccpResponsiblePerson: e.target.value })} placeholder="Person responsible for HACCP" />
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." />
        </div>
      </Modal>
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
  main: { maxWidth: '1000px', margin: '0 auto', padding: '36px 32px' },
  pageTitle: { fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', marginBottom: '4px' },
  pageSubtitle: { fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', marginBottom: '28px' },
  successBox: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-pale)', border: '1px solid #B8DBCA', color: 'var(--color-primary)', fontSize: '14px', fontWeight: 500, marginBottom: '20px' },
  infoGrid: { display: 'flex', gap: '32px', flexWrap: 'wrap' },
  infoItem: {},
  infoLabel: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' },
  infoValue: { fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' },
  limitWarning: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-warning)', fontWeight: 500 },
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' },
  restName: { fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' },
  branchName: { fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '12px' },
  detailRow: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '6px' },
};

export default ClientRestaurantsPage;
