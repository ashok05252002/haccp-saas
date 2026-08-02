import React from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import CookingTemperatureForm from '../components/haccp/CookingTemperatureForm';

const CookingTemperatureFormPage = () => {
  const handleSave = () => {
    router.visit('/haccp-logs/cooking-temperature');
  };

  const handleCancel = () => {
    router.visit('/haccp-logs/cooking-temperature');
  };

  return (
    <PageLayout>
      <Head title="Add Cooking & Process Entry" />

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ flexShrink: 0 }}>
          <button onClick={() => router.visit('/haccp-logs/cooking-temperature')} className="back-btn">
            <ArrowLeft size={16} />
            <span>Back to Cooking Logs</span>
          </button>

          <div className="panel-header-row">
            <div>
              <h1 className="page-title">Add Cooking & Process Entry</h1>
              <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Complete the 6-step Cook, Cool, Reheat & Hold Process log.
              </p>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, paddingBottom: '32px' }}>
          <Card padding="0">
            <CookingTemperatureForm onSave={handleSave} onCancel={handleCancel} />
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default CookingTemperatureFormPage;
