import React from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import TemperatureForm from '../components/haccp/TemperatureForm';

const TemperatureFormPage = ({ logId }) => {
  const isEdit = Boolean(logId);

  const handleSave = () => {
    router.visit('/haccp-logs/temperature');
  };

  const handleCancel = () => {
    router.visit('/haccp-logs/temperature');
  };

  return (
    <PageLayout>
      <Head title={isEdit ? "Edit Temperature Entry" : "Add Temperature Entry"} />

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ flexShrink: 0 }}>
          <button onClick={() => router.visit('/haccp-logs/temperature')} className="back-btn">
            <ArrowLeft size={16} />
            <span>Back to Temperature Logs</span>
          </button>

          <div className="panel-header-row">
            <div>
              <h1 className="page-title">{isEdit ? "Edit Temperature Entry" : "Add Temperature Entry"}</h1>
              <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                {isEdit ? "Update logged temperature readings, equipment, and corrective actions." : "Record new temperature values for your equipment."}
              </p>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, paddingBottom: '32px' }}>
          <Card padding="0">
            <TemperatureForm logId={logId} onSave={handleSave} onCancel={handleCancel} />
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default TemperatureFormPage;
