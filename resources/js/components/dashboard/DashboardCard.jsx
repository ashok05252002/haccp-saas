import React from 'react';
import { router } from '@inertiajs/react';
import * as LucideIcons from 'lucide-react';

const DashboardCard = ({ title, description, icon, iconColor, iconBg, route }) => {
  const IconComponent = LucideIcons[icon] || LucideIcons.FileText;

  return (
    <div
      style={styles.card}
      onClick={() => router.visit(route)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
      }}
    >
      <div style={{ ...styles.iconBox, backgroundColor: iconBg }}>
        <IconComponent size={20} color={iconColor} />
      </div>
      <div>
        <div style={styles.title}>{title}</div>
        <div style={styles.description}>{description}</div>
      </div>
    </div>
  );
};

const styles = {
  card: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    padding: '20px 22px',
    backgroundColor: '#fff',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border-light)',
    boxShadow: 'var(--shadow-card)',
    cursor: 'pointer',
    transition: 'all 200ms ease',
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
  title: {
    fontSize: 'var(--font-size-md)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-text-primary)',
    marginBottom: '3px',
  },
  description: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
    lineHeight: '1.4',
  },
};

export default DashboardCard;
