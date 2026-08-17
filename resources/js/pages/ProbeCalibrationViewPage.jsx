import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Gauge, CheckCircle, AlertTriangle } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Button from '../components/common/Button';
import axios from 'axios';

const ProbeCalibrationViewPage = ({ logId }) => {
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLog = async () => {
      try {
        const res = await axios.get(`/api/probe-calibration-logs/${logId}`);
        setLog(res.data);
      } catch (err) {
        console.error('Failed to fetch probe calibration log', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLog();
  }, [logId]);

  if (loading) {
    return (
      <PageLayout>
        <Head title="View Probe Accuracy Check" />
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
          <p>Probe calibration log not found.</p>
          <Button variant="secondary" onClick={() => router.visit('/haccp-logs/probe-calibration')} style={{ marginTop: '16px' }}>
            Back to Probe Accuracy Checks
          </Button>
        </div>
      </PageLayout>
    );
  }

  const isPassed = log.passed ?? true;
  const isBoilingOk = log.boiling_valid ?? true;
  const isIceOk = log.ice_valid ?? true;

  return (
    <PageLayout>
      <Head title={`Probe Calibration - ${log.probe_name}`} />

      <div>
        <button onClick={() => router.visit('/haccp-logs/probe-calibration')} className="back-btn">
          <ArrowLeft size={16} />
          <span>Back to Probe Accuracy Checks</span>
        </button>

        <div className="panel-header-row" style={{ marginBottom: '24px' }}>
          <div>
            <h1 className="page-title">Probe Accuracy Check Detail</h1>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Equipment calibration verification audit record (ISO 22000 & Codex HACCP).
            </p>
          </div>
          <Button variant="primary" onClick={() => router.visit(`/haccp-logs/probe-calibration/edit/${logId}`)}>
            Edit Entry
          </Button>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header Card */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span className="badge badge-ccp" style={{ backgroundColor: '#6366F1', color: '#ffffff', marginBottom: '8px' }}>
                  PR / HACCP P6
                </span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  {log.probe_name} {log.probe_serial_number ? `(${log.probe_serial_number})` : ''}
                </div>
              </div>
              <div>
                {isPassed ? (
                  <span className="badge badge-success" style={{ fontSize: '14px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={16} /> Passed (Accurate)
                  </span>
                ) : (
                  <span className="badge badge-error" style={{ fontSize: '14px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={16} /> Needs Review
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--color-border-light)' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Check Date & Time</label>
                <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{log.log_date} {log.log_time}</div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Staff Member</label>
                <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{log.staff_name}</div>
              </div>
            </div>
          </div>

          {/* Test Readings Card */}
          <div className="card" style={{ padding: '24px', backgroundColor: '#F5F3FF', border: '1px solid #DDD6FE' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Gauge size={22} color="#4F46E5" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#4338CA' }}>
                Calibration Test Readings
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #C7D2FE' }}>
                <label style={{ fontSize: '11px', color: '#4338CA', fontWeight: 700, textTransform: 'uppercase' }}>Boiling Water Test (99°C – 101°C)</label>
                <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: isBoilingOk ? '#047857' : '#B91C1C' }}>
                  {log.boiling_temp !== null ? `${log.boiling_temp} °C` : 'N/A'}
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px', color: isBoilingOk ? '#059669' : '#DC2626', fontWeight: 600 }}>
                  {isBoilingOk ? 'Within Expected Range' : 'Out of Range!'}
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #C7D2FE' }}>
                <label style={{ fontSize: '11px', color: '#4338CA', fontWeight: 700, textTransform: 'uppercase' }}>Ice Water Test (−1°C – 1°C)</label>
                <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: isIceOk ? '#047857' : '#B91C1C' }}>
                  {log.ice_temp !== null ? `${log.ice_temp} °C` : 'N/A'}
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px', color: isIceOk ? '#059669' : '#DC2626', fontWeight: 600 }}>
                  {isIceOk ? 'Within Expected Range' : 'Out of Range!'}
                </div>
              </div>
            </div>
          </div>

          {/* Comments & Verification Card */}
          <div className="card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Verification & Notes</h4>
            {log.comments ? (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Comments / Actions Taken</label>
                <div style={{ fontSize: '14px', color: 'var(--color-text-primary)', marginTop: '4px', lineHeight: 1.5 }}>{log.comments}</div>
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '20px', fontStyle: 'italic' }}>
                No additional comments or actions provided.
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
    </PageLayout>
  );
};

export default ProbeCalibrationViewPage;
