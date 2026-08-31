import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { FileEdit, AlertCircle } from 'lucide-react';

const AmendmentReasonModal = ({ isOpen, onClose, onConfirm, loading = false }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!reason || !reason.trim()) {
      setError('Reason for amendment is required.');
      return;
    }
    setError('');
    onConfirm(reason.trim());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reason for Amendment"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Confirm & Save'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '8px', color: '#92400E' }}>
          <FileEdit size={20} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '13.5px', lineHeight: '1.4' }}>
            You are editing an already submitted HACCP record. Please provide a reason for this amendment for compliance tracking.
          </div>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: 'var(--color-red-pale)', border: '1px solid var(--color-red-border)', color: 'var(--color-danger)', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontWeight: 600 }}>
            Reason for Amendment <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <textarea
            className="form-input"
            rows={4}
            placeholder="e.g. Corrected mistyped temperature value after verification..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error && e.target.value.trim()) {
                setError('');
              }
            }}
            autoFocus
            style={{ resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
          />
        </div>
      </form>
    </Modal>
  );
};

export default AmendmentReasonModal;
