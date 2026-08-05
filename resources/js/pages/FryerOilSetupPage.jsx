import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Plus, Pencil, Droplets } from 'lucide-react';
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

const FryerOilSetupPage = () => {
  const [activeTab, setActiveTab] = useState('stations'); // 'stations' | 'quality' | 'actions'

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Tab 1: Fryer / Cooking Stations State
  const [stations, setStations] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(false);

  // Tab 2: Oil Quality Options State
  const [qualityOptions, setQualityOptions] = useState([]);
  const [qualityLoading, setQualityLoading] = useState(false);

  // Tab 3: Oil Actions State
  const [actions, setActions] = useState([]);
  const [actionsLoading, setActionsLoading] = useState(false);

  // Modal State for Active Tab
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formStatus, setFormStatus] = useState('Active');
  const [formError, setFormError] = useState('');

  // Status Toggle confirmation modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmRecord, setConfirmRecord] = useState(null);
  const [confirmSaving, setConfirmSaving] = useState(false);

  // Fetch API endpoints
  const fetchStations = async () => {
    setStationsLoading(true);
    try {
      const res = await axios.get('/api/fryer-stations');
      setStations(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch fryer / cooking stations.');
    } finally {
      setStationsLoading(false);
    }
  };

  const fetchQualityOptions = async () => {
    setQualityLoading(true);
    try {
      const res = await axios.get('/api/oil-quality-options');
      setQualityOptions(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch oil quality options.');
    } finally {
      setQualityLoading(false);
    }
  };

  const fetchActions = async () => {
    setActionsLoading(true);
    try {
      const res = await axios.get('/api/oil-actions');
      setActions(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch oil actions.');
    } finally {
      setActionsLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
    fetchQualityOptions();
    fetchActions();
  }, []);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  const openAddModal = () => {
    setEditId(null);
    setFormName('');
    setFormStatus('Active');
    setFormError('');
    setModalOpen(true);
  };

  const handleEditClick = (item) => {
    setEditId(item.id);
    setFormName(item.name);
    setFormStatus(item.status || 'Active');
    setFormError('');
    setModalOpen(true);
  };

  const getTargetEndpoint = () => {
    if (activeTab === 'stations') return '/api/fryer-stations';
    if (activeTab === 'quality') return '/api/oil-quality-options';
    return '/api/oil-actions';
  };

  const getEntityNameLabel = () => {
    if (activeTab === 'stations') return 'Fryer / Cooking Station Name';
    if (activeTab === 'quality') return 'Oil Quality Option Name';
    return 'Oil Action Name';
  };

  const getEntityPlaceholder = () => {
    if (activeTab === 'stations') return 'e.g. Main Fryer, Chips Fryer, Fish Fryer';
    if (activeTab === 'quality') return 'e.g. Good – clear / normal, Foaming';
    return 'e.g. Filtered oil, Changed oil';
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError(`${getEntityNameLabel()} is required.`);
      return;
    }

    const endpoint = getTargetEndpoint();
    const payload = {
      name: formName,
      status: formStatus,
    };

    try {
      if (editId) {
        await axios.put(`${endpoint}/${editId}`, payload);
        setSuccess('Record updated successfully!');
      } else {
        await axios.post(endpoint, payload);
        setSuccess('Record added successfully!');
      }

      setModalOpen(false);
      if (activeTab === 'stations') fetchStations();
      else if (activeTab === 'quality') fetchQualityOptions();
      else fetchActions();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errMsg = err.response?.data?.errors?.name?.[0] || 'An error occurred while saving record.';
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
    const endpoint = getTargetEndpoint();

    try {
      await axios.put(`${endpoint}/${confirmRecord.id}`, {
        name: confirmRecord.name,
        status: nextStatus,
      });

      setConfirmModalOpen(false);
      setSuccess(`"${confirmRecord.name}" status updated to ${nextStatus}.`);

      if (activeTab === 'stations') fetchStations();
      else if (activeTab === 'quality') fetchQualityOptions();
      else fetchActions();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to update status.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setConfirmSaving(false);
      setConfirmRecord(null);
    }
  };

  // Helper for current list and filtering
  const getCurrentRawList = () => {
    if (activeTab === 'stations') return stations;
    if (activeTab === 'quality') return qualityOptions;
    return actions;
  };

  const getCurrentLoading = () => {
    if (activeTab === 'stations') return stationsLoading;
    if (activeTab === 'quality') return qualityLoading;
    return actionsLoading;
  };

  const filteredList = getCurrentRawList().filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageLayout>
      <Head title="Fryer Oil Setup Master" />

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
              <Droplets size={28} color="var(--color-primary)" />
              Fryer Oil Setup Master
            </h1>
            <p className="page-subtitle text-secondary mt-1">
              Manage cooking stations, oil quality options, and oil actions used for fryer checks.
            </p>
          </div>

          <Button 
            variant="primary" 
            onClick={openAddModal}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            <span>
              {activeTab === 'stations' && 'Add Fryer / Cooking Station'}
              {activeTab === 'quality' && 'Add Oil Quality Option'}
              {activeTab === 'actions' && 'Add Oil Action'}
            </span>
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-gray-200 mb-6" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
          <button
            type="button"
            onClick={() => handleTabSwitch('stations')}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'stations' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'stations' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            }}
          >
            Fryer / Cooking Stations ({stations.length})
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('quality')}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'quality' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'quality' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            }}
          >
            Oil Quality Options ({qualityOptions.length})
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('actions')}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'actions' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'actions' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            }}
          >
            Oil Actions ({actions.length})
          </button>
        </div>

        {/* Toast Alerts */}
        <Alert type="success" message={success} className="mb-4" />
        <Alert type="error" message={error} className="mb-4" />

        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={`Search ${getEntityNameLabel().toLowerCase()}s...`}
          className="mb-6"
        />

        {/* Table Content Card */}
        <Card padding="0">
          {getCurrentLoading() ? (
            <Loader message="Loading data..." />
          ) : filteredList.length === 0 ? (
            <EmptyState 
              icon={Droplets}
              message={
                searchQuery
                  ? `No items match your search.`
                  : activeTab === 'stations'
                  ? 'No fryer / cooking stations created yet. Click "Add Fryer / Cooking Station" to create one.'
                  : activeTab === 'quality'
                  ? 'No oil quality options created yet. Click "Add Oil Quality Option" to create one.'
                  : 'No oil actions created yet. Click "Add Oil Action" to create one.'
              }
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <DataTable>
                <thead>
                  <tr>
                    <th>{getEntityNameLabel()}</th>
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
                              title="Edit item"
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
          title={
            editId 
              ? `Edit ${activeTab === 'stations' ? 'Fryer / Cooking Station' : activeTab === 'quality' ? 'Oil Quality Option' : 'Oil Action'}`
              : `New ${activeTab === 'stations' ? 'Fryer / Cooking Station' : activeTab === 'quality' ? 'Oil Quality Option' : 'Oil Action'}`
          }
        >
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <Alert type="error" message={formError} />

            {/* Name Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-primary">{getEntityNameLabel()} *</label>
              <input
                type="text"
                placeholder={getEntityPlaceholder()}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="form-input"
                required
              />
            </div>

            {/* Active Toggle */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <ToggleSwitch
                checked={formStatus === 'Active'}
                onChange={(val) => setFormStatus(val ? 'Active' : 'Inactive')}
                label="Active Status"
                sublabel="Inactive records will be hidden from fryer oil check logs."
              />
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {editId 
                  ? `Update ${activeTab === 'stations' ? 'Fryer Station' : activeTab === 'quality' ? 'Quality Option' : 'Oil Action'}`
                  : `Save ${activeTab === 'stations' ? 'Fryer Station' : activeTab === 'quality' ? 'Quality Option' : 'Oil Action'}`
                }
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
          title="Change Status"
        >
          {confirmRecord && (
            <div>
              <p className="text-sm text-secondary mb-5 leading-relaxed">
                Are you sure you want to change the status of <strong>"{confirmRecord.name}"</strong> to{' '}
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

export default FryerOilSetupPage;
