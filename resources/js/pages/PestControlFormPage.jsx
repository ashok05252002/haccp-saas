import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Info, CheckCircle, AlertTriangle, Check, X, Bug } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SignaturePad from '../components/common/SignaturePad';
import axios from 'axios';

const CHECK_TYPES = [
  'Routine Daily Check',
  'Weekly Pest Inspection',
  'Pest Sighting',
  'Contractor Visit',
  'Follow-up Check',
];

const EVIDENCE_TYPES = [
  'Live pest',
  'Droppings',
  'Gnaw marks',
  'Damaged packaging',
  'Dead insect/pest',
  'Other',
];

const DEFAULT_QUESTIONS = [
  { id: 1, text: 'Are premises protected against pests and free from signs of pest activity?' },
  { id: 2, text: 'Are external doors and windows protected where required?' },
  { id: 3, text: 'Are insect-control units or pest-control devices maintained properly?' },
  { id: 4, text: 'Is food protected from possible pest contamination?' },
  { id: 5, text: 'Are pest sightings or pest-control contractor visits recorded?' },
  { id: 6, text: 'Are doors kept closed or protected to reduce pest entry?' },
  { id: 7, text: 'Are waste areas kept clean and covered?' },
  { id: 8, text: 'Are drains, gaps, and wall/floor junctions in good condition?' },
  { id: 9, text: 'Are dry goods stored off the floor and in sealed containers?' },
  { id: 10, text: 'Are damaged food packages checked for possible pest contamination?' },
];

const PEST_TYPES = ['Rodents (Rats/Mice)', 'Cockroaches', 'Flies / Flying Insects', 'Ants', 'Stored Product Insects', 'Other'];
const LOCATIONS = ['Main Kitchen', 'Dry Food Store', 'Walk-in Fridge / Freezer', 'Waste Storage Area', 'Dining Area', 'Goods Receiving Bay', 'External Grounds', 'Other'];

