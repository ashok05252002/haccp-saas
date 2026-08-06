import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Download, ShieldCheck, Search, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import DataTable from '../components/common/DataTable';

const SupervisionReviewHistoryPage = ({ reviews }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const reviewsData = reviews?.data || [];

  const filteredReviews = reviewsData.filter(r => {
    const query = searchQuery.toLowerCase();
    return (
      (r.reviewer_name && r.reviewer_name.toLowerCase().includes(query)) ||
      (r.reviewer_role && r.reviewer_role.toLowerCase().includes(query)) ||
      (r.review_date && r.review_date.includes(query)) ||
      (r.compliance_status && r.compliance_status.toLowerCase().includes(query))
    );
  });

  const handleExportCsv = () => {
    window.open('/api/supervision-reviews/export-csv', '_blank');
  };

  const columns = [
    {
      header: 'Review Date',
      accessor: (row) => (
        <div>
          <strong style={{ fontSize: '13.5px', color: 'var(--color-primary)' }}>
            {new Date(row.review_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </strong>
          <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
            Mode: {row.review_mode}
          </div>
        </div>
      ),
    },
    {
      header: 'Supervisor / Reviewer',
      accessor: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{row.reviewer_name}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{row.reviewer_role}</div>
        </div>
      ),
    },
    {
      header: 'HACCP Logs Ratio',
      accessor: (row) => (
        <span className="badge badge-neutral" style={{ fontWeight: 700 }}>
          {row.haccp_completed_count} / {row.haccp_total_count}
        </span>
      ),
    },
    {
      header: 'Cleaning Ratio',
      accessor: (row) => (
        <span className="badge badge-neutral" style={{ fontWeight: 700 }}>
          {row.cleaning_completed_count} / {row.cleaning_total_count}
        </span>
      ),
    },
    {
      header: 'Flagged Items',
      accessor: (row) => (
        row.flagged_items_count > 0 ? (
          <span className="badge" style={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontWeight: 700 }}>
            {row.flagged_items_count} Flagged
          </span>
        ) : (
          <span style={{ color: '#10B981', fontSize: '12px', fontWeight: 600 }}>0 Non-Compliances</span>
        )
      ),
    },
    {
      header: 'Compliance Status',
      accessor: (row) => {
        const statusMap = {
          passed: { label: 'PASSED', bg: '#DCFCE7', color: '#15803D' },
          passed_with_action: { label: 'PASSED (ACTION TAKEN)', bg: '#FEF3C7', color: '#B45309' },
          failed: { label: 'FAILED / REJECTED', bg: '#FEE2E2', color: '#B91C1C' },
        };
        const s = statusMap[row.compliance_status] || { label: row.compliance_status.toUpperCase(), bg: '#F3F4F6', color: '#374151' };
        return (
          <span className="badge" style={{ backgroundColor: s.bg, color: s.color, fontWeight: 700, fontSize: '11px' }}>
            {s.label}
          </span>
        );
      },
    },
    {
      header: 'Supervisor Signature',
      accessor: (row) => (
        row.signature ? (
          <div style={{ height: '36px', padding: '2px 8px', backgroundColor: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: '6px', width: '90px' }}>
            <img src={row.signature} alt="Signature" style={{ height: '100%', width: '100%', objectFit: 'contain' }} />
          </div>
        ) : (
          <span style={{ fontSize: '12px', color: '#9CA3AF' }}>None</span>
        )
      ),
    },
  ];

  return (
    <PageLayout>
      <Head title="Supervision Review Audit History" />

      <div>
        <div className="panel-header-row" style={{ marginBottom: '24px' }}>
          <div>
            <Button variant="secondary" icon={ArrowLeft} onClick={() => router.visit('/supervision-review')} style={{ marginBottom: '10px' }}>
              Back to Supervision Review
            </Button>
            <h1 className="page-title">Supervision Review Audit History</h1>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Archive of all past supervisory sign-offs and manager HACCP audit verifications.
            </p>
          </div>

          <Button variant="secondary" icon={Download} onClick={handleExportCsv}>
            Export Audit CSV
          </Button>
        </div>

        <Card style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ marginBottom: '16px', maxWidth: '360px' }}>
            <SearchBar 
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by supervisor name, role, date..."
            />
          </div>

          <DataTable 
            columns={columns}
            data={filteredReviews}
            emptyMessage="No supervisory review sign-off records found."
          />
        </Card>
      </div>
    </PageLayout>
  );
};

export default SupervisionReviewHistoryPage;
