import React, { useState } from 'react';
import { router, Head } from '@inertiajs/react';
import {
  ChefHat,
  LogOut,
  ArrowLeft,
  AlertCircle,
  Save,
} from 'lucide-react';
import { useAuth } from '../features/auth/hooks/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { createRestaurant } from '../services/restaurantService';

const ClientCreateRestaurantPage = () => {
  const { user, logout } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    restaurantName: '',
    branchName: '',
    registrationNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    county: '',
    postalCode: '',
    country: 'Ireland',
    contactPerson: '',
    phone: '',
    email: '',
    foodBusinessType: 'Restaurant',
    openingTime: '09:00',
    closingTime: '22:00',
    haccpResponsiblePerson: '',
    notes: '',
  });

  const handleLogout = async () => {
    await logout();
  };

  const handleSaveRestaurant = async (e) => {
    e.preventDefault();
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
      router.visit('/client/restaurants');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <Head title="Add Restaurant Location" />

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
        {/* Back Link */}
        <button
          onClick={() => router.visit('/client/restaurants')}
          style={styles.backBtn}
        >
          <ArrowLeft size={16} />
          <span>Back to Restaurants</span>
        </button>

        <h1 style={styles.pageTitle}>Add Restaurant Location</h1>
        <p style={styles.pageSubtitle}>Register a new branch or kitchen under your account</p>

        <Card style={styles.cardContainer}>
          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSaveRestaurant}>
            <div style={styles.formGrid}>
              <div style={styles.fullWidth} className="form-group">
                <label className="form-label">Restaurant Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input
                  className="form-input"
                  value={form.restaurantName}
                  onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
                  placeholder="e.g. Aoife Bistro"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Branch / Location Name</label>
                <input
                  className="form-input"
                  value={form.branchName}
                  onChange={(e) => setForm({ ...form, branchName: e.target.value })}
                  placeholder="e.g. Dublin Central"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Registration Number</label>
                <input
                  className="form-input"
                  value={form.registrationNumber}
                  onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                  placeholder="e.g. CRO123456"
                />
              </div>

              <div style={styles.fullWidth} className="form-group">
                <label className="form-label">Address Line 1 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input
                  className="form-input"
                  value={form.addressLine1}
                  onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                  placeholder="Street address"
                />
              </div>

              <div style={styles.fullWidth} className="form-group">
                <label className="form-label">Address Line 2</label>
                <input
                  className="form-input"
                  value={form.addressLine2}
                  onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                  placeholder="Apt, suite, etc."
                />
              </div>

              <div className="form-group">
                <label className="form-label">City / Town <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input
                  className="form-input"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Dublin"
                />
              </div>

              <div className="form-group">
                <label className="form-label">County / State</label>
                <input
                  className="form-input"
                  value={form.county}
                  onChange={(e) => setForm({ ...form, county: e.target.value })}
                  placeholder="Dublin"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Postal Code</label>
                <input
                  className="form-input"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  placeholder="D01 AB12"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Country <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input
                  className="form-input"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  placeholder="Ireland"
                />
              </div>

              <div style={styles.fullWidth} className="form-group">
                <label className="form-label">Contact Person <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input
                  className="form-input"
                  value={form.contactPerson}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                  placeholder="Manager name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input
                  className="form-input"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+353 123456789"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input
                  className="form-input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="manager@restaurant.com"
                />
              </div>

              <div style={styles.fullWidth} className="form-group">
                <label className="form-label">Food Business Type</label>
                <select
                  className="form-select"
                  value={form.foodBusinessType}
                  onChange={(e) => setForm({ ...form, foodBusinessType: e.target.value })}
                >
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

              <div className="form-group">
                <label className="form-label">Opening Time</label>
                <input
                  className="form-input"
                  type="time"
                  value={form.openingTime}
                  onChange={(e) => setForm({ ...form, openingTime: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Closing Time</label>
                <input
                  className="form-input"
                  type="time"
                  value={form.closingTime}
                  onChange={(e) => setForm({ ...form, closingTime: e.target.value })}
                />
              </div>

              <div style={styles.fullWidth} className="form-group">
                <label className="form-label">HACCP Responsible Person</label>
                <input
                  className="form-input"
                  value={form.haccpResponsiblePerson}
                  onChange={(e) => setForm({ ...form, haccpResponsiblePerson: e.target.value })}
                  placeholder="Person responsible for HACCP"
                />
              </div>

              <div style={styles.fullWidth} className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-textarea"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={4}
                />
              </div>
            </div>

            <div style={styles.footerActions}>
              <Button
                variant="secondary"
                type="button"
                onClick={() => router.visit('/client/restaurants')}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                icon={Save}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Register Location'}
              </Button>
            </div>
          </form>
        </Card>
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
  main: { maxWidth: '800px', margin: '0 auto', padding: '36px 32px' },
  backBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', fontSize: '14px', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginBottom: '20px', padding: 0 },
  pageTitle: { fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', marginBottom: '4px' },
  pageSubtitle: { fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', marginBottom: '28px' },
  cardContainer: { padding: '32px' },
  errorBox: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-red-pale)', border: '1px solid var(--color-red-border)', color: 'var(--color-danger)', fontSize: '14px', fontWeight: 500, marginBottom: '24px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' },
  fullWidth: { gridColumn: 'span 2' },
  footerActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--color-border-light)' },
};

export default ClientCreateRestaurantPage;
