import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Thermometer, ArrowRight, Truck, Flame, HeartPulse, Snowflake, Wind } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';

const HaccpLogsSidebarPage = () => {
  return (
    <PageLayout>
      <Head title="HACCP Logs" />

      <div>
        <div className="page-header" style={{ marginBottom: '24px' }}>
          <h1 className="page-title">HACCP Logs</h1>
          <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Maintain daily and ad-hoc HACCP related notes and logs.
          </p>
        </div>

        <div style={styles.grid}>
          {/* Temperature Monitoring Card */}
          <Link href="/haccp-logs/temperature" style={styles.masterCard}>
            <div style={styles.iconContainer}>
              <Thermometer size={28} color="var(--color-primary)" />
            </div>
            <h3 style={styles.cardTitle}>Temperature Monitoring</h3>
            <p style={styles.cardDesc}>Log current temperatures for your fridges, freezers, and other temperature-controlled zones.</p>
          </Link>

          {/* Delivery Intake Card */}
          <Link href="/haccp-logs/delivery-intake" style={styles.masterCard}>
            <div style={styles.iconContainer}>
              <Truck size={28} color="var(--color-primary)" />
            </div>
            <h3 style={styles.cardTitle}>Delivery Intake</h3>
            <p style={styles.cardDesc}>Record incoming deliveries, check temperatures, batch numbers, and supplier details.</p>
          </Link>

          {/* Cleaning & Sanitation Card */}
          <Link href="/haccp-logs/cleaning" style={styles.masterCard}>
            <div style={styles.iconContainer}>
              <div style={{width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 0 0-4 4v11a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4Z"/><path d="M7 16a5 5 0 0 0 10 0"/></svg>
              </div>
            </div>
            <h3 style={styles.cardTitle}>Cleaning & Sanitation</h3>
            <p style={styles.cardDesc}>Log completed cleaning tasks against your active cleaning areas and checklists.</p>
          </Link>

          {/* Cooking Temperature Card */}
          <Link href="/haccp-logs/cooking-temperature" style={styles.masterCard}>
            <div style={styles.iconContainer}>
              <Flame size={28} color="var(--color-primary)" />
            </div>
            <h3 style={styles.cardTitle}>Cooking Temperature</h3>
            <p style={styles.cardDesc}>Log the 6-step Cook, Cool, Reheat & Hot Holding process with CCP limit checks.</p>
          </Link>

          {/* Blast Chilling Card */}
          <Link href="/haccp-logs/blast-chilling" style={styles.masterCard}>
            <div style={styles.iconContainer}>
              <Snowflake size={28} color="var(--color-primary)" />
            </div>
            <h3 style={styles.cardTitle}>Blast Chilling</h3>
            <p style={styles.cardDesc}>CCP-4 rapid cooling cycle monitoring (from ≥63°C to ≤3°C within 90 minutes).</p>
          </Link>

          {/* Cooling Process Card */}
          <Link href="/haccp-logs/cooling-process" style={styles.masterCard}>
            <div style={styles.iconContainer}>
              <Wind size={28} color="var(--color-primary)" />
            </div>
            <h3 style={styles.cardTitle}>Cooling Process</h3>
            <p style={styles.cardDesc}>CCP-6 ambient cooling monitoring (cool to ≤8°C within 2 hours / 120 minutes).</p>
          </Link>

          {/* Staff Health Declaration Card */}
          <Link href="/haccp-logs/health-declaration" style={styles.masterCard}>
            <div style={styles.iconContainer}>
              <HeartPulse size={28} color="var(--color-primary)" />
            </div>
            <h3 style={styles.cardTitle}>Staff Health Declaration</h3>
            <p style={styles.cardDesc}>Daily pre-shift health screening, symptom declaration, and fit-for-duty certification.</p>
          </Link>

          {/* Placeholders for future modules */}
          <div style={{ ...styles.masterCard, ...styles.disabledCard }}>
            <div style={{ ...styles.iconContainer, backgroundColor: '#F3F4F6', color: '#9CA3AF' }}>
              <div style={{width: 28, height: 28, backgroundColor: 'var(--color-grey-border)', borderRadius: 4}}></div>
            </div>
            <h3 style={{ ...styles.cardTitle, color: '#9CA3AF' }}>More Modules</h3>
            <p style={{ ...styles.cardDesc, color: '#9CA3AF' }}>Additional HACCP modules coming soon...</p>
            <span style={styles.plannedBadge}>Coming Soon</span>
          </div>
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
  plannedBadge: {
    marginTop: '10px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
    padding: '2px 10px',
    borderRadius: '10px',
    textTransform: 'uppercase',
  },
};

export default HaccpLogsSidebarPage;
