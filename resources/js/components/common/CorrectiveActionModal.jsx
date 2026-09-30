import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

export const isInvalidCorrectiveAction = (val) => {
  if (!val) return true;
  const s = String(val).trim().toLowerCase();
  return s === '' || s === 'n/a' || s === 'na';
};

const CorrectiveActionModal = ({
  isOpen,
  onClose,
  title = "Corrective Action Required",
  message = "A failed check or out-of-limit value has been detected. Please rectify the issue and enter the corrective action before submitting.",
  issueDetails = [],
  actionFieldName = "Corrective Action"
}) => {
  const issues = Array.isArray(issueDetails)
    ? issueDetails.filter(Boolean)
    : (issueDetails ? [issueDetails] : []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
          <Button variant="primary" onClick={onClose}>
            Rectify Issue & Enter {actionFieldName}
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '14px 16px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            color: '#991B1B'
          }}
        >
          <AlertTriangle size={22} style={{ flexShrink: 0, marginTop: '2px', color: '#DC2626' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
              Action Required Before Submission
            </div>
            <div style={{ fontSize: '13.5px', lineHeight: '1.45', color: '#7F1D1D' }}>
              {message}
            </div>
          </div>
        </div>

        {issues.length > 0 && (
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '8px',
              color: '#92400E'
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={15} style={{ color: '#D97706' }} />
              <span>Specific Issue(s) Detected:</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.5' }}>
              {issues.map((issue, idx) => (
                <li key={idx} style={{ marginBottom: idx === issues.length - 1 ? 0 : '4px' }}>
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ fontSize: '12.5px', color: '#4B5563', lineHeight: '1.4', padding: '0 4px' }}>
          <strong>Compliance Policy:</strong> Whenever a CCP limit or critical inspection check fails, a documented corrective action is legally required. Corrective action cannot be left blank, whitespace only, or marked as &quot;N/A&quot;.
        </div>
      </div>
    </Modal>
  );
};

export default CorrectiveActionModal;
