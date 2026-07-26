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
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rests, clients] = await Promise.all([
        getRestaurantsByClient(user.id),
        getClients().catch(() => []),
      ]);
      setRestaurants(rests);
      let myClient = clients.find((c) => c.id === user.id || c.email === user.email);

      // Fallback to database tenant relation from Laravel Auth
      if (!myClient && user?.tenant) {
        myClient = {
          id: user.tenant_id,
          clientName: user.name,
          businessName: user.tenant.name,
          email: user.email,
          restaurantLimit: user.tenant.restaurant_limit,
          subscriptionPlan: user.tenant.subscription_plan,
          status: user.tenant.status,
        };
      }

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
              <Button variant="primary" icon={Plus} onClick={() => router.visit('/client/restaurants/create')} disabled={!canAdd}>
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
