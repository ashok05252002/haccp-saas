import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import HaccpReferenceBadges from './HaccpReferenceBadges';
import HaccpStandardBanner from './HaccpStandardBanner';
import HaccpFieldRenderer from './HaccpFieldRenderer';
import { getCurrentTime, formatDateISO } from '../../utils/dateUtils';

const HaccpFormModal = ({ isOpen, onClose, moduleMeta, onSave }) => {
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  // Initialize form with defaults when opened
  useEffect(() => {
    if (isOpen && moduleMeta) {
      const initialData = {
        date: formatDateISO(new Date()),
        time: getCurrentTime(),
      };
      
      // Default toggles to true for convenience, as checks usually pass
      moduleMeta.schema?.fields.forEach(field => {
        if (Array.isArray(field)) {
           field.forEach(subField => {
             if (subField.type === 'toggle') initialData[subField.name] = true;
           });
        } else {
           if (field.type === 'toggle') initialData[field.name] = true;
        }
      });
      
      setFormData(initialData);
    }
  }, [isOpen, moduleMeta]);

  if (!moduleMeta || !moduleMeta.schema) return null;

  const handleFieldChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={moduleMeta.title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Log'}
          </Button>
        </>
      }
    >
      <HaccpReferenceBadges badges={moduleMeta.referenceBadges} />
      
      {moduleMeta.description && (
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
          {moduleMeta.description}
        </p>
      )}

      <HaccpStandardBanner standard={moduleMeta.requiredStandard} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {moduleMeta.schema.fields.map((fieldOrRow, idx) => {
          if (Array.isArray(fieldOrRow)) {
            // It's a row (like Date and Time)
            return (
              <div key={idx} style={{ display: 'flex', gap: '12px' }}>
                {fieldOrRow.map((field) => (
                  <div key={field.name} style={{ flex: 1 }}>
                    <HaccpFieldRenderer
                      field={field}
                      value={formData[field.name]}
                      onChange={handleFieldChange}
                    />
                  </div>
                ))}
              </div>
            );
          }
          
          // Single field
          return (
            <HaccpFieldRenderer
              key={fieldOrRow.name}
              field={fieldOrRow}
              value={formData[fieldOrRow.name]}
              onChange={handleFieldChange}
            />
          );
        })}
      </div>
    </Modal>
  );
};

export default HaccpFormModal;
