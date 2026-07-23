import React from 'react';
import { FileText } from 'lucide-react';

const EmptyState = ({ icon: Icon = FileText, message = 'No data found', submessage = '' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--color-page-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <Icon size={24} color="var(--color-text-muted)" />
      </div>
      <p
        style={{
          fontSize: 'var(--font-size-base)',
          color: 'var(--color-text-secondary)',
          fontWeight: 'var(--font-weight-medium)',
        }}
      >
        {message}
      </p>
      {submessage && (
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-muted)',
            marginTop: '4px',
          }}
        >
          {submessage}
        </p>
      )}
    </div>
  );
};

export default EmptyState;
