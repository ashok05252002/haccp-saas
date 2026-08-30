import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Printer, Flame, CheckCircle, AlertTriangle, Droplets } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import ManagerPinModal from '../components/common/ManagerPinModal';
import useHaccpEditGate from '../hooks/useHaccpEditGate';
import axios from 'axios';

const FryerOilViewPage = ({ logId }) => {
  const { requestEdit, pinModalOpen, handlePinSuccess, handlePinClose } = useHaccpEditGate();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/fryer-oil-logs/${logId}`).then(res => {
      setLog(res.data);
    }).catch(err => {
      console.error('Failed to load fryer oil log details', err);
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
          Loading fryer oil log details...
        </div>
      </PageLayout>
    );
  }

  if (!log) {
    return (
      <PageLayout>
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-danger)' }}>
          Fryer oil log entry not found.
        </div>
      </PageLayout>
    );
  }

  const isTempHigh = log.frying_temp > 175;

  return (
    <PageLayout>
      <Head title={`Fryer Oil Log - ${log.log_date}`} />

      <div>
        <button onClick={() => router.visit('/haccp-logs/fryer-oil')} className="back-btn" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} />
          <span>Back to Fryer Oil Logs</span>
        </button>

        <div className="panel-header-row" style={{ marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 className="page-title">Fryer Oil & Grease Log Details</h1>
              <StatusBadge status={log.status} />
            </div>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Logged on {log.log_date} at {log.log_time} by {log.staff_name}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="primary" onClick={() => requestEdit(`/haccp-logs/fryer-oil/edit/${logId}`)}>
              Edit Entry
            </Button>
            <Button variant="secondary" icon={Printer} onClick={handlePrint}>
              Print Log
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* STEP 1 DETAILS */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '12px', marginBottom: '16px' }}>
              <Flame size={20} color="#D97706" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                STEP 1: Fryer Oil Check Details
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Fryer Station</span>
                <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>{log.fryer_station}</strong>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Frying Temperature</span>
                <strong style={{ fontSize: '15px', color: isTempHigh ? '#DC2626' : '#059669' }}>
                  {log.frying_temp} °C {isTempHigh && '(High Temp Alert >175°C)'}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Oil Condition</span>
                <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>{log.oil_condition}</strong>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Oil Quality Result</span>
                {log.oil_quality_acceptable ? (
                  <span style={{ backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                    Acceptable
                  </span>
                ) : (
                  <span style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', border: '1px solid #F8B4B4', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                    Not Acceptable
                  </span>
                )}
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Action Taken</span>
                <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>{log.oil_action_taken}</strong>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Quantity Removed / Replaced</span>
                <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>
                  {log.quantity_removed ? `${log.quantity_removed} Litres` : 'N/A'}
                </strong>
              </div>
            </div>

            {log.step1_comments && (
              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--color-border-light)' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Step 1 Observations</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--color-text-primary)' }}>{log.step1_comments}</p>
              </div>
            )}
          </Card>

          {/* STEP 2 DETAILS */}
          <Card>
            <div style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                STEP 2: Grease & Used Oil Disposal Details
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Disposal / Cleaning Type</span>
                <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>{log.disposal_type}</strong>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Grease Trap / Area Details</span>
                <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>{log.grease_area}</strong>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Disposal Quantity</span>
                <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>
                  {log.disposal_quantity ? `${log.disposal_quantity} Litres` : 'N/A'}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Disposal Method</span>
                <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>{log.disposal_method}</strong>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Waste Contractor</span>
                <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>{log.waste_contractor || 'N/A'}</strong>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Collection Ref Number</span>
                <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>{log.collection_ref_number || 'N/A'}</strong>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Next Cleaning Due Date</span>
                <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>{log.next_cleaning_due_date || 'N/A'}</strong>
              </div>
            </div>

            {log.step2_comments && (
              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--color-border-light)' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Step 2 Disposal Notes</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--color-text-primary)' }}>{log.step2_comments}</p>
              </div>
            )}
          </Card>

          {/* VERIFICATION & SIGNATURE */}
          <Card>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginTop: 0, marginBottom: '16px', color: 'var(--color-text-primary)' }}>
              Staff Verification & Signature
            </h3>

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
          </Card>
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

export default FryerOilViewPage;
