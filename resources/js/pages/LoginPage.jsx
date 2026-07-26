import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Mail, Info } from 'lucide-react';
import axios from 'axios';
import AuthLayout from '../features/auth/components/AuthLayout';
import ClientBranding from '../features/auth/components/ClientBranding';
import PasswordInput from '../components/ui/PasswordInput';

const LoginPage = () => {
  const [submitting, setSubmitting] = useState(false);
  const { data, setData, errors, setError, clearErrors } = useForm({
    email: '',
    password: '',
    remember: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    clearErrors();
    setSubmitting(true);

    axios.post('/login', {
      email: data.email,
      password: data.password,
      remember: data.remember,
    })
    .then(response => {
      window.location.href = response.data.redirectUrl || '/client/restaurants';
    })
    .catch(err => {
      setSubmitting(false);
      if (err.response && err.response.status === 422) {
        const backendErrors = err.response.data.errors;
        Object.keys(backendErrors).forEach((key) => {
          setError(key, backendErrors[key][0]);
        });
      } else {
        setError('email', 'Authentication failed. Please check your credentials or network connection.');
      }
    });
  };

  return (
    <>
      <Head title="Login" />
      <AuthLayout branding={<ClientBranding />}>
        <h2 style={styles.formTitle}>Sign in to your account</h2>
        <p style={styles.formSubtitle}>
          Welcome back! Enter your credentials to continue.
        </p>

        {errors.email && (
          <div style={styles.errorBox}>
            <span>{errors.email}</span>
          </div>
        )}
        {errors.password && (
          <div style={styles.errorBox}>
            <span>{errors.password}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div style={styles.inputWrapper}>
              <Mail
                size={16}
                color="var(--color-text-muted)"
                style={styles.inputIcon}
              />
              <input
                className="form-input"
                type="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                placeholder="client@demo.com"
                style={{ paddingLeft: 38, width: '100%', boxSizing: 'border-box', borderColor: errors.email ? 'var(--color-danger)' : undefined }}
              />
            </div>
            {errors.email && (
              <span style={{ color: 'var(--color-danger)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                {errors.email}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <PasswordInput 
              value={data.password} 
              onChange={(e) => setData('password', e.target.value)} 
              style={errors.password ? { borderColor: 'var(--color-danger)' } : undefined}
            />
            {errors.password && (
              <span style={{ color: 'var(--color-danger)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                {errors.password}
              </span>
            )}
          </div>

          <div style={styles.optionsRow}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={data.remember}
                onChange={(e) => setData('remember', e.target.checked)}
                style={styles.checkbox}
              />
              <span>Remember me</span>
            </label>
            <a href="#" style={styles.forgotLink}>
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: '100%', padding: '12px', fontSize: '15px', marginTop: '4px', boxSizing: 'border-box' }}
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>


        {/* Super Admin link */}
        <div style={styles.adminLink}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Platform admin?</span>
          <button
            type="button"
            onClick={() => {
              window.location.href = window.location.protocol + '//admin.' + window.location.host + '/login';
            }}
            style={styles.linkBtn}
          >
            Go to Super Admin Login →
          </button>
        </div>
      </AuthLayout>
    </>
  );
};

const styles = {
  formTitle: {
    fontSize: '22px',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
    marginBottom: '6px',
  },
  formSubtitle: {
    fontSize: '14px',
    color: 'var(--color-text-secondary)',
    marginBottom: '28px',
  },
  errorBox: {
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-red-pale)',
    border: '1px solid var(--color-red-border)',
    color: 'var(--color-danger)',
    fontSize: '13px',
    marginBottom: '16px',
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },
  optionsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
  },
  checkbox: {
    width: 16,
    height: 16,
    accentColor: 'var(--color-primary)',
  },
  forgotLink: {
    fontSize: '13px',
    color: 'var(--color-primary)',
    textDecoration: 'none',
  },
  demoBox: {
    marginTop: '24px',
    padding: '14px 16px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-primary-pale)',
    border: '1px solid #C6E7D8',
  },
  demoHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '8px',
  },
  demoTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--color-primary)',
  },
  demoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    marginBottom: '4px',
  },
  demoLabel: {
    color: 'var(--color-text-secondary)',
    minWidth: '60px',
  },
  demoCode: {
    fontFamily: 'monospace',
    fontSize: '12px',
    backgroundColor: 'rgba(0,0,0,0.04)',
    padding: '2px 6px',
    borderRadius: '4px',
    color: 'var(--color-text-primary)',
  },
  adminLink: {
    marginTop: '16px',
    textAlign: 'center',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-primary)',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    padding: 0,
  },
};

export default LoginPage;
