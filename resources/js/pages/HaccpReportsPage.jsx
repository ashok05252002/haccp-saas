import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Download, Printer, FileText, Calendar, CheckCircle2, AlertTriangle, Filter, BarChart3 } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import axios from 'axios';

const MODULE_OPTIONS = [
  { id: 'all', title: 'All Modules' },
  { id: 'hot-holding', title: 'Hot Holding / Bain Marie' },
  { id: 'food-waste', title: 'Food Waste & Disposal Log' },
  { id: 'staff-training', title: 'Staff Training & Hygiene Log' },
  { id: 'pest-control', title: 'Pest Prevention & Activity Log' },
  { id: 'health-declaration', title: 'Staff Health Declaration' },
  { id: 'temperature', title: 'Temperature Monitoring' },
  { id: 'delivery-intake', title: 'Delivery Intake' },
  { id: 'cooking-temperature', title: 'Cooking Temperature' },
  { id: 'cleaning', title: 'Cleaning & Sanitation' },
  { id: 'blast-chilling', title: 'Blast Chilling' },
  { id: 'cooling-process', title: 'Cooling Process' },
  { id: 'probe-calibration', title: 'Probe Accuracy Check' },
  { id: 'food-dispatch', title: 'Food Dispatch & Transfer' },
  { id: 'fryer-oil', title: 'Fryer Oil & Grease Management' },
];

const HaccpReportsPage = () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [reportDate, setReportDate] = useState(todayStr);
  const [moduleFilter, setModuleFilter] = useState('all');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/haccp-reports', {
        params: {
          date: reportDate,
          module: moduleFilter,
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
  }, [reportDate, moduleFilter]);

  const handleCSV = () => {
    window.open(`/api/haccp-reports/export-csv?date=${reportDate}&module=${moduleFilter}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <PageLayout>
      <Head title="HACCP Reports & Audits" />

      <div>
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
              Export CSV
            </Button>
            <Button variant="secondary" icon={Printer} onClick={handlePrint}>
              Print Report
            </Button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <Card style={{ padding: '16px 20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
              <Calendar size={18} color="var(--color-primary)" />
              <div style={{ flex: 1 }}>
                <label className="form-label" style={{ fontSize: '11px', marginBottom: '2px' }}>Audit Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={reportDate}
                  onChange={e => setReportDate(e.target.value)}
                  style={{ fontSize: '13px', padding: '6px 10px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
              <Filter size={18} color="var(--color-primary)" />
              <div style={{ flex: 1 }}>
                <label className="form-label" style={{ fontSize: '11px', marginBottom: '2px' }}>Filter by Module</label>
                <select
                  className="form-select"
                  value={moduleFilter}
                  onChange={e => setModuleFilter(e.target.value)}
                  style={{ fontSize: '13px', padding: '6px 10px' }}
                >
                  {MODULE_OPTIONS.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Loading HACCP report data...
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
                  {data?.modulesUsed || 0} / {data?.totalModules || 13}
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
                data.logs.map((log, idx) => (
                  <Card key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
                          {log.moduleName}
                        </h3>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          Log Record ID: #{log.id} • Date: {log.date} at {log.time}
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
                ))
              ) : (
                <Card style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  <FileText size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <div>No HACCP log records found for {reportDate}.</div>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default HaccpReportsPage;
