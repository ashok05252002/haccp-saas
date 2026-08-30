import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { Plus, ArrowLeft, Flame, CheckCircle, AlertTriangle } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import ManagerPinModal from '../components/common/ManagerPinModal';
import useHaccpEditGate from '../hooks/useHaccpEditGate';
import axios from 'axios';

const CookingTemperatureMonitoringPage = () => {
  const { requestEdit, pinModalOpen, handlePinSuccess, handlePinClose } = useHaccpEditGate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/cooking-logs');
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch cooking logs', err);
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
      return matchFood || matchStaff || matchDate;
    });
  }, [logs, searchQuery]);

  return (
    <PageLayout>
      <Head title="Cooking & Process Logs" />

      <div>
        <button onClick={() => router.visit('/haccp-logs')} className="back-btn">
          <ArrowLeft size={16} />
          <span>Back to HACCP Logs</span>
        </button>

        <div className="panel-header-row">
          <div>
            <h1 className="page-title">Cooking Temperature & Process Logs</h1>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Monitor daily Cook, Cool, Reheat & Hot Holding process logs.
            </p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => router.visit('/haccp-logs/cooking-temperature/add')}>
            Add Entry
          </Button>
        </div>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={20} color="var(--color-primary)" />
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                  Process Log History
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <SearchBar 
                  value={searchQuery} 
                  onChange={setSearchQuery} 
                  placeholder="Search by food item or staff..." 
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
              No cooking logs found. Click "Add Entry" to record one.
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No logs matching your search query.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Food Item / Product</th>
                  <th>Cooking Temp</th>
                  <th>Blast Chilling</th>
                  <th>Staff Member</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => {
                  const isCookingOk = log.cooking_passed ?? true;
                  const isChillingOk = log.chilling_passed ?? true;

                  return (
                    <tr key={log.id}>
                      <td>
                        <strong style={{ color: 'var(--color-text-primary)' }}>{log.log_date}</strong>
                        <span style={{ color: 'var(--color-text-secondary)', marginLeft: '6px', fontSize: '13px' }}>{log.log_time}</span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--color-text-primary)' }}>{log.food_item}</strong>
                        {log.batch_code && <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Batch: {log.batch_code}</div>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700, color: isCookingOk ? '#047857' : '#B91C1C' }}>
                            {log.cooking_temp !== null ? `${log.cooking_temp} °C` : '-'}
                          </span>
                          {log.cooking_temp !== null && (
                            isCookingOk 
                              ? <CheckCircle size={16} color="#10B981" /> 
                              : <AlertTriangle size={16} color="#EF4444" />
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, color: isChillingOk ? '#0891B2' : '#B91C1C' }}>
                            {log.chilling_end_temp !== null ? `${log.chilling_end_temp} °C` : '-'}
                          </span>
                          {log.chilling_end_temp !== null && (
                            isChillingOk 
                              ? <CheckCircle size={16} color="#06B6D4" /> 
                              : <AlertTriangle size={16} color="#EF4444" />
                          )}
                        </div>
                      </td>
                      <td>{log.staff_name || '-'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <Button variant="secondary" size="sm" onClick={() => router.visit(`/haccp-logs/cooking-temperature/view/${log.id}`)}>
                            View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => requestEdit(`/haccp-logs/cooking-temperature/edit/${log.id}`)}>
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <ManagerPinModal
        isOpen={pinModalOpen}
        onClose={handlePinClose}
        onSuccess={handlePinSuccess}
      />
    </PageLayout>
  );
};

export default CookingTemperatureMonitoringPage;
