import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Download, Printer, FileText, Calendar, CheckCircle2, AlertTriangle, Filter, BarChart3, Clock, ChevronRight } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import MultiSelectDropdown from '../components/common/MultiSelectDropdown';
import HaccpLogDetailDrawer from '../components/haccp/HaccpLogDetailDrawer';
import axios from 'axios';

const ALL_MODULE_OPTIONS = [
  { id: 'temperature', name: 'Temperature Monitoring' },
  { id: 'delivery-intake', name: 'Delivery Intake' },
  { id: 'cleaning', name: 'Cleaning & Sanitation' },
  { id: 'cooking-temperature', name: 'Cooking Temperature' },
  { id: 'blast-chilling', name: 'Blast Chilling' },
  { id: 'cooling-process', name: 'Cooling Process' },
  { id: 'probe-calibration', name: 'Probe Accuracy Check' },
  { id: 'food-dispatch', name: 'Food Dispatch & Transfer' },
  { id: 'fryer-oil', name: 'Fryer Oil & Grease Management' },
  { id: 'pest-control', name: 'Pest Prevention & Activity Log' },
  { id: 'food-waste', name: 'Food Waste & Disposal Log' },
  { id: 'hot-holding', name: 'Hot Holding / Bain Marie' },
  { id: 'staff-training', name: 'Staff Training & Hygiene Log' },
  { id: 'thawing', name: 'Thawing / Defrosting Record' },
  { id: 'health-declaration', name: 'Staff Health Declaration' },
];

