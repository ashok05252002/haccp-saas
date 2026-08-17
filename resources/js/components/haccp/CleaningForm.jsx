import React, { useState, useEffect, useRef } from 'react';
import Button from '../common/Button';
import SignatureCanvas from 'react-signature-canvas';
import { AlertTriangle, Save, CheckCircle, XCircle, MinusCircle, ClipboardCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const CleaningForm = ({ onSave, onCancel, logId }) => {
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [existingSignature, setExistingSignature] = useState(null);

  // Stepper State
  const [currentStep, setCurrentStep] = useState(0);

  // Form State
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logTime, setLogTime] = useState(
    new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
  );
  const [staffName, setStaffName] = useState('');
  const [overallComment, setOverallComment] = useState('');
  const [answers, setAnswers] = useState({});
  const sigPad = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [res, staffRes] = await Promise.all([
          axios.get('/api/cleaning-logs/dependencies'),
          axios.get('/api/tenant-users')
        ]);
        
        const fetchedSections = res.data.sections || [];
        setSections(fetchedSections);
        setStaffMembers((staffRes.data || []).filter(s => s.status !== 'Inactive'));

        // Initialize answers
        const initialAnswers = {};
        fetchedSections.forEach(section => {
          (section.questions || []).forEach(q => {
            initialAnswers[q.id] = { result: '', comment: '' };
          });
        });

        if (logId) {
          try {
            const logRes = await axios.get(`/api/cleaning-logs/${logId}`);
            const logData = logRes.data;
            if (logData) {
              if (logData.log_date) setLogDate(logData.log_date);
              if (logData.log_time) setLogTime(logData.log_time);
              if (logData.staff_name) setStaffName(logData.staff_name);
              if (logData.comment) setOverallComment(logData.comment);
              if (logData.signature) setExistingSignature(logData.signature);

              if (Array.isArray(logData.results)) {
                logData.results.forEach(r => {
                  initialAnswers[r.question_id] = {
                    result: r.result,
                    comment: r.comment || ''
                  };
                });
              }
            }
          } catch (fetchErr) {
            console.error('Failed to load existing cleaning log', fetchErr);
          }
        }

        setAnswers(initialAnswers);

      } catch (err) {
        console.error('Failed to load form data', err);
        setError('Failed to load required data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [logId]);

  const handleAnswerChange = (qId, field, val) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        [field]: val
      }
    }));
  };

  const handleNext = () => {
    setError(null);
    if (currentStep === 0) {
      if (!logDate || !logTime) {
        setError("Date and Time are required.");
        return;
      }
    } else if (currentStep > 0 && currentStep <= sections.length) {
      const currentSection = sections[currentStep - 1];
      const hasMissing = (currentSection.questions || []).some(q => {
        const ans = answers[q.id];
        return !ans || !ans.result;
      });
      if (hasMissing) {
        setError("Please answer all questions in this section before proceeding.");
        return;
      }
    }
    setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setError(null);
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Format results
    const results = [];
    sections.forEach(section => {
      (section.questions || []).forEach(q => {
        const ans = answers[q.id];
        if (ans && ans.result) {
          results.push({
            question_id: q.id,
            result: ans.result,
            comment: ans.comment
          });
        }
      });
    });

    let signatureData = existingSignature;
    if (sigPad.current && !sigPad.current.isEmpty()) {
      signatureData = sigPad.current.getCanvas().toDataURL('image/png');
    }

    try {
      const payload = {
        log_date: logDate,
        log_time: logTime,
        staff_name: staffName,
        comment: overallComment,
        signature: signatureData,
        results: results
      };

      if (logId) {
        await axios.put(`/api/cleaning-logs/${logId}`, payload);
      } else {
        await axios.post('/api/cleaning-logs', payload);
      }
      onSave();
    } catch (err) {
      console.error('Failed to save logs', err);
      setError(err.response?.data?.message || 'Failed to save logs.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: '15px' }}>Loading checklist...</div>;
  }

  if (sections.length === 0) {
    return (
      <div style={styles.modalBody}>
        <div style={styles.emptyState}>
          <ClipboardCheck size={32} color="var(--color-primary)" style={{ marginBottom: '12px', opacity: 0.5 }} />
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '16px' }}>No checklist configured</div>
          <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '6px', textAlign: 'center', maxWidth: '300px' }}>
            Add sections and questions to the Cleaning Checklist Master in the Manager Hub first.
          </div>
          <Button variant="secondary" onClick={onCancel} style={{ marginTop: '24px' }}>Go Back</Button>
        </div>
      </div>
    );
  }

  const totalSteps = sections.length + 2; // Details -> Sections... -> Final
  const progressPercent = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div style={styles.formContainer}>
      <style>
        {`
          .question-card {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            background-color: #ffffff;
            border: 1px solid var(--color-border-light);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 16px;
          }
          .question-card:hover {
            border-color: #D1D5DB;
            box-shadow: 0 2px 8px rgba(0,0,0,0.02);
          }
          .radio-btn {
            flex: 1;
            padding: 12px 16px;
            border: 2px solid var(--color-border-light);
            border-radius: 12px;
            background-color: #ffffff;
            color: var(--color-text-secondary);
            font-weight: 700;
            font-size: 15px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .radio-btn:hover {
            background-color: #F9FAFB;
            border-color: #D1D5DB;
            transform: translateY(-1px);
          }
          .radio-btn.selected-yes {
            background-color: #ECFDF5;
            border-color: #10B981;
            color: #047857;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
          }
          .radio-btn.selected-no {
            background-color: #FEF2F2;
            border-color: #EF4444;
            color: #B91C1C;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
          }
          .radio-btn.selected-na {
            background-color: #F3F4F6;
            border-color: #6B7280;
            color: #374151;
            box-shadow: 0 4px 12px rgba(107, 114, 128, 0.15);
          }
        `}
      </style>

      {/* Stepper Header */}
      <div style={styles.stepperHeader}>
        <div style={styles.progressContainer}>
          <div style={{ ...styles.progressBar, width: `${progressPercent}%` }}></div>
        </div>
        <div style={styles.stepInfo}>
          Step {currentStep + 1} of {totalSteps}: 
          {currentStep === 0 && " General Details"}
          {currentStep > 0 && currentStep <= sections.length && ` ${sections[currentStep - 1].title}`}
          {currentStep === totalSteps - 1 && " Final Review & Signature"}
        </div>
      </div>
      
      <div style={styles.modalBody}>
        {error && (
          <div style={{ padding: '12px 16px', backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        {/* STEP 0: General Details */}
        {currentStep === 0 && (
          <div style={styles.generalDetailsWrapper}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: 'var(--color-text-primary)' }}>General Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: '#4B5563' }}>Date *</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={logDate}
                  onChange={e => setLogDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: '#4B5563' }}>Time *</label>
                <input 
                  type="time" 
                  className="form-input" 
                  value={logTime}
                  onChange={e => setLogTime(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: '#4B5563' }}>Staff Name</label>
                <select 
                  className="form-input" 
                  value={staffName}
                  onChange={e => setStaffName(e.target.value)}
                >
                  <option value="">-- Select Staff Member --</option>
                  {staffMembers.map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name} {s.assigned_role ? `(${s.assigned_role.name})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1 to N: Sections */}
        {currentStep > 0 && currentStep <= sections.length && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(() => {
              const section = sections[currentStep - 1];
              return (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--color-primary-pale)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px' }}>
                      {currentStep}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>{section.title}</h3>
                      {section.description && <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>{section.description}</p>}
                    </div>
                  </div>

                  {(section.questions || []).map((q, index) => {
                    const ans = answers[q.id] || { result: '', comment: '' };
                    return (
                      <div key={q.id} className="question-card">
                        <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
                          <p style={{ fontSize: '15.5px', fontWeight: 500, color: 'var(--color-text-primary)', margin: 0, lineHeight: '1.5' }}>
                            <span style={{ color: 'var(--color-text-muted)', marginRight: '6px' }}>{index + 1}.</span> 
                            {q.question}
                          </p>
                          
                          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: '12px', minWidth: '300px' }}>
                              <div className={`radio-btn ${ans.result === 'Yes' ? 'selected-yes' : ''}`} onClick={() => handleAnswerChange(q.id, 'result', 'Yes')}>
                                <CheckCircle size={16} /> Yes
                              </div>
                              <div className={`radio-btn ${ans.result === 'No' ? 'selected-no' : ''}`} onClick={() => handleAnswerChange(q.id, 'result', 'No')}>
                                <XCircle size={16} /> No
                              </div>
                              <div className={`radio-btn ${ans.result === 'N/A' ? 'selected-na' : ''}`} onClick={() => handleAnswerChange(q.id, 'result', 'N/A')}>
                                <MinusCircle size={16} /> N/A
                              </div>
                            </div>
                            
                            <div style={{ flex: 1, minWidth: '250px' }}>
                              <input 
                                type="text" 
                                className="form-input" 
                                placeholder="Add a comment or note (optional)..."
                                value={ans.comment}
                                onChange={(e) => handleAnswerChange(q.id, 'comment', e.target.value)}
                                style={{ backgroundColor: '#F9FAFB', border: '1px dashed var(--color-border-light)' }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* FINAL STEP: Comments & Signature */}
        {currentStep === totalSteps - 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Summary Statistics */}
            {(() => {
              let yesCount = 0;
              let noCount = 0;
              let naCount = 0;
              Object.values(answers).forEach(ans => {
                if (ans.result === 'Yes') yesCount++;
                if (ans.result === 'No') noCount++;
                if (ans.result === 'N/A') naCount++;
              });

              return (
                <div>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: 'var(--color-text-primary)' }}>Review Results</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #10B981', padding: '20px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.05)' }}>
                      <div style={{ fontSize: '36px', fontWeight: 800, color: '#047857', lineHeight: '1' }}>{yesCount}</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '8px' }}>Passed (Yes)</div>
                    </div>
                    <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #EF4444', padding: '20px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.05)' }}>
                      <div style={{ fontSize: '36px', fontWeight: 800, color: '#B91C1C', lineHeight: '1' }}>{noCount}</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '8px' }}>Failed (No)</div>
                    </div>
                    <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #9CA3AF', padding: '20px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(107, 114, 128, 0.05)' }}>
                      <div style={{ fontSize: '36px', fontWeight: 800, color: '#374151', lineHeight: '1' }}>{naCount}</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '8px' }}>Not App. (N/A)</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '32px' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--color-text-primary)', fontSize: '15px' }}>Overall Comments</label>
                <textarea 
                  className="form-input" 
                  rows="4" 
                  placeholder="Any additional notes about the cleaning process..."
                  value={overallComment}
                  onChange={e => setOverallComment(e.target.value)}
                  style={{ resize: 'vertical' }}
                ></textarea>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>Signature</h4>
                <button variant="secondary" size="sm" onClick={() => sigPad.current.clear()} type="button" style={styles.clearBtn}>
                  Clear Signature
                </button>
              </div>
              <div style={styles.sigPadWrapper}>
                <SignatureCanvas 
                  penColor="black"
                  canvasProps={{ width: 800, height: 160, className: 'sigCanvas' }} 
                  ref={sigPad}
                  backgroundColor="#FAFAFA"
                />
              </div>
            </div>
          </div>
        )}

      </div>

      <div style={styles.modalFooter}>
        <div style={{ display: 'flex', gap: '12px' }}>
          {currentStep === 0 ? (
            <Button variant="secondary" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
          ) : (
            <Button variant="secondary" onClick={handlePrev} icon={ArrowLeft} disabled={submitting}>
              Previous
            </Button>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          {currentStep < totalSteps - 1 ? (
            <Button variant="primary" onClick={handleNext} style={styles.nextBtn}>
              Next <ArrowRight size={18} style={{ marginLeft: '6px' }} />
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit} icon={Save} disabled={submitting} style={styles.saveBtn}>
              {submitting ? 'Saving...' : 'Save Log'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    height: '100%',
  },
  stepperHeader: {
    padding: '24px 32px 0 32px',
    backgroundColor: '#ffffff',
  },
  progressContainer: {
    height: '6px',
    backgroundColor: '#F3F4F6',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'var(--color-primary)',
    transition: 'width 0.3s ease',
  },
  stepInfo: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  modalBody: {
    padding: '32px',
    overflowY: 'auto',
    flex: 1,
  },
  generalDetailsWrapper: {
    backgroundColor: '#F9FAFB',
    border: '1px solid var(--color-border-light)',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)',
    maxWidth: '600px',
    margin: '0 auto',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-danger)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  sigPadWrapper: {
    border: '1px solid var(--color-border-light)',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)'
  },
  emptyState: {
    padding: '48px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px dashed var(--color-border-light)',
    borderRadius: '16px',
    backgroundColor: '#FAFAFA',
    margin: '32px 0',
  },
  modalFooter: {
    padding: '20px 32px',
    borderTop: '1px solid var(--color-border-light)',
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    borderBottomLeftRadius: '12px',
    borderBottomRightRadius: '12px',
  },
  nextBtn: {
    background: 'var(--color-primary)',
    padding: '10px 24px',
    fontSize: '15px',
  },
  saveBtn: {
    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
    boxShadow: '0 4px 12px rgba(26, 138, 99, 0.25)',
    border: 'none',
    padding: '10px 24px',
    fontSize: '15px',
  }
};

export default CleaningForm;
