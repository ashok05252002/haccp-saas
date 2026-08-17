import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { Plus, Truck, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import Modal from '../components/common/Modal';
import axios from 'axios';

const DeliveryIntakeMonitoringPage = () => {
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
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
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
                        <span title="Packaging Intact" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: log.packaging_intact ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {log.packaging_intact ? <CheckCircle size={14}/> : <XCircle size={14}/>} Pkg
                        </span>
                        <span title="Vehicle Safe" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: log.vehicle_safe ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {log.vehicle_safe ? <CheckCircle size={14}/> : <XCircle size={14}/>} Veh
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <Button variant="secondary" size="sm" onClick={() => openViewModal(log)}>
                          View
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => router.visit(`/haccp-logs/delivery-intake/edit/${log.id}`)}>
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
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
              <Button variant="primary" onClick={() => router.visit(`/haccp-logs/delivery-intake/edit/${selectedLog.id}`)}>
                Edit Entry
              </Button>
            )}
          </div>
        }
      >
        {selectedLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date & Time</label>
                <div style={{ fontSize: '15px', fontWeight: 500, marginTop: '4px', color: 'var(--color-text-primary)' }}>{selectedLog.log_date} {selectedLog.log_time}</div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Supplier</label>
                <div style={{ fontSize: '15px', fontWeight: 500, marginTop: '4px', color: 'var(--color-text-primary)' }}>{selectedLog.supplier?.name || 'Unknown Supplier'}</div>
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
                  {selectedLog.packaging_intact ? <CheckCircle size={18} color="var(--color-success)"/> : <XCircle size={18} color="var(--color-danger)"/>}
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>Packaging Intact</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {selectedLog.vehicle_safe ? <CheckCircle size={18} color="var(--color-success)"/> : <XCircle size={18} color="var(--color-danger)"/>}
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
                      {selectedLog.products.map(p => (
                        <tr key={p.id}>
                          <td>{p.food_item?.name || 'Unknown Item'}</td>
                          <td>{p.quantity}</td>
                          <td>{p.batch_number || '-'}</td>
                          <td>{p.use_by_date || '-'}</td>
                          <td>{p.temperature ? `${p.temperature} °C` : '-'}</td>
                        </tr>
                      ))}
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
        )}
      </Modal>
    </PageLayout>
  );
};

export default DeliveryIntakeMonitoringPage;
