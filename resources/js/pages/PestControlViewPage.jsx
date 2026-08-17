import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Printer, ShieldCheck, CheckCircle, AlertTriangle, Bug, Check, X } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import axios from 'axios';

const PestControlViewPage = ({ logId }) => {
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/pest-control-logs/${logId}`).then(res => {
      setLog(res.data);
    }).catch(err => {
      console.error('Failed to load pest control log details', err);
    }).finally(() => {
      setLoading(false);
    });
  }, [logId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <PageLayout>
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Loading pest control log details...
        </div>
      </PageLayout>
    );
  }

  if (!log) {
    return (
      <PageLayout>
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-danger)' }}>
          Pest control log entry not found.
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Head title={`Pest Log - ${log.log_date}`} />

      <div>
        <button onClick={() => router.visit('/haccp-logs/pest-control')} className="back-btn" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} />
          <span>Back to Pest Control Logs</span>
        </button>

        <div className="panel-header-row" style={{ marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 className="page-title">Pest Control Inspection Details</h1>
              <StatusBadge status={log.status} />
            </div>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Logged on {log.log_date} at {log.log_time} by {log.staff_name}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="primary" onClick={() => router.visit(`/haccp-logs/pest-control/edit/${logId}`)}>
              Edit Entry
            </Button>
            <Button variant="secondary" icon={Printer} onClick={handlePrint}>
              Print Log
            </Button>
          </div>
        </div>

        <Card style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Inspection Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Date & Time</span>
              <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>{log.log_date} at {log.log_time}</strong>
            </div>

            <div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Inspector / Staff Member</span>
              <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>{log.staff_name}</strong>
            </div>
          </div>

          {/* Master Data Checklist Questions Results */}
          <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '20px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', color: 'var(--color-text-primary)' }}>
              Checklist Questions Results
            </div>

            {Array.isArray(log.checklist_answers) && log.checklist_answers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {log.checklist_answers.map((item, idx) => (
                  <div key={idx} style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: '#F9FAFB', border: '1px solid var(--color-border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        <span style={{ fontWeight: 700, marginRight: '6px' }}>{idx + 1}.</span> {item.text}
                      </div>

                      {item.answer ? (
                        <span style={{ backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                          <Check size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Yes
                        </span>
                      ) : (
                        <span style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', border: '1px solid #F8B4B4', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                          <X size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> No
                        </span>
                      )}
                    </div>

                    {item.note && (
                      <div style={{ marginTop: '6px', fontSize: '13px', color: '#B91C1C', backgroundColor: '#FFF5F5', padding: '6px 10px', borderRadius: '4px' }}>
                        <strong>Note:</strong> {item.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>No checklist items recorded.</div>
            )}
          </div>

          {/* Is Premises Free of Pest Activity? */}
          <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '20px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', color: 'var(--color-text-primary)' }}>
              Is premises free of pest activity?
            </div>

            {!log.pest_activity_observed ? (
              <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '10px 14px', borderRadius: '8px', color: '#047857', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} /> YES - Premises is Pest Free & Clean
              </div>
            ) : (
              <div>
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #F8B4B4', padding: '10px 14px', borderRadius: '8px', color: '#9B1C1C', fontSize: '13px', fontWeight: 700, marginBottom: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Bug size={16} /> NO - Pest Activity Observed
                </div>

                {log.action_notes && (
                  <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #F8B4B4', padding: '12px 14px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#9B1C1C', display: 'block', fontWeight: 700, marginBottom: '4px' }}>Remarks / Action Notes</span>
                    <p style={{ margin: 0, fontSize: '14px', color: '#9B1C1C' }}>{log.action_notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* General Comments */}
          {log.general_comments && (
            <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '20px' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>General Comments</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--color-text-primary)' }}>{log.general_comments}</p>
            </div>
          )}

          {/* Verification & Signature */}
          <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Signed By Staff</span>
                <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>{log.signed_by_staff_name}</strong>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>Digital Signature</span>
                {log.signature ? (
                  <div style={{ border: '1px solid var(--color-border-light)', borderRadius: '8px', padding: '8px', width: '220px', backgroundColor: '#FAFAFA' }}>
                    <img src={log.signature} alt="Staff Signature" style={{ width: '100%', height: '80px', objectFit: 'contain' }} />
                  </div>
                ) : (
                  <span style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>No signature image available</span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
};

export default PestControlViewPage;
