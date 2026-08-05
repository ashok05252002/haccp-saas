import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
  ChefHat, Sparkles, Scale, Truck, Search, X, Package, ClipboardCheck, Thermometer, HeartPulse, Refrigerator, Users, Flame, GraduationCap, Snowflake, Droplets, Recycle
} from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';

const ManagerHubPage = () => {
  const [masterSearchQuery, setMasterSearchQuery] = useState('');

  const masterModules = [
    { 
      key: 'ingredients', 
      label: 'Ingredients', 
      desc: 'Manage cooking raw materials, ingredient categories, and default UOMs.',
      icon: ChefHat, 
      active: true,
      route: '/manager-hub/ingredients'
    },
    { 
      key: 'food-items', 
      label: 'Food Items', 
      desc: 'Manage food/menu items, default UOM, and storage type rules.',
      icon: Package, 
      active: true,
      route: '/manager-hub/food-items'
    },
    { 
      key: 'uom', 
      label: 'Unit of Measurement (UOM)', 
      desc: 'Set up unit categories, reference base units, and conversion factors.',
      icon: Scale, 
      active: true,
      route: '/manager-hub/uom'
    },
    { 
      key: 'suppliers', 
      label: 'Suppliers Master', 
      desc: 'Manage approved vendors, order schedules, categories, and supplied items.',
      icon: Truck, 
      active: true,
      route: '/manager-hub/suppliers'
    },
    { 
      key: 'cleaning', 
      label: 'Cleaning Areas', 
      desc: 'Manage cleaning areas, cleaning frequency, instructions, and active status.',
      icon: Sparkles, 
      active: true,
      route: '/manager-hub/cleaning-areas'
    },
    { 
      key: 'cleaning-checklist', 
      label: 'Cleaning Checklist', 
      desc: 'Manage cleaning checklist sections, questions, frequencies, and active status.',
      icon: ClipboardCheck, 
      active: true,
      route: '/manager-hub/cleaning-checklist'
    },
    { 
      key: 'storage-zones', 
      label: 'Storage Zones', 
      desc: 'Manage fridges, freezers, and hot cabinets used for temperature checks.',
      icon: Refrigerator, 
      active: true,
      route: '/manager-hub/storage-zones'
    },
    { 
      key: 'holding-stations', 
      label: 'Holding Stations', 
      desc: 'Manage hot holding units and stations used for food temperature checks.',
      icon: Flame, 
      active: true,
      route: '/manager-hub/holding-stations'
    },
    { 
      key: 'defrosting-methods', 
      label: 'Defrosting Methods', 
      desc: 'Manage thawing and defrosting methods used in food safety checks.',
      icon: Snowflake, 
      active: true,
      route: '/manager-hub/defrosting-methods'
    },
    { 
      key: 'fryer-oil-setup', 
      label: 'Fryer Oil Setup', 
      desc: 'Manage cooking stations, oil quality options, and oil actions for fryer checks.',
      icon: Droplets, 
      active: true,
      route: '/manager-hub/fryer-oil-setup'
    },
    { 
      key: 'grease-used-oil-setup', 
      label: 'Grease & Used Oil Setup', 
      desc: 'Manage disposal types, grease trap areas, disposal methods, and waste contractors.',
      icon: Recycle, 
      active: true,
      route: '/manager-hub/grease-used-oil-setup'
    },
    { 
      key: 'training-tasks', 
      label: 'Training Tasks', 
      desc: 'Manage staff training tasks, frequencies, and position or employee assignments.',
      icon: GraduationCap, 
      active: true,
      route: '/manager-hub/training-tasks'
    },
    { 
      key: 'thermometers', 
      label: 'Thermometers / Probes', 
      desc: 'Manage digital probes, infrared thermometers, serial numbers, and active status.',
      icon: Thermometer, 
      active: true,
      route: '/manager-hub/thermometers'
    },
    { 
      key: 'health-declaration', 
      label: 'Health Declaration Setup', 
      desc: 'Manage health declaration sections, staff questionnaire items, and active status.',
      icon: HeartPulse, 
      active: true,
      route: '/manager-hub/health-declaration'
    },
    { 
      key: 'users-roles', 
      label: 'User & Role Management', 
      desc: 'Manage staff accounts, user profiles, and assign custom operational roles.',
      icon: Users, 
      active: true,
      route: '/manager-hub/users-roles'
    }
  ];

  const filteredMasterModules = masterModules.filter(m =>
    m.label.toLowerCase().includes(masterSearchQuery.toLowerCase()) ||
    m.desc.toLowerCase().includes(masterSearchQuery.toLowerCase())
  );

  return (
    <PageLayout>
      <Head title="Manager Hub" />

      <div>
        <div className="page-header" style={{ marginBottom: '24px' }}>
          <h1 className="page-title">Manager Hub</h1>
          <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Select a master configuration panel to manage inventory items, ingredients, suppliers, and settings.
          </p>
        </div>

        {/* Master Grid Search */}
        <div className="search-bar-wrapper">
          <Search size={16} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search master panels..."
            value={masterSearchQuery}
            onChange={(e) => setMasterSearchQuery(e.target.value)}
            className="search-bar-input"
          />
          {masterSearchQuery && (
            <button onClick={() => setMasterSearchQuery('')} className="search-clear-btn">
              <X size={14} />
            </button>
          )}
        </div>

        <div style={styles.grid}>
          {filteredMasterModules.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No master panels match your search.
            </div>
          ) : (
            filteredMasterModules.map(m => {
              const Icon = m.icon;
              if (!m.active) {
                return (
                  <div key={m.key} style={{ ...styles.masterCard, ...styles.disabledCard }}>
                    <div style={{ ...styles.iconContainer, backgroundColor: '#F3F4F6', color: '#9CA3AF' }}>
                      <Icon size={28} />
                    </div>
                    <h3 style={{ ...styles.cardTitle, color: '#9CA3AF' }}>{m.label}</h3>
                    <p style={{ ...styles.cardDesc, color: '#9CA3AF' }}>{m.desc}</p>
                    <span style={styles.plannedBadge}>Coming Soon</span>
                  </div>
                );
              }
              return (
                <div 
                  key={m.key} 
                  style={styles.masterCard} 
                  onClick={() => router.visit(m.route)}
                >
                  <div style={styles.iconContainer}>
                    <Icon size={28} color="var(--color-primary)" />
                  </div>
                  <h3 style={styles.cardTitle}>{m.label}</h3>
                  <p style={styles.cardDesc}>{m.desc}</p>
                </div>
              );
            })
          )}
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
  searchBarWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    backgroundColor: '#fff',
    border: '1px solid var(--color-border-light)',
    borderRadius: '8px',
    marginBottom: '24px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    color: 'var(--color-text-primary)',
    backgroundColor: 'transparent',
    fontFamily: 'inherit',
  },
  searchClearBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#E5E7EB',
    color: '#6B7280',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  },
};

export default ManagerHubPage;
