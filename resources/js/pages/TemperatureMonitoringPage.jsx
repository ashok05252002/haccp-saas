import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { Plus, Thermometer, ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import Modal from '../components/common/Modal';
import ManagerPinModal from '../components/common/ManagerPinModal';
import useHaccpEditGate from '../hooks/useHaccpEditGate';
import axios from 'axios';

const TemperatureMonitoringPage = () => {
  const { requestEdit, pinModalOpen, handlePinSuccess, handlePinClose } = useHaccpEditGate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // View Modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const openViewModal = (log) => {
    setSelectedLog(log);
    setViewModalOpen(true);
  };

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/temperature-logs');
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch temperature logs', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleDeleteLog = async (id) => {
    if (!confirm('Are you sure you want to delete this temperature log?')) return;
    try {
      await axios.delete(`/api/temperature-logs/${id}`);
      fetchLogs();
    } catch (err) {
      console.error('Failed to delete temperature log', err);
      alert('Failed to delete temperature log.');
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const q = searchQuery.toLowerCase();
      const matchEquip = log.storage_zone?.name?.toLowerCase().includes(q);
      const matchStaff = log.staff_name?.toLowerCase().includes(q);
      const matchThermo = log.thermometer?.name?.toLowerCase().includes(q);
      const matchDate = log.log_date?.includes(q);
      
      return matchEquip || matchStaff || matchThermo || matchDate;
    });
  }, [logs, searchQuery]);

  const getThermometerStr = (log) => {
    return log.thermometer ? `${log.thermometer.name} (${log.thermometer.serial_number})` : '-';
  };

  return (
    <PageLayout>
      <Head title="Temperature Monitoring" />

      <div>
        <button onClick={() => router.visit('/haccp-logs')} className="back-btn">
          <ArrowLeft size={16} />
          <span>Back to HACCP Logs</span>
        </button>

        <div className="panel-header-row">
          <div>
            <h1 className="page-title">Temperature Monitoring</h1>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Record and monitor temperature logs for fridges and freezers.
            </p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => router.visit('/haccp-logs/temperature/add')}>
            Add Entry
          </Button>
        </div>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Thermometer size={20} color="var(--color-primary)" />
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                  Temperature Logs
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <SearchBar 
                  value={searchQuery} 
                  onChange={setSearchQuery} 
                  placeholder="Search logs..." 
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              Loading temperature logs...
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No temperature logs found. Click "Add Entry" to record one.
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
                  <th>Equipment</th>
                  <th>Temperature</th>
                  <th>Thermometer</th>
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
                    <td>{log.storage_zone?.name || 'Unknown'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          fontWeight: 600, 
                          color: log.is_valid ? 'var(--color-success)' : 'var(--color-danger)'
                        }}>
                          {log.temperature} °C
                        </span>
                        {!log.is_valid && (
                          <span style={{ fontSize: '11px', backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Failed</span>
                        )}
                      </div>
                    </td>
                    <td>{getThermometerStr(log)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <Button variant="secondary" size="sm" onClick={() => openViewModal(log)}>
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          icon={Pencil} 
                          onClick={() => requestEdit(`/haccp-logs/temperature/edit/${log.id}`)}
                        >
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
        title="View Temperature Log Details"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            {selectedLog && (
              <Button 
                variant="outline" 
                icon={Pencil} 
                onClick={() => requestEdit(`/haccp-logs/temperature/edit/${selectedLog.id}`)}
              >
                Edit Entry
              </Button>
            )}
            <Button variant="secondary" onClick={() => setViewModalOpen(false)}>
              Close
            </Button>
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
                <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Equipment</label>
                <div style={{ fontSize: '15px', fontWeight: 500, marginTop: '4px', color: 'var(--color-text-primary)' }}>{selectedLog.storage_zone?.name || 'Unknown'}</div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Temperature</label>
                <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px', color: selectedLog.is_valid ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {selectedLog.temperature} °C
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Thermometer</label>
                <div style={{ fontSize: '15px', fontWeight: 500, marginTop: '4px', color: 'var(--color-text-primary)' }}>{getThermometerStr(selectedLog)}</div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Logged By</label>
                <div style={{ fontSize: '15px', fontWeight: 500, marginTop: '4px', color: 'var(--color-text-primary)' }}>{selectedLog.staff_name || '-'}</div>
              </div>
            </div>
            
            <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '20px' }}>
              <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Comment</label>
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

      <ManagerPinModal
        isOpen={pinModalOpen}
        onClose={handlePinClose}
        onSuccess={handlePinSuccess}
      />
    </PageLayout>
  );
};

export default TemperatureMonitoringPage;
