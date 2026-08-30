import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { Lock, AlertCircle } from 'lucide-react';
import axios from 'axios';

const ManagerPinModal = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setPin('');
    setError('');
    setLoading(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!pin.trim()) {
      setError('Please enter Manager PIN.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axios.post('/api/verify-manager-pin', { pin: pin.trim() });
      if (res.data && res.data.success) {
        handleClose();
        if (onSuccess) onSuccess(res.data);
      } else {
        setError(res.data?.message || 'Invalid Manager PIN.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid Manager PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Manager PIN Required"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading || !pin.trim()}>
            {loading ? 'Verifying...' : 'Authorize & Edit'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '8px', color: '#92400E' }}>
          <Lock size={20} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '13.5px', lineHeight: '1.4' }}>
            Editing a submitted HACCP log requires manager authorization. Please enter your Manager PIN to continue.
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
            Manager PIN <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <input
            type="password"
            className="form-input"
            placeholder="Enter 4-digit PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoFocus
            maxLength={10}
            style={{ fontSize: '18px', letterSpacing: '4px', textAlign: 'center', fontWeight: 700 }}
          />
        </div>
      </form>
    </Modal>
  );
};

export default ManagerPinModal;
