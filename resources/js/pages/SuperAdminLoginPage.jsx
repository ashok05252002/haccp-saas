import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Mail, Info, Shield } from 'lucide-react';
import axios from 'axios';
import AuthLayout from '../features/auth/components/AuthLayout';
import SuperAdminBranding from '../features/auth/components/SuperAdminBranding';
import PasswordInput from '../components/ui/PasswordInput';

const SuperAdminLoginPage = () => {
  const [submitting, setSubmitting] = useState(false);
  const { data, setData, errors, setError, clearErrors } = useForm({
    email: '',
    password: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    clearErrors();
    setSubmitting(true);

    axios.post('/login', {
      email: data.email,
      password: data.password,
    })
    .then(response => {
      window.location.href = response.data.redirectUrl || '/dashboard';
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
      <Head title="Super Admin Login" />
      <AuthLayout branding={<SuperAdminBranding />}>
        <div style={styles.badgeRow}>
          <span style={styles.adminBadge}>
            <Shield size={12} />
            Super Admin
          </span>
        </div>
        <h2 style={styles.formTitle}>Super Admin Portal</h2>
        <p style={styles.formSubtitle}>
          Manage clients, subscriptions, restaurant access, and platform users
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
              <Mail size={16} color="var(--color-text-muted)" style={styles.inputIcon} />
              <input
                className="form-input"
                type="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                placeholder="superadmin@chef2comply.com"
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

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: '100%', justifyContent: 'center', height: '42px', marginTop: '12px', boxSizing: 'border-box' }}
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>


        {/* Client login link */}
        <div style={styles.clientLink}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Are you a client?</span>
          <button
            type="button"
            onClick={() => {
              window.location.href = window.location.protocol + '//' + window.location.host.replace('admin.', '') + '/login';
            }}
            style={styles.linkBtn}
          >
            Go to Client Login →
          </button>
        </div>
      </AuthLayout>
    </>
  );
};

const styles = {
  badgeRow: {
    marginBottom: '16px',
  },
  adminBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 12px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--color-primary-pale)',
    color: 'var(--color-primary)',
    fontSize: '12px',
    fontWeight: 600,
  },
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
    lineHeight: '1.5',
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
  clientLink: {
    marginTop: '20px',
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

export default SuperAdminLoginPage;
