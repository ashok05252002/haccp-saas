import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, Clock, X, GraduationCap } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import SignaturePad from '../components/common/SignaturePad';
import axios from 'axios';

const StaffTrainingTaskPage = ({ staffId }) => {
  const [staff, setStaff] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [completedLogs, setCompletedLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Completion Form
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingLogId, setEditingLogId] = useState(null);
  const [trainerName, setTrainerName] = useState('');
  const [notes, setNotes] = useState('');
  const [understandingConfirmed, setUnderstandingConfirmed] = useState(true);
  const [signedByStaffName, setSignedByStaffName] = useState('');
  const [signature, setSignature] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const fetchData = async () => {
    try {
      setLoading(true);

      const [staffRes, tasksRes, logsRes] = await Promise.all([
        axios.get('/api/tenant-users'),
        axios.get('/api/training-tasks'),
        axios.get('/api/staff-training-logs'),
      ]);

      const foundStaff = (staffRes.data || []).find(s => String(s.id) === String(staffId));
      setStaff(foundStaff || { id: staffId, name: 'Staff Member', role: 'Staff' });
      if (foundStaff) setSignedByStaffName(foundStaff.name);

      const rawTasks = Array.isArray(tasksRes.data) ? tasksRes.data : (tasksRes.data?.tasks || []);
      const allTasks = rawTasks.filter(t => t.status === 'Active' || !t.status);
      setTasks(allTasks);
      setCompletedLogs(logsRes.data || []);
    } catch (err) {
      console.error('Failed to load staff task data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [staffId]);

  const assignedTasks = useMemo(() => {
    if (!staff) return [];
    return tasks.filter(t => {
      const appliesTo = t.applies_to || t.appliesTo || 'All Staff';
      if (appliesTo === 'All Staff') return true;
      if (appliesTo === 'By Position') {
        const staffRole = staff.role || staff.position || '';
        const taskRole = t.position || '';
        return staffRole.toLowerCase() === taskRole.toLowerCase();
      }
      if (appliesTo === 'Specific Staff') {
        const staffNameStr = staff.name || '';
        const taskStaff = t.staff_member || t.staffMember || '';
        return staffNameStr.toLowerCase() === taskStaff.toLowerCase();
      }
      return true;
    });
  }, [staff, tasks]);

  const getTaskLog = (taskTitle) => {
    if (!staff) return null;
    return completedLogs.find(
      l => (l.staff_name || '').toLowerCase() === (staff.name || '').toLowerCase() && (l.task_title || '').toLowerCase() === (taskTitle || '').toLowerCase()
    );
  };

  const isTaskCompleted = (taskTitle) => {
    return Boolean(getTaskLog(taskTitle));
  };

  const handleOpenModal = (task) => {
    setSelectedTask(task);
    setEditingLogId(null);
    setTrainerName('');
    setNotes('');
    setUnderstandingConfirmed(true);
    setSignature('');
    setErrors({});
    setModalOpen(true);
  };

  const handleOpenEditModal = (task, existingLog) => {
    setSelectedTask(task);
    setEditingLogId(existingLog.id);
    setTrainerName(existingLog.trainer_name || '');
    setNotes(existingLog.notes || '');
    setUnderstandingConfirmed(existingLog.understanding_confirmed !== undefined ? Boolean(existingLog.understanding_confirmed) : true);
    setSignature(existingLog.signature || '');
    setErrors({});
    setModalOpen(true);
  };

  const handleSaveCompletion = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!trainerName.trim()) newErrors.trainerName = 'Trainer / Supervisor name is required.';
    if (!signature) newErrors.signature = 'Staff signature is required.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        log_date: today,
        log_time: nowTime,
        staff_name: staff.name,
        staff_position: staff.role || staff.position || 'Staff',
        task_id: selectedTask.id || null,
        task_title: selectedTask.title,
        task_description: selectedTask.description || '',
        trainer_name: trainerName.trim(),
        understanding_confirmed: understandingConfirmed,
        notes: notes,
        signed_by_staff_name: signedByStaffName || staff.name,
        signature: signature,
      };

      if (editingLogId) {
        await axios.put(`/api/staff-training-logs/${editingLogId}`, payload);
      } else {
        await axios.post('/api/staff-training-logs', payload);
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to complete training task', err);
      alert(err.response?.data?.message || 'Failed to complete training task.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <Head title={`Training Tasks - ${staff?.name || ''}`} />

      <div>
        <button onClick={() => router.visit('/haccp-logs/staff-training')} className="back-btn" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} />
          <span>Back to Staff Training List</span>
        </button>

        {/* Staff Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'var(--color-primary-pale)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '18px' }}>
              {staff?.name?.charAt(0) || 'S'}
            </div>
            <div>
              <h1 className="page-title" style={{ fontSize: '22px' }}>Staff Name: {staff?.name}</h1>
              <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Position: {staff?.role || staff?.position || 'Staff Member'}
              </p>
            </div>
          </div>
        </div>

        {/* Tasks Card */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading training tasks...</div>
          ) : assignedTasks.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No training tasks assigned to this staff member. You can configure tasks in <strong>Manager Hub → Training Tasks</strong>.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Training / Hygiene Task</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {assignedTasks.map(task => {
                  const completed = isTaskCompleted(task.title);

                  return (
                    <tr key={task.id}>
                      <td>
                        <strong style={{ color: 'var(--color-text-primary)' }}>{task.title}</strong>
                        {task.description && (
                          <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                            {task.description}
                          </div>
                        )}
                      </td>
                      <td>
                        {completed ? (
                          <span className="badge" style={{ backgroundColor: '#D1FAE5', color: '#047857', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14} /> Completed
                          </span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#B45309', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={14} /> Pending
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {completed ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                const log = getTaskLog(task.title);
                                if (log) router.visit(`/haccp-logs/staff-training/view/${log.id}`);
                              }}
                            >
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const log = getTaskLog(task.title);
                                if (log) handleOpenEditModal(task, log);
                              }}
                            >
                              Edit
                            </Button>
                          </div>
                        ) : (
                          <Button variant="primary" size="sm" onClick={() => handleOpenModal(task)}>
                            Start / Complete
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>

        {/* Task Completion Modal */}
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Task Completion">
          <form onSubmit={handleSaveCompletion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Staff Member</label>
                <input className="form-input" value={staff?.name || ''} disabled style={{ backgroundColor: '#F3F4F6' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Position</label>
                <input className="form-input" value={staff?.role || staff?.position || 'Staff'} disabled style={{ backgroundColor: '#F3F4F6' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Task / Training Topic</label>
              <input className="form-input" value={selectedTask?.title || ''} disabled style={{ backgroundColor: '#F3F4F6' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Completion Date</label>
                <input className="form-input" value={today} disabled style={{ backgroundColor: '#F3F4F6' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Trainer / Supervisor Name *</label>
                <input
                  className="form-input"
                  placeholder="e.g. Head Chef"
                  value={trainerName}
                  onChange={e => setTrainerName(e.target.value)}
                  required
                />
                {errors.trainerName && <span style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{errors.trainerName}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes / Instructions Given</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Optional notes or training details..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Understanding Confirmed?</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setUnderstandingConfirmed(true)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    border: `1px solid ${understandingConfirmed ? 'var(--color-primary)' : 'var(--color-border-light)'}`,
                    backgroundColor: understandingConfirmed ? 'var(--color-primary)' : '#fff',
                    color: understandingConfirmed ? '#fff' : 'var(--color-text-secondary)',
                  }}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setUnderstandingConfirmed(false)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    border: `1px solid ${!understandingConfirmed ? '#DC2626' : 'var(--color-border-light)'}`,
                    backgroundColor: !understandingConfirmed ? '#DC2626' : '#fff',
                    color: !understandingConfirmed ? '#fff' : 'var(--color-text-secondary)',
                  }}
                >
                  No
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Staff Signature *</label>
              <SignaturePad value={signature} onChange={setSignature} />
              {errors.signature && <span style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{errors.signature}</span>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Saving Task...' : 'Complete Task'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PageLayout>
  );
};

export default StaffTrainingTaskPage;
