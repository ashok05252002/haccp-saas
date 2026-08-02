import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Info, Check } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import DeliveryIntakeForm from '../components/haccp/DeliveryIntakeForm';

const DeliveryIntakeFormPage = () => {
  const [acceptedGuidelines, setAcceptedGuidelines] = useState(false);
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
      <Head title="Add Delivery Intake Entry" />

      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
        <div style={{ flexShrink: 0 }}>
          <button onClick={() => router.visit('/haccp-logs/delivery-intake')} className="back-btn">
            <ArrowLeft size={16} />
            <span>Back to Intake Logs</span>
          </button>

          <div className="panel-header-row">
            <div>
              <h1 className="page-title">Add Delivery Intake Entry</h1>
              <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Record new incoming deliveries, check temperatures, and supplier details.
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
                      Incoming goods must be checked at intake to prevent hazardous materials entering the food chain.
                    </p>
                    
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
                      Critical Limits
                    </h4>
                    
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                      For large deliveries, sample one or two food products from that delivery.
                    </p>

                    <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', marginTop: '6px' }}></div>
                        <div>
                          <strong style={{ color: 'var(--color-text-primary)' }}>Chilled food:</strong> 0°C to 5°C <span style={{ color: 'var(--color-text-muted)' }}>(Minced meat products: 0°C to 2°C)</span>
                        </div>
                      </li>
                      <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', marginTop: '6px' }}></div>
                        <div>
                          <strong style={{ color: 'var(--color-text-primary)' }}>Frozen food:</strong> less than or equal to -18°C
                        </div>
                      </li>
                      <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', marginTop: '6px' }}></div>
                        <div>
                          <strong style={{ color: 'var(--color-text-primary)' }}>Ambient food:</strong> Food can be safely stored at room temperature
                        </div>
                      </li>
                      <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', marginTop: '6px' }}></div>
                        <div>
                          <strong style={{ color: 'var(--color-text-primary)' }}>Hot food:</strong> greater than or equal to 63°C
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', backgroundColor: 'var(--color-page-bg)', padding: '16px', borderRadius: '8px' }}>
                    <input 
                      type="checkbox" 
                      id="accept_guidelines" 
                      checked={isChecked} 
                      onChange={(e) => setIsChecked(e.target.checked)}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                    />
                    <label htmlFor="accept_guidelines" style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)', cursor: 'pointer', userSelect: 'none' }}>
                      I have read and accepted these guidelines
                    </label>
                  </div>

                  <Button 
                    variant="primary" 
                    size="lg" 
                    icon={Check} 
                    onClick={handleAccept} 
                    disabled={!isChecked}
                    style={{ width: '100%', padding: '14px', fontSize: '16px' }}
                  >
                    Proceed to Form
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card padding="0">
              <DeliveryIntakeForm onSave={handleSave} onCancel={handleCancel} />
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default DeliveryIntakeFormPage;
