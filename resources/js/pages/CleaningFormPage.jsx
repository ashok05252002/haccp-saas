import React from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import CleaningForm from '../components/haccp/CleaningForm';

const CleaningFormPage = ({ logId }) => {
  const isEdit = Boolean(logId);

  const handleSave = () => {
    router.visit('/haccp-logs/cleaning');
  };

  const handleCancel = () => {
    router.visit('/haccp-logs/cleaning');
  };

  return (
    <PageLayout>
      <Head title={isEdit ? "Edit Cleaning & Sanitation Entry" : "Add Cleaning & Sanitation Entry"} />

      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
        <div style={{ flexShrink: 0 }}>
          <button onClick={() => router.visit('/haccp-logs/cleaning')} className="back-btn">
            <ArrowLeft size={16} />
            <span>Back to Cleaning Logs</span>
          </button>

          <div className="panel-header-row">
            <div>
              <h1 className="page-title">{isEdit ? "Edit Cleaning & Sanitation Entry" : "Add Cleaning & Sanitation Entry"}</h1>
              <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                {isEdit ? "Update completed cleaning tasks and checklist verification details." : "Record completed cleaning tasks against your active cleaning areas and checklists."}
              </p>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '24px', marginRight: '-12px', paddingRight: '12px' }}>
          <Card padding="0">
            <CleaningForm logId={logId} onSave={handleSave} onCancel={handleCancel} />
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default CleaningFormPage;
