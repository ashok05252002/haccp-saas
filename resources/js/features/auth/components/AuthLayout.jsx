import React from 'react';

const AuthLayout = ({ branding, children }) => {
  return (
    <>
      <style>{`
        .auth-container {
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 960px;
          min-height: 580px;
          background-color: #fff;
          border-radius: var(--radius-xl);
          box-shadow: 0 8px 40px rgba(0,0,0,0.08);
          overflow: hidden;
        }
        .auth-branding {
          display: none;
        }
        .auth-form-side {
          flex: 1;
          padding: 40px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @media (min-width: 768px) {
          .auth-container {
            flex-direction: row;
          }
          .auth-branding {
            display: flex;
            flex: 1;
            background: linear-gradient(135deg, #1A6B4F 0%, #0E3D2E 100%);
            padding: 48px 40px;
            align-items: center;
            justify-content: center;
          }
          .auth-form-side {
            padding: 48px 40px;
          }
        }
      `}</style>
      <div style={styles.page}>
        <div className="auth-container">
          <div className="auth-branding">
            {branding}
          </div>
          <div className="auth-form-side">
            <div style={styles.formWrapper}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
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
  formWrapper: {
    width: '100%',
    maxWidth: '360px',
  },
};

export default AuthLayout;
