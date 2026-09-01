import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Flame, Snowflake, Refrigerator as RefrigeratorIcon, RefreshCw, Soup, CheckCircle, AlertTriangle } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Button from '../components/common/Button';
import ManagerPinModal from '../components/common/ManagerPinModal';
import useHaccpEditGate from '../hooks/useHaccpEditGate';
import axios from 'axios';

const CookingTemperatureViewPage = ({ logId }) => {
  const { requestEdit, pinModalOpen, handlePinSuccess, handlePinClose } = useHaccpEditGate();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLog = async () => {
      try {
        const res = await axios.get(`/api/cooking-logs/${logId}`);
        setLog(res.data);
      } catch (err) {
        console.error('Failed to fetch cooking log', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLog();
  }, [logId]);

  if (loading) {
    return (
      <PageLayout>
        <Head title="View Cooking Log" />
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
          <p>Cooking log not found.</p>
          <Button variant="secondary" onClick={() => router.visit('/haccp-logs/cooking-temperature')} style={{ marginTop: '16px' }}>
            Back to Cooking Logs
          </Button>
        </div>
      </PageLayout>
    );
  }

  const isInProgress = (log.status === 'IN_PROGRESS');

  const renderStageBadge = (tempValue, isPassed) => {
    const hasData = tempValue !== null && tempValue !== undefined && tempValue !== '';
    if (!hasData) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#F3F4F6',
          color: '#6B7280',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: 700
        }}>
          <span>N/A</span>
        </div>
      );
    }

    const passed = Boolean(isPassed);
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: passed ? '#ECFDF5' : '#FEF2F2',
        color: passed ? '#047857' : '#B91C1C',
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '13px',
        fontWeight: 700
      }}>
        {passed ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
        <span>{passed ? 'PASSED' : 'FAILED'}</span>
      </div>
    );
  };

  return (
    <PageLayout>
      <Head title="View Cooking Log" />

      <div>
        <button onClick={() => router.visit('/haccp-logs/cooking-temperature')} className="back-btn">
          <ArrowLeft size={16} />
          <span>Back to Cooking Logs</span>
        </button>

        <div className="panel-header-row" style={{ marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h1 className="page-title" style={{ margin: 0 }}>Cook, Cool, Reheat & Hold Process Log</h1>
              {isInProgress ? (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#FEF3C7',
                  color: '#92400E',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#D97706' }}></span>
                  IN PROGRESS
                </span>
              ) : (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#ECFDF5',
                  color: '#065F46',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
                  COMPLETED
                </span>
              )}
            </div>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Full breakdown of all 6 process stages.
            </p>
          </div>

          {isInProgress ? (
            <Button 
              variant="primary" 
              onClick={() => router.visit(`/haccp-logs/cooking-temperature/edit/${logId}`)}
              style={{ backgroundColor: '#D97706', borderColor: '#D97706' }}
            >
              Resume Batch
            </Button>
          ) : (
            <Button variant="primary" onClick={() => requestEdit(`/haccp-logs/cooking-temperature/edit/${logId}`)}>
              Edit Entry
            </Button>
          )}
        </div>

        <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Header Card */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-border-light)', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)' }}>{log.food_item}</div>
              {log.final_signed_at && (
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  Signed Off: {new Date(log.final_signed_at).toLocaleString()}
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border-light)' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Date & Time</label>
                <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{log.log_date} {log.log_time}</div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Staff Member</label>
                <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{log.staff_name || 'N/A'}</div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Batch Code</label>
                <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{log.batch_code || 'N/A'}</div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Probe ID</label>
                <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{log.probe_id || 'N/A'}</div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Status</label>
                <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '2px', color: isInProgress ? '#D97706' : '#059669' }}>
                  {isInProgress ? 'IN PROGRESS' : 'COMPLETED'}
                </div>
              </div>
            </div>
          </div>

          {/* 6 Process Stages Breakdown Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Stage 1: Cooking (CCP-3) */}
            <div style={{ backgroundColor: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Flame size={22} color="#EA580C" />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#9A3412' }}>Stage 1: Cooking (CCP-3)</h3>
                </div>
                {renderStageBadge(log.cooking_temp, log.cooking_passed)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', fontSize: '14px' }}>
                <div>
                  <span style={{ color: '#C2410C', fontWeight: 500 }}>Core Temp:</span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#9A3412', marginTop: '2px' }}>{log.cooking_temp !== null ? `${log.cooking_temp} °C` : 'N/A'}</div>
                </div>
                <div>
                  <span style={{ color: '#C2410C', fontWeight: 500 }}>Target:</span>
                  <div style={{ fontWeight: 600, color: '#9A3412', marginTop: '2px' }}>{log.cooking_target || '≥ 75°C'}</div>
                </div>
                <div>
                  <span style={{ color: '#C2410C', fontWeight: 500 }}>Time Finished:</span>
                  <div style={{ fontWeight: 600, color: '#9A3412', marginTop: '2px' }}>{log.time_finished_cooking || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Stage 2: Blast Chilling (CCP-4) */}
            <div style={{ backgroundColor: '#ECFEFF', border: '1px solid #CFFAFE', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Snowflake size={22} color="#0891B2" />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#155E75' }}>Stage 2: Blast Chilling (CCP-4)</h3>
                </div>
                {renderStageBadge(log.chilling_end_temp, log.chilling_passed)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', fontSize: '14px' }}>
                <div>
                  <span style={{ color: '#0E7490', fontWeight: 500 }}>Method:</span>
                  <div style={{ fontWeight: 600, color: '#155E75', marginTop: '2px' }}>{log.chilling_method || 'N/A'}</div>
                </div>
                <div>
                  <span style={{ color: '#0E7490', fontWeight: 500 }}>Chilling Times:</span>
                  <div style={{ fontWeight: 600, color: '#155E75', marginTop: '2px' }}>
                    {log.chilling_start_time && log.chilling_end_time ? `${log.chilling_start_time} - ${log.chilling_end_time}` : log.chilling_start_time || 'N/A'}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#0E7490', fontWeight: 500 }}>Start Temp:</span>
                  <div style={{ fontWeight: 600, color: '#155E75', marginTop: '2px' }}>{log.chilling_start_temp !== null ? `${log.chilling_start_temp} °C` : 'N/A'}</div>
                </div>
                <div>
                  <span style={{ color: '#0E7490', fontWeight: 500 }}>End Temp:</span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#155E75', marginTop: '2px' }}>{log.chilling_end_temp !== null ? `${log.chilling_end_temp} °C` : 'N/A'}</div>
                </div>
                <div>
                  <span style={{ color: '#0E7490', fontWeight: 500 }}>Duration:</span>
                  <div style={{ fontWeight: 600, color: '#155E75', marginTop: '2px' }}>{log.chilling_duration_minutes ? `${log.chilling_duration_minutes} mins` : 'N/A'}</div>
                </div>
              </div>

              {log.chilling_corrective_action && (
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed #A5F3FC', color: '#991B1B', fontSize: '13px' }}>
                  <strong>Blast Chilling Corrective Action Taken:</strong>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 600 }}>{log.chilling_corrective_action}</p>
                </div>
              )}
            </div>

            {/* Stage 3: Chiller Hold */}
            <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <RefrigeratorIcon size={22} color="#2563EB" />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#1E40AF' }}>Stage 3: Cold Storage / Chiller Hold</h3>
                </div>
                {renderStageBadge(log.chiller_temp, log.chiller_passed)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
                <div>
                  <span style={{ color: '#1D4ED8', fontWeight: 500 }}>Location:</span>
                  <div style={{ fontWeight: 600, color: '#1E40AF', marginTop: '2px' }}>{log.chiller_location || 'N/A'}</div>
                </div>
                <div>
                  <span style={{ color: '#1D4ED8', fontWeight: 500 }}>Storage Temp:</span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#1E40AF', marginTop: '2px' }}>{log.chiller_temp !== null ? `${log.chiller_temp} °C` : 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Stage 4: Reheating */}
            <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <RefreshCw size={22} color="#D97706" />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#B45309' }}>Stage 4: Reheating Process</h3>
                </div>
                {renderStageBadge(log.reheating_temp, log.reheating_passed)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
                <div>
                  <span style={{ color: '#92400E', fontWeight: 500 }}>Method:</span>
                  <div style={{ fontWeight: 600, color: '#B45309', marginTop: '2px' }}>{log.reheating_method || 'N/A'}</div>
                </div>
                <div>
                  <span style={{ color: '#92400E', fontWeight: 500 }}>Reheated Core Temp:</span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#B45309', marginTop: '2px' }}>{log.reheating_temp !== null ? `${log.reheating_temp} °C` : 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Stage 5: Hot Holding (CCP-5) */}
            <div style={{ backgroundColor: '#FDF2F8', border: '1px solid #FBCFE8', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Soup size={22} color="#DB2777" />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#9D174D' }}>Stage 5: Hot Holding & Service (CCP-5)</h3>
                </div>
                {renderStageBadge(log.hot_holding_temp, log.hot_holding_passed)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
                <div>
                  <span style={{ color: '#BE185D', fontWeight: 500 }}>Location:</span>
                  <div style={{ fontWeight: 600, color: '#9D174D', marginTop: '2px' }}>{log.hot_holding_location || 'N/A'}</div>
                </div>
                <div>
                  <span style={{ color: '#BE185D', fontWeight: 500 }}>Holding Temp:</span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#9D174D', marginTop: '2px' }}>{log.hot_holding_temp !== null ? `${log.hot_holding_temp} °C` : 'N/A'}</div>
                </div>
              </div>
            </div>

          </div>

          {/* Corrective Actions & Signature Card */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-border-light)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {log.corrective_action && (
              <div style={{ backgroundColor: '#FFF5F5', color: '#B91C1C', padding: '12px 16px', borderRadius: '8px', borderLeft: '4px solid #EF4444' }}>
                <strong style={{ fontSize: '13px', textTransform: 'uppercase' }}>Corrective Action Taken:</strong>
                <div style={{ fontSize: '14px', marginTop: '4px' }}>{log.corrective_action}</div>
              </div>
            )}

            {log.notes && (
              <div>
                <strong style={{ fontSize: '13px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Notes / Observations:</strong>
                <div style={{ fontSize: '14px', marginTop: '4px', color: 'var(--color-text-primary)' }}>{log.notes}</div>
              </div>
            )}

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <strong style={{ fontSize: '13px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Staff Signature:</strong>
                {log.final_signed_at && (
                  <span style={{ fontSize: '12px', color: '#059669', fontWeight: 700 }}>
                    Final Signed: {new Date(log.final_signed_at).toLocaleString()}
                  </span>
                )}
              </div>
              <div style={{ marginTop: '8px' }}>
                {log.signature ? (
                  <div style={{ backgroundColor: '#FAFAFA', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border-light)', display: 'inline-block' }}>
                    <img src={log.signature} alt="Signature" style={{ height: '80px', objectFit: 'contain' }} />
                  </div>
                ) : (
                  <span style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    {isInProgress ? 'Pending staff signature on Final Sign-Off.' : 'No signature recorded.'}
                  </span>
                )}
              </div>
            </div>
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

export default CookingTemperatureViewPage;
