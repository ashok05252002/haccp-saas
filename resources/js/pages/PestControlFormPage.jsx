import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Info, CheckCircle, AlertTriangle, Check, X } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SignaturePad from '../components/common/SignaturePad';
import axios from 'axios';

const PestControlFormPage = () => {
  const [staffList, setStaffList] = useState([]);
  const [masterQuestions, setMasterQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  // Inspection Details
  const [logDate, setLogDate] = useState(today);
  const [logTime, setLogTime] = useState(nowTime);
  const [staffName, setStaffName] = useState('');

  // Master Data Checklist Answers: { [qId]: { answer: true|false, note: '' } }
  const [checklistAnswers, setChecklistAnswers] = useState({});

  // Premises Free of Pest Activity Toggle (Default: YES / Safe)
  const [isPestFree, setIsPestFree] = useState(true);
  const [remarks, setRemarks] = useState('');

  // Contractor Visit Details (Optional)
  const [contractorName, setContractorName] = useState('');
  const [visitDate, setVisitDate] = useState(today);
  const [reportRefNumber, setReportRefNumber] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [nextVisitDueDate, setNextVisitDueDate] = useState('');

  // General Comments & Verification
  const [generalComments, setGeneralComments] = useState('');
  const [signedByStaffName, setSignedByStaffName] = useState('');
  const [signature, setSignature] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Fetch Staff List
    axios.get('/api/tenant-users').then(res => {
      setStaffList(res.data || []);
      if (res.data && res.data.length > 0) {
        setStaffName(res.data[0].name);
        setSignedByStaffName(res.data[0].name);
      }
    }).catch(() => {});

    // Fetch Pest Control Setup Questions from Master Data
    axios.get('/api/pest-control-questions').then(res => {
      const activeQs = (res.data || []).filter(q => q.status === 'Active' || !q.status);
      setMasterQuestions(activeQs);

      const initialAnswers = {};
      activeQs.forEach(q => {
        initialAnswers[q.id] = { answer: true, note: '' };
      });
      setChecklistAnswers(initialAnswers);
    }).catch(err => {
      console.error('Failed to load pest control questions', err);
    }).finally(() => {
      setLoadingQuestions(false);
    });
  }, []);

  const handleChecklistToggle = (qId, answer) => {
    setChecklistAnswers(prev => ({
      ...prev,
      [qId]: { ...prev[qId], answer, note: answer ? '' : (prev[qId]?.note || '') }
    }));
  };

  const handleChecklistNoteChange = (qId, note) => {
    setChecklistAnswers(prev => ({
      ...prev,
      [qId]: { ...prev[qId], note }
    }));
  };

  // Evaluation Status: Passed if all questions Yes and Premises Pest Free
  const hasFailedChecklist = Object.values(checklistAnswers).some(a => a.answer === false);
  const passed = !hasFailedChecklist && isPestFree;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!staffName) newErrors.staffName = 'Staff member is required.';
    if (!signedByStaffName) newErrors.signedBy = 'Signed by staff member is required.';
    if (!signature) newErrors.signature = 'Signature is required.';

    // Check notes for any No answers in master questions
    let failedNoteMissing = false;
    Object.entries(checklistAnswers).forEach(([qId, data]) => {
      if (data.answer === false && !data.note.trim()) {
        failedNoteMissing = true;
      }
    });
    if (failedNoteMissing) {
      newErrors.checklist = 'Please add follow-up notes for any questions marked No.';
    }

    if (!isPestFree && !remarks.trim()) {
      newErrors.remarks = 'Remarks / Action Notes are required when pest activity is observed.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const checklistData = masterQuestions.map(q => ({
        id: q.id,
        text: q.question_text || q.text,
        answer: checklistAnswers[q.id]?.answer ?? true,
        note: checklistAnswers[q.id]?.note || '',
      }));

      await axios.post('/api/pest-control-logs', {
        log_date: logDate,
        log_time: logTime,
        staff_name: staffName,
        check_type: 'General Check',
        checklist_answers: checklistData,
        pest_activity_observed: !isPestFree,
        action_notes: !isPestFree ? remarks : '',
        contractor_name: contractorName || null,
        visit_date: visitDate || null,
        report_ref_number: reportRefNumber || null,
        next_visit_due_date: nextVisitDueDate || null,
        recommendations: recommendations || null,
        general_comments: generalComments,
        signed_by_staff_name: signedByStaffName,
        signature: signature,
      });

      router.visit('/haccp-logs/pest-control');
    } catch (err) {
      console.error('Failed to submit pest control log', err);
      alert(err.response?.data?.message || 'Failed to submit pest control log.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <Head title="Log Pest Control Check" />

      <div>
        <button onClick={() => router.visit('/haccp-logs/pest-control')} className="back-btn" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} />
          <span>Back to Pest Control Logs</span>
        </button>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <h1 className="page-title">Pest Prevention & Activity Log</h1>
            <span className="badge badge-prp">PRP</span>
            <span className="badge badge-standard">EC 852/2004 Annex II</span>
          </div>
          <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Record pest prevention checks, pest activity observations, and corrective actions.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Guidance Info Banner */}
          <div style={{ display: 'flex', gap: '12px', padding: '14px 18px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', color: '#1E40AF', fontSize: '13px', lineHeight: '1.6' }}>
            <Info size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#2563EB' }} />
            <div>
              <strong>Pest Control Guidance</strong>
              <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px' }}>
                <li>Keep doors, windows, drains, and gaps sealed to prevent pest access.</li>
                <li>Check regularly for signs of pests or damaged packaging.</li>
                <li>If pest activity is found, mark No and type remarks / corrective action taken.</li>
              </ul>
            </div>
          </div>

          {/* Unified Form Card */}
          <Card style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Date, Time, Staff */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input className="form-input" type="date" value={logDate} onChange={e => setLogDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Time *</label>
                <input className="form-input" type="time" value={logTime} onChange={e => setLogTime(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Staff Member *</label>
                {staffList.length > 0 ? (
                  <select className="form-select" value={staffName} onChange={e => { setStaffName(e.target.value); if (!signedByStaffName) setSignedByStaffName(e.target.value); }}>
                    {staffList.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                ) : (
                  <input className="form-input" type="text" placeholder="Staff Name" value={staffName} onChange={e => { setStaffName(e.target.value); setSignedByStaffName(e.target.value); }} required />
                )}
                {errors.staffName && <span style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{errors.staffName}</span>}
              </div>
            </div>

            {/* Master Data Checklist Questions */}
            <div>
              {errors.checklist && <div style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '12px' }}>{errors.checklist}</div>}

              {loadingQuestions ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading checklist questions from Pest Control Setup...</div>
              ) : masterQuestions.length === 0 ? (
                <div style={{ padding: '16px', backgroundColor: '#F9FAFB', border: '1px dashed var(--color-border-light)', borderRadius: '8px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                  No active checklist questions configured in <strong>Pest Control Setup</strong>. You can configure questions in <strong>Manager Hub → Pest Control Setup</strong>.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {masterQuestions.map((q, idx) => {
                    const currentAns = checklistAnswers[q.id]?.answer ?? true;
                    const currentNote = checklistAnswers[q.id]?.note || '';

                    return (
                      <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px 16px', backgroundColor: '#F9FAFB', border: '1px solid var(--color-border-light)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                          <div style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                            <span style={{ fontWeight: 700, marginRight: '6px', color: 'var(--color-text-secondary)' }}>{idx + 1}.</span>
                            {q.question_text || q.text}
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleChecklistToggle(q.id, true)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                border: `1px solid ${currentAns ? 'var(--color-primary)' : 'var(--color-border-light)'}`,
                                backgroundColor: currentAns ? 'var(--color-primary)' : '#fff',
                                color: currentAns ? '#fff' : 'var(--color-text-secondary)',
                              }}
                            >
                              <Check size={14} /> Yes
                            </button>

                            <button
                              type="button"
                              onClick={() => handleChecklistToggle(q.id, false)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                border: `1px solid ${!currentAns ? '#DC2626' : 'var(--color-border-light)'}`,
                                backgroundColor: !currentAns ? '#DC2626' : '#fff',
                                color: !currentAns ? '#fff' : 'var(--color-text-secondary)',
                              }}
                            >
                              <X size={14} /> No
                            </button>
                          </div>
                        </div>

                        {!currentAns && (
                          <div className="form-group" style={{ marginTop: '6px', marginBottom: 0 }}>
                            <input
                              className="form-input"
                              placeholder="Add note / follow-up required * (Mandatory for No)"
                              value={currentNote}
                              onChange={e => handleChecklistNoteChange(q.id, e.target.value)}
                              style={{ borderColor: !currentNote.trim() ? 'var(--color-danger)' : 'var(--color-border-light)', backgroundColor: '#FFF5F5', fontSize: '13px' }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Is Premises Free of Pest Activity? (Default: YES) */}
            <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Is premises free of pest activity? *
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPestFree(true)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      border: `1px solid ${isPestFree ? 'var(--color-primary)' : 'var(--color-border-light)'}`,
                      backgroundColor: isPestFree ? 'var(--color-primary)' : '#fff',
                      color: isPestFree ? '#fff' : 'var(--color-text-secondary)',
                    }}
                  >
                    <Check size={14} /> Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setPestFree(false)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      border: `1px solid ${!isPestFree ? '#DC2626' : 'var(--color-border-light)'}`,
                      backgroundColor: !isPestFree ? '#DC2626' : '#fff',
                      color: !isPestFree ? '#fff' : 'var(--color-text-secondary)',
                    }}
                  >
                    <X size={14} /> No
                  </button>
                </div>
              </div>

              {/* If NO (Pest Activity Found), show only Remarks text field */}
              {!isPestFree && (
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label className="form-label" style={{ color: '#DC2626', fontWeight: 600 }}>Remarks / Action Notes *</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Type remarks regarding pest activity observed and corrective actions taken..."
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    style={{ backgroundColor: '#FFF5F5', borderColor: !remarks.trim() ? '#DC2626' : 'var(--color-border-light)' }}
                    required
                  />
                  {errors.remarks && <span style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{errors.remarks}</span>}
                </div>
              )}
            </div>

            {/* General Comments */}
            <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '20px' }}>
              <div className="form-group">
                <label className="form-label">General Comments / Observations</label>
                <textarea className="form-input" rows={2} placeholder="Add any additional observations..." value={generalComments} onChange={e => setGeneralComments(e.target.value)} />
              </div>

              {/* Status Evaluation Banner */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: passed ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${passed ? '#A7F3D0' : '#F8B4B4'}`, borderRadius: '8px', color: passed ? '#047857' : '#9B1C1C', fontSize: '13.5px', fontWeight: 500, marginTop: '16px' }}>
                {passed ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                <span>
                  Evaluation: <strong>{passed ? 'Passed (Pest Free & all checks OK)' : 'Attention Required (Remarks recorded or check failed)'}</strong>
                </span>
              </div>
            </div>

            {/* Staff Verification & Signature */}
            <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '20px' }}>
              <div className="form-group" style={{ maxWidth: '400px', marginBottom: '20px' }}>
                <label className="form-label">Signed By *</label>
                {staffList.length > 0 ? (
                  <select className="form-select" value={signedByStaffName} onChange={e => setSignedByStaffName(e.target.value)}>
                    {staffList.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                ) : (
                  <input className="form-input" type="text" placeholder="Signed By Name" value={signedByStaffName} onChange={e => setSignedByStaffName(e.target.value)} required />
                )}
                {errors.signedBy && <span style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{errors.signedBy}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Signature *</label>
                <SignaturePad value={signature} onChange={setSignature} />
                {errors.signature && <span style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{errors.signature}</span>}
              </div>
            </div>
          </Card>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '40px' }}>
            <Button variant="secondary" onClick={() => router.visit('/haccp-logs/pest-control')} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving Log...' : 'Save Pest Log'}
            </Button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
};

export default PestControlFormPage;
