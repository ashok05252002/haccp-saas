import React from 'react';
import { router } from '@inertiajs/react';
import { Home, AlertCircle } from 'lucide-react';
import Button from '../components/common/Button';

const NotFoundPage = () => {

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-page-bg)',
        padding: '20px',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--color-red-pale)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <AlertCircle size={32} color="var(--color-danger)" />
        </div>
        <h1
          style={{
            fontSize: '48px',
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            marginBottom: '8px',
          }}
        >
          404
        </h1>
        <p
          style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: '8px',
          }}
        >
          Page Not Found
        </p>
        <p
          style={{
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-text-secondary)',
            marginBottom: '28px',
          }}
        >
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button variant="primary" icon={Home} onClick={() => router.visit('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;
