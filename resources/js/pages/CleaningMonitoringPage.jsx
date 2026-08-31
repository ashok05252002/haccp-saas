import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { Plus, ArrowLeft, ClipboardCheck, CheckCircle, XCircle, MinusCircle, ChevronDown, ChevronUp } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import Modal from '../components/common/Modal';
import ManagerPinModal from '../components/common/ManagerPinModal';
import useHaccpEditGate from '../hooks/useHaccpEditGate';
import axios from 'axios';

const CleaningMonitoringPage = () => {
  const { requestEdit, pinModalOpen, handlePinSuccess, handlePinClose } = useHaccpEditGate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/cleaning-logs');
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch cleaning logs', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const openViewModal = (log) => {
    setSelectedLog(log);
    setViewModalOpen(true);
  };

  const getLogStats = (log) => {
    if (!log || !log.results) return { yes: 0, no: 0, na: 0 };
    let yes = 0, no = 0, na = 0;
    log.results.forEach(r => {
      if (r.result === 'Yes') yes++;
      if (r.result === 'No') no++;
      if (r.result === 'N/A') na++;
    });
    return { yes, no, na };
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const q = searchQuery.toLowerCase();
      const matchStaff = log.staff_name?.toLowerCase().includes(q);
      const matchDate = log.log_date?.includes(q);
      
      return matchStaff || matchDate;
    });
  }, [logs, searchQuery]);



  return (
    <PageLayout>
      <Head title="Cleaning & Sanitation Logs" />

      <div>
        <button onClick={() => router.visit('/haccp-logs')} className="back-btn">
          <ArrowLeft size={16} />
          <span>Back to HACCP Logs</span>
        </button>

        <div className="panel-header-row">
          <div>
            <h1 className="page-title">Cleaning & Sanitation Logs</h1>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Monitor and review completed cleaning checklists.
            </p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => router.visit('/haccp-logs/cleaning/add')}>
            Add Entry
          </Button>
        </div>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClipboardCheck size={20} color="var(--color-primary)" />
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                  Log History
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
              Loading logs...
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No cleaning logs found. Click "Add Entry" to record one.
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
                  <th>Staff Name</th>
                  <th>Tasks Checked</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => {
                  const passed = log.results ? log.results.filter(r => r.result === 'Yes').length : 0;
                  const total = log.results ? log.results.length : 0;
                  const failed = log.results ? log.results.filter(r => r.result === 'No').length : 0;

                  return (
                    <tr key={log.id}>
                      <td>
                        <strong style={{ color: 'var(--color-text-primary)' }}>{log.log_date}</strong>
                        <span style={{ color: 'var(--color-text-secondary)', marginLeft: '6px', fontSize: '13px' }}>{log.log_time}</span>
                      </td>
                      <td>{log.staff_name || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 500, color: failed > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                            {passed} / {total} Passed
                          </span>
                          {failed > 0 && (
                            <span style={{ fontSize: '11px', backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>{failed} Failed</span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <Button variant="secondary" size="sm" onClick={() => openViewModal(log)}>
                            View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => requestEdit(`/haccp-logs/cleaning/edit/${log.id}`)}>
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
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
        title="View Cleaning & Sanitation Details"
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', gap: '10px' }}>
            <Button variant="secondary" onClick={() => setViewModalOpen(false)}>
              Close
            </Button>
            {selectedLog && (
              <Button variant="primary" onClick={() => requestEdit(`/haccp-logs/cleaning/edit/${selectedLog.id}`)}>
                Edit Entry
              </Button>
            )}
          </div>
        }
      >
        {selectedLog && (() => {
          const stats = getLogStats(selectedLog);
          return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: '#FAFAFA', padding: '24px', borderRadius: '12px', margin: '-20px' }}>
            
            {/* Top Level Summary Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #10B981', padding: '16px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#10B981' }}></div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#047857', lineHeight: '1', marginTop: '4px' }}>{stats.yes}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '8px' }}>Passed (Yes)</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #EF4444', padding: '16px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#EF4444' }}></div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#B91C1C', lineHeight: '1', marginTop: '4px' }}>{stats.no}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '8px' }}>Failed (No)</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #9CA3AF', padding: '16px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 12px rgba(107, 114, 128, 0.1)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#9CA3AF' }}></div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#374151', lineHeight: '1', marginTop: '4px' }}>{stats.na}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '8px' }}>Not App. (N/A)</div>
              </div>
            </div>

            {/* General Info Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border-light)', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#F3F4F6', color: '#4B5563', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date & Time</label>
                  <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '2px', color: 'var(--color-text-primary)' }}>{selectedLog.log_date} <span style={{ color: 'var(--color-text-secondary)', marginLeft: '4px', fontSize: '13px' }}>{selectedLog.log_time}</span></div>
                </div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border-light)', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#F3F4F6', color: '#4B5563', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Staff Name</label>
                  <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '2px', color: 'var(--color-text-primary)' }}>{selectedLog.staff_name || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Overall Comment */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '8px 0 12px 0', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Comment</h4>
              <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--color-text-primary)', padding: '16px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid var(--color-border-light)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                {selectedLog.comment ? (
                  <span>{selectedLog.comment}</span>
                ) : (
                  <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No overall comment provided.</span>
                )}
              </div>
            </div>

            {/* Signature */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '8px 0 12px 0', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Signature</h4>
              <div>
                {selectedLog.signature ? (
                  <div style={{ border: '1px solid var(--color-border-light)', borderRadius: '12px', padding: '16px', display: 'inline-block', backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <img src={selectedLog.signature} alt="Signature" style={{ height: '80px', maxWidth: '100%', objectFit: 'contain' }} />
                  </div>
                ) : (
                  <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '16px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid var(--color-border-light)' }}>
                    No signature provided.
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: '8px' }}>
              <Button variant="primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} onClick={() => router.visit(`/haccp-logs/cleaning/view/${selectedLog.id}`)}>
                View Full Checklist Details
              </Button>
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

export default CleaningMonitoringPage;
