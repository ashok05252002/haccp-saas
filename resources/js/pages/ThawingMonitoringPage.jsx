import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { Plus, Search, Calendar, Eye, Trash2, ArrowLeft, Snowflake, Thermometer, AlertTriangle } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import Modal from '../components/common/Modal';
import axios from 'axios';

const ThawingMonitoringPage = () => {
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
      const res = await axios.get('/api/thawing-logs');
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch thawing logs', err);
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
      await axios.delete(`/api/thawing-logs/${deleteId}`);
      setDeleteId(null);
      fetchLogs();
    } catch (err) {
      console.error('Failed to delete thawing log', err);
      alert('Failed to delete log entry.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        (log.food_item_name && log.food_item_name.toLowerCase().includes(q)) ||
        (log.defrost_method && log.defrost_method.toLowerCase().includes(q)) ||
        (log.signed_by_staff_name && log.signed_by_staff_name.toLowerCase().includes(q));

      const matchDate = !dateFilter || log.log_date === dateFilter;

      return matchSearch && matchDate;
    });
  }, [logs, searchQuery, dateFilter]);

  const stats = useMemo(() => {
    const total = logs.length;
    let itemsThawed = total;

    return { total, itemsThawed };
  }, [logs]);

  return (
    <PageLayout>
      <Head title="Thawing / Defrosting Records" />

      <div>
        <button onClick={() => router.visit('/haccp-logs')} className="back-btn" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} />
          <span>Back to HACCP Logs</span>
        </button>

        {/* Page Header */}
        <div className="panel-header-row" style={{ marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 className="page-title">Thawing / Defrosting Record</h1>
              <span className="badge badge-ccp">CCP</span>
              <span className="badge badge-standard">EC 852/2004 Annex II</span>
            </div>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Log controlled defrosting methods, completion times, and core temperatures to ensure safe food thawing (≤5°C).
            </p>
          </div>

          <Button variant="primary" icon={Plus} onClick={() => router.visit('/haccp-logs/thawing/add')}>
            Log Thawing / Defrosting
          </Button>
        </div>

        {/* Summary Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <Card style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
              <Snowflake size={22} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-primary)' }}>{stats.total}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Total Defrost Logs</div>
            </div>
          </Card>

          <Card style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#047857' }}>
              <Thermometer size={22} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#047857' }}>{stats.itemsThawed}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Items Thawed</div>
            </div>
          </Card>
        </div>

        {/* Filter Controls Bar */}
        <Card style={{ padding: '16px 20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by food item, method, staff..." />
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
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading thawing logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No thawing log entries found. Click "Log Thawing / Defrosting" to add one.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Food Item</th>
                  <th>Defrost Method</th>
                  <th>Defrost Temp (°C)</th>
                  <th>Staff Member</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => {
                  const isHigh = parseFloat(log.defrost_temp) > 5.0;

                  return (
                    <tr key={log.id}>
                      <td>
                        <strong style={{ color: 'var(--color-text-primary)' }}>{log.log_date}</strong>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{log.log_time}</div>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--color-primary)' }}>{log.food_item_name}</strong>
                        {log.storage_location && <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{log.storage_location}</div>}
                      </td>
                      <td>{log.defrost_method}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: isHigh ? '#DC2626' : 'inherit' }}>
                          {log.defrost_temp !== null ? `${log.defrost_temp}°C` : '-'}
                          {isHigh && <span style={{ fontSize: '11px', marginLeft: '4px', color: '#DC2626' }}>(&gt;5°C)</span>}
                        </span>
                      </td>
                      <td>{log.signed_by_staff_name}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <Button variant="secondary" size="sm" icon={Eye} onClick={() => router.visit(`/haccp-logs/thawing/view/${log.id}`)} />
                          <Button variant="secondary" size="sm" icon={Trash2} onClick={() => confirmDelete(log.id)} style={{ color: '#EF4444' }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
                Are you sure you want to delete this thawing log entry? This action cannot be undone.
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

export default ThawingMonitoringPage;
