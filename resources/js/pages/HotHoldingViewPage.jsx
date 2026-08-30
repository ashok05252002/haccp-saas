import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Printer, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import ManagerPinModal from '../components/common/ManagerPinModal';
import useHaccpEditGate from '../hooks/useHaccpEditGate';
import axios from 'axios';

const getItemCheckVal = (item, checkKey) => {
  if (!item) return '';
  const keyNum = checkKey.replace('check', '');
  const keys = [
    checkKey,
    `check_${keyNum}`,
    `check${keyNum}Temp`,
    `temp${keyNum}`,
    `temp_${keyNum}`,
    keyNum === '1' ? 'temp' : null,
  ].filter(Boolean);

  for (const k of keys) {
    if (item[k] !== undefined && item[k] !== null && item[k] !== '') {
      return item[k];
    }
  }
  return '';
};

const getItemTime = (item) => {
  if (!item) return '-';
  return item.timeIntoHold || item.time_into_hold || item.time || item.timeHold || '-';
};

const getItemFoodName = (item) => {
  if (!item) return '-';
  return item.foodName || item.food_name || item.name || item.product_name || '-';
};

const getItemComments = (item) => {
  if (!item) return '-';
  return item.comments || item.notes || item.comment || '-';
};

const renderTemp = (val) => {
  if (val === '' || val === null || val === undefined) return '-';
  return `${val}°C`;
};

const isBelowLimit = (val) => {
  if (val === '' || val === null || val === undefined) return false;
  const num = parseFloat(val);
  return !isNaN(num) && num < 63.0;
};

