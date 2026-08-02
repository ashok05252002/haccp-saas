import React from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import TemperatureForm from '../components/haccp/TemperatureForm';

const TemperatureFormPage = () => {
  const handleSave = () => {
    router.visit('/haccp-logs/temperature');
  };

  const handleCancel = () => {
    router.visit('/haccp-logs/temperature');
  };

  return (
    <PageLayout>
      <Head title="Add Temperature Entry" />

      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
        <div style={{ flexShrink: 0 }}>
          <button onClick={() => router.visit('/haccp-logs/temperature')} className="back-btn">
            <ArrowLeft size={16} />
            <span>Back to Temperature Logs</span>
          </button>

          <div className="panel-header-row">
            <div>
              <h1 className="page-title">Add Temperature Entry</h1>
              <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Record new temperature values for your equipment.
              </p>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '24px', marginRight: '-12px', paddingRight: '12px' }}>
          <Card padding="0">
            <TemperatureForm onSave={handleSave} onCancel={handleCancel} />
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default TemperatureFormPage;
