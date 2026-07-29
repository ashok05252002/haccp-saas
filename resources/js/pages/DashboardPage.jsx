import React, { useEffect } from 'react';
import { router } from '@inertiajs/react';
import PageLayout from '../components/layout/PageLayout';
import { useAuth } from '../features/auth/hooks/AuthContext';

const DashboardPage = () => {
  const { user, selectedRestaurant } = useAuth();

  useEffect(() => {
    if (user && user.role === 'client' && !selectedRestaurant) {
      router.visit('/client/restaurants');
    }
  }, [user, selectedRestaurant]);

  return (
    <PageLayout>
      <div className="page-header">
        <h1 className="page-title">Client Dashboard</h1>
      </div>

      <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: '20px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Welcome to your Dashboard</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>Select an option from the sidebar to begin.</p>
      </div>
    </PageLayout>
  );
};

export default DashboardPage;