const HotHoldingViewPage = ({ logId }) => {
  const { requestEdit, pinModalOpen, handlePinSuccess, handlePinClose } = useHaccpEditGate();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);

  // Follow-up Check Modal
  const [checkModalOpen, setCheckModalOpen] = useState(false);
  const [modalItems, setModalItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchLogDetails = () => {
    setLoading(true);
    axios.get(`/api/hot-holding-logs/${logId}`).then(res => {
      setLog(res.data);
    }).catch(err => {
      console.error('Failed to load hot holding log details', err);
    }).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchLogDetails();
  }, [logId]);

  const itemsArray = useMemo(() => {
    if (!log) return [];
    let itemsData = log.items || log.form_data?.items || log.formData?.items || [];
    if (typeof itemsData === 'string') {
      try { itemsData = JSON.parse(itemsData); } catch(e) { itemsData = []; }
    }
    return Array.isArray(itemsData) ? itemsData : [];
  }, [log]);

  const handlePrint = () => {
    window.print();
  };

  // Determine next pending check column key
  const getNextCheckKey = () => {
    if (itemsArray.length === 0) return 'check2';
    const firstItem = itemsArray[0];
    if (!getItemCheckVal(firstItem, 'check2')) return 'check2';
    if (!getItemCheckVal(firstItem, 'check3')) return 'check3';
    if (!getItemCheckVal(firstItem, 'check4')) return 'check4';
    return 'check4';
  };

  const nextKey = getNextCheckKey();
  const nextCheckNum = nextKey.replace('check', '');

  const handleOpenCheckModal = () => {
    if (itemsArray.length === 0) return;
    const clonedItems = itemsArray.map(item => ({
      ...item,
      tempInput: getItemCheckVal(item, nextKey) || '',
    }));
    setModalItems(clonedItems);
    setCheckModalOpen(true);
  };

  const handleModalItemChange = (id, value) => {
    setModalItems(prev => prev.map((item, idx) => (item.id === id || idx === id) ? { ...item, tempInput: value } : item));
  };

  const handleSaveFollowupCheck = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const updatedItems = itemsArray.map((item, idx) => {
        const modalMatch = modalItems.find((m, mIdx) => (m.id && m.id === item.id) || mIdx === idx);
        const newTemp = modalMatch ? modalMatch.tempInput : getItemCheckVal(item, nextKey);
        return {
          ...item,
          [nextKey]: newTemp !== '' ? newTemp : getItemCheckVal(item, nextKey),
        };
      });

      await axios.put(`/api/hot-holding-logs/${logId}`, {
        items: updatedItems,
        general_comments: log.general_comments,
      });

      setCheckModalOpen(false);
      fetchLogDetails();
    } catch (err) {
      console.error('Failed to save follow-up temperature check', err);
      alert('Failed to save follow-up check.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Loading hot holding log details...
        </div>
      </PageLayout>
    );
  }

  if (!log) {
    return (
      <PageLayout>
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-danger)' }}>
          Hot holding log entry not found.
        </div>
      </PageLayout>
    );
  }

  const hasCheck2 = itemsArray.some(i => getItemCheckVal(i, 'check2') !== '');
  const hasCheck3 = itemsArray.some(i => getItemCheckVal(i, 'check3') !== '');
  const hasCheck4 = itemsArray.some(i => getItemCheckVal(i, 'check4') !== '');

  return (
    <PageLayout>
      <Head title={`Hot Holding Log - ${log.holding_unit}`} />

      <div>
        <button onClick={() => router.visit('/haccp-logs/hot-holding')} className="back-btn" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} />
          <span>Back to Hot Holding Logs</span>
        </button>

        <div className="panel-header-row" style={{ marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 className="page-title">Hot Holding Log Details</h1>
              <StatusBadge status={log.status} />
            </div>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Holding Station: <strong>{log.holding_unit}</strong> • Logged on {log.log_date} at {log.log_time}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" onClick={() => requestEdit(`/haccp-logs/hot-holding/edit/${logId}`)}>
              Edit Entry
            </Button>
            {(!hasCheck2 || !hasCheck3 || !hasCheck4) && (
              <Button variant="primary" icon={Plus} onClick={handleOpenCheckModal}>
                Log Check {nextCheckNum}
              </Button>
            )}
            <Button variant="secondary" icon={Printer} onClick={handlePrint}>
              Print Log
            </Button>
          </div>
        </div>

        <Card style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Holding Unit / Station</span>
              <strong style={{ fontSize: '16px', color: 'var(--color-primary)' }}>{log.holding_unit}</strong>
            </div>

            <div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Date & Time</span>
              <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>{log.log_date} at {log.log_time}</strong>
            </div>

            <div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Inspector / Staff Member</span>
              <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>{log.staff_name}</strong>
            </div>
          </div>

          {/* Itemized Checks Table */}
          <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Monitored Food Temperature Checks
              </div>
              {(!hasCheck2 || !hasCheck3 || !hasCheck4) && (
                <Button variant="secondary" size="sm" icon={Plus} onClick={handleOpenCheckModal}>
                  + Add Check {nextCheckNum}
                </Button>
              )}
            </div>

            {itemsArray.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Food Item</th>
                      <th>Time into Hold</th>
                      <th>Check 1 (°C)</th>
                      {hasCheck2 && <th>Check 2 (°C)</th>}
                      {hasCheck3 && <th>Check 3 (°C)</th>}
                      {hasCheck4 && <th>Check 4 (°C)</th>}
                      <th>Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsArray.map((item, idx) => {
                      const c1 = getItemCheckVal(item, 'check1');
                      const c2 = getItemCheckVal(item, 'check2');
                      const c3 = getItemCheckVal(item, 'check3');
                      const c4 = getItemCheckVal(item, 'check4');

                      return (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td><strong style={{ color: 'var(--color-text-primary)' }}>{getItemFoodName(item)}</strong></td>
                          <td>{getItemTime(item)}</td>
                          <td>
                            <span style={{ fontWeight: 700, color: isBelowLimit(c1) ? '#DC2626' : 'inherit' }}>
                              {renderTemp(c1)}
                            </span>
                          </td>
                          {hasCheck2 && (
                            <td>
                              <span style={{ fontWeight: 700, color: isBelowLimit(c2) ? '#DC2626' : 'inherit' }}>
                                {renderTemp(c2)}
                              </span>
                            </td>
                          )}
                          {hasCheck3 && (
                            <td>
                              <span style={{ fontWeight: 700, color: isBelowLimit(c3) ? '#DC2626' : 'inherit' }}>
                                {renderTemp(c3)}
                              </span>
                            </td>
                          )}
                          {hasCheck4 && (
                            <td>
                              <span style={{ fontWeight: 700, color: isBelowLimit(c4) ? '#DC2626' : 'inherit' }}>
                                {renderTemp(c4)}
                              </span>
                            </td>
                          )}
                          <td>{getItemComments(item)}</td>
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

          {/* General Comments */}
          {log.general_comments && (
            <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '20px' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>General Comments</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--color-text-primary)' }}>{log.general_comments}</p>
            </div>
          )}

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

        {/* Modal to Log Follow-up Temperature Check */}
        <Modal isOpen={checkModalOpen} onClose={() => setCheckModalOpen(false)} title={`Log Check ${nextCheckNum} (°C)`}>
          <form onSubmit={handleSaveFollowupCheck} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
              Enter follow-up temperature readings for items in <strong>{log.holding_unit}</strong>. Safe holding limit: <strong>≥ 63.0°C</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
              {modalItems.map((item, idx) => (
                <div key={item.id || idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid var(--color-border-light)' }}>
                  <div>
                    <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)', display: 'block' }}>{getItemFoodName(item)}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Time: {getItemTime(item)} • Check 1: {renderTemp(getItemCheckVal(item, 'check1'))}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="°C"
                      className="form-input"
                      style={{ width: '90px', padding: '6px 8px', fontSize: '13.5px' }}
                      value={item.tempInput}
                      onChange={e => handleModalItemChange(item.id || idx, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <Button variant="secondary" onClick={() => setCheckModalOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Saving Check...' : `Save Check ${nextCheckNum}`}
              </Button>
            </div>
          </form>
        </Modal>

        <ManagerPinModal
          isOpen={pinModalOpen}
          onClose={handlePinClose}
          onSuccess={handlePinSuccess}
        />
      </div>
    </PageLayout>
  );
};

export default HotHoldingViewPage;
