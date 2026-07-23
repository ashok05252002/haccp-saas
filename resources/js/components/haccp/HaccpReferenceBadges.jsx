import React from 'react';

const HaccpReferenceBadges = ({ badges = [] }) => {
  if (!badges || badges.length === 0) return null;

  return (
    <div style={styles.container}>
      {badges.map((badge, idx) => (
        <span key={idx} style={styles.badge}>
          {badge}
        </span>
      ))}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '12px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    backgroundColor: 'var(--color-primary-pale)',
    color: 'var(--color-primary)',
    borderRadius: '16px',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.3px',
    border: '1px solid #B8DBCA', // A subtle green border
  },
};

export default HaccpReferenceBadges;
