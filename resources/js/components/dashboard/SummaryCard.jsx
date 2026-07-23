import React from 'react';
import * as LucideIcons from 'lucide-react';

const SummaryCard = ({ label, value, icon, iconColor, iconBg }) => {
  const IconComponent = LucideIcons[icon] || LucideIcons.FileText;

  return (
    <div style={styles.card}>
      <div style={{ ...styles.iconBox, backgroundColor: iconBg }}>
        <IconComponent size={20} color={iconColor} />
      </div>
      <div>
        <div style={styles.label}>{label}</div>
        <div style={{ ...styles.value, color: iconColor }}>{value}</div>
      </div>
    </div>
  );
};

const styles = {
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '20px 24px',
    backgroundColor: '#fff',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border-light)',
    boxShadow: 'var(--shadow-card)',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  label: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
    marginBottom: '2px',
  },
  value: {
    fontSize: 'var(--font-size-2xl)',
    fontWeight: 'var(--font-weight-bold)',
  },
};

export default SummaryCard;
