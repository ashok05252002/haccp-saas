import React, { useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import PageLayout from '../components/layout/PageLayout';
import IrelandGreetingBanner from '../components/common/IrelandGreetingBanner';
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
      <Head title="Dashboard" />

      {/* Dynamic Sky Ireland Time Greeting Card */}
      <IrelandGreetingBanner />
    </PageLayout>
  );
};

export default DashboardPage;
