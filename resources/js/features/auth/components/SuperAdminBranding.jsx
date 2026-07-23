import React from 'react';
import { ChefHat, Shield, Users, Building2, BarChart3 } from 'lucide-react';

const SuperAdminBranding = () => {
  return (
    <div style={styles.brandingContent}>
      <div style={styles.logoRow}>
        <div style={styles.logoIcon}>
          <ChefHat size={28} color="#fff" />
        </div>
        <div>
          <h1 style={styles.logoTitle}>Chef2Comply</h1>
          <p style={styles.logoTagline}>HACCP & Planning</p>
        </div>
      </div>
      <p style={styles.brandingDescription}>
        Platform administration portal. Manage clients, subscriptions, restaurant access, and platform users.
      </p>
      <div style={styles.featureList}>
        {[
          { icon: Users, text: 'Create & manage client accounts' },
          { icon: Building2, text: 'Control restaurant access limits' },
          { icon: BarChart3, text: 'Monitor platform usage & activity' },
          { icon: Shield, text: 'Manage subscriptions & billing' },
        ].map((f, i) => (
          <div key={i} style={styles.featureItem}>
            <div style={styles.featureCheck}>
              <f.icon size={12} color="rgba(255,255,255,0.9)" />
            </div>
            <span>{f.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  brandingContent: {
    color: '#fff',
    maxWidth: '360px',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '28px',
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: '12px',
    backgroundColor: 'rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoTitle: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#fff',
  },
  logoTagline: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.65)',
    marginTop: '1px',
  },
  brandingDescription: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: '32px',
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.8)',
  },
  featureCheck: {
    width: 24,
    height: 24,
    borderRadius: '6px',
    backgroundColor: 'rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
};

export default SuperAdminBranding;
