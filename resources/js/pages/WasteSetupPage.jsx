import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
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

const WasteSetupPage = () => {
  const [activeTab, setActiveTab] = useState('types'); // 'types' | 'stages' | 'reasons' | 'methods'

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Tab 1: Waste Types State
  const [wasteTypes, setWasteTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(false);

  // Tab 2: Waste Source / Stage State
  const [wasteStages, setWasteStages] = useState([]);
  const [stagesLoading, setStagesLoading] = useState(false);

  // Tab 3: Waste Reasons State
  const [wasteReasons, setWasteReasons] = useState([]);
  const [reasonsLoading, setReasonsLoading] = useState(false);

  // Tab 4: Disposal Methods State
  const [disposalMethods, setDisposalMethods] = useState([]);
  const [methodsLoading, setMethodsLoading] = useState(false);

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
  const fetchTypes = async () => {
    setTypesLoading(true);
    try {
      const res = await axios.get('/api/waste-types');
      setWasteTypes(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch waste types.');
    } finally {
      setTypesLoading(false);
    }
  };

  const fetchStages = async () => {
    setStagesLoading(true);
    try {
      const res = await axios.get('/api/waste-source-stages');
      setWasteStages(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch waste source / stage records.');
    } finally {
      setStagesLoading(false);
    }
  };

  const fetchReasons = async () => {
    setReasonsLoading(true);
    try {
      const res = await axios.get('/api/waste-reasons');
      setWasteReasons(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch waste reasons.');
    } finally {
      setReasonsLoading(false);
    }
  };

  const fetchMethods = async () => {
    setMethodsLoading(true);
    try {
      const res = await axios.get('/api/waste-disposal-methods');
      setDisposalMethods(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch disposal methods.');
    } finally {
      setMethodsLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
    fetchStages();
    fetchReasons();
    fetchMethods();
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
    if (activeTab === 'types') return '/api/waste-types';
    if (activeTab === 'stages') return '/api/waste-source-stages';
    if (activeTab === 'reasons') return '/api/waste-reasons';
    return '/api/waste-disposal-methods';
  };

  const getEntityNameLabel = () => {
    if (activeTab === 'types') return 'Waste Type Name';
    if (activeTab === 'stages') return 'Waste Source / Stage Name';
    if (activeTab === 'reasons') return 'Waste Reason Name';
    return 'Disposal Method Name';
  };

  const getEntityPlaceholder = () => {
    if (activeTab === 'types') return 'e.g. Organic / Processing Scraps, Rejected Product';
    if (activeTab === 'stages') return 'e.g. Receiving, Preparation, Cooking';
    if (activeTab === 'reasons') return 'e.g. Spoilage, Preparation waste, Over production';
    return 'e.g. Food waste bin, General waste';
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
      if (activeTab === 'types') fetchTypes();
      else if (activeTab === 'stages') fetchStages();
      else if (activeTab === 'reasons') fetchReasons();
      else fetchMethods();

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

      if (activeTab === 'types') fetchTypes();
      else if (activeTab === 'stages') fetchStages();
      else if (activeTab === 'reasons') fetchReasons();
      else fetchMethods();

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
    if (activeTab === 'types') return wasteTypes;
    if (activeTab === 'stages') return wasteStages;
    if (activeTab === 'reasons') return wasteReasons;
    return disposalMethods;
  };

  const getCurrentLoading = () => {
    if (activeTab === 'types') return typesLoading;
    if (activeTab === 'stages') return stagesLoading;
    if (activeTab === 'reasons') return reasonsLoading;
    return methodsLoading;
  };

  const filteredList = getCurrentRawList().filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageLayout>
      <Head title="Waste Setup Master" />

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
              <Trash2 size={28} color="var(--color-primary)" />
              Waste Setup Master
            </h1>
            <p className="page-subtitle text-secondary mt-1">
              Manage waste types, waste sources/stages, waste reasons, and disposal methods used in food waste tracking.
            </p>
          </div>

          <Button 
            variant="primary" 
            onClick={openAddModal}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            <span>
              {activeTab === 'types' && 'Add Waste Type'}
              {activeTab === 'stages' && 'Add Waste Source / Stage'}
              {activeTab === 'reasons' && 'Add Waste Reason'}
              {activeTab === 'methods' && 'Add Disposal Method'}
            </span>
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-gray-200 mb-6" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
          <button
            type="button"
            onClick={() => handleTabSwitch('types')}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'types' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'types' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            }}
          >
            Waste Types ({wasteTypes.length})
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('stages')}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'stages' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'stages' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            }}
          >
            Waste Source / Stage ({wasteStages.length})
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('reasons')}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'reasons' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'reasons' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            }}
          >
            Waste Reasons ({wasteReasons.length})
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('methods')}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'methods' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'methods' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            }}
          >
            Disposal Methods ({disposalMethods.length})
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
              icon={Trash2}
              message={
                searchQuery
                  ? `No items match your search.`
                  : activeTab === 'types'
                  ? 'No waste types created yet. Click "Add Waste Type" to create one.'
                  : activeTab === 'stages'
                  ? 'No waste sources / stages created yet. Click "Add Waste Source / Stage" to create one.'
                  : activeTab === 'reasons'
                  ? 'No waste reasons created yet. Click "Add Waste Reason" to create one.'
                  : 'No disposal methods created yet. Click "Add Disposal Method" to create one.'
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
              ? `Edit ${activeTab === 'types' ? 'Waste Type' : activeTab === 'stages' ? 'Waste Source / Stage' : activeTab === 'reasons' ? 'Waste Reason' : 'Disposal Method'}`
              : `New ${activeTab === 'types' ? 'Waste Type' : activeTab === 'stages' ? 'Waste Source / Stage' : activeTab === 'reasons' ? 'Waste Reason' : 'Disposal Method'}`
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
                sublabel="Inactive records will be hidden from food waste logs."
              />
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {editId 
                  ? `Update ${activeTab === 'types' ? 'Waste Type' : activeTab === 'stages' ? 'Source / Stage' : activeTab === 'reasons' ? 'Waste Reason' : 'Disposal Method'}`
                  : `Save ${activeTab === 'types' ? 'Waste Type' : activeTab === 'stages' ? 'Source / Stage' : activeTab === 'reasons' ? 'Waste Reason' : 'Disposal Method'}`
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

export default WasteSetupPage;
