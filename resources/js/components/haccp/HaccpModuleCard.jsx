import React from 'react';
import * as LucideIcons from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

const HaccpModuleCard = ({ module, onClick }) => {
  const IconComponent = LucideIcons[module.icon] || LucideIcons.FileText;

  return (
    <div
      style={{ ...styles.card, borderLeftColor: module.borderColor }}
      onClick={() => onClick(module)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
      }}
    >
      <div style={{ ...styles.iconBox, backgroundColor: module.iconBg }}>
        <IconComponent size={20} color={module.iconColor} />
      </div>
      <div style={styles.content}>
        <div style={styles.title}>{module.title}</div>
        <div style={styles.description}>{module.description}</div>
        <div style={styles.badges}>
          <StatusBadge label={module.badge} type={module.badgeType} />
          {module.target && <StatusBadge label={module.target} type="target" />}
        </div>
      </div>
      <ChevronRight size={20} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
    </div>
  );
};

const styles = {
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px 24px',
    backgroundColor: '#fff',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border-light)',
    borderLeft: '3px solid',
    boxShadow: 'var(--shadow-card)',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    marginBottom: '12px',
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
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 'var(--font-size-md)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-text-primary)',
    marginBottom: '4px',
  },
  description: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
    lineHeight: '1.4',
    marginBottom: '8px',
  },
  badges: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
};

export default HaccpModuleCard;
