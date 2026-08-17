import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Printer, CheckCircle, AlertTriangle } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import axios from 'axios';

const StaffTrainingViewPage = ({ logId }) => {
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/staff-training-logs/${logId}`).then(res => {
      setLog(res.data);
    }).catch(err => {
      console.error('Failed to load training log details', err);
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
          Loading training log details...
        </div>
      </PageLayout>
    );
  }

  if (!log) {
    return (
      <PageLayout>
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-danger)' }}>
          Staff training log entry not found.
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Head title={`Training Log - ${log.staff_name}`} />

      <div>
        <button onClick={() => router.visit('/haccp-logs/staff-training')} className="back-btn" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} />
          <span>Back to Staff Training List</span>
        </button>

        <div className="panel-header-row" style={{ marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 className="page-title">Staff Training Log Details</h1>
              <StatusBadge status={log.status} />
            </div>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Logged on {log.log_date} at {log.log_time}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {log.staff_id && (
              <Button variant="primary" onClick={() => router.visit(`/haccp-logs/staff-training/task/${log.staff_id}`)}>
                Manage Staff Tasks
              </Button>
            )}
            <Button variant="secondary" icon={Printer} onClick={handlePrint}>
              Print Log
            </Button>
          </div>
        </div>

        <Card style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header Info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Staff Member</span>
              <strong style={{ fontSize: '16px', color: 'var(--color-text-primary)' }}>{log.staff_name}</strong>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Position: {log.staff_position || 'Staff'}</div>
            </div>

            <div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Trainer / Supervisor</span>
              <strong style={{ fontSize: '16px', color: 'var(--color-text-primary)' }}>{log.trainer_name}</strong>
            </div>

            <div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Completion Date & Time</span>
              <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>{log.log_date} at {log.log_time}</strong>
            </div>
          </div>

          {/* Task Info Box */}
          <div style={{ padding: '16px 20px', backgroundColor: '#F9FAFB', border: '1px solid var(--color-border-light)', borderRadius: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
              Training / Hygiene Task
            </span>
            <strong style={{ fontSize: '18px', display: 'block', color: 'var(--color-primary)', marginTop: '4px' }}>
              {log.task_title}
            </strong>
            {log.task_description && (
              <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: 'var(--color-text-secondary)' }}>
                {log.task_description}
              </p>
            )}
          </div>

          {/* Notes & Confirmation */}
          <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Understanding Confirmed?</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                {log.understanding_confirmed ? (
                  <span style={{ color: '#047857', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={18} /> Confirmed (Yes)
                  </span>
                ) : (
                  <span style={{ color: '#DC2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={18} /> Not Confirmed (No)
                  </span>
                )}
              </div>
            </div>

            {log.notes && (
              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Notes / Instructions Given</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--color-text-primary)' }}>{log.notes}</p>
              </div>
            )}
          </div>

          {/* Verification & Signature */}
          <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Signed By Staff</span>
                <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>{log.signed_by_staff_name || log.staff_name}</strong>
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

export default StaffTrainingViewPage;
