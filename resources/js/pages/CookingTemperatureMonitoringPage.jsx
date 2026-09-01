import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { Plus, ArrowLeft, Flame, CheckCircle, AlertTriangle, Clock, ArrowRight, Play } from 'lucide-react';
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

  // Separate in-progress batches from completed logs
  const inProgressLogs = useMemo(() => {
    return logs.filter(log => log.status === 'IN_PROGRESS');
  }, [logs]);

  const completedLogs = useMemo(() => {
    return logs.filter(log => log.status !== 'IN_PROGRESS');
  }, [logs]);

  const filteredCompletedLogs = useMemo(() => {
    return completedLogs.filter(log => {
      const q = searchQuery.toLowerCase();
      const matchFood = log.food_item?.toLowerCase().includes(q);
      const matchStaff = log.staff_name?.toLowerCase().includes(q);
      const matchDate = log.log_date?.includes(q);
      return matchFood || matchStaff || matchDate;
    });
  }, [completedLogs, searchQuery]);

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

        {/* ACTIVE IN-PROGRESS BATCHES SECTION */}
        {inProgressLogs.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#D97706" />
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                  Active In-Progress Batches
                </h2>
                <span style={{ 
                  backgroundColor: '#FEF3C7', 
                  color: '#92400E', 
                  fontSize: '12px', 
                  fontWeight: 700, 
                  padding: '2px 8px', 
                  borderRadius: '10px' 
                }}>
                  {inProgressLogs.length} Active
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
              {inProgressLogs.map(batch => (
                <div 
                  key={batch.id} 
                  style={{
                    backgroundColor: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#92400E' }}>
                        {batch.food_item}
                      </div>
                      <div style={{ fontSize: '12px', color: '#B45309', marginTop: '2px' }}>
                        {batch.batch_code ? `Batch: ${batch.batch_code}` : 'No Batch Code'}
                      </div>
                    </div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: '#FDE68A',
                      color: '#78350F',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#D97706' }}></span>
                      IN PROGRESS
                    </span>
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '8px', 
                    fontSize: '12px', 
                    color: '#78350F',
                    borderTop: '1px dashed #FCD34D',
                    paddingTop: '10px'
                  }}>
                    <div>
                      <span style={{ color: '#92400E', fontWeight: 500 }}>Started: </span>
                      <strong style={{ fontWeight: 600 }}>{batch.log_date} {batch.log_time}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#92400E', fontWeight: 500 }}>Staff: </span>
                      <strong style={{ fontWeight: 600 }}>{batch.staff_name || 'N/A'}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={() => router.visit(`/haccp-logs/cooking-temperature/edit/${batch.id}`)}
                      style={{ 
                        backgroundColor: '#D97706', 
                        borderColor: '#D97706',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>Resume Batch</span>
                      <ArrowRight size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COMPLETED LOG HISTORY TABLE */}
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
          ) : completedLogs.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No completed cooking logs found. Click "Add Entry" to record one.
            </div>
          ) : filteredCompletedLogs.length === 0 ? (
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
                {filteredCompletedLogs.map(log => {
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