const HaccpReportsPage = () => {
  const todayObj = new Date();
  const todayStr = todayObj.toISOString().split('T')[0];

  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [activePreset, setActivePreset] = useState('today');
  const [selectedModuleIds, setSelectedModuleIds] = useState([]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Drill-Down Drawer State
  const [selectedLogDetail, setSelectedLogDetail] = useState(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const openLogDetail = async (logRow) => {
    if (logRow.moduleId !== 'cooking-temperature') {
      return; // Pilot module only
    }

    setDetailDrawerOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setSelectedLogDetail(null);

    try {
      const res = await axios.get(`/api/haccp-reports/log-detail/cooking-temperature/${logRow.id}`);
      setSelectedLogDetail(res.data);
    } catch (err) {
      console.error('Failed to load detailed cooking temperature log', err);
      setDetailError(err.response?.data?.message || 'Failed to load detailed log record.');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeLogDetail = () => {
    setDetailDrawerOpen(false);
    setSelectedLogDetail(null);
    setDetailError(null);
  };

  // Quick Date Preset Helpers
  const handlePresetSelect = (presetType) => {
    setActivePreset(presetType);
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (presetType === 'today') {
      setFromDate(today);
      setToDate(today);
    } else if (presetType === 'this_week') {
      const dayOfWeek = now.getDay();
      const diffToMon = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diffToMon)).toISOString().split('T')[0];
      setFromDate(monday);
      setToDate(todayStr);
    } else if (presetType === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      setFromDate(firstDay);
      setToDate(todayStr);
    } else if (presetType === 'last_30_days') {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 30);
      setFromDate(past30.toISOString().split('T')[0]);
      setToDate(todayStr);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const moduleParam = selectedModuleIds.length > 0 ? selectedModuleIds.join(',') : 'all';
      const res = await axios.get('/api/haccp-reports', {
        params: {
          from_date: fromDate,
          to_date: toDate,
          preset: activePreset,
          module: moduleParam,
        },
      });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load HACCP report data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [fromDate, toDate, selectedModuleIds]);

  const handleCSV = () => {
    const moduleParam = selectedModuleIds.length > 0 ? selectedModuleIds.join(',') : 'all';
    window.open(`/api/haccp-reports/export-csv?from_date=${fromDate}&to_date=${toDate}&module=${moduleParam}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <PageLayout>
      <Head title="HACCP Reports & Audits" />

      <div className="haccp-reports-main-content">
        {/* Page Header */}
        <div className="panel-header-row" style={{ marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 className="page-title">HACCP Reports & Historical Audits</h1>
              <span className="badge badge-standard">Audit Ready</span>
            </div>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Aggregated historical log records for environmental health officers (EHO), managers & auditors.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" icon={Download} onClick={handleCSV}>
              Export CSV Report
            </Button>
            <Button variant="secondary" icon={Printer} onClick={handlePrint}>
              Print Report
            </Button>
          </div>
        </div>

        {/* Filter Controls Bar with Date Ranges & Multi-Select Modules */}
        <Card style={{ padding: '20px', marginBottom: '24px', borderRadius: '16px' }}>
          {/* Quick Date Range Preset Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
              Quick Date Filters:
            </span>

            <button
              type="button"
              onClick={() => handlePresetSelect('today')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: activePreset === 'today' ? 'var(--color-primary)' : '#F3F4F6',
                color: activePreset === 'today' ? '#fff' : 'var(--color-text-secondary)',
                transition: 'all 150ms ease',
              }}
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => handlePresetSelect('this_week')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: activePreset === 'this_week' ? 'var(--color-primary)' : '#F3F4F6',
                color: activePreset === 'this_week' ? '#fff' : 'var(--color-text-secondary)',
                transition: 'all 150ms ease',
              }}
            >
              This Week
            </button>

            <button
              type="button"
              onClick={() => handlePresetSelect('this_month')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: activePreset === 'this_month' ? 'var(--color-primary)' : '#F3F4F6',
                color: activePreset === 'this_month' ? '#fff' : 'var(--color-text-secondary)',
                transition: 'all 150ms ease',
              }}
            >
              This Month
            </button>

            <button
              type="button"
              onClick={() => handlePresetSelect('last_30_days')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: activePreset === 'last_30_days' ? 'var(--color-primary)' : '#F3F4F6',
                color: activePreset === 'last_30_days' ? '#fff' : 'var(--color-text-secondary)',
                transition: 'all 150ms ease',
              }}
            >
              Last 30 Days
            </button>
          </div>

          {/* Custom Date Inputs & Multi-Select Module Filter */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', alignItems: 'flex-start' }}>
            
            {/* From Date */}
            <div>
              <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>From Date</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="var(--color-primary)" />
                <input
                  type="date"
                  className="form-input"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setActivePreset('');
                  }}
                  style={{ fontSize: '13px', padding: '8px 10px' }}
                />
              </div>
            </div>

            {/* To Date */}
            <div>
              <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>To Date</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="var(--color-primary)" />
                <input
                  type="date"
                  className="form-input"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setActivePreset('');
                  }}
                  style={{ fontSize: '13px', padding: '8px 10px' }}
                />
              </div>
            </div>

            {/* Multi-Select Modules Filter */}
            <div>
              <MultiSelectDropdown 
                label="Filter by Modules (Multi-Select)"
                options={ALL_MODULE_OPTIONS}
                selectedIds={selectedModuleIds}
                onChange={setSelectedModuleIds}
                placeholder="All 15 Modules Selected..."
              />
            </div>

          </div>
        </Card>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Loading HACCP report data for range ({fromDate} to {toDate})...
          </div>
        ) : (
          <>
            {/* Aggregate KPI Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <Card style={{ padding: '16px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '2px' }}>
                  {data?.totalEntries || 0}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Total Log Entries</div>
              </Card>

              <Card style={{ padding: '16px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#2563EB', marginBottom: '2px' }}>
                  {data?.modulesUsed || 0} / {data?.totalModules || 15}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Modules Active</div>
              </Card>

              <Card style={{ padding: '16px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#047857', marginBottom: '2px' }}>
                  {data?.passed || 0}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Passed Logs</div>
              </Card>

              <Card style={{ padding: '16px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#DC2626', marginBottom: '2px' }}>
                  {data?.failed || 0}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Needs Review / Failed</div>
              </Card>
            </div>

            {/* Audit Logs List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Array.isArray(data?.logs) && data.logs.length > 0 ? (
                data.logs.map((log, idx) => {
                  const isCookingLog = log.moduleId === 'cooking-temperature';

                  return (
                    <Card
                      key={idx}
                      onClick={isCookingLog ? () => openLogDetail(log) : undefined}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                        cursor: isCookingLog ? 'pointer' : 'default',
                        transition: 'all 0.15s ease-in-out',
                        border: isCookingLog ? '1px solid #D1FAE5' : '1px solid var(--color-border-light)',
                        backgroundColor: '#FFFFFF',
                      }}
                      className={isCookingLog ? 'haccp-clickable-report-card' : ''}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
                              {log.moduleName}
                            </h3>
                            {isCookingLog && (
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: 'var(--color-primary)',
                                  backgroundColor: '#ECFDF5',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                View Details <ChevronRight size={12} />
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                            Log Record ID: #{log.id} • Date: <strong>{log.date}</strong> at {log.time}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <StatusBadge status={log.status} />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13.5px' }}>
                        <div>
                          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Inspector / Staff</span>
                          <strong style={{ color: 'var(--color-text-primary)' }}>{log.staffName}</strong>
                        </div>

                        {log.formData?.holdingUnit && (
                          <div>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Station / Unit</span>
                            <strong>{log.formData.holdingUnit}</strong>
                          </div>
                        )}

                        {log.formData?.mainReason && (
                          <div>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Primary Waste Reason</span>
                            <strong>{log.formData.mainReason}</strong>
                          </div>
                        )}

                        {log.formData?.taskTitle && (
                          <div>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block' }}>Training Task</span>
                            <strong>{log.formData.taskTitle}</strong>
                          </div>
                        )}
                      </div>

                      {/* Form Details Summary */}
                      {log.formData?.generalComments && (
                        <div style={{ padding: '10px 14px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid var(--color-border-light)', fontSize: '13px' }}>
                          <strong>Comments / Observations:</strong> {log.formData.generalComments}
                        </div>
                      )}

                      {/* Itemized Table if Hot Holding */}
                      {log.moduleId === 'hot-holding' && Array.isArray(log.formData?.items) && log.formData.items.length > 0 && (
                        <div style={{ overflowX: 'auto', border: '1px solid var(--color-border-light)', borderRadius: '8px' }}>
                          <table className="data-table" style={{ fontSize: '12.5px' }}>
                            <thead>
                              <tr>
                                <th>Food Item</th>
                                <th>Time into Hold</th>
                                <th>Check 1 (°C)</th>
                                <th>Check 2 (°C)</th>
                                <th>Check 3 (°C)</th>
                                <th>Check 4 (°C)</th>
                                <th>Comments</th>
                              </tr>
                            </thead>
                            <tbody>
                              {log.formData.items.map((it, iIdx) => (
                                <tr key={iIdx}>
                                  <td><strong>{it.foodName}</strong></td>
                                  <td>{it.timeIntoHold || '-'}</td>
                                  <td>{it.check1 ? `${it.check1}°C` : '-'}</td>
                                  <td>{it.check2 ? `${it.check2}°C` : '-'}</td>
                                  <td>{it.check3 ? `${it.check3}°C` : '-'}</td>
                                  <td>{it.check4 ? `${it.check4}°C` : '-'}</td>
                                  <td>{it.comments || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Signature */}
                      {log.signature && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid var(--color-border-light)', paddingTop: '10px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Staff Signature:</span>
                          <div style={{ height: '40px', padding: '4px 10px', backgroundColor: '#FAFAFA', border: '1px solid var(--color-border-light)', borderRadius: '6px' }}>
                            <img src={log.signature} alt="Signature" style={{ height: '100%', objectFit: 'contain' }} />
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })
              ) : (
                <Card style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  <FileText size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <div>No HACCP log records found for range ({fromDate} to {toDate}).</div>
                </Card>
              )}
            </div>
          </>
        )}
      </div>

      {/* HACCP Log Detail Drawer (Requirement 4) */}
      <HaccpLogDetailDrawer
        isOpen={detailDrawerOpen}
        onClose={closeLogDetail}
        data={selectedLogDetail}
        loading={detailLoading}
        error={detailError}
      />
    </PageLayout>
  );
};

export default HaccpReportsPage;
