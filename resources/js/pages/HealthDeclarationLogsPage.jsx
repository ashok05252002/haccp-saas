import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { Plus, ArrowLeft, HeartPulse, Eye, Trash2, CheckCircle, AlertTriangle, XCircle, Printer } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import Modal from '../components/common/Modal';
import axios from 'axios';

const HealthDeclarationLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/health-declaration-logs');
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch health declaration logs', err);
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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this health declaration log?')) return;
    try {
      await axios.delete(`/api/health-declaration-logs/${id}`);
      fetchLogs();
    } catch (err) {
      console.error('Failed to delete log', err);
      alert('Failed to delete health declaration log.');
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const q = searchQuery.toLowerCase();
      const matchStaff = (log.staff_name || '').toLowerCase().includes(q);
      const matchStatus = (log.overall_status || '').toLowerCase().includes(q);
      const matchDate = (log.log_date || '').includes(q);
      
      return matchStaff || matchStatus || matchDate;
    });
  }, [logs, searchQuery]);

  const renderStatusBadge = (status) => {
    if (status === 'Fit for Work') {
      return (
        <span style={{
          backgroundColor: '#ECFDF5',
          color: '#059669',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <CheckCircle size={14} /> Fit for Work
        </span>
      );
    }
    return (
      <span style={{
        backgroundColor: '#FEF2F2',
        color: '#DC2626',
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <AlertTriangle size={14} /> {status || 'Action Required'}
      </span>
    );
  };

  return (
    <PageLayout>
      <Head title="Staff Health Declaration Logs" />

      <div>
        <button onClick={() => router.visit('/haccp-logs')} className="back-btn">
          <ArrowLeft size={16} />
          <span>Back to HACCP Logs</span>
        </button>

        <div className="panel-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <HeartPulse size={28} color="var(--color-primary)" />
              <span>Staff Health Declaration Logs</span>
            </h1>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px', margin: 0 }}>
              Review staff health screening submissions and fit-for-duty certifications.
            </p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => router.visit('/haccp-logs/health-declaration/add')}>
            New Declaration Log
          </Button>
        </div>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HeartPulse size={20} color="var(--color-primary)" />
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                  Health Declaration History
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <SearchBar 
                  value={searchQuery} 
                  onChange={setSearchQuery} 
                  placeholder="Search staff, date, status..." 
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              Loading health declaration logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <HeartPulse size={48} color="var(--color-text-muted)" style={{ marginBottom: '12px', opacity: 0.5 }} />
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                {searchQuery ? 'No matching health declaration logs found' : 'No Staff Health Declarations Recorded'}
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
                {searchQuery ? 'Try clearing your search filters.' : 'Record your first daily staff health screening declaration.'}
              </p>
              {!searchQuery && (
                <Button variant="primary" icon={Plus} onClick={() => router.visit('/haccp-logs/health-declaration/add')}>
                  Create Declaration
                </Button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Staff Name</th>
                    <th>Fit for Duty Status</th>
                    <th>Symptoms Flagged</th>
                    <th>Comments / Notes</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <strong style={{ color: 'var(--color-text-primary)', fontSize: '14px' }}>{log.log_date}</strong>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{log.log_time}</div>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--color-text-primary)', fontSize: '14px' }}>
                          {log.staff_name || 'Staff Member'}
                        </strong>
                      </td>
                      <td>{renderStatusBadge(log.overall_status)}</td>
                      <td>
                        {log.symptoms_reported ? (
                          <span style={{ color: '#DC2626', fontWeight: 700, fontSize: '12px', backgroundColor: '#FEE2E2', padding: '3px 8px', borderRadius: '8px' }}>
                            Yes — Symptoms Reported
                          </span>
                        ) : (
                          <span style={{ color: '#059669', fontWeight: 600, fontSize: '12px' }}>
                            None (Clear)
                          </span>
                        )}
                      </td>
                      <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        {log.comment || '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => router.visit(`/haccp-logs/health-declaration/view/${log.id}`)}
                            title="View Full Declaration"
                            style={{
                              background: 'none',
                              border: '1px solid var(--color-border-light)',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: 'var(--color-primary)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: 600
                            }}
                          >
                            <Eye size={14} /> View
                          </button>
                          <button
                            onClick={() => handleDelete(log.id)}
                            title="Delete Entry"
                            style={{
                              background: 'none',
                              border: '1px solid #FCA5A5',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: '#DC2626',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </PageLayout>
  );
};

export default HealthDeclarationLogsPage;
