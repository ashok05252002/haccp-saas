import React, { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import DateNavigator from '../components/haccp/DateNavigator';
import EmptyState from '../components/common/EmptyState';
import { addDays } from '../utils/dateUtils';

const SupervisorReviewPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <PageLayout>
      <div className="page-header">
        <h1 className="page-title">Supervisor Review</h1>
        <p className="page-subtitle">Review and sign off daily HACCP logs</p>
      </div>

      {/* Date Navigator */}
      <div style={{ marginBottom: '24px', maxWidth: '400px' }}>
        <DateNavigator
          date={selectedDate}
          onPrev={() => setSelectedDate(addDays(selectedDate, -1))}
          onNext={() => setSelectedDate(addDays(selectedDate, 1))}
        />
      </div>

      {/* Review Card */}
      <Card>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <div>
            <h3
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)',
                marginBottom: '4px',
              }}
            >
              Hygiene Sign off
            </h3>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Review daily hygiene and HACCP sign-off items · 0 logs
            </p>
          </div>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-grey-pale)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-grey)',
            }}
          >
            No logs
          </span>
        </div>
        <EmptyState
          icon={ClipboardList}
          message="No review items for this date"
          submessage="HACCP logs will appear here once staff submit daily entries."
        />
      </Card>
    </PageLayout>
  );
};

export default SupervisorReviewPage;
