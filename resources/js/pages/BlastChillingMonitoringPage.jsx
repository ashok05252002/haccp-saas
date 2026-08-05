import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { Plus, ArrowLeft, Snowflake } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import axios from 'axios';

const BlastChillingMonitoringPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/blast-chilling-logs');
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch blast chilling logs', err);
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
      const matchStaff = log.staff_name?.toLowerCase().includes(q);
      const matchDate = log.log_date?.includes(q);
      const matchProbe = log.probe_id?.toLowerCase().includes(q);
      return matchFood || matchStaff || matchDate || matchProbe;
    });
  }, [logs, searchQuery]);

  return (
    <PageLayout>
      <Head title="Blast Chilling Logs" />

      <div>
        <button onClick={() => router.visit('/haccp-logs')} className="back-btn">
          <ArrowLeft size={16} />
          <span>Back to HACCP Logs</span>
        </button>

        <div className="panel-header-row">
          <div>
            <h1 className="page-title">Blast Chilling & Rapid Cooling Logs</h1>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              CCP-4 Monitoring — Rapid cooling compliance from ≥63°C to ≤3°C within 90 mins.
            </p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => router.visit('/haccp-logs/blast-chilling/add')}>
            Add Entry
          </Button>
        </div>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Snowflake size={20} color="var(--color-primary)" />
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                  Blast Chilling Logs
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
              No blast chilling logs found. Click "Add Entry" to record one.
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
                  <th>Food Item</th>
                  <th>Thermometer / Probe</th>
                  <th>Start & End Temp</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => {
                  const isPassed = log.check_passed ?? true;
                  return (
                    <tr key={log.id}>
                      <td>
                        <strong style={{ color: 'var(--color-text-primary)' }}>{log.log_date}</strong>
                        <span style={{ color: 'var(--color-text-secondary)', marginLeft: '6px', fontSize: '13px' }}>
                          {log.log_time}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--color-text-primary)' }}>{log.food_item}</strong>
                      </td>
                      <td>{log.probe_id || '-'}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: isPassed ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {log.start_temp !== null ? `${log.start_temp} °C` : '-'} → {log.end_temp !== null ? `${log.end_temp} °C` : '-'}
                        </span>
                      </td>
                      <td>{log.duration_minutes !== null ? `${log.duration_minutes} mins` : '-'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontWeight: 600,
                            color: isPassed ? 'var(--color-success)' : 'var(--color-danger)',
                            fontSize: '13px'
                          }}>
                            {isPassed ? 'Passed' : 'Failed'}
                          </span>
                          {!isPassed && (
                            <span style={{ fontSize: '11px', backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                              Limit Breach
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => router.visit(`/haccp-logs/blast-chilling/view/${log.id}`)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </PageLayout>
  );
};

export default BlastChillingMonitoringPage;
