import React from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import DeliveryIntakeForm from '../components/haccp/DeliveryIntakeForm';

const DeliveryIntakeFormPage = ({ logId }) => {
  const isEdit = Boolean(logId);

  const handleSave = () => {
    router.visit('/haccp-logs/delivery-intake');
  };

  const handleCancel = () => {
    router.visit('/haccp-logs/delivery-intake');
  };

  return (
    <PageLayout>
      <Head title={isEdit ? "Edit Delivery Intake Entry" : "Add Delivery Intake Entry"} />

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ flexShrink: 0 }}>
          <button onClick={() => router.visit('/haccp-logs/delivery-intake')} className="back-btn">
            <ArrowLeft size={16} />
            <span>Back to Intake Logs</span>
          </button>

          <div className="panel-header-row">
            <div>
              <h1 className="page-title">{isEdit ? "Edit Delivery Intake Entry" : "Add Delivery Intake Entry"}</h1>
              <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                {isEdit ? "Update delivery intake details, product temperatures, and supplier verification." : "Record new incoming deliveries, check temperatures, and supplier details."}
              </p>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, paddingBottom: '32px' }}>
          <Card padding="0">
            <DeliveryIntakeForm logId={logId} onSave={handleSave} onCancel={handleCancel} />
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default DeliveryIntakeFormPage;
