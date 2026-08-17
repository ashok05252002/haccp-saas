import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Printer, CheckCircle, AlertTriangle, Trash, Scale, PoundSterling } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import axios from 'axios';

const FoodWasteViewPage = ({ logId }) => {
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/food-waste-logs/${logId}`).then(res => {
      setLog(res.data);
    }).catch(err => {
      console.error('Failed to load food waste log details', err);
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

  return (
    <PageLayout>
      <Head title={`Food Waste Log - ${log.log_date}`} />

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
              Logged on {log.log_date} at {log.log_time} by {log.staff_name}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="primary" onClick={() => router.visit(`/haccp-logs/food-waste/edit/${logId}`)}>
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
              <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>{log.log_date} at {log.log_time}</strong>
            </div>

            <div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Inspector / Staff Member</span>
              <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>{log.staff_name}</strong>
            </div>
          </div>

          {/* Summary Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', backgroundColor: '#F9FAFB', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--color-border-light)' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Total Items</span>
              <strong style={{ fontSize: '18px', display: 'block', color: 'var(--color-text-primary)' }}>{log.total_entries} items</strong>
            </div>

            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Total Quantity</span>
              <strong style={{ fontSize: '16px', display: 'block', color: 'var(--color-text-primary)' }}>{log.quantity_summary || '0 kg'}</strong>
            </div>

            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Main Waste Reason</span>
              <strong style={{ fontSize: '15px', display: 'block', color: 'var(--color-text-primary)' }}>{log.main_reason || 'N/A'}</strong>
            </div>

            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Total Cost Impact</span>
              <strong style={{ fontSize: '18px', display: 'block', color: parseFloat(log.total_cost_impact) > 0 ? '#DC2626' : 'var(--color-text-primary)' }}>
                £{parseFloat(log.total_cost_impact || 0).toFixed(2)}
              </strong>
            </div>
          </div>

          {/* Itemized Waste Table */}
          <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '20px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', color: 'var(--color-text-primary)' }}>
              Logged Waste Items
            </div>

            {Array.isArray(log.items) && log.items.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Food Item</th>
                      <th>Waste Type</th>
                      <th>Source Stage</th>
                      <th>Waste Reason</th>
                      <th>Quantity</th>
                      <th>Cost (£)</th>
                      <th>Expiry Date</th>
                      <th>Disposal Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {log.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td><strong style={{ color: 'var(--color-text-primary)' }}>{item.foodItem || '-'}</strong></td>
                        <td>{item.wasteType || '-'}</td>
                        <td>{item.source || '-'}</td>
                        <td>
                          <span style={{ fontWeight: 600, color: ['Temperature abuse', 'Expired raw materials', 'Contamination risk'].includes(item.reason) ? '#DC2626' : 'inherit' }}>
                            {item.reason || '-'}
                          </span>
                        </td>
                        <td><strong>{item.quantity} {item.unit || 'kg'}</strong></td>
                        <td>£{parseFloat(item.estimatedCost || 0).toFixed(2)}</td>
                        <td>{item.expiryDate || '-'}</td>
                        <td>{item.disposalMethod || '-'}</td>
                      </tr>
                    ))}
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
    </PageLayout>
  );
};

export default FoodWasteViewPage;
