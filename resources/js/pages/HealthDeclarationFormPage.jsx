import React, { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import { HeartPulse, ArrowLeft, Save, AlertCircle, CheckCircle, XCircle, ShieldAlert } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SignatureCanvas from 'react-signature-canvas';
import axios from 'axios';

const getTodayDateString = () => new Date().toISOString().split('T')[0];
const getCurrentTimeString = () => new Date().toTimeString().slice(0, 5);

const HealthDeclarationFormPage = () => {
  const employeeSigCanvas = useRef(null);
  const managerSigCanvas = useRef(null);

  const [sections, setSections] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [form, setForm] = useState({
    log_date: getTodayDateString(),
    log_time: getCurrentTimeString(),
    staff_name: '',
    comment: '',
    signature: '',
    manager_signature: ''
  });

  // Map of question_id -> { answer: 'Yes'|'No', notes: '' }
  const [responses, setResponses] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [depRes, staffRes] = await Promise.all([
          axios.get('/api/health-declaration-logs/dependencies'),
          axios.get('/api/tenant-users')
        ]);

        const secList = depRes.data?.sections || [];
        const staffList = (staffRes.data || []).filter(s => s.status !== 'Inactive');

        setSections(secList);
        setStaffMembers(staffList);

        // Pre-populate initial responses with 'No' default for questions
        const initialMap = {};
        secList.forEach(sec => {
          (sec.questions || []).forEach(q => {
            initialMap[q.id] = { answer: 'No', notes: '' };
          });
        });
        setResponses(initialMap);
      } catch (err) {
        console.error('Failed to load health declaration dependencies', err);
        setFormError('Failed to load health declaration setup data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleResponseChange = (qId, field, val) => {
    setResponses(prev => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        [field]: val
      }
    }));
  };

  const clearEmployeeSignature = () => {
    if (employeeSigCanvas.current) {
      employeeSigCanvas.current.clear();
      setForm(prev => ({ ...prev, signature: '' }));
    }
  };

  const handleEmployeeSignatureEnd = () => {
    if (employeeSigCanvas.current && !employeeSigCanvas.current.isEmpty()) {
      const dataUrl = employeeSigCanvas.current.getCanvas
        ? employeeSigCanvas.current.getCanvas().toDataURL('image/png')
        : employeeSigCanvas.current.toDataURL('image/png');
      setForm(prev => ({
        ...prev,
        signature: dataUrl
      }));
    }
  };

  const clearManagerSignature = () => {
    if (managerSigCanvas.current) {
      managerSigCanvas.current.clear();
      setForm(prev => ({ ...prev, manager_signature: '' }));
    }
  };

  const handleManagerSignatureEnd = () => {
    if (managerSigCanvas.current && !managerSigCanvas.current.isEmpty()) {
      const dataUrl = managerSigCanvas.current.getCanvas
        ? managerSigCanvas.current.getCanvas().toDataURL('image/png')
        : managerSigCanvas.current.toDataURL('image/png');
      setForm(prev => ({
        ...prev,
        manager_signature: dataUrl
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!form.staff_name.trim()) {
      setFormError('Please select or enter Staff Member Name.');
      return;
    }

    // Build results array
    const resultsArray = Object.keys(responses).map(qId => ({
      question_id: isNaN(Number(qId)) ? null : Number(qId),
      answer: responses[qId].answer,
      notes: responses[qId].notes
    })).filter(r => r.question_id !== null);

    setSubmitting(true);
    try {
      await axios.post('/api/health-declaration-logs', {
        ...form,
        results: resultsArray
      });
      router.visit('/haccp-logs/health-declaration');
    } catch (err) {
      console.error('Failed to submit health declaration log', err);
      setFormError(err.response?.data?.message || 'Failed to save health declaration log.');
    } finally {
      setSubmitting(false);
    }
  };

  // Evaluate live symptom status
  const hasFlaggedSymptoms = Object.values(responses).some(r => r.answer === 'Yes');

  return (
    <PageLayout>
      <Head title="Record Staff Health Declaration" />

      <div>
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => router.visit('/haccp-logs/health-declaration')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: 0,
              marginBottom: '8px'
            }}
          >
            <ArrowLeft size={18} />
            Back to Health Declaration Logs
          </button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <HeartPulse size={28} color="var(--color-primary)" />
            <span>Record Staff Health Declaration</span>
          </h1>
          <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px', margin: 0 }}>
            Daily pre-shift health screening and fit-for-duty certification checklist.
          </p>
        </div>

        {loading ? (
          <Card>
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              Loading health declaration form...
            </div>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {formError && (
              <div style={{
                padding: '14px 18px',
                backgroundColor: '#FEE2E2',
                color: '#B91C1C',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                border: '1px solid #FCA5A5'
              }}>
                <AlertCircle size={20} color="#B91C1C" />
                <span>{formError}</span>
              </div>
            )}

            {/* Section 1: Staff Info */}
            <Card>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '10px' }}>
                1. Staff & Shift Information
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.log_date}
                    onChange={e => setForm({ ...form, log_date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Time *</label>
                  <input
                    type="time"
                    className="form-input"
                    value={form.log_time}
                    onChange={e => setForm({ ...form, log_time: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Staff Member Name *</label>
                  {staffMembers.length > 0 ? (
                    <select
                      className="form-input"
                      value={form.staff_name}
                      onChange={e => setForm({ ...form, staff_name: e.target.value })}
                      required
                    >
                      <option value="">-- Select Staff Member --</option>
                      {staffMembers.map(s => (
                        <option key={s.id} value={s.name}>
                          {s.name} {s.assigned_role ? `(${s.assigned_role.name})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. John Doe"
                      value={form.staff_name}
                      onChange={e => setForm({ ...form, staff_name: e.target.value })}
                      required
                    />
                  )}
                </div>
              </div>
            </Card>

            {/* Live Health Evaluation Banner */}
            {hasFlaggedSymptoms ? (
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                color: '#991B1B'
              }}>
                <ShieldAlert size={28} color="#DC2626" />
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                    Health Symptoms Flagged — Action Required
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
                    One or more health symptoms/exposures have been answered as <strong>YES</strong>. Please consult your hygiene manager before handling food.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{
                backgroundColor: '#F0FDF4',
                border: '1px solid #A7F3D0',
                borderRadius: '12px',
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#065F46'
              }}>
                <CheckCircle size={22} color="#059669" />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>
                  Pre-screening Status: Clear & Fit for Food Handling Work
                </span>
              </div>
            )}

            {/* Section 2: Questionnaire Breakdown */}
            {sections.length === 0 ? (
              <Card style={{ padding: '40px', textAlign: 'center' }}>
                <HeartPulse size={48} color="var(--color-text-muted)" style={{ marginBottom: '12px', opacity: 0.5 }} />
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                  No Active Health Declaration Questions Configured
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
                  Please set up your health declaration sections and screening questions in Manager Hub first.
                </p>
                <Button type="button" variant="primary" onClick={() => router.visit('/manager-hub/health-declaration')}>
                  Go to Health Declaration Setup
                </Button>
              </Card>
            ) : (
              sections.map((sec, sIdx) => (
                <Card key={sec.id || sIdx}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '10px' }}>
                    {sec.title}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {(sec.questions || []).map((q, qIdx) => {
                      const currResp = responses[q.id] || { answer: 'No', notes: '' };
                      const isYes = currResp.answer === 'Yes';

                      return (
                        <div
                          key={q.id || qIdx}
                          style={{
                            backgroundColor: isYes ? '#FEF2F2' : '#F9FAFB',
                            padding: '16px',
                            borderRadius: '10px',
                            border: isYes ? '1px solid #FCA5A5' : '1px solid var(--color-border-light)',
                            transition: 'all 200ms ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ flex: 1, minWidth: '240px' }}>
                              <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)', display: 'block', marginBottom: '4px' }}>
                                {qIdx + 1}. {q.question_text}
                              </strong>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button
                                type="button"
                                onClick={() => handleResponseChange(q.id, 'answer', 'No')}
                                style={{
                                  padding: '8px 16px',
                                  borderRadius: '8px',
                                  border: '1px solid',
                                  borderColor: !isYes ? '#059669' : '#D1D5DB',
                                  backgroundColor: !isYes ? '#ECFDF5' : '#FFFFFF',
                                  color: !isYes ? '#059669' : '#4B5563',
                                  fontWeight: 700,
                                  fontSize: '13px',
                                  cursor: 'pointer'
                                }}
                              >
                                No (Clear)
                              </button>

                              <button
                                type="button"
                                onClick={() => handleResponseChange(q.id, 'answer', 'Yes')}
                                style={{
                                  padding: '8px 16px',
                                  borderRadius: '8px',
                                  border: '1px solid',
                                  borderColor: isYes ? '#DC2626' : '#D1D5DB',
                                  backgroundColor: isYes ? '#FEF2F2' : '#FFFFFF',
                                  color: isYes ? '#DC2626' : '#4B5563',
                                  fontWeight: 700,
                                  fontSize: '13px',
                                  cursor: 'pointer'
                                }}
                              >
                                Yes (Flagged)
                              </button>
                            </div>
                          </div>

                          {/* Dedicated Remarks / Notes column field for EACH question */}
                          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--color-border-light)' }}>
                            <label className="form-label" style={{ fontSize: '12px', color: isYes ? '#991B1B' : 'var(--color-text-secondary)', marginBottom: '4px' }}>
                              Remarks / Notes:
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Enter remarks or notes for this question..."
                              value={currResp.notes || ''}
                              onChange={e => handleResponseChange(q.id, 'notes', e.target.value)}
                              style={{ borderColor: isYes ? '#FCA5A5' : 'var(--color-border-light)' }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))
            )}

            {/* Section 3: Signatures & Remarks */}
            <Card>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '10px' }}>
                3. Signatures & Remarks
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">General Comments / Remarks</label>
                  <textarea
                    className="form-input"
                    rows="2"
                    placeholder="Optional general remarks..."
                    value={form.comment}
                    onChange={e => setForm({ ...form, comment: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {/* Employee Signature Canvas */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>Employee Signature *</label>
                      <button
                        type="button"
                        onClick={clearEmployeeSignature}
                        style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Clear
                      </button>
                    </div>
                    <div style={{ border: '1px solid var(--color-border-light)', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#FAFAFA' }}>
                      <SignatureCanvas
                        ref={employeeSigCanvas}
                        canvasProps={{ width: 400, height: 130, className: 'sigCanvas', style: { width: '100%', height: '130px' } }}
                        onEnd={handleEmployeeSignatureEnd}
                      />
                    </div>
                  </div>

                  {/* Manager Signature Canvas */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>Manager Signature *</label>
                      <button
                        type="button"
                        onClick={clearManagerSignature}
                        style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Clear
                      </button>
                    </div>
                    <div style={{ border: '1px solid var(--color-border-light)', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#FAFAFA' }}>
                      <SignatureCanvas
                        ref={managerSigCanvas}
                        canvasProps={{ width: 400, height: 130, className: 'sigCanvas', style: { width: '100%', height: '130px' } }}
                        onEnd={handleManagerSignatureEnd}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.visit('/haccp-logs/health-declaration')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={Save}
                disabled={submitting}
              >
                {submitting ? 'Saving Declaration...' : 'Submit Health Declaration'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </PageLayout>
  );
};

export default HealthDeclarationFormPage;
