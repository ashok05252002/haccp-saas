import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Info, Check } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import DeliveryIntakeForm from '../components/haccp/DeliveryIntakeForm';

const DeliveryIntakeFormPage = ({ logId }) => {
  const isEdit = Boolean(logId);
  const [acceptedGuidelines, setAcceptedGuidelines] = useState(isEdit);
  const [isChecked, setIsChecked] = useState(false);

  const handleSave = () => {
    router.visit('/haccp-logs/delivery-intake');
  };

  const handleCancel = () => {
    router.visit('/haccp-logs/delivery-intake');
  };

  const handleAccept = () => {
    if (isChecked) {
      setAcceptedGuidelines(true);
    }
  };

  return (
    <PageLayout>
      <Head title={isEdit ? "Edit Delivery Intake Entry" : "Add Delivery Intake Entry"} />

      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
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

        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '24px', marginRight: '-12px', paddingRight: '12px' }}>
          {!acceptedGuidelines ? (
            <Card style={{ padding: '32px', maxWidth: '800px', margin: '0 auto', borderTop: '4px solid var(--color-primary)' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: 'var(--color-primary-pale)', padding: '12px', borderRadius: '50%' }}>
                  <Info size={28} color="var(--color-primary)" />
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '16px' }}>
                    Critical Limits & Guidelines
                  </h2>
                  <div style={{ backgroundColor: '#FAFAFA', border: '1px solid var(--color-border-light)', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
                    <p style={{ fontSize: '15px', color: 'var(--color-text-primary)', marginBottom: '16px', fontWeight: 500 }}>
                      Delivery checks are critical control points (CCP-1). Before logging a delivery intake, confirm:
                    </p>
                    <ul style={{ paddingLeft: '20px', color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.8 }}>
                      <li><strong style={{ color: 'var(--color-text-primary)' }}>Chilled Foods:</strong> Must arrive at <strong>≤ 5°C</strong> (or manufacturer specification).</li>
                      <li><strong style={{ color: 'var(--color-text-primary)' }}>Frozen Foods:</strong> Must arrive at <strong>≤ -18°C</strong> with no signs of thawing/refreezing.</li>
                      <li><strong style={{ color: 'var(--color-text-primary)' }}>Packaging:</strong> Clean, intact, properly sealed, and undamaged.</li>
                      <li><strong style={{ color: 'var(--color-text-primary)' }}>Use-by / Best Before:</strong> Dates are within safe shelf-life limits.</li>
                      <li><strong style={{ color: 'var(--color-text-primary)' }}>Vehicle Cleanliness:</strong> Delivery van/truck must be clean and hygienic.</li>
                    </ul>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => setIsChecked(e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                      />
                      <span style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                        I have inspected the delivery against critical limits and understand acceptance criteria.
                      </span>
                    </label>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <Button
                        variant="secondary"
                        onClick={handleCancel}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        icon={Check}
                        disabled={!isChecked}
                        onClick={handleAccept}
                      >
                        Proceed to Intake Form
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card padding="0">
              <DeliveryIntakeForm logId={logId} onSave={handleSave} onCancel={handleCancel} />
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default DeliveryIntakeFormPage;
