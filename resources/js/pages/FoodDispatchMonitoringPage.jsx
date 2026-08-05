import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { Plus, ArrowLeft, Truck, CheckCircle, AlertTriangle, Eye } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import DataTable from '../components/common/DataTable';
import axios from 'axios';

const FoodDispatchMonitoringPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/food-dispatch-logs');
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch food dispatch logs', err);
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
      const matchFood = log.food_item?.toLowerCase().includes(q);
      const matchDest = log.destination?.toLowerCase().includes(q);
      const matchStaff = log.staff_name?.toLowerCase().includes(q);
      const matchBatch = log.batch_code?.toLowerCase().includes(q);
      const matchDate = log.log_date?.includes(q);
      return matchFood || matchDest || matchStaff || matchBatch || matchDate;
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
      header: 'Food / Product',
      key: 'food_item',
      render: (log) => (
        <div>
          <strong style={{ color: 'var(--color-text-primary)' }}>{log.food_item}</strong>
          {log.batch_code && (
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Batch: {log.batch_code}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Destination',
      key: 'destination',
      render: (log) => log.destination || '-',
    },
    {
      header: 'Use By Date',
      key: 'use_by_date',
      render: (log) => log.use_by_date || '-',
    },
    {
      header: 'Dispatch Temp (°C)',
      key: 'temperature',
      render: (log) => {
        const isValid = log.temp_in_range ?? true;
        return (
          <span style={{ fontWeight: 600, color: isValid ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {log.temperature !== null ? `${log.temperature} °C` : '-'}
          </span>
        );
      },
    },
    {
      header: 'Separation',
      key: 'separation',
      render: (log) => log.separation ? (
        <span style={{ fontWeight: 600, color: 'var(--color-success)', fontSize: '13px' }}>Verified</span>
      ) : (
        <span style={{ fontWeight: 600, color: 'var(--color-danger)', fontSize: '13px' }}>Flagged</span>
      ),
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
              Action Required
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
          onClick={() => router.visit(`/haccp-logs/food-dispatch/view/${log.id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <PageLayout>
      <Head title="Food Dispatch & Transfer Logs" />

      <div>
        <button onClick={() => router.visit('/haccp-logs')} className="back-btn">
          <ArrowLeft size={16} />
          <span>Back to HACCP Logs</span>
        </button>

        <div className="panel-header-row">
          <div>
            <h1 className="page-title">Food Dispatch & Transfer Logs</h1>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Record and monitor safe food transport and dispatch to branches, events, or customers.
            </p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => router.visit('/haccp-logs/food-dispatch/add')}>
            Add Entry
          </Button>
        </div>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={20} color="var(--color-primary)" />
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                  Food Dispatch Logs
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
              No food dispatch logs found. Click "Add Entry" to record one.
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

export default FoodDispatchMonitoringPage;
