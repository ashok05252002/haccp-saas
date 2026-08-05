import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Plus, Pencil, Flame } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import SearchBar from '../components/common/SearchBar';
import Alert from '../components/common/Alert';
import StatusBadge from '../components/common/StatusBadge';
import ToggleSwitch from '../components/common/ToggleSwitch';
import DataTable from '../components/common/DataTable';
import EmptyState from '../components/common/EmptyState';
import Loader from '../components/common/Loader';
import axios from 'axios';

const HoldingStationsPage = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    status: 'Active',
  });
  const [formError, setFormError] = useState('');

  // Status Toggle confirmation modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmRecord, setConfirmRecord] = useState(null);
  const [confirmSaving, setConfirmSaving] = useState(false);

  // Fetch holding stations
  const fetchStations = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/holding-stations');
      setStations(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch holding stations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const openAddModal = () => {
    setEditId(null);
    setForm({
      name: '',
      status: 'Active',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleEditClick = (item) => {
    setEditId(item.id);
    setForm({
      name: item.name,
      status: item.status || 'Active',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim()) {
      setFormError('Holding Station Name is required.');
      return;
    }

    try {
      if (editId) {
        await axios.put(`/api/holding-stations/${editId}`, form);
        setSuccess('Holding station updated successfully!');
      } else {
        await axios.post('/api/holding-stations', form);
        setSuccess('Holding station added successfully!');
      }

      setModalOpen(false);
      fetchStations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errMsg = err.response?.data?.errors?.name?.[0] || 
                     'An error occurred while saving holding station.';
      setFormError(errMsg);
    }
  };

  const handleToggleStatus = (item) => {
    setConfirmRecord(item);
    setConfirmModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!confirmRecord) return;
    setConfirmSaving(true);
    const nextStatus = confirmRecord.status === 'Active' ? 'Inactive' : 'Active';

    try {
      await axios.put(`/api/holding-stations/${confirmRecord.id}`, {
        name: confirmRecord.name,
        status: nextStatus,
      });

      setConfirmModalOpen(false);
      setSuccess(`Holding station "${confirmRecord.name}" status updated to ${nextStatus}.`);
      fetchStations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to update holding station status.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setConfirmSaving(false);
      setConfirmRecord(null);
    }
  };

  const filteredList = stations.filter(item => {
    return item.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <PageLayout>
      <Head title="Holding Stations Master" />

      <div>
        {/* Back Link */}
        <div 
          onClick={() => router.visit('/manager-hub')}
          className="back-link mb-4"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 600, fontSize: '13px' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Manager Hub</span>
        </div>

        {/* Top Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="page-title flex items-center gap-3">
              <Flame size={28} color="var(--color-primary)" />
              Holding Stations Master
            </h1>
            <p className="page-subtitle text-secondary mt-1">
              Manage hot holding units and stations used for food temperature checks.
            </p>
          </div>

          <Button 
            variant="primary" 
            onClick={openAddModal}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Add Holding Station</span>
          </Button>
        </div>

        {/* Toast Alerts */}
        <Alert type="success" message={success} className="mb-4" />
        <Alert type="error" message={error} className="mb-4" />

        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search holding stations by name..."
          className="mb-6"
        />

        {/* Holding Stations Table */}
        <Card padding="0">
          {loading ? (
            <Loader message="Loading holding stations..." />
          ) : filteredList.length === 0 ? (
            <EmptyState 
              icon={Flame}
              message={searchQuery ? 'No holding stations match your search.' : 'No holding stations added yet. Click "Add Holding Station" to create one.'}
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <DataTable>
                <thead>
                  <tr>
                    <th>Holding Station Name</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((item) => {
                    const isActive = item.status === 'Active';
                    return (
                      <tr key={item.id}>
                        <td className="font-semibold">{item.name}</td>
                        <td>
                          <StatusBadge 
                            label={item.status || 'Active'} 
                            type={isActive ? 'passed' : 'draft'} 
                          />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="flex items-center justify-end gap-3">
                            <button 
                              type="button"
                              onClick={() => handleEditClick(item)} 
                              className="p-1 rounded hover:bg-gray-100 border-none bg-transparent cursor-pointer"
                              title="Edit Holding Station"
                            >
                              <Pencil size={15} color="var(--color-primary)" />
                            </button>

                            <ToggleSwitch 
                              checked={isActive}
                              onChange={() => handleToggleStatus(item)}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </DataTable>
            </div>
          )}
        </Card>

        {/* ========================================================================= */}
        {/* ADD / EDIT MODAL */}
        {/* ========================================================================= */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editId ? "Edit Holding Station" : "New Holding Station"}
        >
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <Alert type="error" message={formError} />

            {/* Holding Station Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-primary">Holding Station Name *</label>
              <input
                type="text"
                placeholder="e.g. Bain Marie, Hot Display Counter, Soup Station, Buffet Counter"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="form-input"
                required
              />
            </div>

            {/* Active Toggle */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <ToggleSwitch
                checked={form.status === 'Active'}
                onChange={(val) => setForm({ ...form, status: val ? 'Active' : 'Inactive' })}
                label="Active Status"
                sublabel="Inactive stations will be hidden from hot holding temperature logs."
              />
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {editId ? 'Update Holding Station' : 'Save Holding Station'}
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
          title="Change Holding Station Status"
        >
          {confirmRecord && (
            <div>
              <p className="text-sm text-secondary mb-5 leading-relaxed">
                Are you sure you want to change the status of holding station <strong>"{confirmRecord.name}"</strong> to{' '}
                <strong style={{ color: confirmRecord.status === 'Active' ? '#D97706' : 'var(--color-primary)' }}>
                  {confirmRecord.status === 'Active' ? 'Inactive' : 'Active'}
                </strong>?
              </p>
              <div className="flex justify-end gap-3">
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

export default HoldingStationsPage;