const PestControlFormPage = () => {
  const [staffList, setStaffList] = useState([]);
  const [contractorsList, setContractorsList] = useState([]);

  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  // Section 1: Inspection & Check Details
  const [logDate, setLogDate] = useState(today);
  const [logTime, setLogTime] = useState(nowTime);
  const [staffName, setStaffName] = useState('');
  const [checkType, setCheckType] = useState(CHECK_TYPES[0]);

  // Section 2: Premises Protection Checklist
  const [checklistAnswers, setChecklistAnswers] = useState(() => {
    const initialMap = {};
    DEFAULT_QUESTIONS.forEach(q => {
      initialMap[q.id] = { answer: true, note: '' };
    });
    return initialMap;
  });

  // Section 3: Pest Activity Details
  const [pestActivityObserved, setPestActivityObserved] = useState(false);
  const [pestType, setPestType] = useState(PEST_TYPES[0]);
  const [locationFound, setLocationFound] = useState(LOCATIONS[0]);
  const [evidenceObserved, setEvidenceObserved] = useState(EVIDENCE_TYPES[0]);
  const [foodAffected, setFoodAffected] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [contractorContacted, setContractorContacted] = useState(false);

  // Section 4: Contractor Visit Details
  const [contractorName, setContractorName] = useState('');
  const [visitDate, setVisitDate] = useState(today);
  const [reportRefNumber, setReportRefNumber] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [nextVisitDueDate, setNextVisitDueDate] = useState('');

  // Section 5: General & Verification
  const [generalComments, setGeneralComments] = useState('');
  const [signedByStaffName, setSignedByStaffName] = useState('');
  const [signature, setSignature] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    axios.get('/api/tenant-users').then(res => {
      setStaffList(res.data || []);
      if (res.data && res.data.length > 0) {
        setStaffName(res.data[0].name);
        setSignedByStaffName(res.data[0].name);
      }
    }).catch(() => {});

    axios.get('/api/waste-contractors').then(res => {
      setContractorsList(res.data || []);
      if (res.data && res.data.length > 0) setContractorName(res.data[0].name);
      else setContractorName('EcoPest Solutions Ltd');
    }).catch(() => setContractorName('EcoPest Solutions Ltd'));
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

  // Evaluation
  const hasFailedChecklist = Object.values(checklistAnswers).some(a => a.answer === false);
  const passed = !hasFailedChecklist && !pestActivityObserved;
  const showContractorSection = checkType === 'Contractor Visit' || contractorContacted;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!staffName) newErrors.staffName = 'Staff member is required.';
    if (!signedByStaffName) newErrors.signedBy = 'Signed by staff member is required.';
    if (!signature) newErrors.signature = 'Signature is required.';

    // Check notes for No answers
    let failedNoteMissing = false;
    Object.entries(checklistAnswers).forEach(([qId, data]) => {
      if (data.answer === false && !data.note.trim()) {
        failedNoteMissing = true;
      }
    });
    if (failedNoteMissing) {
      newErrors.checklist = 'Please add follow-up notes for any questions marked No.';
    }

    if (pestActivityObserved && !actionNotes.trim()) {
      newErrors.actionNotes = 'Action / follow-up notes are required when pest activity is observed.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const checklistData = DEFAULT_QUESTIONS.map(q => ({
        id: q.id,
        text: q.text,
        answer: checklistAnswers[q.id]?.answer ?? true,
        note: checklistAnswers[q.id]?.note || '',
      }));

      await axios.post('/api/pest-control-logs', {
        log_date: logDate,
        log_time: logTime,
        staff_name: staffName,
        check_type: checkType,
        checklist_answers: checklistData,
        pest_activity_observed: pestActivityObserved,
        pest_type: pestActivityObserved ? pestType : null,
        location_found: pestActivityObserved ? locationFound : null,
        evidence_observed: pestActivityObserved ? evidenceObserved : null,
        food_affected: pestActivityObserved ? foodAffected : false,
        action_notes: pestActivityObserved ? actionNotes : '',
        contractor_contacted: pestActivityObserved ? contractorContacted : false,
        contractor_name: showContractorSection ? contractorName : null,
        visit_date: showContractorSection ? visitDate : null,
        report_ref_number: showContractorSection ? reportRefNumber : null,
        next_visit_due_date: showContractorSection ? nextVisitDueDate : null,
        recommendations: showContractorSection ? recommendations : null,
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
            Verify pest ingress barriers, record pest activity sightings, and log professional contractor recommendations.
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
                <li>Check daily for signs of droppings, gnaw marks, insects, damaged packaging, or pest sightings.</li>
                <li>If pest activity is discovered, record location, containment action, and notify contractor.</li>
              </ul>
            </div>
          </div>

          {/* Section 1: Inspection & Check Details */}
          <Card>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginTop: 0, marginBottom: '16px', color: 'var(--color-text-primary)' }}>
              Section 1: Inspection & Check Details
            </h3>

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

              <div className="form-group">
                <label className="form-label">Check Type *</label>
                <select className="form-select" value={checkType} onChange={e => setCheckType(e.target.value)}>
                  {CHECK_TYPES.map(ct => (
                    <option key={ct} value={ct}>{ct}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Section 2: Premises Protection Checklist */}
          <Card>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginTop: 0, marginBottom: '16px', color: 'var(--color-text-primary)' }}>
              Section 2: Premises Protection Checklist
            </h3>

            {errors.checklist && <div style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '12px' }}>{errors.checklist}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {DEFAULT_QUESTIONS.map((q, idx) => {
                const currentAns = checklistAnswers[q.id]?.answer ?? true;
                const currentNote = checklistAnswers[q.id]?.note || '';

                return (
                  <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px 16px', backgroundColor: '#F9FAFB', border: '1px solid var(--color-border-light)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        <span style={{ fontWeight: 700, marginRight: '6px', color: 'var(--color-text-secondary)' }}>{idx + 1}.</span>
                        {q.text}
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
          </Card>

          {/* Section 3: Pest Activity Details */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                Section 3: Pest Activity Details
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 600 }}>Any pest activity observed?</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setPestActivityObserved(false)}
                    style={{
                      padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      border: `1px solid ${!pestActivityObserved ? 'var(--color-primary)' : 'var(--color-border-light)'}`,
                      backgroundColor: !pestActivityObserved ? 'var(--color-primary)' : '#fff',
                      color: !pestActivityObserved ? '#fff' : 'var(--color-text-secondary)',
                    }}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setPestActivityObserved(true)}
                    style={{
                      padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      border: `1px solid ${pestActivityObserved ? '#DC2626' : 'var(--color-border-light)'}`,
                      backgroundColor: pestActivityObserved ? '#DC2626' : '#fff',
                      color: pestActivityObserved ? '#fff' : 'var(--color-text-secondary)',
                    }}
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>

            {pestActivityObserved && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Pest Type *</label>
                    <select className="form-select" value={pestType} onChange={e => setPestType(e.target.value)}>
                      {PEST_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Location Found *</label>
                    <select className="form-select" value={locationFound} onChange={e => setLocationFound(e.target.value)}>
                      {LOCATIONS.map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Evidence Observed *</label>
                    <select className="form-select" value={evidenceObserved} onChange={e => setEvidenceObserved(e.target.value)}>
                      {EVIDENCE_TYPES.map(ev => (
                        <option key={ev} value={ev}>{ev}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Food affected?</label>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setFoodAffected(false)}
                        style={{
                          padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                          border: `1px solid ${!foodAffected ? 'var(--color-primary)' : 'var(--color-border-light)'}`,
                          backgroundColor: !foodAffected ? 'var(--color-primary)' : '#fff',
                          color: !foodAffected ? '#fff' : 'var(--color-text-secondary)',
                        }}
                      >
                        No
                      </button>
                      <button
                        type="button"
                        onClick={() => setFoodAffected(true)}
                        style={{
                          padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                          border: `1px solid ${foodAffected ? '#DC2626' : 'var(--color-border-light)'}`,
                          backgroundColor: foodAffected ? '#DC2626' : '#fff',
                          color: foodAffected ? '#fff' : 'var(--color-text-secondary)',
                        }}
                      >
                        Yes
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Action / Follow-up Notes *</label>
                  <textarea className="form-input" rows={3} placeholder="Detail action taken, containment, pest contractor call..." value={actionNotes} onChange={e => setActionNotes(e.target.value)} required />
                  {errors.actionNotes && <span style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{errors.actionNotes}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Contractor contacted?</label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setContractorContacted(false)}
                      style={{
                        padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                        border: `1px solid ${!contractorContacted ? 'var(--color-primary)' : 'var(--color-border-light)'}`,
                        backgroundColor: !contractorContacted ? 'var(--color-primary)' : '#fff',
                        color: !contractorContacted ? '#fff' : 'var(--color-text-secondary)',
                      }}
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={() => setContractorContacted(true)}
                      style={{
                        padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                        border: `1px solid ${contractorContacted ? 'var(--color-primary)' : 'var(--color-border-light)'}`,
                        backgroundColor: contractorContacted ? 'var(--color-primary)' : '#fff',
                        color: contractorContacted ? '#fff' : 'var(--color-text-secondary)',
                      }}
                    >
                      Yes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Section 4: Contractor Visit Details */}
          {showContractorSection && (
            <Card>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginTop: 0, marginBottom: '16px', color: 'var(--color-text-primary)' }}>
                Section 4: Contractor Visit Details
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Contractor Name</label>
                  {contractorsList.length > 0 ? (
                    <select className="form-select" value={contractorName} onChange={e => setContractorName(e.target.value)}>
                      {contractorsList.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input className="form-input" type="text" placeholder="e.g. EcoPest Solutions Ltd" value={contractorName} onChange={e => setContractorName(e.target.value)} />
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Visit Date</label>
                  <input className="form-input" type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Report / Reference Number</label>
                  <input className="form-input" type="text" placeholder="e.g. REF-99281" value={reportRefNumber} onChange={e => setReportRefNumber(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Next Visit Due Date</label>
                  <input className="form-input" type="date" value={nextVisitDueDate} onChange={e => setNextVisitDueDate(e.target.value)} />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Recommendations / Notes</label>
                <textarea className="form-input" rows={2} placeholder="Contractor recommendations, bait station status..." value={recommendations} onChange={e => setRecommendations(e.target.value)} />
              </div>
            </Card>
          )}

          {/* Section 5: General Comments */}
          <Card>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginTop: 0, marginBottom: '16px', color: 'var(--color-text-primary)' }}>
              Section 5: General Comments
            </h3>

            <div className="form-group">
              <textarea className="form-input" rows={2} placeholder="Add any additional observations..." value={generalComments} onChange={e => setGeneralComments(e.target.value)} />
            </div>

            {/* Status Evaluation Banner */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: passed ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${passed ? '#A7F3D0' : '#F8B4B4'}`, borderRadius: '8px', color: passed ? '#047857' : '#9B1C1C', fontSize: '13.5px', fontWeight: 500, marginTop: '16px' }}>
              {passed ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
              <span>
                Evaluation: <strong>{passed ? 'Passed (All checks passed & no pest activity)' : 'Attention Required (Follow-up note or pest activity recorded)'}</strong>
              </span>
            </div>
          </Card>

          {/* Section 6: Verification & Signature */}
          <Card>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginTop: 0, marginBottom: '16px', color: 'var(--color-text-primary)' }}>
              Section 6: Staff Verification & Signature
            </h3>

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
