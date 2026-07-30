import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
  ArrowLeft, Plus, Pencil, Check, Search, X, HeartPulse, ShieldAlert
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

const HealthDeclarationPage = () => {
  const [activeTab, setActiveTab] = useState('sections'); // 'sections' | 'questions'
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  // =========================================================================
  // 1. SECTIONS STATES & LOGIC
  // =========================================================================
  const [sections, setSections] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [secModalOpen, setSecModalOpen] = useState(false);
  const [secEditId, setSecEditId] = useState(null);
  const [secForm, setSecForm] = useState({ title: '', status: 'Active' });
  const [secFormError, setSecFormError] = useState('');

  const [secConfirmModalOpen, setSecConfirmModalOpen] = useState(false);
  const [secConfirmRecord, setSecConfirmRecord] = useState(null);
  const [secConfirmSaving, setSecConfirmSaving] = useState(false);

  // =========================================================================
  // 2. QUESTIONS STATES & LOGIC
  // =========================================================================
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [qModalOpen, setQModalOpen] = useState(false);
  const [qEditId, setQEditId] = useState(null);
  const [qForm, setQForm] = useState({ question_text: '', section_id: '', status: 'Active' });
  const [qFormError, setQFormError] = useState('');

  const [qConfirmModalOpen, setQConfirmModalOpen] = useState(false);
  const [qConfirmRecord, setQConfirmRecord] = useState(null);
  const [qConfirmSaving, setQConfirmSaving] = useState(false);

  // Fetch data
  const fetchData = async () => {
    setSectionsLoading(true);
    setQuestionsLoading(true);
    try {
      const [secRes, qRes] = await Promise.all([
        axios.get('/api/health-declaration-sections'),
        axios.get('/api/health-declaration-questions'),
      ]);
      setSections(secRes.data);
      setQuestions(qRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch health declaration setup data.');
    } finally {
      setSectionsLoading(false);
      setQuestionsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Active sections list for question dropdown
  const activeSections = sections.filter(s => s.status === 'Active');

  // -------------------------------------------------------------------------
  // SECTION HANDLERS
  // -------------------------------------------------------------------------
  const handleSaveSection = async (e) => {
    e.preventDefault();
    setSecFormError('');
    if (!secForm.title.trim()) {
      setSecFormError('Section Title is required.');
      return;
    }

    try {
      if (secEditId) {
        await axios.put(`/api/health-declaration-sections/${secEditId}`, secForm);
        setSuccess('Declaration section updated successfully!');
      } else {
        await axios.post('/api/health-declaration-sections', secForm);
        setSuccess('Declaration section added successfully!');
      }
      setSecForm({ title: '', status: 'Active' });
      setSecModalOpen(false);
      setSecEditId(null);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errMsg = err.response?.data?.errors?.title?.[0] || 'An error occurred while saving section.';
      setSecFormError(errMsg);
    }
  };

  const handleEditSecClick = (sec) => {
    setSecEditId(sec.id);
    setSecForm({
      title: sec.title,
      status: sec.status || 'Active',
    });
    setSecFormError('');
    setSecModalOpen(true);
  };

  const handleToggleSecStatus = (sec) => {
    setSecConfirmRecord(sec);
    setSecConfirmModalOpen(true);
  };

  const confirmToggleSecStatus = async () => {
    if (!secConfirmRecord) return;
    setSecConfirmSaving(true);
    const nextStatus = secConfirmRecord.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await axios.put(`/api/health-declaration-sections/${secConfirmRecord.id}`, {
        title: secConfirmRecord.title,
        status: nextStatus,
      });
      setSecConfirmModalOpen(false);
      setSuccess(`Section "${secConfirmRecord.title}" is now ${nextStatus}.`);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to toggle section status.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSecConfirmSaving(false);
      setSecConfirmRecord(null);
    }
  };

  const openAddSecModal = () => {
    setSecEditId(null);
    setSecForm({ title: '', status: 'Active' });
    setSecFormError('');
    setSecModalOpen(true);
  };

  // -------------------------------------------------------------------------
  // QUESTION HANDLERS
  // -------------------------------------------------------------------------
  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    setQFormError('');
    if (!qForm.question_text.trim()) {
      setQFormError('Question Text is required.');
      return;
    }
    if (!qForm.section_id) {
      setQFormError('Section is required.');
      return;
    }

    try {
      if (qEditId) {
        await axios.put(`/api/health-declaration-questions/${qEditId}`, qForm);
        setSuccess('Declaration question updated successfully!');
      } else {
        await axios.post('/api/health-declaration-questions', qForm);
        setSuccess('Declaration question added successfully!');
      }
      setQForm({ question_text: '', section_id: '', status: 'Active' });
      setQModalOpen(false);
      setQEditId(null);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errMsg = err.response?.data?.errors?.question_text?.[0] || 
                     err.response?.data?.errors?.section_id?.[0] || 
                     'An error occurred while saving question.';
      setQFormError(errMsg);
    }
  };

  const handleEditQClick = (qItem) => {
    setQEditId(qItem.id);
    setQForm({
      question_text: qItem.question_text,
      section_id: qItem.section_id ? String(qItem.section_id) : '',
      status: qItem.status || 'Active',
    });
    setQFormError('');
    setQModalOpen(true);
  };

  const handleToggleQStatus = (qItem) => {
    setQConfirmRecord(qItem);
    setQConfirmModalOpen(true);
  };

  const confirmToggleQStatus = async () => {
    if (!qConfirmRecord) return;
    setQConfirmSaving(true);
    const nextStatus = qConfirmRecord.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await axios.put(`/api/health-declaration-questions/${qConfirmRecord.id}`, {
        question_text: qConfirmRecord.question_text,
        section_id: qConfirmRecord.section_id,
        status: nextStatus,
      });
      setQConfirmModalOpen(false);
      setSuccess(`Question "${qConfirmRecord.question_text}" is now ${nextStatus}.`);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to toggle question status.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setQConfirmSaving(false);
      setQConfirmRecord(null);
    }
  };

  const openAddQModal = () => {
    setQEditId(null);
    const defaultSectionId = activeSections.length > 0 ? String(activeSections[0].id) : '';
    setQForm({ question_text: '', section_id: defaultSectionId, status: 'Active' });
    setQFormError('');
    setQModalOpen(true);
  };

  // Filtered lists
  const query = searchQuery.toLowerCase();
  const filteredSections = sections.filter(s => {
    return s.title.toLowerCase().includes(query);
  });

  const filteredQuestions = questions.filter(qItem => {
    const qMatch = qItem.question_text.toLowerCase().includes(query);
    const secMatch = (qItem.section?.title || '').toLowerCase().includes(query);
    return qMatch || secMatch;
  });

  return (
    <PageLayout>
      <Head title="Health Declaration Master" />

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
              <HeartPulse size={28} color="var(--color-primary)" />
              Health Declaration Setup
            </h1>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Manage health declaration sections and staff screening questions.
            </p>
          </div>

          <Button 
            variant="primary" 
            onClick={activeTab === 'sections' ? openAddSecModal : openAddQModal}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            <span>{activeTab === 'sections' ? 'Add Section' : 'Add Question'}</span>
          </Button>
        </div>

        {/* Global Toast Alerts */}
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

        {/* Navigation Tabs */}
        <div style={styles.tabContainer}>
          <button
            style={{
              ...styles.tabButton,
              ...(activeTab === 'sections' ? styles.activeTabButton : {}),
            }}
            onClick={() => switchTab('sections')}
          >
            Declaration Sections ({sections.length})
          </button>
          <button
            style={{
              ...styles.tabButton,
              ...(activeTab === 'questions' ? styles.activeTabButton : {}),
            }}
            onClick={() => switchTab('questions')}
          >
            Declaration Questions ({questions.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="search-bar-wrapper">
          <Search size={16} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder={
              activeTab === 'sections'
                ? "Search sections by title..."
                : "Search questions by question text or section..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-bar-input"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="search-clear-btn">
              <X size={14} />
            </button>
          )}
        </div>

        {/* TAB 1: DECLARATION SECTIONS */}
        {activeTab === 'sections' && (
          <Card padding="0">
            {sectionsLoading ? (
              <div style={styles.loadingState}>Loading declaration sections...</div>
            ) : filteredSections.length === 0 ? (
              <div style={styles.emptyState}>
                {searchQuery 
                  ? 'No declaration sections match your search.' 
                  : 'No declaration sections created yet. Click "Add Section" to create one.'}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th >Section Title</th>
                      <th >Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSections.map((sec) => {
                      const isActive = sec.status === 'Active';
                      return (
                        <tr key={sec.id} style={styles.tr}>
                          <td style={styles.tdBold}>{sec.title}</td>
                          <td >
                            <span style={{
                              ...styles.statusBadge,
                              backgroundColor: isActive ? '#E6F4EA' : '#F3F4F6',
                              color: isActive ? '#137333' : '#5F6368',
                            }}>
                              {sec.status || 'Active'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={styles.actionCell}>
                              <button 
                                onClick={() => handleEditSecClick(sec)} 
                                style={styles.actionBtn}
                                title="Edit Section"
                              >
                                <Pencil size={15} color="var(--color-primary)" />
                              </button>

                              <Toggle 
                                checked={isActive}
                                onChange={() => handleToggleSecStatus(sec)}
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
        )}

        {/* TAB 2: DECLARATION QUESTIONS */}
        {activeTab === 'questions' && (
          <Card padding="0">
            {questionsLoading ? (
              <div style={styles.loadingState}>Loading declaration questions...</div>
            ) : filteredQuestions.length === 0 ? (
              <div style={styles.emptyState}>
                {searchQuery 
                  ? 'No declaration questions match your search.' 
                  : sections.length === 0 
                    ? 'No declaration questions created yet. Create a section first, then add questions.'
                    : 'No declaration questions created yet. Click "Add Question" to create one.'}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th >Question Text</th>
                      <th >Section</th>
                      <th >Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuestions.map((qItem) => {
                      const isActive = qItem.status === 'Active';
                      const sectionTitle = qItem.section?.title || '-';

                      return (
                        <tr key={qItem.id} style={styles.tr}>
                          <td style={styles.tdBold}>{qItem.question_text}</td>
                          <td >
                            <span style={styles.secBadge}>
                              {sectionTitle}
                            </span>
                          </td>
                          <td >
                            <span style={{
                              ...styles.statusBadge,
                              backgroundColor: isActive ? '#E6F4EA' : '#F3F4F6',
                              color: isActive ? '#137333' : '#5F6368',
                            }}>
                              {qItem.status || 'Active'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={styles.actionCell}>
                              <button 
                                onClick={() => handleEditQClick(qItem)} 
                                style={styles.actionBtn}
                                title="Edit Question"
                              >
                                <Pencil size={15} color="var(--color-primary)" />
                              </button>

                              <Toggle 
                                checked={isActive}
                                onChange={() => handleToggleQStatus(qItem)}
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
        )}

        {/* ========================================================================= */}
        {/* ADD / EDIT SECTION MODAL */}
        {/* ========================================================================= */}
        <Modal
          isOpen={secModalOpen}
          onClose={() => setSecModalOpen(false)}
          title={secEditId ? "Edit Section" : "Add New Section"}
        >
          <form onSubmit={handleSaveSection} style={styles.form}>
            {secFormError && (
              <div style={styles.formErrorMsg}>
                <ShieldAlert size={16} />
                <span>{secFormError}</span>
              </div>
            )}

            {/* Section Title */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Section Title *</label>
              <input
                type="text"
                placeholder="e.g. Declaration, Symptoms, Illness History, Return to Work"
                value={secForm.title}
                onChange={(e) => setSecForm({ ...secForm, title: e.target.value })}
                style={styles.input}
                required
              />
            </div>

            {/* Active Toggle */}
            <div style={styles.toggleRow}>
              <div>
                <div style={styles.toggleLabel}>Active Status</div>
                <div style={styles.toggleDesc}>Inactive sections will be hidden from fitness-to-work declarations.</div>
              </div>
              <Toggle
                checked={secForm.status === 'Active'}
                onChange={(val) => setSecForm({ ...secForm, status: val ? 'Active' : 'Inactive' })}
              />
            </div>

            <div style={styles.modalActions}>
              <Button type="button" variant="secondary" onClick={() => setSecModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {secEditId ? 'Update Section' : 'Save Section'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* ========================================================================= */}
        {/* ADD / EDIT QUESTION MODAL */}
        {/* ========================================================================= */}
        <Modal
          isOpen={qModalOpen}
          onClose={() => setQModalOpen(false)}
          title={qEditId ? "Edit Question" : "Add New Question"}
        >
          <form onSubmit={handleSaveQuestion} style={styles.form}>
            {qFormError && (
              <div style={styles.formErrorMsg}>
                <ShieldAlert size={16} />
                <span>{qFormError}</span>
              </div>
            )}

            {/* Question Text */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Question Text *</label>
              <textarea
                placeholder="e.g. Have you had vomiting or diarrhoea in the last 24 hours?"
                value={qForm.question_text}
                onChange={(e) => setQForm({ ...qForm, question_text: e.target.value })}
                style={styles.textarea}
                rows={3}
                required
              />
            </div>

            {/* Section Dropdown */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Section *</label>
              <select
                value={qForm.section_id}
                onChange={(e) => setQForm({ ...qForm, section_id: e.target.value })}
                style={styles.select}
                required
              >
                <option value="">Select Declaration Section...</option>
                {activeSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.title}
                  </option>
                ))}
              </select>
              {activeSections.length === 0 && (
                <div style={{ fontSize: '11px', color: '#D97706', marginTop: '2px' }}>
                  No active sections available. Please create a section first.
                </div>
              )}
            </div>

            {/* Active Toggle */}
            <div style={styles.toggleRow}>
              <div>
                <div style={styles.toggleLabel}>Active Status</div>
                <div style={styles.toggleDesc}>Inactive questions will not appear in active health declarations.</div>
              </div>
              <Toggle
                checked={qForm.status === 'Active'}
                onChange={(val) => setQForm({ ...qForm, status: val ? 'Active' : 'Inactive' })}
              />
            </div>

            <div style={styles.modalActions}>
              <Button type="button" variant="secondary" onClick={() => setQModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={activeSections.length === 0}>
                {qEditId ? 'Update Question' : 'Save Question'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* ========================================================================= */}
        {/* CONFIRMATION MODAL - SECTION STATUS TOGGLE */}
        {/* ========================================================================= */}
        <Modal
          isOpen={secConfirmModalOpen}
          onClose={() => setSecConfirmModalOpen(false)}
          title="Change Section Status"
        >
          {secConfirmRecord && (
            <div>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
                Are you sure you want to change the status of section <strong>"{secConfirmRecord.title}"</strong> to{' '}
                <strong style={{ color: secConfirmRecord.status === 'Active' ? '#D97706' : 'var(--color-primary)' }}>
                  {secConfirmRecord.status === 'Active' ? 'Inactive' : 'Active'}
                </strong>?
              </p>
              <div style={styles.modalActions}>
                <Button variant="secondary" onClick={() => setSecConfirmModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={confirmToggleSecStatus}
                  disabled={secConfirmSaving}
                >
                  {secConfirmSaving ? 'Saving...' : 'Confirm Change'}
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* ========================================================================= */}
        {/* CONFIRMATION MODAL - QUESTION STATUS TOGGLE */}
        {/* ========================================================================= */}
        <Modal
          isOpen={qConfirmModalOpen}
          onClose={() => setQConfirmModalOpen(false)}
          title="Change Question Status"
        >
          {qConfirmRecord && (
            <div>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
                Are you sure you want to change the status of this question to{' '}
                <strong style={{ color: qConfirmRecord.status === 'Active' ? '#D97706' : 'var(--color-primary)' }}>
                  {qConfirmRecord.status === 'Active' ? 'Inactive' : 'Active'}
                </strong>?
              </p>
              <div style={styles.modalActions}>
                <Button variant="secondary" onClick={() => setQConfirmModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={confirmToggleQStatus}
                  disabled={qConfirmSaving}
                >
                  {qConfirmSaving ? 'Saving...' : 'Confirm Change'}
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
  tabContainer: {
    display: 'flex',
    gap: '8px',
    borderBottom: '2px solid var(--color-border-light)',
    marginBottom: '20px',
  },
  tabButton: {
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    marginBottom: '-2px',
    cursor: 'pointer',
    transition: 'all 150ms ease',
  },
  activeTabButton: {
    color: 'var(--color-primary)',
    borderBottomColor: 'var(--color-primary)',
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
  secBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '6px',
    backgroundColor: '#FEF3C7',
    color: '#92400E',
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

export default HealthDeclarationPage;
