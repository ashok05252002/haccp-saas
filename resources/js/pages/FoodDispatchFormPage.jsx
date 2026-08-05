import React from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import FoodDispatchForm from '../components/haccp/FoodDispatchForm';

const FoodDispatchFormPage = () => {
  const handleSave = () => {
    router.visit('/haccp-logs/food-dispatch');
  };

  const handleCancel = () => {
    router.visit('/haccp-logs/food-dispatch');
  };

  return (
    <PageLayout>
      <Head title="Add Food Dispatch Log" />

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ flexShrink: 0 }}>
          <button onClick={() => router.visit('/haccp-logs/food-dispatch')} className="back-btn">
            <ArrowLeft size={16} />
            <span>Back to Food Dispatch Logs</span>
          </button>

          <div className="panel-header-row">
            <div>
              <h1 className="page-title">Record Food Dispatch / Transfer</h1>
              <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Record safe dispatch parameters, temperatures, and separation checks for food in transit.
              </p>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, paddingBottom: '32px' }}>
          <FoodDispatchForm onSave={handleSave} onCancel={handleCancel} />
        </div>
      </div>
    </PageLayout>
  );
};

export default FoodDispatchFormPage;
