import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Printer, CheckCircle, AlertTriangle, Trash, Scale, PoundSterling } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import ManagerPinModal from '../components/common/ManagerPinModal';
import useHaccpEditGate from '../hooks/useHaccpEditGate';
import axios from 'axios';

const formatDateStr = (str) => {
  if (!str) return '';
  return String(str).split('T')[0];
};

const formatTimeStr = (str) => {
  if (!str) return '';
  return String(str).substring(0, 5);
};

const FoodWasteViewPage = ({ logId }) => {
  const { requestEdit, pinModalOpen, handlePinSuccess, handlePinClose } = useHaccpEditGate();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);

  // Master lookup tables keyed by id
  const [typesMaster, setTypesMaster]     = useState([]);
  const [sourcesMaster, setSourcesMaster] = useState([]);
  const [reasonsMaster, setReasonsMaster] = useState([]);
  const [methodsMaster, setMethodsMaster] = useState([]);

  useEffect(() => {
    axios.get(`/api/food-waste-logs/${logId}`).then(res => {
      setLog(res.data);
    }).catch(err => {
      console.error('Failed to load food waste log details', err);
    }).finally(() => {
      setLoading(false);
    });

    // Load master tables for name resolution
    axios.get('/api/waste-masters').then(res => {
      const d = res.data || {};
      setTypesMaster(d.types    || []);
      setSourcesMaster(d.sources || []);
      setReasonsMaster(d.reasons || []);
      setMethodsMaster(d.methods || []);
    }).catch(() => {});
  }, [logId]);

  // Resolve a name from an ID using a master array [{id, name}]
  const resolveName = (id, master) => {
    if (!id) return '—';
    const found = master.find(m => String(m.id) === String(id));
    return found ? found.name : String(id);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <PageLayout>
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Loading food waste log details...
        </div>
      </PageLayout>
    );
  }

  if (!log) {
    return (
      <PageLayout>
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-danger)' }}>
          Food waste log entry not found.
        </div>
      </PageLayout>
    );
  }

  const formattedDate = formatDateStr(log.log_date);
  const formattedTime = formatTimeStr(log.log_time);

  return (
    <PageLayout>
      <Head title={`Food Waste Log - ${formattedDate}`} />

      <div>
        <button onClick={() => router.visit('/haccp-logs/food-waste')} className="back-btn" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} />
          <span>Back to Food Waste Logs</span>
        </button>

        <div className="panel-header-row" style={{ marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 className="page-title">Food Waste Log Details</h1>
              <StatusBadge status={log.status} />
            </div>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Logged on {formattedDate} at {formattedTime} by {log.staff_name}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="primary" onClick={() => requestEdit(`/haccp-logs/food-waste/edit/${logId}`)}>
              Edit Entry
            </Button>
            <Button variant="secondary" icon={Printer} onClick={handlePrint}>
              Print Log
            </Button>
          </div>
        </div>

        <Card style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Date & Time</span>
              <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>{formattedDate} at {formattedTime}</strong>
            </div>

            <div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Inspector / Staff Member</span>
              <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>{log.staff_name}</strong>
            </div>
          </div>

          {/* Summary Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', backgroundColor: '#F9FAFB', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--color-border-light)' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Total Items</span>
              <strong style={{ fontSize: '18px', display: 'block', color: 'var(--color-text-primary)' }}>{log.total_entries} items</strong>
            </div>

            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Total Quantity</span>
              <strong style={{ fontSize: '16px', display: 'block', color: 'var(--color-text-primary)' }}>{log.quantity_summary || '0 kg'}</strong>
            </div>

            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Main Waste Type</span>
              <strong style={{ fontSize: '14px', display: 'block', color: 'var(--color-text-primary)' }}>{resolveName(log.main_waste_type, typesMaster)}</strong>
            </div>

            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Source Stage</span>
              <strong style={{ fontSize: '14px', display: 'block', color: 'var(--color-text-primary)' }}>{resolveName(log.main_source_stage, sourcesMaster)}</strong>
            </div>

            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Main Waste Reason</span>
              <strong style={{ fontSize: '14px', display: 'block', color: 'var(--color-text-primary)' }}>{resolveName(log.main_reason, reasonsMaster)}</strong>
            </div>

            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Disposal Method</span>
              <strong style={{ fontSize: '14px', display: 'block', color: 'var(--color-text-primary)' }}>{resolveName(log.main_disposal_method, methodsMaster)}</strong>
            </div>

            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Total Cost Impact</span>
              <strong style={{ fontSize: '18px', display: 'block', color: parseFloat(log.total_cost_impact) > 0 ? '#DC2626' : 'var(--color-text-primary)' }}>
                €{parseFloat(log.total_cost_impact || 0).toFixed(2)}
              </strong>
            </div>
          </div>

          {/* Itemized Waste Table */}
          <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '20px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', color: 'var(--color-text-primary)' }}>
              Logged Waste Items ({Array.isArray(log.items) ? log.items.length : 0})
            </div>

            {Array.isArray(log.items) && log.items.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Category</th>
                      <th>Food Item</th>
                      <th>Waste Type</th>
                      <th>Source Stage</th>
                      <th>Waste Reason</th>
                      <th>Quantity</th>
                      <th>Cost (€)</th>
                      <th>Batch Code</th>
                      <th>Expiry Date</th>
                      <th>Disposal Method</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {log.items.map((item, idx) => {
                      const foodItem       = item.foodItem || item.food_item || item.name || '—';
                      const itemType       = item.itemType || item.item_type || 'ingredient';
                      // Resolve names from IDs using masters
                      const wasteType      = resolveName(item.waste_type_id, typesMaster);
                      const source         = resolveName(item.source_stage_id, sourcesMaster);
                      const reason         = resolveName(item.reason_id, reasonsMaster);
                      const disposalMethod = resolveName(item.disposal_method_id, methodsMaster);
                      const qty            = item.quantity !== null && item.quantity !== undefined ? item.quantity : '—';
                      const unit           = item.unit || (itemType === 'recipe' ? 'portions' : 'kg');
                      const cost           = item.estimatedCost || 0;
                      const batchCode      = item.batchCode || '—';
                      const expiryDate     = item.expiryDate || '—';
                      const notes          = item.notes || '—';

                      const severeReasonIds = reasonsMaster
                        .filter(r => ['Temperature abuse', 'Expired raw materials', 'Contamination risk'].includes(r.name))
                        .map(r => String(r.id));
                      const isSevereReason = severeReasonIds.includes(String(item.reason_id));

                      return (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: itemType === 'recipe' ? '#F3E8FF' : '#DCFCE7',
                              color: itemType === 'recipe' ? '#6B21A8' : '#15803D',
                              display: 'inline-block',
                              whiteSpace: 'nowrap'
                            }}>
                              {itemType === 'recipe' ? '🍲 Recipe' : '🥦 Ingredient'}
                            </span>
                          </td>
                          <td><strong style={{ color: 'var(--color-text-primary)' }}>{foodItem}</strong></td>
                          <td>{wasteType}</td>
                          <td>{source}</td>
                          <td>
                            <span style={{ fontWeight: 600, color: isSevereReason ? '#DC2626' : 'inherit' }}>
                              {reason}
                            </span>
                          </td>
                          <td><strong>{qty} {unit}</strong></td>
                          <td>
                            <strong style={{ color: parseFloat(cost) > 0 ? '#DC2626' : 'inherit' }}>
                              €{parseFloat(cost || 0).toFixed(2)}
                            </strong>
                          </td>
                          <td><code>{batchCode}</code></td>
                          <td>{expiryDate}</td>
                          <td>{disposalMethod}</td>
                          <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)', maxWidth: '200px' }}>{notes}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>No items recorded.</div>
            )}
          </div>

          {/* General Comments & Prevention */}
          {(log.general_comments || log.prevention_action) && (
            <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {log.general_comments && (
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>General Comments</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--color-text-primary)' }}>{log.general_comments}</p>
                </div>
              )}

              {log.prevention_action && (
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Prevention Action / Follow-up</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--color-text-primary)' }}>{log.prevention_action}</p>
                </div>
              )}
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

      <ManagerPinModal
        isOpen={pinModalOpen}
        onClose={handlePinClose}
        onSuccess={handlePinSuccess}
      />
    </PageLayout>
  );
};

export default FoodWasteViewPage;
