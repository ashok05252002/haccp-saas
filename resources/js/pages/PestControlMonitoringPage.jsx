import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { Plus, Search, Calendar, Eye, Pencil, Trash2, CheckCircle2, AlertTriangle, Bug, ArrowLeft, ShieldCheck, UserCheck } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import ManagerPinModal from '../components/common/ManagerPinModal';
import useHaccpEditGate from '../hooks/useHaccpEditGate';
import axios from 'axios';

const PestControlMonitoringPage = () => {
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
      const res = await axios.get('/api/pest-control-logs');
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch pest control logs', err);
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
      await axios.delete(`/api/pest-control-logs/${deleteId}`);
      setDeleteId(null);
      fetchLogs();
    } catch (err) {
      console.error('Failed to delete pest control log', err);
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
        (log.check_type && log.check_type.toLowerCase().includes(q)) ||
        (log.pest_type && log.pest_type.toLowerCase().includes(q)) ||
        (log.location_found && log.location_found.toLowerCase().includes(q)) ||
        (log.contractor_name && log.contractor_name.toLowerCase().includes(q));

      const matchDate = !dateFilter || log.log_date === dateFilter;
      const matchStatus = statusFilter === 'ALL' || log.status === statusFilter;

      return matchSearch && matchDate && matchStatus;
    });
  }, [logs, searchQuery, dateFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = logs.length;
    const passed = logs.filter(l => l.status === 'Passed').length;
    const activityReported = logs.filter(l => l.pest_activity_observed).length;
    const contractorVisits = logs.filter(l => l.check_type === 'Contractor Visit' || l.contractor_contacted).length;
    return { total, passed, activityReported, contractorVisits };
  }, [logs]);

  return (
    <PageLayout>
      <Head title="Pest Prevention & Activity Logs" />

      <div>
        <button onClick={() => router.visit('/haccp-logs')} className="back-btn" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} />
          <span>Back to HACCP Logs</span>
        </button>

        {/* Page Header */}
        <div className="panel-header-row" style={{ marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 className="page-title">Pest Prevention & Activity Log</h1>
              <span className="badge badge-prp">PRP</span>
              <span className="badge badge-standard">EC 852/2004 Annex II</span>
            </div>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Record premises protection checks, pest sightings/evidence, corrective actions, and professional contractor visits.
            </p>
          </div>

          <Button variant="primary" icon={Plus} onClick={() => router.visit('/haccp-logs/pest-control/add')}>
            Log Pest Control Check
          </Button>
        </div>

        {/* Summary Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <Card style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-primary)' }}>{stats.total}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Total Inspections</div>
            </div>
          </Card>

          <Card style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#059669' }}>{stats.passed}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Passed Checks</div>
            </div>
          </Card>

          <Card style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
              <Bug size={22} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#DC2626' }}>{stats.activityReported}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Pest Activity Sighted</div>
            </div>
          </Card>

          <Card style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
              <UserCheck size={22} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#7C3AED' }}>{stats.contractorVisits}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Contractor Visits</div>
            </div>
          </Card>
        </div>

        {/* Filter Controls Bar */}
        <Card style={{ padding: '16px 20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by check type, staff, pest type, location, contractor..." />
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
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading pest control logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No pest control log entries found. Click "Log Pest Control Check" to add one.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Premises Status</th>
                  <th>Pest Activity</th>
                  <th>Location & Evidence</th>
                  <th>Contractor Visit</th>
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
                      {log.status === 'Passed' ? (
                        <span style={{ color: '#059669', fontSize: '13px', fontWeight: 600 }}>All Checks OK</span>
                      ) : (
                        <span style={{ color: '#DC2626', fontSize: '13px', fontWeight: 600 }}>Follow-up Required</span>
                      )}
                    </td>
                    <td>
                      {log.pest_activity_observed ? (
                        <span style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', border: '1px solid #F8B4B4', padding: '2px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 700 }}>
                          YES - {log.pest_type || 'Pest Activity'}
                        </span>
                      ) : (
                        <span style={{ backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600 }}>
                          No Activity
                        </span>
                      )}
                    </td>
                    <td>
                      {log.pest_activity_observed ? (
                        <div>
                          <div><strong>Location:</strong> {log.location_found || '-'}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>{log.evidence_observed || '-'}</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                      )}
                    </td>
                    <td>
                      {log.contractor_name ? (
                        <div>
                          <div>{log.contractor_name}</div>
                          {log.report_ref_number && <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>Ref: {log.report_ref_number}</div>}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>None</span>
                      )}
                    </td>
                    <td>{log.staff_name}</td>
                    <td>
                      <StatusBadge status={log.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <Button variant="secondary" size="sm" icon={Eye} onClick={() => router.visit(`/haccp-logs/pest-control/view/${log.id}`)} />
                        <Button variant="secondary" size="sm" icon={Pencil} onClick={() => requestEdit(`/haccp-logs/pest-control/edit/${log.id}`)} />
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
                Are you sure you want to delete this pest control log entry? This action cannot be undone.
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

export default PestControlMonitoringPage;
