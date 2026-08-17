import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { HeartPulse, ArrowLeft, Printer, CheckCircle, AlertTriangle, XCircle, ShieldAlert } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import axios from 'axios';

const HealthDeclarationViewPage = ({ logId }) => {
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLog = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/health-declaration-logs/${logId}`);
        setLog(res.data);
      } catch (err) {
        console.error('Failed to load health declaration details', err);
        setError('Failed to load health declaration log details.');
      } finally {
        setLoading(false);
      }
    };

    if (logId) {
      fetchLog();
    }
  }, [logId]);

  const handlePrint = () => {
    window.print();
  };

  // Group results by section
  const groupedResults = React.useMemo(() => {
    if (!log || !log.results) return {};
    const map = {};

    log.results.forEach(res => {
      const secTitle = res.question?.section?.title || 'General Health Screening';
      if (!map[secTitle]) {
        map[secTitle] = [];
      }
      map[secTitle].push(res);
    });

    return map;
  }, [log]);

  return (
    <PageLayout>
      <Head title={log ? `Health Declaration - ${log.staff_name}` : 'Health Declaration Details'} />

      {/* Printable CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-declaration, #printable-declaration * {
            visibility: visible;
          }
          #printable-declaration {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: #fff;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div>
        {/* Navigation & Header Actions */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
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
              <span>Staff Health Declaration Audit Record</span>
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="primary" onClick={() => router.visit(`/haccp-logs/health-declaration/edit/${logId}`)}>
              Edit Entry
            </Button>
            <Button variant="secondary" icon={Printer} onClick={handlePrint}>
              Print Audit Sheet
            </Button>
          </div>
        </div>

        {loading ? (
          <Card>
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              Loading health declaration details...
            </div>
          </Card>
        ) : error || !log ? (
          <Card>
            <div style={{ padding: '40px', textAlign: 'center', color: '#DC2626' }}>
              {error || 'Health declaration log not found.'}
            </div>
          </Card>
        ) : (
          <div id="printable-declaration" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Log Header Summary */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '12px', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>
                    {log.staff_name}
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
                    Recorded on {log.log_date} at {log.log_time}
                  </p>
                </div>

                <div>
                  {log.overall_status === 'Fit for Work' ? (
                    <span style={{ backgroundColor: '#ECFDF5', color: '#059669', padding: '6px 14px', borderRadius: '14px', fontSize: '14px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle size={18} /> Fit for Work
                    </span>
                  ) : (
                    <span style={{ backgroundColor: '#FEF2F2', color: '#DC2626', padding: '6px 14px', borderRadius: '14px', fontSize: '14px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldAlert size={18} /> {log.overall_status || 'Action Required'}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Staff Member</span>
                  <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{log.staff_name}</strong>
                </div>

                <div>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Symptoms Reported</span>
                  <strong style={{ fontSize: '14px', color: log.symptoms_reported ? '#DC2626' : '#059669' }}>
                    {log.symptoms_reported ? 'Yes (Flagged)' : 'None (Clear)'}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Submission ID</span>
                  <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>#HD-{log.id}</strong>
                </div>
              </div>
            </Card>

            {/* Question Results Breakdown */}
            {Object.keys(groupedResults).map((secTitle, idx) => (
              <Card key={idx}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 14px 0', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '8px' }}>
                  {secTitle}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {groupedResults[secTitle].map((res, rIdx) => {
                    const isYes = res.answer === 'Yes';
                    return (
                      <div
                        key={res.id || rIdx}
                        style={{
                          backgroundColor: isYes ? '#FEF2F2' : '#F9FAFB',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: isYes ? '1px solid #FCA5A5' : '1px solid var(--color-border-light)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {res.question?.question_text || 'Health Screening Item'}
                          </span>

                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: 700,
                            backgroundColor: isYes ? '#FEE2E2' : '#ECFDF5',
                            color: isYes ? '#DC2626' : '#059669'
                          }}>
                            {res.answer}
                          </span>
                        </div>

                        <div style={{ marginTop: '8px', fontSize: '12px', color: isYes ? '#991B1B' : 'var(--color-text-secondary)', fontWeight: 500 }}>
                          <strong>Remarks / Notes:</strong> {res.notes || '—'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}

            {/* Signatures & Remarks */}
            <Card>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 14px 0', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '8px' }}>
                Signatures & Remarks
              </h3>

              {log.comment && (
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Comments / Remarks:</span>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-primary)', backgroundColor: '#F9FAFB', padding: '10px 14px', borderRadius: '8px' }}>
                    {log.comment}
                  </p>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                    Employee Signature:
                  </span>
                  {log.signature ? (
                    <div style={{ backgroundColor: '#FAFAFA', border: '1px solid var(--color-border-light)', borderRadius: '8px', padding: '10px', display: 'inline-block' }}>
                      <img src={log.signature} alt="Employee Signature" style={{ maxHeight: '80px', maxWidth: '300px', objectFit: 'contain' }} />
                    </div>
                  ) : (
                    <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                      No employee signature captured.
                    </span>
                  )}
                </div>

                <div>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                    Manager Signature:
                  </span>
                  {log.manager_signature ? (
                    <div style={{ backgroundColor: '#FAFAFA', border: '1px solid var(--color-border-light)', borderRadius: '8px', padding: '10px', display: 'inline-block' }}>
                      <img src={log.manager_signature} alt="Manager Signature" style={{ maxHeight: '80px', maxWidth: '300px', objectFit: 'contain' }} />
                    </div>
                  ) : (
                    <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                      No manager signature captured.
                    </span>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default HealthDeclarationViewPage;
