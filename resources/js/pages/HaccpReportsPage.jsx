import React, { useState, useEffect } from 'react';
import { Download, Printer, FileText } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import Loader from '../components/common/Loader';
import { getReportData, exportReportCSV } from '../services/reportsService';
import { haccpModules } from '../data/haccpModulesMockData';
import { formatDateInput } from '../utils/dateUtils';

const HaccpReportsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportDate, setReportDate] = useState(formatDateInput(new Date()));
  const [moduleFilter, setModuleFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getReportData(reportDate, moduleFilter);
        setData(result);
      } catch (err) {
        console.error('Failed to load report data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [reportDate, moduleFilter]);

  const handleCSV = async () => {
    const result = await exportReportCSV(reportDate);
    alert(result.message);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <PageLayout>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">HACCP Reports</h1>
          <p className="page-subtitle">Historical logs for managers & auditors</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" icon={Download} onClick={handleCSV}>
            CSV
          </Button>
          <Button variant="outline" icon={Printer} onClick={handlePrint}>
            Print
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card style={{ marginTop: '24px', marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
          }}
        >
          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
            <label className="form-label">Report Date</label>
            <input
              className="form-input"
              type="text"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              placeholder="dd/mm/yyyy"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
            <label className="form-label">Filter by Module</label>
            <select
              className="form-select"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
            >
              <option value="all">All Modules</option>
              {haccpModules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {loading ? (
        <Loader message="Loading report..." />
      ) : (
        <>
          {/* Stats Row */}
          <div className="grid-3" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { value: data?.totalEntries || 0, label: 'Total Entries' },
              { value: `${data?.modulesUsed || 0}/${data?.totalModules || 13}`, label: 'Modules Used' },
              { value: data?.passed || 0, label: 'Passed' },
              { value: data?.failed || 0, label: 'Failed' },
            ].map((stat, i) => (
              <Card key={i}>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: 'var(--font-size-2xl)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: 'var(--color-primary)',
                      marginBottom: '4px',
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Logs or Empty State */}
          <Card>
            {data?.logs?.length > 0 ? (
              <div>
                {data.logs.map((log, i) => (
                  <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border-light)' }}>
                    <p>{log.moduleName}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={FileText} message="No logs found for this date." />
            )}
          </Card>
        </>
      )}
    </PageLayout>
  );
};

export default HaccpReportsPage;
