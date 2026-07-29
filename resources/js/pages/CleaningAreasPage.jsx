import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
  ArrowLeft, Plus, Pencil, Check, Search, X, Sparkles, ShieldAlert
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

const FREQUENCY_OPTIONS = [
  'Daily',
  'Weekly',
  'Monthly',
  'Quarterly',
  'As Needed',
];

const CleaningAreasPage = () => {
  const [cleaningAreas, setCleaningAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    frequency: 'Daily',
    description: '',
    status: 'Active',
  });
  const [formError, setFormError] = useState('');

  // Status Toggle Confirmation modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmRecord, setConfirmRecord] = useState(null);
  const [confirmSaving, setConfirmSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/cleaning-areas');
      setCleaningAreas(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch cleaning areas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditId(null);
    setForm({
      name: '',
      frequency: 'Daily',
      description: '',
      status: 'Active',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleEditClick = (area) => {
    setEditId(area.id);
    setForm({
      name: area.name,
      frequency: area.frequency || 'Daily',
      description: area.description || '',
      status: area.status || 'Active',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSaveCleaningArea = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim()) {
      setFormError('Area Name is required.');
      return;
    }
    if (!form.frequency) {
      setFormError('Cleaning Frequency is required.');
      return;
    }

    try {
      if (editId) {
        await axios.put(`/api/cleaning-areas/${editId}`, form);
        setSuccess('Cleaning area updated successfully!');
      } else {
        await axios.post('/api/cleaning-areas', form);
        setSuccess('Cleaning area added successfully!');
      }
      setModalOpen(false);
      setEditId(null);
      setForm({ name: '', frequency: 'Daily', description: '', status: 'Active' });
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errMsg = err.response?.data?.errors?.name?.[0] || 
                     err.response?.data?.errors?.frequency?.[0] || 
                     'An error occurred while saving.';
      setFormError(errMsg);
    }
  };

  const handleToggleStatus = (area) => {
    setConfirmRecord(area);
    setConfirmModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!confirmRecord) return;
    setConfirmSaving(true);
    const nextStatus = confirmRecord.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await axios.put(`/api/cleaning-areas/${confirmRecord.id}`, {
        name: confirmRecord.name,
        frequency: confirmRecord.frequency,
        description: confirmRecord.description,
        status: nextStatus,
      });
      setConfirmModalOpen(false);
      setSuccess(`Cleaning area "${confirmRecord.name}" is now ${nextStatus}.`);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to toggle status.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setConfirmSaving(false);
      setConfirmRecord(null);
    }
  };

  const q = searchQuery.toLowerCase();
  const filteredAreas = cleaningAreas.filter(area => {
    const nameMatch = area.name.toLowerCase().includes(q);
    const freqMatch = (area.frequency || '').toLowerCase().includes(q);
    const descMatch = (area.description || '').toLowerCase().includes(q);
    return nameMatch || freqMatch || descMatch;
  });

  return (
    <PageLayout>
      <Head title="Cleaning Areas Master" />

      <div>
        {/* Back Link */}
        <div 
          onClick={() => router.visit('/manager-hub')}
          style={styles.backLink}
        >
          <ArrowLeft size={16} />
          <span>Back to Manager Hub</span>
        </div>

        {/* Top Header */}
        <div style={styles.headerRow}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={28} color="var(--color-primary)" />
              Cleaning Areas Master
            </h1>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Manage cleaning locations, frequencies, and cleaning instructions.
            </p>
          </div>

          <Button 
            variant="primary" 
            onClick={openAddModal}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            <span>Add Cleaning Area</span>
          </Button>
        </div>

        {/* Toast Notifications */}
        {success && (
          <div style={styles.successToast}>
            <Check size={18} />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div style={styles.errorToast}>
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Search Bar */}
        <div style={styles.searchBarWrapper}>
          <Search size={16} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search cleaning areas by name, frequency, or instructions..."
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

        {/* Cleaning Areas List / Table */}
        <Card padding="0">
          {loading ? (
            <div style={styles.loadingState}>Loading cleaning areas...</div>
          ) : filteredAreas.length === 0 ? (
            <div style={styles.emptyState}>
              {searchQuery ? 'No cleaning areas match your search.' : 'No cleaning areas added yet. Click "+ Add Cleaning Area" to get started.'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Area Name</th>
                    <th style={styles.th}>Cleaning Frequency</th>
                    <th style={styles.th}>Description / Instructions</th>
                    <th style={styles.th}>Status</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAreas.map((area) => {
                    const isActive = area.status === 'Active';
                    return (
                      <tr key={area.id} style={styles.tr}>
                        <td style={styles.tdBold}>{area.name}</td>
                        <td style={styles.td}>
                          <span style={styles.freqBadge}>
                            {area.frequency}
                          </span>
                        </td>
                        <td style={styles.td}>{area.description || '-'}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.statusBadge,
                            backgroundColor: isActive ? '#E6F4EA' : '#F3F4F6',
                            color: isActive ? '#137333' : '#5F6368',
                          }}>
                            {area.status || 'Active'}
                          </span>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          <div style={styles.actionCell}>
                            <button 
                              onClick={() => handleEditClick(area)} 
                              style={styles.actionBtn}
                              title="Edit Cleaning Area"
                            >
                              <Pencil size={15} color="var(--color-primary)" />
                            </button>

                            <Toggle 
                              checked={isActive}
                              onChange={() => handleToggleStatus(area)}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ========================================================================= */}
        {/* ADD / EDIT CLEANING AREA MODAL */}
        {/* ========================================================================= */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editId ? "Edit Cleaning Area" : "Add New Cleaning Area"}
        >
          <form onSubmit={handleSaveCleaningArea} style={styles.form}>
            {formError && (
              <div style={styles.formErrorMsg}>
                <ShieldAlert size={16} />
                <span>{formError}</span>
              </div>
            )}

            {/* Area Name */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Area Name *</label>
              <input
                type="text"
                placeholder="e.g. Prep Area 1, Grill Station, Coffee Table, Restroom 1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={styles.input}
                required
              />
            </div>

            {/* Cleaning Frequency Dropdown */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Cleaning Frequency *</label>
              <select
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                style={styles.select}
                required
              >
                {FREQUENCY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Description / Instructions */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Description / Instructions</label>
              <textarea
                placeholder="What needs cleaning in this area, e.g. sanitize all surfaces, degrease behind fryer"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={styles.textarea}
                rows={3}
              />
            </div>

            {/* Active Toggle */}
            <div style={styles.toggleRow}>
              <div>
                <div style={styles.toggleLabel}>Active Status</div>
                <div style={styles.toggleDesc}>Inactive cleaning areas are hidden from daily sanitation checklists.</div>
              </div>
              <Toggle
                checked={form.status === 'Active'}
                onChange={(val) => setForm({ ...form, status: val ? 'Active' : 'Inactive' })}
              />
            </div>

            <div style={styles.modalActions}>
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {editId ? 'Update Cleaning Area' : 'Save Cleaning Area'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* ========================================================================= */}
        {/* CONFIRMATION MODAL - STATUS TOGGLE */}
        {/* ========================================================================= */}
        <Modal
          isOpen={confirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
          title="Change Cleaning Area Status"
        >
          {confirmRecord && (
            <div>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
                Are you sure you want to change the status of <strong>"{confirmRecord.name}"</strong> to{' '}
                <strong style={{ color: confirmRecord.status === 'Active' ? '#D97706' : 'var(--color-primary)' }}>
                  {confirmRecord.status === 'Active' ? 'Inactive' : 'Active'}
                </strong>?
              </p>
              <div style={styles.modalActions}>
                <Button variant="secondary" onClick={() => setConfirmModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={confirmToggleStatus}
                  disabled={confirmSaving}
                >
                  {confirmSaving ? 'Saving...' : 'Confirm Change'}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </PageLayout>
  );
};

const styles = {
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--color-primary)',
    cursor: 'pointer',
    marginBottom: '16px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  searchBarWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    backgroundColor: '#fff',
    border: '1px solid var(--color-border-light)',
    borderRadius: '8px',
    marginBottom: '20px',
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
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '14px',
  },
  th: {
    padding: '12px 16px',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    backgroundColor: '#F9FAFB',
    borderBottom: '1px solid var(--color-border-light)',
  },
  tr: {
    borderBottom: '1px solid var(--color-border-light)',
  },
  td: {
    padding: '14px 16px',
    color: 'var(--color-text-primary)',
    verticalAlign: 'middle',
  },
  tdBold: {
    padding: '14px 16px',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    verticalAlign: 'middle',
  },
  freqBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '6px',
    backgroundColor: 'var(--color-primary-pale)',
    color: 'var(--color-primary)',
    fontSize: '12px',
    fontWeight: 600,
  },
  statusBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
  },
  actionCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: '20px',
    transition: 'background-color 200ms ease',
  },
  sliderKnob: {
    position: 'absolute',
    top: '2px',
    left: '2px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    transition: 'transform 200ms ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  },
  loadingState: {
    padding: '40px',
    textAlign: 'center',
    color: 'var(--color-text-secondary)',
  },
  emptyState: {
    padding: '40px',
    textAlign: 'center',
    color: 'var(--color-text-secondary)',
  },
  successToast: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    backgroundColor: '#E6F4EA',
    color: '#137333',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    fontWeight: 500,
  },
  errorToast: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    backgroundColor: '#FCE8E6',
    color: '#C5221F',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    fontWeight: 500,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--color-border-light)',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
  },
  select: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--color-border-light)',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#fff',
    fontFamily: 'inherit',
  },
  textarea: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--color-border-light)',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  toggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    border: '1px solid var(--color-border-light)',
  },
  toggleLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
  },
  toggleDesc: {
    fontSize: '11px',
    color: 'var(--color-text-secondary)',
    marginTop: '2px',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px',
  },
  formErrorMsg: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    backgroundColor: '#FCE8E6',
    color: '#C5221F',
    borderRadius: '6px',
    fontSize: '13px',
  },
};

export default CleaningAreasPage;
