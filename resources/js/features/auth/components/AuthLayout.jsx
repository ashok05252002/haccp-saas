import React from 'react';

const AuthLayout = ({ branding, children }) => {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.brandingSide}>
          {branding}
        </div>
        <div style={styles.formSide}>
          <div style={styles.formWrapper}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-page-bg)',
    padding: '20px',
  },
  container: {
    display: 'flex',
    width: '100%',
    maxWidth: '960px',
    minHeight: '580px',
    backgroundColor: '#fff',
    borderRadius: 'var(--radius-xl)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  brandingSide: {
    flex: 1,
    background: 'linear-gradient(135deg, #1A6B4F 0%, #0E3D2E 100%)',
    padding: '48px 40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formSide: {
    flex: 1,
    padding: '48px 40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formWrapper: {
    width: '100%',
    maxWidth: '360px',
  },
};

export default AuthLayout;
