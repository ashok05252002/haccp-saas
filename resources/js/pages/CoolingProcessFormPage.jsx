import React from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import CoolingProcessForm from '../components/haccp/CoolingProcessForm';

const CoolingProcessFormPage = () => {
  const handleSave = () => {
    router.visit('/haccp-logs/cooling-process');
  };

  const handleCancel = () => {
    router.visit('/haccp-logs/cooling-process');
  };

  return (
    <PageLayout>
      <Head title="Add Cooling Process Log" />

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ flexShrink: 0 }}>
          <button onClick={() => router.visit('/haccp-logs/cooling-process')} className="back-btn">
            <ArrowLeft size={16} />
            <span>Back to Cooling Process Logs</span>
          </button>

          <div className="panel-header-row">
            <div>
              <h1 className="page-title">Add Cooling Process Entry</h1>
              <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Record ambient cooling parameters for CCP-6 compliance verification (≤8°C within 2 hrs).
              </p>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, paddingBottom: '32px' }}>
          <CoolingProcessForm onSave={handleSave} onCancel={handleCancel} />
        </div>
      </div>
    </PageLayout>
  );
};

export default CoolingProcessFormPage;
