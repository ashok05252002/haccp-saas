import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { Plus, ArrowLeft, Gauge, CheckCircle, AlertTriangle, Eye } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import DataTable from '../components/common/DataTable';
import axios from 'axios';

const ProbeCalibrationMonitoringPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/probe-calibration-logs');
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch probe calibration logs', err);
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
      const matchProbe = log.probe_name?.toLowerCase().includes(q) || log.probe_serial_number?.toLowerCase().includes(q);
      const matchStaff = log.staff_name?.toLowerCase().includes(q);
      const matchDate = log.log_date?.includes(q);
      return matchProbe || matchStaff || matchDate;
    });
  }, [logs, searchQuery]);

  const columns = [
    {
      header: 'Date & Time',
      key: 'log_date',
      render: (log) => (
        <div>
          <strong style={{ color: 'var(--color-text-primary)' }}>{log.log_date}</strong>
          <span style={{ color: 'var(--color-text-secondary)', marginLeft: '6px', fontSize: '13px' }}>{log.log_time}</span>
        </div>
      ),
    },
    {
      header: 'Thermometer / Probe',
      key: 'probe_name',
      render: (log) => (
        <div>
          <strong style={{ color: 'var(--color-text-primary)' }}>{log.probe_name}</strong>
          {log.probe_serial_number && (
            <span style={{ color: 'var(--color-text-secondary)', marginLeft: '6px', fontSize: '12px' }}>
              ({log.probe_serial_number})
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Boiling Test (99-101°C)',
      key: 'boiling_temp',
      render: (log) => {
        const isValid = log.boiling_valid ?? true;
        return (
          <span style={{ fontWeight: 600, color: isValid ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {log.boiling_temp !== null ? `${log.boiling_temp} °C` : '-'}
          </span>
        );
      },
    },
    {
      header: 'Ice Test (-1 to +1°C)',
      key: 'ice_temp',
      render: (log) => {
        const isValid = log.ice_valid ?? true;
        return (
          <span style={{ fontWeight: 600, color: isValid ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {log.ice_temp !== null ? `${log.ice_temp} °C` : '-'}
          </span>
        );
      },
    },
    {
      header: 'Status',
      key: 'status',
      render: (log) => {
        const isPassed = log.passed ?? true;
        return isPassed ? (
          <span style={{ fontWeight: 600, color: 'var(--color-success)', fontSize: '13px' }}>
            Passed
          </span>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-danger)', fontSize: '13px' }}>
              Needs Review
            </span>
            <span style={{ fontSize: '11px', backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
              Out of Range
            </span>
          </div>
        );
      },
    },
    {
      header: 'Staff Member',
      key: 'staff_name',
      render: (log) => log.staff_name || '-',
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (log) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.visit(`/haccp-logs/probe-calibration/view/${log.id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <PageLayout>
      <Head title="Probe Accuracy Checks" />

      <div>
        <button onClick={() => router.visit('/haccp-logs')} className="back-btn">
          <ArrowLeft size={16} />
          <span>Back to HACCP Logs</span>
        </button>

        <div className="panel-header-row">
          <div>
            <h1 className="page-title">Probe Accuracy Checks</h1>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Verify food thermometer and probe accuracy using boiling water and ice water calibration tests.
            </p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => router.visit('/haccp-logs/probe-calibration/add')}>
            Add Entry
          </Button>
        </div>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Gauge size={20} color="var(--color-primary)" />
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                  Probe Accuracy Check History
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
              No probe calibration logs found. Click "Add Entry" to record one.
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No logs found matching your search.
            </div>
          ) : (
            <DataTable columns={columns} data={filteredLogs} />
          )}
        </Card>
      </div>
    </PageLayout>
  );
};

export default ProbeCalibrationMonitoringPage;
