import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Snowflake, CheckCircle, AlertTriangle } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Button from '../components/common/Button';
import ManagerPinModal from '../components/common/ManagerPinModal';
import useHaccpEditGate from '../hooks/useHaccpEditGate';
import axios from 'axios';

const BlastChillingViewPage = ({ logId }) => {
  const { requestEdit, pinModalOpen, handlePinSuccess, handlePinClose } = useHaccpEditGate();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLog = async () => {
      try {
        const res = await axios.get(`/api/blast-chilling-logs/${logId}`);
        setLog(res.data);
      } catch (err) {
        console.error('Failed to fetch blast chilling log', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLog();
  }, [logId]);

  if (loading) {
    return (
      <PageLayout>
        <Head title="View Blast Chilling Log" />
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Loading log details...
        </div>
      </PageLayout>
    );
  }

  if (!log) {
    return (
      <PageLayout>
        <Head title="Log Not Found" />
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <p>Blast chilling log not found.</p>
          <Button variant="secondary" onClick={() => router.visit('/haccp-logs/blast-chilling')} style={{ marginTop: '16px' }}>
            Back to Blast Chilling Logs
          </Button>
        </div>
      </PageLayout>
    );
  }

  const isPassed = log.check_passed ?? true;

  return (
    <PageLayout>
      <Head title={`Blast Chilling Log - ${log.food_item}`} />

      <div>
        <button onClick={() => router.visit('/haccp-logs/blast-chilling')} className="back-btn">
          <ArrowLeft size={16} />
          <span>Back to Blast Chilling Logs</span>
        </button>

        <div className="panel-header-row" style={{ marginBottom: '24px' }}>
          <div>
            <h1 className="page-title">Blast Chilling Audit Detail</h1>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Full CCP-4 compliance audit record for rapid cooling.
            </p>
          </div>
          <Button variant="primary" onClick={() => requestEdit(`/haccp-logs/blast-chilling/edit/${logId}`)}>
            Edit Entry
          </Button>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header Card */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span className="badge badge-ccp" style={{ backgroundColor: '#0891B2', color: '#ffffff', marginBottom: '8px' }}>
                  CCP-4
                </span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  {log.food_item}
                </div>
              </div>
              <div>
                {isPassed ? (
                  <span className="badge badge-success" style={{ fontSize: '14px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={16} /> CCP-4 Passed
                  </span>
                ) : (
                  <span className="badge badge-error" style={{ fontSize: '14px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={16} /> Limit Failed
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--color-border-light)' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Date & Time</label>
                <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{log.log_date} {log.log_time}</div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Staff Member</label>
                <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{log.staff_name || 'N/A'}</div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Probe / Thermometer ID</label>
                <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{log.probe_id || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Execution Details Card */}
          <div className="card" style={{ padding: '24px', backgroundColor: 'var(--color-cyan-pale)', border: '1px solid var(--color-cyan-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Snowflake size={22} color="#0891B2" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#155E75' }}>
                Blast Chilling Cycle Audit Data
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #CFFAFE' }}>
                <label style={{ fontSize: '11px', color: '#155E75', fontWeight: 700, textTransform: 'uppercase' }}>Start Temperature</label>
                <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px', color: '#0E7490' }}>
                  {log.start_temp !== null ? `${log.start_temp} °C` : 'N/A'}
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #CFFAFE' }}>
                <label style={{ fontSize: '11px', color: '#155E75', fontWeight: 700, textTransform: 'uppercase' }}>End Temperature (Target ≤ 3.0°C)</label>
                <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px', color: isPassed ? '#047857' : '#B91C1C' }}>
                  {log.end_temp !== null ? `${log.end_temp} °C` : 'N/A'}
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #CFFAFE' }}>
                <label style={{ fontSize: '11px', color: '#155E75', fontWeight: 700, textTransform: 'uppercase' }}>Calculated Duration</label>
                <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px', color: '#0E7490' }}>
                  {log.duration_minutes !== null ? `${log.duration_minutes} mins` : 'N/A'}
                </div>
              </div>
            </div>

            {(log.chilling_start_time || log.chilling_end_time) && (
              <div style={{ backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #CFFAFE', fontSize: '13px', color: '#155E75' }}>
                <strong>Cycle Times:</strong> {log.chilling_start_time || '--:--'} → {log.chilling_end_time || '--:--'}
              </div>
            )}
          </div>

          {/* Corrective Action Section if applicable */}
          {log.corrective_action && (
            <div className="card" style={{ padding: '20px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#991B1B', fontWeight: 700 }}>
                <AlertTriangle size={18} />
                <span>Corrective Action Taken</span>
              </div>
              <div style={{ fontSize: '14px', color: '#7F1D1D', lineHeight: 1.5 }}>
                {log.corrective_action}
              </div>
            </div>
          )}

          {/* Notes & Verification Card */}
          <div className="card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Verification & Notes</h4>
            {log.notes && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Notes / Observations</label>
                <div style={{ fontSize: '14px', color: 'var(--color-text-primary)', marginTop: '4px' }}>{log.notes}</div>
              </div>
            )}

            {log.signature && (
              <div>
                <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Staff Signature Verification
                </label>
                <div style={{ border: '1px solid var(--color-border-light)', borderRadius: '8px', padding: '12px', backgroundColor: '#FAFAFA', display: 'inline-block' }}>
                  <img src={log.signature} alt="Staff Signature" style={{ maxHeight: '80px', display: 'block' }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ManagerPinModal
        isOpen={pinModalOpen}
        onClose={handlePinClose}
        onSuccess={handlePinSuccess}
      />
    </PageLayout>
  );
};

export default BlastChillingViewPage;
