import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { Thermometer, ArrowRight, Truck, Flame, HeartPulse, Snowflake, Wind, Gauge, Lock, Droplets, Bug, Trash, GraduationCap } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';

const HaccpLogsSidebarPage = () => {
  const { auth } = usePage().props;
  const userRole = auth?.user?.assigned_role || auth?.user?.role;
  const userPermissions = userRole?.permissions || null; // null means Full Access / Admin

  const hasPermission = (key) => {
    if (!userPermissions) return true; // Full access for admins or default legacy roles
    return userPermissions.includes(key);
  };

  const haccpModules = [
    {
      key: 'haccp.temperature',
      href: '/haccp-logs/temperature',
      title: 'Temperature Monitoring',
      desc: 'Log current temperatures for your fridges, freezers, and other temperature-controlled zones.',
      icon: Thermometer,
    },
    {
      key: 'haccp.delivery-intake',
      href: '/haccp-logs/delivery-intake',
      title: 'Delivery Intake',
      desc: 'Record incoming deliveries, check temperatures, batch numbers, and supplier details.',
      icon: Truck,
    },
    {
      key: 'haccp.cleaning',
      href: '/haccp-logs/cleaning',
      title: 'Cleaning & Sanitation',
      desc: 'Log completed cleaning tasks against your active cleaning areas and checklists.',
      icon: null, // Custom SVG
    },
    {
      key: 'haccp.cooking-temperature',
      href: '/haccp-logs/cooking-temperature',
      title: 'Cooking Temperature',
      desc: 'Log the 6-step Cook, Cool, Reheat & Hot Holding process with CCP limit checks.',
      icon: Flame,
    },
    {
      key: 'haccp.blast-chilling',
      href: '/haccp-logs/blast-chilling',
      title: 'Blast Chilling',
      desc: 'CCP-4 rapid cooling cycle monitoring (from ≥63°C to ≤3°C within 90 minutes).',
      icon: Snowflake,
    },
    {
      key: 'haccp.cooling-process',
      href: '/haccp-logs/cooling-process',
      title: 'Cooling Process',
      desc: 'CCP-6 ambient cooling monitoring (cool to ≤8°C within 2 hours / 120 minutes).',
      icon: Wind,
    },
    {
      key: 'haccp.probe-calibration',
      href: '/haccp-logs/probe-calibration',
      title: 'Probe Accuracy Check',
      desc: 'Equipment calibration verification (boiling 99–101°C & ice water −1 to 1°C checks).',
      icon: Gauge,
    },
    {
      key: 'haccp.food-dispatch',
      href: '/haccp-logs/food-dispatch',
      title: 'Food Dispatch & Transfer',
      desc: 'Record food transport parameters, dispatch temperatures, and raw/RTE separation checks.',
      icon: Truck,
    },
    {
      key: 'haccp.fryer-oil',
      href: '/haccp-logs/fryer-oil',
      title: 'Fryer Oil & Grease Management',
      desc: 'Monitor oil condition, frying temperatures (160–175°C), oil changes, and grease trap disposal.',
      icon: Droplets,
    },
    {
      key: 'haccp.pest-control',
      href: '/haccp-logs/pest-control',
      title: 'Pest Prevention & Activity Log',
      desc: 'Verify premises protection, pest sightings/evidence, corrective actions, and contractor visits.',
      icon: Bug,
    },
    {
      key: 'haccp.food-waste',
      href: '/haccp-logs/food-waste',
      title: 'Food Waste & Disposal Log',
      desc: 'Track wasted food items, disposal reasons, financial cost impact (£), and prevention measures.',
      icon: Trash,
    },
    {
      key: 'haccp.hot-holding',
      href: '/haccp-logs/hot-holding',
      title: 'Hot Holding / Bain Marie',
      desc: 'Monitor bain marie, hot display counters, and heated units to verify safe holding temperatures (≥63°C).',
      icon: Flame,
    },
    {
      key: 'haccp.staff-training',
      href: '/haccp-logs/staff-training',
      title: 'Staff Training & Hygiene Log',
      desc: 'Complete and track staff food-safety, hygiene, and safe-catering training tasks.',
      icon: GraduationCap,
    },
    {
      key: 'haccp.thawing',
      href: '/haccp-logs/thawing',
      title: 'Thawing / Defrosting Record',
      desc: 'Log controlled defrosting methods, completion times, and temperatures (≤5°C).',
      icon: Snowflake,
    },
    {
      key: 'haccp.health-declaration',
      href: '/haccp-logs/health-declaration',
      title: 'Staff Health Declaration',
      desc: 'Daily pre-shift health screening, symptom declaration, and fit-for-duty certification.',
      icon: HeartPulse,
    },
  ];

  return (
    <PageLayout>
      <Head title="HACCP Logs" />

      <div>
        <div className="page-header" style={{ marginBottom: '24px' }}>
          <h1 className="page-title">HACCP Logs</h1>
          <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Maintain daily and ad-hoc HACCP related notes and logs based on your assigned operational role.
          </p>
        </div>

        <div style={styles.grid}>
          {haccpModules.map((mod) => {
            const isAllowed = hasPermission(mod.key);
            const Icon = mod.icon;

            if (!isAllowed) {
              return (
                <div key={mod.key} style={{ ...styles.masterCard, ...styles.disabledCard }}>
                  <div style={{ ...styles.iconContainer, backgroundColor: '#F3F4F6', color: '#9CA3AF' }}>
                    <Lock size={26} />
                  </div>
                  <h3 style={{ ...styles.cardTitle, color: '#9CA3AF' }}>{mod.title}</h3>
                  <p style={{ ...styles.cardDesc, color: '#9CA3AF' }}>{mod.desc}</p>
                  <span style={styles.lockedBadge}>Access Restricted</span>
                </div>
              );
            }

            return (
              <Link key={mod.key} href={mod.href} style={styles.masterCard}>
                <div style={styles.iconContainer}>
                  {Icon ? (
                    <Icon size={28} color="var(--color-primary)" />
                  ) : (
                    <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a4 4 0 0 0-4 4v11a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4Z"/>
                        <path d="M7 16a5 5 0 0 0 10 0"/>
                      </svg>
                    </div>
                  )}
                </div>
                <h3 style={styles.cardTitle}>{mod.title}</h3>
                <p style={styles.cardDesc}>{mod.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
};

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '24px',
    marginTop: '12px',
  },
  masterCard: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    border: '2px solid var(--color-primary)',
    padding: '28px 20px',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    textDecoration: 'none',
    boxShadow: '0 2px 6px rgba(26, 107, 79, 0.08)',
  },
  disabledCard: {
    cursor: 'not-allowed',
    backgroundColor: '#FAFAFA',
    border: '2px dashed #D1D5DB',
    boxShadow: 'none',
  },
  iconContainer: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    backgroundColor: 'var(--color-primary-pale)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '14px',
    transition: 'transform 200ms ease',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
    margin: 0,
    lineHeight: '1.4',
  },
  cardDesc: {
    fontSize: '12px',
    color: 'var(--color-text-secondary)',
    lineHeight: '1.5',
    marginTop: '6px',
    marginBottom: 0,
  },
  lockedBadge: {
    marginTop: '10px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#9CA3AF',
    backgroundColor: '#F3F4F6',
    padding: '2px 10px',
    borderRadius: '10px',
    textTransform: 'uppercase',
  },
};

export default HaccpLogsSidebarPage;
