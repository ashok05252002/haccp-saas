import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Plus, Pencil, Bug } from 'lucide-react';
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

const PestControlSetupPage = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    question_text: '',
    status: 'Active',
  });
  const [formError, setFormError] = useState('');

  // Status Toggle confirmation modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmRecord, setConfirmRecord] = useState(null);
  const [confirmSaving, setConfirmSaving] = useState(false);

  // Fetch pest control questions
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/pest-control-questions');
      setQuestions(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch pest control questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const openAddModal = () => {
    setEditId(null);
    setForm({
      question_text: '',
      status: 'Active',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleEditClick = (item) => {
    setEditId(item.id);
    setForm({
      question_text: item.question_text,
      status: item.status || 'Active',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.question_text.trim()) {
      setFormError('Question Text is required.');
      return;
    }

    try {
      if (editId) {
        await axios.put(`/api/pest-control-questions/${editId}`, form);
        setSuccess('Pest control question updated successfully!');
      } else {
        await axios.post('/api/pest-control-questions', form);
        setSuccess('Pest control question added successfully!');
      }

      setModalOpen(false);
      fetchQuestions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errMsg = err.response?.data?.errors?.question_text?.[0] || 
                     'An error occurred while saving question.';
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
      await axios.put(`/api/pest-control-questions/${confirmRecord.id}`, {
        question_text: confirmRecord.question_text,
        status: nextStatus,
      });

      setConfirmModalOpen(false);
      setSuccess(`Question status updated to ${nextStatus}.`);
      fetchQuestions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to update question status.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setConfirmSaving(false);
      setConfirmRecord(null);
    }
  };

  const filteredList = questions.filter(item => {
    return item.question_text.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <PageLayout>
      <Head title="Pest Control Setup Master" />

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
              <Bug size={28} color="var(--color-primary)" />
              Pest Control Setup Master
            </h1>
            <p className="page-subtitle text-secondary mt-1">
              Manage pest control checklist questions used in food safety checks.
            </p>
          </div>

          <Button 
            variant="primary" 
            onClick={openAddModal}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Add Question</span>
          </Button>
        </div>

        {/* Toast Alerts */}
        <Alert type="success" message={success} className="mb-4" />
        <Alert type="error" message={error} className="mb-4" />

        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search pest control questions..."
          className="mb-6"
        />

        {/* Questions Table */}
        <Card padding="0">
          {loading ? (
            <Loader message="Loading pest control questions..." />
          ) : filteredList.length === 0 ? (
            <EmptyState 
              icon={Bug}
              message={searchQuery ? 'No pest control questions match your search.' : 'No pest control questions created yet. Click "Add Question" to create one.'}
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <DataTable>
                <thead>
                  <tr>
                    <th>Question Text</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((item) => {
                    const isActive = item.status === 'Active';
                    return (
                      <tr key={item.id}>
                        <td className="font-semibold" style={{ whiteSpace: 'normal', minWidth: '320px' }}>{item.question_text}</td>
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
                              title="Edit Question"
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
          title={editId ? "Edit Pest Control Question" : "New Pest Control Question"}
        >
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <Alert type="error" message={formError} />

            {/* Question Text */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-primary">Question Text *</label>
              <textarea
                placeholder="e.g. Are premises protected against pests and free from signs of pest activity?"
                value={form.question_text}
                onChange={(e) => setForm({ ...form, question_text: e.target.value })}
                className="form-input"
                rows={3}
                required
              />
            </div>

            {/* Active Toggle */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <ToggleSwitch
                checked={form.status === 'Active'}
                onChange={(val) => setForm({ ...form, status: val ? 'Active' : 'Inactive' })}
                label="Active Status"
                sublabel="Inactive questions will be hidden from pest control logs."
              />
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {editId ? 'Update Question' : 'Save Question'}
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
          title="Change Question Status"
        >
          {confirmRecord && (
            <div>
              <p className="text-sm text-secondary mb-5 leading-relaxed">
                Are you sure you want to change the status of question <strong>"{confirmRecord.question_text}"</strong> to{' '}
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

export default PestControlSetupPage;
