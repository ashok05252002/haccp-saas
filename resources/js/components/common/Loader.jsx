import React from 'react';

const Loader = ({ size = 32, message = '' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        gap: '12px',
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          border: '3px solid var(--color-border-light)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {message && (
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default Loader;
