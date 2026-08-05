import React from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import ProbeCalibrationForm from '../components/haccp/ProbeCalibrationForm';

const ProbeCalibrationFormPage = () => {
  const handleSave = () => {
    router.visit('/haccp-logs/probe-calibration');
  };

  const handleCancel = () => {
    router.visit('/haccp-logs/probe-calibration');
  };

  return (
    <PageLayout>
      <Head title="Add Probe Accuracy Check" />

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ flexShrink: 0 }}>
          <button onClick={() => router.visit('/haccp-logs/probe-calibration')} className="back-btn">
            <ArrowLeft size={16} />
            <span>Back to Probe Accuracy Checks</span>
          </button>

          <div className="panel-header-row">
            <div>
              <h1 className="page-title">Record Probe Accuracy Check</h1>
              <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Verify thermometer accuracy using boiling water and ice water calibration tests.
              </p>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, paddingBottom: '32px' }}>
          <ProbeCalibrationForm onSave={handleSave} onCancel={handleCancel} />
        </div>
      </div>
    </PageLayout>
  );
};

export default ProbeCalibrationFormPage;
