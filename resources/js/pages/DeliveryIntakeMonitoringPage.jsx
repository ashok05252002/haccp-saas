import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { Plus, Truck, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import ManagerPinModal from '../components/common/ManagerPinModal';
import useHaccpEditGate from '../hooks/useHaccpEditGate';
import axios from 'axios';

const isProductTempInvalid = (product) => {
  if (!product || product.temperature === undefined || product.temperature === null || product.temperature === '') return false;
  const temp = parseFloat(product.temperature);
  if (isNaN(temp)) return false;

  const foodItem = product.food_item || product.foodItem;
  const storageType = foodItem?.storage_type || foodItem?.storageType || product.storage_type;
  
  if (storageType) {
    const nameLower = (storageType.name || '').toLowerCase().trim();
    if (nameLower.includes('chilled')) {
      const min = (storageType.min_temp !== null && storageType.min_temp !== undefined) ? Number(storageType.min_temp) : 0;
      const max = (storageType.max_temp !== null && storageType.max_temp !== undefined) ? Number(storageType.max_temp) : 5;
      return temp < min || temp > max;
    }
    if (nameLower.includes('frozen')) {
      const max = (storageType.max_temp !== null && storageType.max_temp !== undefined) ? Number(storageType.max_temp) : -18;
      return temp > max;
    }
    if (nameLower.includes('hot')) {
      const min = (storageType.min_temp !== null && storageType.min_temp !== undefined) ? Number(storageType.min_temp) : 63;
      return temp < min;
    }
    if (nameLower.includes('ambient')) {
      return false;
    }
    if (storageType.min_temp !== null && storageType.min_temp !== undefined) {
      if (temp < Number(storageType.min_temp)) return true;
    }
    if (storageType.max_temp !== null && storageType.max_temp !== undefined) {
      if (temp > Number(storageType.max_temp)) return true;
    }
  }

  const itemName = (foodItem?.name || product.name || '').toLowerCase().trim();
  if (itemName.includes('chilled') || itemName.includes('milk') || itemName.includes('dairy') || itemName.includes('cheese') || itemName.includes('meat') || itemName.includes('fish') || itemName.includes('chicken')) {
    return temp < 0 || temp > 5;
  }
  if (itemName.includes('frozen') || itemName.includes('ice cream')) {
    return temp > -18;
  }
  if (itemName.includes('hot')) {
    return temp < 63;
  }

  return false;
};

const getDeliveryIntakeLogStatus = (log) => {
  if (!log) return { passed: true, label: 'Passed', reasons: [] };

  const reasons = [];

  const pkgVal = log.packaging_intact ?? log.packagingIntact;
  if (pkgVal === false || pkgVal === 0 || pkgVal === 'false' || pkgVal === '0' || pkgVal === 'no' || pkgVal === 'No') {
    reasons.push('Packaging Intact failed');
  }

  const vehVal = log.vehicle_safe ?? log.isVehicleSafe ?? log.vehicleSafe;
  if (vehVal === false || vehVal === 0 || vehVal === 'false' || vehVal === '0' || vehVal === 'no' || vehVal === 'No') {
    reasons.push('Vehicle Safe failed');
  }

  if (Array.isArray(log.products)) {
    const hasTempError = log.products.some(p => isProductTempInvalid(p));
    if (hasTempError) {
      reasons.push('Temperature out of bounds');
    }
  }

  const statusStr = (log.status || log.result || '').toLowerCase().trim();
  if (statusStr.includes('fail') || statusStr.includes('review') || statusStr.includes('out_of_bounds')) {
    if (reasons.length === 0) reasons.push('Check failed');
  }

  if (reasons.length > 0) {
    return { passed: false, label: 'Needs Review', reasons };
  }

  return { passed: true, label: 'Passed', reasons: [] };
};

const DeliveryIntakeMonitoringPage = () => {
  const { requestEdit, pinModalOpen, handlePinSuccess, handlePinClose } = useHaccpEditGate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const openViewModal = (log) => {
    setSelectedLog(log);
    setViewModalOpen(true);
  };

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/delivery-intake');
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch delivery intake logs', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const q = searchQuery.toLowerCase();
      const matchSupplier = log.supplier?.name?.toLowerCase().includes(q);
      const matchStaff = log.staff_name?.toLowerCase().includes(q);
      const matchDate = log.log_date?.includes(q);
      
      // Check if any product matches the search query (food item name or batch)
      const matchProducts = log.products?.some(p => 
        p.food_item?.name?.toLowerCase().includes(q) || 
        p.batch_number?.toLowerCase().includes(q)
      );
      
      return matchSupplier || matchStaff || matchDate || matchProducts;
    });
  }, [logs, searchQuery]);

  return (
    <PageLayout>
      <Head title="Delivery Intake Monitoring" />

      <div>
        <button onClick={() => router.visit('/haccp-logs')} className="back-btn">
          <ArrowLeft size={16} />
          <span>Back to HACCP Logs</span>
        </button>

        <div className="panel-header-row">
          <div>
            <h1 className="page-title">Delivery Intake</h1>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Record and monitor incoming deliveries, check temperatures, and supplier details.
            </p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => router.visit('/haccp-logs/delivery-intake/add')}>
            Add Entry
          </Button>
        </div>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={20} color="var(--color-primary)" />
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                  Intake Logs
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <SearchBar 
                  value={searchQuery} 
                  onChange={setSearchQuery} 
                  placeholder="Search suppliers, products..." 
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              Loading delivery intake logs...
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No delivery intake logs found. Click "Add Entry" to record one.
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No logs found matching your search.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Supplier</th>
                  <th>Products</th>
                  <th>Safety Checks</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => {
                  const statusInfo = getDeliveryIntakeLogStatus(log);
                  const pkgOk = log.packaging_intact !== false && log.packaging_intact !== 0 && log.packaging_intact !== 'false' && log.packaging_intact !== 'no' && log.packaging_intact !== 'No';
                  const vehOk = log.vehicle_safe !== false && log.vehicle_safe !== 0 && log.vehicle_safe !== 'false' && log.vehicle_safe !== 'no' && log.vehicle_safe !== 'No';

                  return (
                    <tr key={log.id}>
                      <td>
                        <strong style={{ color: 'var(--color-text-primary)' }}>{log.log_date}</strong>
                        <span style={{ color: 'var(--color-text-secondary)', marginLeft: '6px', fontSize: '13px' }}>{log.log_time}</span>
                      </td>
                      <td>{log.supplier?.name || 'Unknown Supplier'}</td>
                      <td>
                        {log.products?.length || 0} product(s)
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span title="Packaging Intact" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: pkgOk ? 'var(--color-success)' : 'var(--color-danger)' }}>
                            {pkgOk ? <CheckCircle size={14}/> : <XCircle size={14}/>} Pkg
                          </span>
                          <span title="Vehicle Safe" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: vehOk ? 'var(--color-success)' : 'var(--color-danger)' }}>
                            {vehOk ? <CheckCircle size={14}/> : <XCircle size={14}/>} Veh
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <StatusBadge label={statusInfo.label} type={statusInfo.passed ? 'passed' : 'failed'} />
                          {!statusInfo.passed && statusInfo.reasons.length > 0 && (
                            <span style={{ fontSize: '11px', color: 'var(--color-danger)', fontWeight: 500 }}>
                              {statusInfo.reasons.join(', ')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <Button variant="secondary" size="sm" onClick={() => openViewModal(log)}>
                            View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => requestEdit(`/haccp-logs/delivery-intake/edit/${log.id}`)}>
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* View Log Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="View Delivery Intake Details"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', gap: '10px' }}>
            <Button variant="secondary" onClick={() => setViewModalOpen(false)}>
              Close
            </Button>
            {selectedLog && (
              <Button variant="primary" onClick={() => requestEdit(`/haccp-logs/delivery-intake/edit/${selectedLog.id}`)}>
                Edit Entry
              </Button>
            )}
          </div>
        }
      >
        {selectedLog && (() => {
          const modalStatus = getDeliveryIntakeLogStatus(selectedLog);
          const pkgOk = selectedLog.packaging_intact !== false && selectedLog.packaging_intact !== 0 && selectedLog.packaging_intact !== 'false' && selectedLog.packaging_intact !== 'no' && selectedLog.packaging_intact !== 'No';
          const vehOk = selectedLog.vehicle_safe !== false && selectedLog.vehicle_safe !== 0 && selectedLog.vehicle_safe !== 'false' && selectedLog.vehicle_safe !== 'no' && selectedLog.vehicle_safe !== 'No';

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date & Time</label>
                  <div style={{ fontSize: '15px', fontWeight: 500, marginTop: '4px', color: 'var(--color-text-primary)' }}>{selectedLog.log_date} {selectedLog.log_time}</div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Supplier</label>
                  <div style={{ fontSize: '15px', fontWeight: 500, marginTop: '4px', color: 'var(--color-text-primary)' }}>{selectedLog.supplier?.name || 'Unknown Supplier'}</div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Status</label>
                  <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <StatusBadge label={modalStatus.label} type={modalStatus.passed ? 'passed' : 'failed'} />
                    {!modalStatus.passed && modalStatus.reasons.length > 0 && (
                      <span style={{ fontSize: '11px', color: 'var(--color-danger)', fontWeight: 500 }}>
                        ({modalStatus.reasons.join(', ')})
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Logged By</label>
                  <div style={{ fontSize: '15px', fontWeight: 500, marginTop: '4px', color: 'var(--color-text-primary)' }}>{selectedLog.staff_name || '-'}</div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '20px' }}>
                <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '12px' }}>Safety Checklist</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {pkgOk ? <CheckCircle size={18} color="var(--color-success)"/> : <XCircle size={18} color="var(--color-danger)"/>}
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>Packaging Intact</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {vehOk ? <CheckCircle size={18} color="var(--color-success)"/> : <XCircle size={18} color="var(--color-danger)"/>}
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>Vehicle Safe</span>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '20px' }}>
                <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '12px' }}>Products Received</label>
                
                {selectedLog.products && selectedLog.products.length > 0 ? (
                  <div style={{ overflowX: 'auto', border: '1px solid var(--color-border-light)', borderRadius: '8px' }}>
                    <table className="data-table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th style={{ backgroundColor: '#F9FAFB' }}>Item</th>
                          <th style={{ backgroundColor: '#F9FAFB' }}>Qty</th>
                          <th style={{ backgroundColor: '#F9FAFB' }}>Batch/Lot</th>
                          <th style={{ backgroundColor: '#F9FAFB' }}>Use By</th>
                          <th style={{ backgroundColor: '#F9FAFB' }}>Temp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedLog.products.map(p => {
                          const isTempError = isProductTempInvalid(p);
                          return (
                            <tr key={p.id}>
                              <td>{p.food_item?.name || 'Unknown Item'}</td>
                              <td>{p.quantity}</td>
                              <td>{p.batch_number || '-'}</td>
                              <td>{p.use_by_date || '-'}</td>
                              <td>
                                <span style={isTempError ? { color: 'var(--color-danger)', fontWeight: 700 } : {}}>
                                  {p.temperature !== null && p.temperature !== undefined ? `${p.temperature} °C` : '-'}
                                </span>
                                {isTempError && (
                                  <span style={{ marginLeft: '6px', fontSize: '11px', color: 'var(--color-danger)', fontWeight: 600 }}>
                                    (Out of bounds)
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <span style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No products recorded.</span>
                )}
              </div>
            
            <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '20px' }}>
              <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Comment / Issues</label>
              <div style={{ fontSize: '14px', marginTop: '4px', lineHeight: '1.5', color: 'var(--color-text-primary)' }}>{selectedLog.comment || 'No comment provided.'}</div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '20px' }}>
              <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Signature</label>
              <div style={{ marginTop: '8px' }}>
                {selectedLog.signature ? (
                  <div style={{ border: '1px solid var(--color-border-light)', borderRadius: '8px', padding: '12px', display: 'inline-block', backgroundColor: '#FAFAFA' }}>
                    <img src={selectedLog.signature} alt="Signature" style={{ height: '80px', maxWidth: '100%', objectFit: 'contain' }} />
                  </div>
                ) : (
                  <span style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No signature provided</span>
                )}
              </div>
            </div>
          </div>
        );
      })()}
      </Modal>

      <ManagerPinModal
        isOpen={pinModalOpen}
        onClose={handlePinClose}
        onSuccess={handlePinSuccess}
      />
    </PageLayout>
  );
};

export default DeliveryIntakeMonitoringPage;
