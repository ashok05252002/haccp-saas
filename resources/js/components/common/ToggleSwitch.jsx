import React from 'react';

const ToggleSwitch = ({ checked, onChange, label, sublabel }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <div>
        {label && (
          <p
            style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-primary)',
            }}
          >
            {label}
          </p>
        )}
        {sublabel && (
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              marginTop: '2px',
            }}
          >
            {sublabel}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          backgroundColor: checked ? 'var(--color-primary)' : 'var(--color-border)',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background-color var(--transition-base)',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 22 : 2,
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transition: 'left var(--transition-base)',
          }}
        />
      </button>
    </div>
  );
};

export default ToggleSwitch;
