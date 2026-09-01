import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { Plus, Search, Calendar, Eye, Pencil, Trash2, CheckCircle2, AlertTriangle, ArrowLeft, Trash, Scale, Euro } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import ManagerPinModal from '../components/common/ManagerPinModal';
import useHaccpEditGate from '../hooks/useHaccpEditGate';
import axios from 'axios';

const FoodWasteMonitoringPage = () => {
  const { requestEdit, pinModalOpen, handlePinSuccess, handlePinClose } = useHaccpEditGate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/food-waste-logs');
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch food waste logs', err);
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
      await axios.delete(`/api/food-waste-logs/${deleteId}`);
      setDeleteId(null);
      fetchLogs();
    } catch (err) {
      console.error('Failed to delete log entry', err);
      alert('Failed to delete log entry.');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        (log.staff_name && log.staff_name.toLowerCase().includes(q)) ||
        (log.main_reason && log.main_reason.toLowerCase().includes(q)) ||
        (log.quantity_summary && log.quantity_summary.toLowerCase().includes(q));

      const matchDate = !dateFilter || log.log_date === dateFilter;
      const matchStatus = statusFilter === 'ALL' || log.status === statusFilter;

      return matchSearch && matchDate && matchStatus;
    });
  }, [logs, searchQuery, dateFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = logs.length;
    let costSum = 0;
    let totalItemsCount = 0;
    let attentionRequired = 0;

    logs.forEach(l => {
      costSum += parseFloat(l.total_cost_impact) || 0;
      totalItemsCount += parseInt(l.total_entries) || 0;
      if (l.status === 'Attention Required') attentionRequired++;
    });

    return { total, costSum, totalItemsCount, attentionRequired };
  }, [logs]);

  return (
    <PageLayout>
      <Head title="Food Waste & Disposal Logs" />

      <div>
        <button onClick={() => router.visit('/haccp-logs')} className="back-btn" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} />
          <span>Back to HACCP Logs</span>
        </button>

        {/* Page Header */}
        <div className="panel-header-row" style={{ marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 className="page-title">Food Waste & Disposal Log</h1>
              <span className="badge badge-prp">PRP</span>
              <span className="badge badge-standard">EC 852/2004 Annex II</span>
            </div>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Track wasted food, disposal reasons, financial cost impact, and prevention measures.
            </p>
          </div>

          <Button variant="primary" icon={Plus} onClick={() => router.visit('/haccp-logs/food-waste/add')}>
            Log Food Waste
          </Button>
        </div>

        {/* Summary Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <Card style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
              <Trash size={22} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-primary)' }}>{stats.total}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Total Waste Logs</div>
            </div>
          </Card>

          <Card style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
              <Scale size={22} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#7C3AED' }}>{stats.totalItemsCount}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Total Items Logged</div>
            </div>
          </Card>

          <Card style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
              <Euro size={22} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#DC2626' }}>€{stats.costSum.toFixed(2)}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Total Cost Impact</div>
            </div>
          </Card>

          <Card style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#D97706' }}>{stats.attentionRequired}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Severe Risks / Expired</div>
            </div>
          </Card>
        </div>

        {/* Filter Controls Bar */}
        <Card style={{ padding: '16px 20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by staff, reason, quantity summary..." />
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

              <select
                className="form-select"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ width: '170px', padding: '6px 10px', fontSize: '13px' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="Passed">Passed</option>
                <option value="Attention Required">Attention Required</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Logs Table */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading food waste logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No food waste log entries found. Click "Log Food Waste" to add one.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Total Items</th>
                  <th>Quantity Breakdown</th>
                  <th>Main Reason</th>
                  <th>Cost Impact</th>
                  <th>Staff</th>
                  <th>Status</th>
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
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{log.total_entries} items</span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--color-text-primary)' }}>{log.quantity_summary || '0 kg'}</strong>
                    </td>
                    <td>
                      {log.main_reason || 'N/A'}
                    </td>
                    <td>
                      <strong style={{ color: parseFloat(log.total_cost_impact) > 0 ? '#DC2626' : 'var(--color-text-primary)' }}>
                        €{parseFloat(log.total_cost_impact || 0).toFixed(2)}
                      </strong>
                    </td>
                    <td>{log.staff_name}</td>
                    <td>
                      <StatusBadge status={log.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <Button variant="secondary" size="sm" icon={Eye} onClick={() => router.visit(`/haccp-logs/food-waste/view/${log.id}`)} />
                        <Button variant="secondary" size="sm" icon={Pencil} onClick={() => requestEdit(`/haccp-logs/food-waste/edit/${log.id}`)} />
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
                Are you sure you want to delete this food waste log entry? This action cannot be undone.
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

        <ManagerPinModal
          isOpen={pinModalOpen}
          onClose={handlePinClose}
          onSuccess={handlePinSuccess}
        />
      </div>
    </PageLayout>
  );
};

export default FoodWasteMonitoringPage;
