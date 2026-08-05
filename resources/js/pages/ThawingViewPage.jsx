import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Printer, CheckCircle, AlertTriangle } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import axios from 'axios';

const ThawingViewPage = ({ logId }) => {
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/thawing-logs/${logId}`).then(res => {
      setLog(res.data);
    }).catch(err => {
      console.error('Failed to load thawing log details', err);
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
          Loading thawing log details...
        </div>
      </PageLayout>
    );
  }

  if (!log) {
    return (
      <PageLayout>
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-danger)' }}>
          Thawing log entry not found.
        </div>
      </PageLayout>
    );
  }

  const isHigh = parseFloat(log.defrost_temp) > 5.0;

  return (
    <PageLayout>
      <Head title={`Thawing Log - ${log.food_item_name}`} />

      <div>
        <button onClick={() => router.visit('/haccp-logs/thawing')} className="back-btn" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} />
          <span>Back to Thawing Logs</span>
        </button>

        <div className="panel-header-row" style={{ marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 className="page-title">Thawing / Defrosting Record Details</h1>
              <StatusBadge status={log.status} />
            </div>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Item: <strong>{log.food_item_name}</strong> • Logged on {log.log_date} at {log.log_time}
            </p>
          </div>

          <Button variant="secondary" icon={Printer} onClick={handlePrint}>
            Print Log
          </Button>
        </div>

        <Card style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Main Specs Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Food Product / Item</span>
              <strong style={{ fontSize: '16px', color: 'var(--color-primary)' }}>{log.food_item_name}</strong>
            </div>

            <div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Defrosting Method</span>
              <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>{log.defrost_method}</strong>
            </div>

            <div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Storage / Location</span>
              <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>{log.storage_location || 'N/A'}</strong>
            </div>

            <div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Defrost Temperature</span>
              <strong style={{ fontSize: '16px', color: isHigh ? '#DC2626' : 'var(--color-text-primary)' }}>
                {log.defrost_temp}°C {isHigh && ' (⚠ >5°C)'}
              </strong>
            </div>
          </div>

          {/* Timestamps Section */}
          <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '20px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', color: 'var(--color-text-primary)' }}>
              Defrosting Timestamps
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Start Date & Time</span>
                <strong style={{ fontSize: '14.5px', color: 'var(--color-text-primary)' }}>{log.start_date} at {log.start_time}</strong>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Completed Date & Time</span>
                <strong style={{ fontSize: '14.5px', color: 'var(--color-text-primary)' }}>{log.completed_date} at {log.completed_time}</strong>
              </div>
            </div>
          </div>

          {/* General Comments */}
          {log.comments && (
            <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '20px' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Comments / Corrective Action</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--color-text-primary)' }}>{log.comments}</p>
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

export default ThawingViewPage;
