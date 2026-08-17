import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { Plus, Search, Calendar, Eye, Pencil, Trash2, ArrowLeft, Flame, Thermometer, AlertTriangle } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import Modal from '../components/common/Modal';
import axios from 'axios';

const HotHoldingMonitoringPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Delete Confirmation Modal State
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/hot-holding-logs');
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch hot holding logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const confirmDelete = (id) => {
    setDeleteId(id);
  };

  const handleExecuteDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/hot-holding-logs/${deleteId}`);
      setDeleteId(null);
      fetchLogs();
    } catch (err) {
      console.error('Failed to delete hot holding log', err);
      alert('Failed to delete log entry.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        (log.staff_name && log.staff_name.toLowerCase().includes(q)) ||
        (log.holding_unit && log.holding_unit.toLowerCase().includes(q));

      const matchDate = !dateFilter || log.log_date === dateFilter;

      return matchSearch && matchDate;
    });
  }, [logs, searchQuery, dateFilter]);

  const stats = useMemo(() => {
    const total = logs.length;
    let itemsMonitored = 0;

    logs.forEach(l => {
      if (Array.isArray(l.items)) itemsMonitored += l.items.length;
    });

    return { total, itemsMonitored };
  }, [logs]);

  return (
    <PageLayout>
      <Head title="Hot Holding / Bain Marie Logs" />

      <div>
        <button onClick={() => router.visit('/haccp-logs')} className="back-btn" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} />
          <span>Back to HACCP Logs</span>
        </button>

        {/* Page Header */}
        <div className="panel-header-row" style={{ marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 className="page-title">Hot Holding / Bain Marie</h1>
              <span className="badge badge-ccp">CCP</span>
              <span className="badge badge-standard">EC 852/2004 Annex II</span>
            </div>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Monitor bain marie, hot display counters, and heated units to verify safe holding temperatures (≥63°C).
            </p>
          </div>

          <Button variant="primary" icon={Plus} onClick={() => router.visit('/haccp-logs/hot-holding/add')}>
            Log Hot Holding
          </Button>
        </div>

        {/* Summary Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <Card style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EA580C' }}>
              <Flame size={22} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-primary)' }}>{stats.total}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Total Holding Logs</div>
            </div>
          </Card>

          <Card style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
              <Thermometer size={22} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#2563EB' }}>{stats.itemsMonitored}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Items Monitored</div>
            </div>
          </Card>
        </div>

        {/* Filter Controls Bar */}
        <Card style={{ padding: '16px 20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by staff, unit..." />
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} color="var(--color-text-muted)" />
                <input
                  type="date"
                  className="form-input"
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  style={{ width: '150px', padding: '6px 10px', fontSize: '13px' }}
                />
                {dateFilter && (
                  <button onClick={() => setDateFilter('')} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Logs Table */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading hot holding logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No hot holding log entries found. Click "Log Hot Holding" to add one.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Holding Unit</th>
                  <th>Items Monitored</th>
                  <th>Staff Member</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <strong style={{ color: 'var(--color-text-primary)' }}>{log.log_date}</strong>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{log.log_time}</div>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--color-primary)' }}>{log.holding_unit}</strong>
                    </td>
                    <td>
                      <span>{Array.isArray(log.items) ? log.items.length : 0} items</span>
                    </td>
                    <td>{log.staff_name}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <Button variant="secondary" size="sm" icon={Eye} onClick={() => router.visit(`/haccp-logs/hot-holding/view/${log.id}`)} />
                        <Button variant="secondary" size="sm" icon={Pencil} onClick={() => router.visit(`/haccp-logs/hot-holding/edit/${log.id}`)} />
                        <Button variant="secondary" size="sm" icon={Trash2} onClick={() => confirmDelete(log.id)} style={{ color: '#EF4444' }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* Custom UI Delete Confirmation Modal */}
        <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Confirm Delete">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#DC2626' }}>
              <AlertTriangle size={24} />
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                Are you sure you want to delete this hot holding log entry? This action cannot be undone.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <Button variant="secondary" onClick={() => setDeleteId(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleExecuteDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete Log Entry'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageLayout>
  );
};

export default HotHoldingMonitoringPage;
