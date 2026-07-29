import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
  ArrowLeft, Plus, Pencil, Check, ShieldAlert, Search, X, Truck, Phone, Mail, Calendar, User
} from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import axios from 'axios';

const Toggle = ({ checked, onChange }) => (
  <label style={styles.switch} onClick={(e) => { e.preventDefault(); onChange(!checked); }}>
    <span style={{ ...styles.slider, backgroundColor: checked ? 'var(--color-primary)' : '#E5E7EB' }}>
      <span style={{ ...styles.sliderKnob, transform: checked ? 'translateX(20px)' : 'translateX(0)' }} />
    </span>
  </label>
);

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Status confirm modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmRecord, setConfirmRecord] = useState(null);
  const [confirmSaving, setConfirmSaving] = useState(false);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/suppliers');
      setSuppliers(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch suppliers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleToggleStatus = (supplier) => {
    setConfirmRecord(supplier);
    setConfirmModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!confirmRecord) return;
    setConfirmSaving(true);
    try {
      const res = await axios.patch(`/api/suppliers/${confirmRecord.id}/toggle-status`);
      setConfirmModalOpen(false);
      setSuccess(`Supplier "${confirmRecord.name}" is now ${res.data.status}.`);
      fetchSuppliers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to update supplier status.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setConfirmSaving(false);
      setConfirmRecord(null);
    }
  };

  const q = searchQuery.toLowerCase();
  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(q) ||
    (s.contact_person || '').toLowerCase().includes(q) ||
    (s.phone || '').toLowerCase().includes(q) ||
    (s.email || '').toLowerCase().includes(q) ||
    (s.order_day || '').toLowerCase().includes(q) ||
    (s.categories || []).some(c => c.name.toLowerCase().includes(q))
  );

  return (
    <PageLayout>
      <Head title="Suppliers Master" />

      {/* Banners */}
      {success && (
        <div style={styles.alertSuccess}>
          <Check size={16} />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div style={styles.alertError}>
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      <div>
        <button onClick={() => router.visit('/manager-hub')} style={styles.backBtn}>
          <ArrowLeft size={16} />
          <span>Back to Manager Hub</span>
        </button>

        <div style={styles.panelHeaderRow}>
          <div>
            <h1 className="page-title">Suppliers Master</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginTop: '2px' }}>
              Manage approved food and ingredient vendors, order schedules, and supplied items.
            </p>
          </div>
          <Button 
            variant="primary" 
            icon={Plus} 
            onClick={() => router.visit('/manager-hub/suppliers/create')}
          >
            Add Supplier
          </Button>
        </div>

        {/* Search Bar */}
        <div style={styles.searchBarWrapper}>
          <Search size={16} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search suppliers by name, contact, email, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={styles.searchClearBtn}>
              <X size={14} />
            </button>
          )}
        </div>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              Loading suppliers...
            </div>
          ) : suppliers.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No suppliers registered yet. Click "Add Supplier" to register one.
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              {searchQuery ? `No suppliers match "${searchQuery}".` : 'No suppliers registered.'}
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Supplier Name</th>
                  <th style={styles.th}>Contact Person</th>
                  <th style={styles.th}>Phone & Email</th>
                  <th style={styles.th}>Order Schedule</th>
                  <th style={styles.th}>Supplied Categories</th>
                  <th style={styles.th}>Status</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((s) => (
                  <tr key={s.id}>
                    <td style={styles.td}>
                      <strong style={{ color: 'var(--color-text-primary)', fontSize: '15px' }}>{s.name}</strong>
                    </td>
                    <td style={styles.td}>
                      {s.contact_person ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={14} color="var(--color-text-muted)" />
                          <span>{s.contact_person}</span>
                        </div>
                      ) : (
                        <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>—</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px' }}>
                        {s.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-secondary)' }}>
                            <Phone size={12} /> {s.phone}
                          </div>
                        )}
                        {s.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-secondary)' }}>
                            <Mail size={12} /> {s.email}
                          </div>
                        )}
                        {!s.phone && !s.email && <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>—</span>}
                      </div>
                    </td>
                    <td style={styles.td}>
                      {s.order_day ? (
                        <span style={styles.dayBadge}>
                          <Calendar size={12} style={{ marginRight: '4px' }} />
                          {s.order_day}
                        </span>
                      ) : (
                        <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Any day</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      {s.categories && s.categories.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {s.categories.map(c => (
                            <span key={c.id} style={styles.categoryTag}>
                              {c.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Toggle
                          checked={s.status === 'Active'}
                          onChange={() => handleToggleStatus(s)}
                        />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: s.status === 'Active' ? 'var(--color-primary)' : '#6B7280' }}>
                          {s.status}
                        </span>
                      </div>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => router.visit(`/manager-hub/suppliers/${s.id}/edit`)}
                          style={styles.actionIconBtn}
                          title="Edit Supplier"
                        >
                          <Pencil size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* Confirm Status Change Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Confirm Status Change"
        footer={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" onClick={() => setConfirmModalOpen(false)} disabled={confirmSaving}>
              Cancel
            </Button>
            <Button variant={confirmRecord?.status === 'Active' ? 'danger' : 'primary'} onClick={confirmToggleStatus} loading={confirmSaving}>
              {confirmRecord?.status === 'Active' ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '14px', color: 'var(--color-text-primary)', lineHeight: '1.5' }}>
            Are you sure you want to change status of supplier <strong>{confirmRecord?.name}</strong> to{' '}
            <strong>{confirmRecord?.status === 'Active' ? 'Inactive' : 'Active'}</strong>?
          </p>
          {confirmRecord?.status === 'Active' && (
            <div style={{ ...styles.alertError, margin: 0 }}>
              <ShieldAlert size={16} />
              <span>Deactivating a supplier will remove them from active order selections.</span>
            </div>
          )}
        </div>
      </Modal>
    </PageLayout>
  );
};

const styles = {
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: 'var(--color-primary)',
    fontSize: '13px',
    fontWeight: 600,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    marginBottom: '20px',
    padding: 0,
  },
  panelHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '12px 20px',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    borderBottom: '2px solid var(--color-border-light)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  td: {
    padding: '16px 20px',
    fontSize: '14px',
    color: 'var(--color-text-secondary)',
    borderBottom: '1px solid var(--color-border-light)',
    verticalAlign: 'middle',
  },
  categoryTag: {
    display: 'inline-block',
    padding: '2px 8px',
    backgroundColor: '#EFF6FF',
    border: '1px solid #BFDBFE',
    borderRadius: '12px',
    color: '#1D4ED8',
    fontSize: '11px',
    fontWeight: 600,
  },
  dayBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 8px',
    backgroundColor: '#F3F4F6',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    color: '#374151',
    fontSize: '12px',
    fontWeight: 600,
  },
  actionIconBtn: {
    width: '30px',
    height: '30px',
    borderRadius: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--color-border-light)',
    backgroundColor: '#fff',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    transition: 'all 150ms ease',
  },
  alertSuccess: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    backgroundColor: 'var(--color-primary-pale)',
    border: '1px solid #B8DBCA',
    color: 'var(--color-primary)',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '20px',
  },
  alertError: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    backgroundColor: 'var(--color-red-pale)',
    border: '1px solid var(--color-red-border)',
    color: 'var(--color-danger)',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '20px',
  },
  switch: {
    position: 'relative',
    display: 'inline-block',
    width: '40px',
    height: '20px',
    cursor: 'pointer',
  },
  slider: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: '20px',
    transition: 'background-color 200ms ease',
    display: 'flex',
    alignItems: 'center',
    padding: '0 2px',
  },
  sliderKnob: {
    height: '16px',
    width: '16px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    transition: 'transform 200ms ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
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

export default SuppliersPage;
