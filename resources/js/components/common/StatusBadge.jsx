import React from 'react';

const StatusBadge = ({ label, type = 'default' }) => {
  const styles = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 10px',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-medium)',
    fontFamily: 'monospace',
    letterSpacing: '0.02em',
    border: '1px solid',
  };

  const typeStyles = {
    ccp: {
      backgroundColor: 'var(--color-page-bg)',
      color: 'var(--color-text-primary)',
      borderColor: 'var(--color-border)',
    },
    pr: {
      backgroundColor: 'var(--color-page-bg)',
      color: 'var(--color-text-primary)',
      borderColor: 'var(--color-border)',
    },
    codex: {
      backgroundColor: 'var(--color-page-bg)',
      color: 'var(--color-text-primary)',
      borderColor: 'var(--color-border)',
    },
    target: {
      backgroundColor: 'var(--color-page-bg)',
      color: 'var(--color-text-secondary)',
      borderColor: 'var(--color-border)',
    },
    passed: {
      backgroundColor: 'var(--color-green-pale)',
      color: 'var(--color-success)',
      borderColor: 'var(--color-green-border)',
    },
    failed: {
      backgroundColor: 'var(--color-red-pale)',
      color: 'var(--color-danger)',
      borderColor: 'var(--color-red-border)',
    },
    pending: {
      backgroundColor: 'var(--color-amber-pale)',
      color: 'var(--color-warning)',
      borderColor: 'var(--color-amber-border)',
    },
    draft: {
      backgroundColor: 'var(--color-grey-pale)',
      color: 'var(--color-grey)',
      borderColor: 'var(--color-grey-border)',
    },
    category: {
      backgroundColor: 'var(--color-primary-pale)',
      color: 'var(--color-primary)',
      borderColor: 'transparent',
    },
    default: {
      backgroundColor: 'var(--color-page-bg)',
      color: 'var(--color-text-secondary)',
      borderColor: 'var(--color-border)',
    },
  };

  return (
    <span style={{ ...styles, ...(typeStyles[type] || typeStyles.default) }}>
      {(type === 'ccp' || type === 'pr' || type === 'codex') && (
        <span style={{ fontSize: '10px' }}>📋</span>
      )}
      {label}
    </span>
  );
};

export default StatusBadge;
