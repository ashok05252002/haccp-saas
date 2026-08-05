import React from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import BlastChillingForm from '../components/haccp/BlastChillingForm';

const BlastChillingFormPage = () => {
  const handleSave = () => {
    router.visit('/haccp-logs/blast-chilling');
  };

  const handleCancel = () => {
    router.visit('/haccp-logs/blast-chilling');
  };

  return (
    <PageLayout>
      <Head title="Add Blast Chilling Log" />

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ flexShrink: 0 }}>
          <button onClick={() => router.visit('/haccp-logs/blast-chilling')} className="back-btn">
            <ArrowLeft size={16} />
            <span>Back to Blast Chilling Logs</span>
          </button>

          <div className="panel-header-row">
            <div>
              <h1 className="page-title">Add Blast Chilling Entry</h1>
              <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Record rapid cooling cycle parameters for CCP-4 compliance verification.
              </p>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, paddingBottom: '32px' }}>
          <BlastChillingForm onSave={handleSave} onCancel={handleCancel} />
        </div>
      </div>
    </PageLayout>
  );
};

export default BlastChillingFormPage;
