import React from 'react';
import { ShieldCheck } from 'lucide-react';

const HaccpStandardBanner = ({ standard }) => {
  if (!standard) return null;

  return (
    <div style={styles.banner}>
      <ShieldCheck size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />
      <span style={styles.text}>
        <strong>Required Standard:</strong> {standard}
      </span>
    </div>
  );
};

const styles = {
  banner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#F0F9F4', // Very soft green background
    border: '1px solid #B8DBCA',
    borderRadius: 'var(--radius-md)',
    padding: '10px 14px',
    marginBottom: '20px',
  },
  text: {
    fontSize: '13px',
    color: 'var(--color-text-primary)',
    lineHeight: '1.4',
  },
};

export default HaccpStandardBanner;
