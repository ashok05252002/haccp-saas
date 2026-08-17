import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { Plus, Search, Calendar, Eye, Pencil, Trash2, CheckCircle2, AlertTriangle, Droplets, ArrowLeft, RefreshCw } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import StatusBadge from '../components/common/StatusBadge';
import axios from 'axios';

const FryerOilMonitoringPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/fryer-oil-logs');
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch fryer oil logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this fryer oil log entry?')) return;
    try {
      await axios.delete(`/api/fryer-oil-logs/${id}`);
      fetchLogs();
    } catch (err) {
      alert('Failed to delete log entry.');
    }
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        (log.staff_name && log.staff_name.toLowerCase().includes(q)) ||
        (log.fryer_station && log.fryer_station.toLowerCase().includes(q)) ||
        (log.oil_condition && log.oil_condition.toLowerCase().includes(q)) ||
        (log.disposal_type && log.disposal_type.toLowerCase().includes(q)) ||
        (log.waste_contractor && log.waste_contractor.toLowerCase().includes(q));

      const matchDate = !dateFilter || log.log_date === dateFilter;
      const matchStatus = statusFilter === 'ALL' || log.status === statusFilter;

      return matchSearch && matchDate && matchStatus;
    });
  }, [logs, searchQuery, dateFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = logs.length;
    const passed = logs.filter(l => l.status === 'Passed').length;
    const attention = logs.filter(l => l.status === 'Attention Required').length;
    const totalOilDisposed = logs.reduce((acc, l) => acc + (parseFloat(l.disposal_quantity) || 0), 0);
    return { total, passed, attention, totalOilDisposed };
  }, [logs]);

  return (
    <PageLayout>
      <Head title="Fryer Oil & Grease Management Logs" />

      <div>
        <button onClick={() => router.visit('/haccp-logs')} className="back-btn" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} />
          <span>Back to HACCP Logs</span>
        </button>

        {/* Page Header */}
        <div className="panel-header-row" style={{ marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 className="page-title">Fryer Oil & Grease Management</h1>
              <span className="badge badge-prp">PRP</span>
              <span className="badge badge-standard">EU 2017/2158 Acrylamide Control</span>
            </div>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Track fryer oil temperatures, oil quality checks, replacement cycles, grease trap cleanings, and waste disposal.
            </p>
          </div>

          <Button variant="primary" icon={Plus} onClick={() => router.visit('/haccp-logs/fryer-oil/add')}>
            Log Fryer Oil Check
          </Button>
        </div>

        {/* Summary Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <Card style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
              <Droplets size={22} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-primary)' }}>{stats.total}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Total Logs</div>
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
              <AlertTriangle size={22} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#DC2626' }}>{stats.attention}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Attention Required</div>
            </div>
          </Card>

          <Card style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
              <RefreshCw size={22} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#D97706' }}>{stats.totalOilDisposed} L</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Waste Oil Disposed</div>
            </div>
          </Card>
        </div>

        {/* Filter Controls Bar */}
        <Card style={{ padding: '16px 20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by station, staff, oil condition, contractor..." />
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
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading fryer oil logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No fryer oil log entries found. Click "Log Fryer Oil Check" to add one.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Station</th>
                  <th>Frying Temp</th>
                  <th>Oil Condition</th>
                  <th>Quality Result</th>
                  <th>Action Taken</th>
                  <th>Disposal & Contractor</th>
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
                      <strong style={{ color: 'var(--color-text-primary)' }}>{log.fryer_station}</strong>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: log.frying_temp > 175 ? '#DC2626' : '#059669' }}>
                        {log.frying_temp} °C
                      </span>
                    </td>
                    <td>{log.oil_condition}</td>
                    <td>
                      {log.oil_quality_acceptable ? (
                        <span style={{ backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600 }}>
                          Acceptable
                        </span>
                      ) : (
                        <span style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', border: '1px solid #F8B4B4', padding: '2px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600 }}>
                          Not Acceptable
                        </span>
                      )}
                    </td>
                    <td>{log.oil_action_taken}</td>
                    <td>
                      <div>{log.disposal_type}</div>
                      {log.waste_contractor && <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>{log.waste_contractor}</div>}
                    </td>
                    <td>{log.staff_name}</td>
                    <td>
                      <StatusBadge status={log.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <Button variant="secondary" size="sm" icon={Eye} onClick={() => router.visit(`/haccp-logs/fryer-oil/view/${log.id}`)} />
                        <Button variant="secondary" size="sm" icon={Pencil} onClick={() => router.visit(`/haccp-logs/fryer-oil/edit/${log.id}`)} />
                        <Button variant="secondary" size="sm" icon={Trash2} onClick={() => handleDelete(log.id)} style={{ color: '#EF4444' }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </PageLayout>
  );
};

export default FryerOilMonitoringPage;
