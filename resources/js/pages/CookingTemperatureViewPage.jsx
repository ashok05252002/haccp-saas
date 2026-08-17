import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Flame, Snowflake, Refrigerator as RefrigeratorIcon, RefreshCw, Soup, CheckCircle, AlertTriangle } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Button from '../components/common/Button';
import axios from 'axios';

const CookingTemperatureViewPage = ({ logId }) => {
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
            <h1 className="page-title">Cook, Cool, Reheat & Hold Process Log</h1>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Full breakdown of all 6 process stages.
            </p>
          </div>
          <Button variant="primary" onClick={() => router.visit(`/haccp-logs/cooking-temperature/edit/${logId}`)}>
            Edit Entry
          </Button>
        </div>

        <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Header Card */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-border-light)', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)' }}>{log.food_item}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border-light)' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: log.cooking_passed ? '#ECFDF5' : '#FEF2F2', color: log.cooking_passed ? '#047857' : '#B91C1C', padding: '4px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}>
                  {log.cooking_passed ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                  <span>{log.cooking_passed ? 'PASSED' : 'FAILED'}</span>
                </div>
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
                  <span style={{ color: '#C2410C', fontWeight: 500 }}>Method:</span>
                  <div style={{ fontWeight: 600, color: '#9A3412', marginTop: '2px' }}>{log.cooking_method || 'N/A'}</div>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: log.chilling_passed ? '#ECFDF5' : '#FEF2F2', color: log.chilling_passed ? '#047857' : '#B91C1C', padding: '4px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}>
                  {log.chilling_passed ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                  <span>{log.chilling_passed ? 'PASSED' : 'FAILED'}</span>
                </div>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: log.chiller_passed ? '#ECFDF5' : '#FEF2F2', color: log.chiller_passed ? '#047857' : '#B91C1C', padding: '4px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}>
                  {log.chiller_passed ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                  <span>{log.chiller_passed ? 'PASSED' : 'FAILED'}</span>
                </div>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: log.reheating_passed ? '#ECFDF5' : '#FEF2F2', color: log.reheating_passed ? '#047857' : '#B91C1C', padding: '4px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}>
                  {log.reheating_passed ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                  <span>{log.reheating_passed ? 'PASSED' : 'FAILED'}</span>
                </div>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: log.hot_holding_passed ? '#ECFDF5' : '#FEF2F2', color: log.hot_holding_passed ? '#047857' : '#B91C1C', padding: '4px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}>
                  {log.hot_holding_passed ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                  <span>{log.hot_holding_passed ? 'PASSED' : 'FAILED'}</span>
                </div>
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
              <strong style={{ fontSize: '13px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Signature:</strong>
              <div style={{ marginTop: '8px' }}>
                {log.signature ? (
                  <div style={{ backgroundColor: '#FAFAFA', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border-light)', display: 'inline-block' }}>
                    <img src={log.signature} alt="Signature" style={{ height: '80px', objectFit: 'contain' }} />
                  </div>
                ) : (
                  <span style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No signature recorded.</span>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </PageLayout>
  );
};

export default CookingTemperatureViewPage;
