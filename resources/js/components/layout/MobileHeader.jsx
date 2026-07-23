import React from 'react';
import { Menu } from 'lucide-react';

const MobileHeader = ({ onMenuClick }) => {
  return (
    <header
      style={{
        display: 'none',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        backgroundColor: '#fff',
        borderBottom: '1px solid var(--color-border-light)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
      className="mobile-header"
    >
      <button
        onClick={onMenuClick}
        style={{
          width: 40,
          height: 40,
          borderRadius: '10px',
          border: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
          cursor: 'pointer',
        }}
      >
        <Menu size={20} color="var(--color-text-primary)" />
      </button>
      <span style={{ fontWeight: 600, fontSize: '15px' }}>Chef2Comply</span>
    </header>
  );
};

export default MobileHeader;
