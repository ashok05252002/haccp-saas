import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Plus, Pencil, GraduationCap } from 'lucide-react';
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
import MultiSelectDropdown from '../components/common/MultiSelectDropdown';
import axios from 'axios';

const FREQUENCY_OPTIONS = [
  'One Time',
  'Daily',
  'Weekly',
  'Monthly',
  'Yearly',
];

const APPLIES_TO_OPTIONS = [
  'All Staff',
  'By Position',
  'By Staff',
];

const TrainingTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [roles, setRoles] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    frequency: 'One Time',
    applies_to: 'All Staff',
    status: 'Active',
  });
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [formError, setFormError] = useState('');

  // Status Toggle confirmation modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmRecord, setConfirmRecord] = useState(null);
  const [confirmSaving, setConfirmSaving] = useState(false);

  // Fetch training tasks, active roles, and active staff
  const fetchTasksData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/training-tasks');
      if (response.data && Array.isArray(response.data.tasks)) {
        setTasks(response.data.tasks);
        setRoles(response.data.roles || []);
        setStaff(response.data.staff || []);
      } else if (Array.isArray(response.data)) {
        setTasks(response.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch training tasks data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksData();
  }, []);

  const openAddModal = () => {
    setEditId(null);
    setForm({
      title: '',
      description: '',
      frequency: 'One Time',
      applies_to: 'All Staff',
      status: 'Active',
    });
    setSelectedRoleIds([]);
    setSelectedUserIds([]);
    setFormError('');
    setModalOpen(true);
  };

  const handleEditClick = (item) => {
    setEditId(item.id);
    setForm({
      title: item.title,
      description: item.description || '',
      frequency: item.frequency || 'One Time',
      applies_to: item.applies_to || 'All Staff',
      status: item.status || 'Active',
    });
    setSelectedRoleIds(Array.isArray(item.role_ids) ? item.role_ids : []);
    setSelectedUserIds(Array.isArray(item.user_ids) ? item.user_ids : []);
    setFormError('');
    setModalOpen(true);
  };

  const handleAppliesToChange = (val) => {
    setForm({ ...form, applies_to: val });
    if (val === 'All Staff') {
      setSelectedRoleIds([]);
      setSelectedUserIds([]);
    } else if (val === 'By Position') {
      setSelectedUserIds([]);
    } else if (val === 'By Staff') {
      setSelectedRoleIds([]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.title.trim()) {
      setFormError('Task Title is required.');
      return;
    }
    if (!form.frequency) {
      setFormError('Frequency is required.');
      return;
    }
    if (!form.applies_to) {
      setFormError('Applies To selection is required.');
      return;
    }
    if (form.applies_to === 'By Position' && selectedRoleIds.length === 0) {
      setFormError('Please select at least one position.');
      return;
    }
    if (form.applies_to === 'By Staff' && selectedUserIds.length === 0) {
      setFormError('Please select at least one staff member.');
      return;
    }

    const payload = {
      ...form,
      role_ids: form.applies_to === 'By Position' ? selectedRoleIds : null,
      user_ids: form.applies_to === 'By Staff' ? selectedUserIds : null,
    };

    try {
      if (editId) {
        await axios.put(`/api/training-tasks/${editId}`, payload);
        setSuccess('Training task updated successfully!');
      } else {
        await axios.post('/api/training-tasks', payload);
        setSuccess('Training task added successfully!');
      }

      setModalOpen(false);
      fetchTasksData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errMsg = err.response?.data?.errors?.title?.[0] || 
                     err.response?.data?.errors?.role_ids?.[0] ||
                     err.response?.data?.errors?.user_ids?.[0] ||
                     'An error occurred while saving training task.';
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

    const payload = {
      title: confirmRecord.title,
      description: confirmRecord.description,
      frequency: confirmRecord.frequency,
      applies_to: confirmRecord.applies_to,
      status: nextStatus,
      role_ids: confirmRecord.role_ids,
      user_ids: confirmRecord.user_ids,
    };

    try {
      await axios.put(`/api/training-tasks/${confirmRecord.id}`, payload);
      setConfirmModalOpen(false);
      setSuccess(`Training task "${confirmRecord.title}" status updated to ${nextStatus}.`);
      fetchTasksData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to update training task status.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setConfirmSaving(false);
      setConfirmRecord(null);
    }
  };

  const filteredList = tasks.filter(item => {
    const query = searchQuery.toLowerCase();
    const titleMatch = item.title.toLowerCase().includes(query);
    const descMatch = (item.description || '').toLowerCase().includes(query);
    const freqMatch = (item.frequency || '').toLowerCase().includes(query);
    const appliesMatch = (item.applies_to || '').toLowerCase().includes(query);
    return titleMatch || descMatch || freqMatch || appliesMatch;
  });

  const renderAssignmentSummary = (item) => {
    if (item.applies_to === 'By Position') {
      let roleNames = '';
      if (Array.isArray(item.assigned_role_names) && item.assigned_role_names.length > 0) {
        roleNames = item.assigned_role_names.join(', ');
      } else if (Array.isArray(item.role_ids) && item.role_ids.length > 0) {
        roleNames = roles
          .filter(r => item.role_ids.includes(r.id))
          .map(r => r.name)
          .join(', ');
      }
      return <span className="text-sm text-secondary font-medium">Applies to: {roleNames || 'None selected'}</span>;
    }

    if (item.applies_to === 'By Staff') {
      let staffNames = '';
      if (Array.isArray(item.assigned_staff_names) && item.assigned_staff_names.length > 0) {
        staffNames = item.assigned_staff_names.join(', ');
      } else if (Array.isArray(item.user_ids) && item.user_ids.length > 0) {
        staffNames = staff
          .filter(s => item.user_ids.includes(s.id))
          .map(s => s.name)
          .join(', ');
      }
      return <span className="text-sm text-secondary font-medium">Applies to: {staffNames || 'None selected'}</span>;
    }

    return <span className="text-sm text-secondary font-medium">Applies to: All Staff</span>;
  };

  return (
    <PageLayout>
      <Head title="Training Tasks Master" />

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
              <GraduationCap size={28} color="var(--color-primary)" />
              Training Tasks Master
            </h1>
            <p className="page-subtitle text-secondary mt-1">
              Manage staff training tasks, frequencies, and position or employee assignments.
            </p>
          </div>

          <Button 
            variant="primary" 
            onClick={openAddModal}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Add Training Task</span>
          </Button>
        </div>

        {/* Toast Alerts */}
        <Alert type="success" message={success} className="mb-4" />
        <Alert type="error" message={error} className="mb-4" />

        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search training tasks by title, frequency, or assignment..."
          className="mb-6"
        />

        {/* Training Tasks Table */}
        <Card padding="0">
          {loading ? (
            <Loader message="Loading training tasks..." />
          ) : filteredList.length === 0 ? (
            <EmptyState 
              icon={GraduationCap}
              message={searchQuery ? 'No training tasks match your search.' : 'No training tasks created yet. Click "Add Training Task" to create one.'}
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <DataTable>
                <thead>
                  <tr>
                    <th>Task Title</th>
                    <th>Description / Guidance</th>
                    <th>Frequency</th>
                    <th>Applies To</th>
                    <th>Assignment Summary</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((item) => {
                    const isActive = item.status === 'Active';
                    return (
                      <tr key={item.id}>
                        <td className="font-semibold">{item.title}</td>
                        <td className="text-sm text-secondary">
                          {item.description ? item.description : '-'}
                        </td>
                        <td>
                          <span className="inline-block px-2.5 py-1 rounded bg-blue-50 text-blue-700 text-xs font-semibold">
                            {item.frequency}
                          </span>
                        </td>
                        <td>
                          <span className="inline-block px-2.5 py-1 rounded bg-purple-50 text-purple-700 text-xs font-semibold">
                            {item.applies_to}
                          </span>
                        </td>
                        <td>{renderAssignmentSummary(item)}</td>
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
                              title="Edit Training Task"
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
          title={editId ? "Edit Training Task" : "New Training Task"}
        >
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <Alert type="error" message={formError} />

            {/* Task Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-primary">Task Title *</label>
              <input
                type="text"
                placeholder="e.g. Basic Food Hygiene Rules, Allergen Awareness Training"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="form-input"
                required
              />
            </div>

            {/* Description / Guidance */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-primary">Description / Guidance</label>
              <textarea
                placeholder="Optional guidance notes or instructions for staff..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="form-input"
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Frequency */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-primary">Frequency *</label>
              <select
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                className="form-select"
                required
              >
                {FREQUENCY_OPTIONS.map((freqOpt) => (
                  <option key={freqOpt} value={freqOpt}>
                    {freqOpt}
                  </option>
                ))}
              </select>
            </div>

            {/* Applies To */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-primary">Applies To *</label>
              <select
                value={form.applies_to}
                onChange={(e) => handleAppliesToChange(e.target.value)}
                className="form-select"
                required
              >
                {APPLIES_TO_OPTIONS.map((appliesOpt) => (
                  <option key={appliesOpt} value={appliesOpt}>
                    {appliesOpt}
                  </option>
                ))}
              </select>
            </div>

            {/* Position Multi-Select (shown if Applies To === 'By Position') */}
            {form.applies_to === 'By Position' && (
              <MultiSelectDropdown
                options={roles}
                selectedIds={selectedRoleIds}
                onChange={setSelectedRoleIds}
                label="Select Positions *"
                placeholder="Select position(s)..."
              />
            )}

            {/* Staff Multi-Select (shown if Applies To === 'By Staff') */}
            {form.applies_to === 'By Staff' && (
              <MultiSelectDropdown
                options={staff}
                selectedIds={selectedUserIds}
                onChange={setSelectedUserIds}
                label="Select Staff Members *"
                placeholder="Select staff member(s)..."
              />
            )}

            {/* Active Toggle */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <ToggleSwitch
                checked={form.status === 'Active'}
                onChange={(val) => setForm({ ...form, status: val ? 'Active' : 'Inactive' })}
                label="Active Status"
                sublabel="Inactive training tasks will be hidden from staff training logs."
              />
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {editId ? 'Update Task' : 'Save Task'}
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
          title="Change Training Task Status"
        >
          {confirmRecord && (
            <div>
              <p className="text-sm text-secondary mb-5 leading-relaxed">
                Are you sure you want to change the status of training task <strong>"{confirmRecord.title}"</strong> to{' '}
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

export default TrainingTasksPage;
