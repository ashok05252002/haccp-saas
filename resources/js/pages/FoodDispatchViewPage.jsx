import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Truck, CheckCircle, AlertTriangle } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Button from '../components/common/Button';
import ManagerPinModal from '../components/common/ManagerPinModal';
import useHaccpEditGate from '../hooks/useHaccpEditGate';
import axios from 'axios';

const FoodDispatchViewPage = ({ logId }) => {
  const { requestEdit, pinModalOpen, handlePinSuccess, handlePinClose } = useHaccpEditGate();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLog = async () => {
      try {
        const res = await axios.get(`/api/food-dispatch-logs/${logId}`);
        setLog(res.data);
      } catch (err) {
        console.error('Failed to fetch food dispatch log', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLog();
  }, [logId]);

  if (loading) {
    return (
      <PageLayout>
        <Head title="View Food Dispatch Log" />
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
          <p>Food dispatch log not found.</p>
          <Button variant="secondary" onClick={() => router.visit('/haccp-logs/food-dispatch')} style={{ marginTop: '16px' }}>
            Back to Food Dispatch Logs
          </Button>
        </div>
      </PageLayout>
    );
  }

  const isPassed = log.passed ?? true;
  const isTempOk = log.temp_in_range ?? true;
  const isSeparationOk = log.separation ?? true;

  return (
    <PageLayout>
      <Head title={`Food Dispatch - ${log.food_item}`} />

      <div>
        <button onClick={() => router.visit('/haccp-logs/food-dispatch')} className="back-btn">
          <ArrowLeft size={16} />
          <span>Back to Food Dispatch Logs</span>
        </button>

        <div className="panel-header-row" style={{ marginBottom: '24px' }}>
          <div>
            <h1 className="page-title">Food Dispatch Audit Detail</h1>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Full transport audit record for food dispatch & transfer.
            </p>
          </div>
          <Button variant="primary" onClick={() => requestEdit(`/haccp-logs/food-dispatch/edit/${logId}`)}>
            Edit Entry
          </Button>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header Card */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span className="badge badge-ccp" style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff', marginBottom: '8px' }}>
                  Transport Safety
                </span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  {log.food_item}
                </div>
                {log.batch_code && (
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    Batch Code: <strong>{log.batch_code}</strong>
                  </div>
                )}
              </div>
              <div>
                {isPassed ? (
                  <span className="badge badge-success" style={{ fontSize: '14px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={16} /> Passed
                  </span>
                ) : (
                  <span className="badge badge-error" style={{ fontSize: '14px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={16} /> Needs Review
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--color-border-light)' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Destination</label>
                <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{log.destination}</div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Use By Date</label>
                <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{log.use_by_date}</div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Staff Member</label>
                <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{log.staff_name}</div>
              </div>
            </div>
          </div>

          {/* Dispatch Metrics Card */}
          <div className="card" style={{ padding: '24px', backgroundColor: 'var(--color-primary-pale)', border: '1px solid var(--color-border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Truck size={22} color="var(--color-primary)" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--color-primary-dark)' }}>
                Dispatch & Safety Audit
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border-light)' }}>
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Dispatch Temperature</label>
                <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: isTempOk ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {log.temperature !== null ? `${log.temperature} °C` : 'N/A'}
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px', color: isTempOk ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
                  {isTempOk ? 'Temperature Safe' : 'Temperature Out of Safe Range!'}
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border-light)' }}>
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Raw / Ready-to-Eat Separation</label>
                <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: isSeparationOk ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {isSeparationOk ? 'Verified (Yes)' : 'Flagged (No)'}
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px', color: isSeparationOk ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
                  {isSeparationOk ? 'Compliant Segregation' : 'Cross-Contamination Risk Flagged'}
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

      <ManagerPinModal
        isOpen={pinModalOpen}
        onClose={handlePinClose}
        onSuccess={handlePinSuccess}
      />
    </PageLayout>
  );
};

export default FoodDispatchViewPage;
