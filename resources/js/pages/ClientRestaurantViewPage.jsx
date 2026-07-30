import React, { useState } from 'react';
import { router, Head } from '@inertiajs/react';
import { 
  ChefHat, LogOut, ArrowLeft, Store, MapPin, 
  Phone, Mail, Calendar, User, ShieldAlert, Check, 
  Info, FileText, Settings, Award
} from 'lucide-react';
import { useAuth } from '../features/auth/hooks/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import axios from 'axios';

const Toggle = ({ checked, onChange }) => (
  <label style={styles.switch} onClick={(e) => { e.preventDefault(); onChange(!checked); }}>
    <span style={{ ...styles.slider, backgroundColor: checked ? 'var(--color-primary)' : '#E5E7EB' }}>
      <span style={{ ...styles.sliderKnob, transform: checked ? 'translateX(20px)' : 'translateX(0)' }} />
    </span>
  </label>
);

const ClientRestaurantViewPage = ({ restaurant: initialRestaurant }) => {
  const { user, logout } = useAuth();
  const [restaurant, setRestaurant] = useState(initialRestaurant);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Status Modal states
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmSaving, setConfirmSaving] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const handleToggleStatus = () => {
    setConfirmModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    setConfirmSaving(true);
    try {
      const res = await axios.patch(`/api/branches/${restaurant.id}/toggle-status`);
      setRestaurant(res.data);
      setConfirmModalOpen(false);
      setSuccess(`Restaurant status successfully updated to ${res.data.haccpStatus}.`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError('Failed to update restaurant status.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setConfirmSaving(false);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <Head title={`${restaurant.restaurantName} - Details`} />

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
        <button onClick={() => router.visit('/client/restaurants')} className="back-btn">
          <ArrowLeft size={16} />
          <span>Back to Restaurants</span>
        </button>

        {/* Global Notifications */}
        {success && (
          <div className="alert-success">
            <Check size={16} />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="alert-error">
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <div style={styles.pageHeaderRow}>
          <div>
            <h1 style={styles.pageTitle}>{restaurant.restaurantName}</h1>
            {restaurant.branchName && (
              <span style={styles.branchSubtitle}>{restaurant.branchName}</span>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div style={styles.contentGrid}>
          {/* Left Column: Details Card */}
          <div style={styles.leftCol}>
            <Card style={{ padding: '28px', marginBottom: '24px' }}>
              <div className="panel-header-row" style={{ borderBottom: "1px solid var(--color-border-light)", paddingBottom: "14px", marginBottom: "20px" }}>
                <Store size={18} color="var(--color-primary)" />
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Location Information</h3>
              </div>

              <div style={styles.detailsList}>
                <div style={styles.detailRow}>
                  <div style={styles.detailLabel}>Restaurant Name</div>
                  <div style={styles.detailVal}>{restaurant.restaurantName}</div>
                </div>

                {restaurant.branchName && (
                  <div style={styles.detailRow}>
                    <div style={styles.detailLabel}>Branch Name / Tag</div>
                    <div style={styles.detailVal}>{restaurant.branchName}</div>
                  </div>
                )}

                {restaurant.registrationNumber && (
                  <div style={styles.detailRow}>
                    <div style={styles.detailLabel}>Registration Number</div>
                    <div style={styles.detailVal}>{restaurant.registrationNumber}</div>
                  </div>
                )}

                <div style={styles.detailRow}>
                  <div style={styles.detailLabel}>Address</div>
                  <div style={styles.detailVal}>
                    {restaurant.addressLine1}
                    {restaurant.addressLine2 && `, ${restaurant.addressLine2}`}
                    <br />
                    {restaurant.city}
                    {restaurant.county && `, ${restaurant.county}`}
                    {restaurant.postalCode && ` - ${restaurant.postalCode}`}
                    <br />
                    {restaurant.country}
                  </div>
                </div>

                <div style={styles.detailRow}>
                  <div style={styles.detailLabel}>Created On</div>
                  <div style={styles.detailVal}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} color="var(--color-text-secondary)" />
                      <span>{restaurant.createdAt}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card style={{ padding: '28px' }}>
              <div className="panel-header-row" style={{ borderBottom: "1px solid var(--color-border-light)", paddingBottom: "14px", marginBottom: "20px" }}>
                <User size={18} color="var(--color-primary)" />
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Contact & Manager Details</h3>
              </div>

              <div style={styles.detailsList}>
                <div style={styles.detailRow}>
                  <div style={styles.detailLabel}>Branch Manager</div>
                  <div style={styles.detailVal}>{restaurant.branchManager || 'Not assigned'}</div>
                </div>

                <div style={styles.detailRow}>
                  <div style={styles.detailLabel}>Contact Person</div>
                  <div style={styles.detailVal}>{restaurant.contactPerson}</div>
                </div>

                <div style={styles.detailRow}>
                  <div style={styles.detailLabel}>Phone Number</div>
                  <div style={styles.detailVal}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} color="var(--color-text-secondary)" />
                      <span>{restaurant.phone}</span>
                    </div>
                  </div>
                </div>

                <div style={styles.detailRow}>
                  <div style={styles.detailLabel}>Login Email Address</div>
                  <div style={styles.detailVal}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={14} color="var(--color-text-secondary)" />
                      <span>{restaurant.email}</span>
                    </div>
                  </div>
                </div>

                {restaurant.notes && (
                  <div style={styles.detailRow}>
                    <div style={styles.detailLabel}>Special Notes</div>
                    <div style={{ ...styles.detailVal, fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>
                      {restaurant.notes}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column: Status Switch */}
          <div style={styles.rightCol}>
            <Card style={{ padding: '28px', backgroundColor: '#FAFAFA', borderColor: 'var(--color-border-light)' }}>
              <h3 style={styles.statusTitle}>Branch Status Control</h3>
              <p style={styles.statusSubtitle}>
                Suspend or reactivate this branch location below. Inactive branches cannot log in or generate reports.
              </p>

              <div style={styles.statusBox}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={styles.statusLabel}>Current State</span>
                  <StatusBadge 
                    label={restaurant.haccpStatus} 
                    type={restaurant.haccpStatus === 'Active' ? 'success' : 'warning'} 
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Toggle 
                    checked={restaurant.haccpStatus === 'Active'} 
                    onChange={handleToggleStatus} 
                  />
                  <span style={styles.toggleText}>
                    {restaurant.haccpStatus === 'Active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {restaurant.haccpStatus === 'Inactive' && (
                <div style={styles.statusNotice}>
                  <Info size={16} style={{ flexShrink: 0 }} />
                  <span>This location is suspended. Branch managers will be blocked from logging into the portal.</span>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Confirm Status Change"
        footer={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" onClick={() => setConfirmModalOpen(false)} disabled={confirmSaving}>
              Cancel
            </Button>
            <Button 
              variant={restaurant.haccpStatus === 'Active' ? 'danger' : 'primary'} 
              onClick={confirmToggleStatus} 
              loading={confirmSaving}
            >
              {restaurant.haccpStatus === 'Active' ? 'Confirm Suspend' : 'Confirm Activate'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '14px', color: 'var(--color-text-primary)', lineHeight: '1.5' }}>
            Are you sure you want to change the status of <strong>{restaurant.restaurantName}</strong> to{' '}
            <strong>{restaurant.haccpStatus === 'Active' ? 'Inactive' : 'Active'}</strong>?
          </p>
          {restaurant.haccpStatus === 'Active' ? (
            <div className="alert-error">
              <ShieldAlert size={16} style={{ flexShrink: 0 }} />
              <span>
                Warning: Deactivating this location will block manager login credentials immediately and pause notifications.
              </span>
            </div>
          ) : (
            <div className="alert-success">
              <Info size={16} style={{ flexShrink: 0 }} />
              <span>This will restore login capabilities for the manager user immediately.</span>
            </div>
          )}
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
  main: { maxWidth: '1040px', margin: '0 auto', padding: '36px 32px' },
  backBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', fontSize: '13px', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginBottom: '20px', padding: 0 },
  pageHeaderRow: { marginBottom: '28px' },
  pageTitle: { fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)' },
  branchSubtitle: { display: 'inline-block', fontSize: '14px', color: 'var(--color-primary)', fontWeight: 600, marginTop: '2px' },
  contentGrid: { display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '28px', alignItems: 'flex-start' },
  leftCol: {},
  rightCol: {},
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border-light)', marginBottom: '20px' },
  sectionTitle: { fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' },
  detailsList: { display: 'flex', flexDirection: 'column', gap: '18px' },
  detailRow: { display: 'flex', flexDirection: 'column', gap: '4px' },
  detailLabel: { fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 },
  detailVal: { fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: 500, lineHeight: '1.5' },
  statusTitle: { fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px' },
  statusSubtitle: { fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '24px' },
  statusBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#fff', border: '1px solid var(--color-border-light)', borderRadius: '8px', marginBottom: '16px' },
  statusLabel: { fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' },
  toggleText: { fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', width: '60px' },
  statusNotice: { display: 'flex', gap: '8px', padding: '12px 14px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', borderRadius: '8px', fontSize: '12px', lineHeight: '1.5' },
  alertSuccess: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: 'var(--color-primary-pale)', border: '1px solid #B8DBCA', color: 'var(--color-primary)', borderRadius: '8px', fontSize: '13px', marginBottom: '20px' },
  alertError: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: 'var(--color-red-pale)', border: '1px solid var(--color-red-border)', color: 'var(--color-danger)', borderRadius: '8px', fontSize: '13px', marginBottom: '20px' },
  switch: { position: 'relative', display: 'inline-block', width: '40px', height: '20px', cursor: 'pointer' },
  slider: { position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, borderRadius: '20px', transition: 'background-color 200ms ease', display: 'flex', alignItems: 'center', padding: '0 2px' },
  sliderKnob: { height: '16px', width: '16px', borderRadius: '50%', backgroundColor: '#fff', transition: 'transform 200ms ease', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }
};

export default ClientRestaurantViewPage;
