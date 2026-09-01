import React from 'react';
import { X, Printer, Download, FileText, CheckCircle, AlertTriangle, Clock, History, User, ShieldCheck, Tag } from 'lucide-react';
import Button from '../common/Button';

const HaccpLogDetailDrawer = ({
  isOpen,
  onClose,
  data = null,
  loading = false,
  error = null,
  onPrint = null,
  onDownloadPdf = null,
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const renderBadge = (statusStr) => {
    if (!statusStr) return null;
    const normalized = String(statusStr).toUpperCase().trim();

    if (normalized === 'PASSED' || normalized === 'COMPLETED') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          backgroundColor: '#ECFDF5',
          color: '#065F46',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.5px'
        }}>
          <CheckCircle size={13} />
          {normalized}
        </span>
      );
    }

    if (normalized === 'FAILED' || normalized === 'NEEDS REVIEW') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          backgroundColor: '#FEF2F2',
          color: '#991B1B',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.5px'
        }}>
          <AlertTriangle size={13} />
          {normalized}
        </span>
      );
    }

    if (normalized === 'IN_PROGRESS' || normalized === 'IN PROGRESS') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          backgroundColor: '#FEF3C7',
          color: '#92400E',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.5px'
        }}>
          <Clock size={13} />
          IN PROGRESS
        </span>
      );
    }

    if (normalized === 'N/A') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: '#F3F4F6',
          color: '#6B7280',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 700
        }}>
          N/A
        </span>
      );
    }

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        color: '#374151',
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 600
      }}>
        {statusStr}
      </span>
    );
  };

  const renderFieldValue = (value, label = '') => {
    if (value === null || value === undefined || value === '') {
      return <span style={{ color: '#9CA3AF', fontStyle: 'italic', fontSize: '13px' }}>N/A</span>;
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (typeof value === 'string' && value.startsWith('data:image')) {
      return (
        <div style={{ backgroundColor: '#FAFAFA', border: '1px solid var(--color-border-light)', borderRadius: '8px', padding: '8px 12px', display: 'inline-block' }}>
          <img src={value} alt="Signature" style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain' }} />
        </div>
      );
    }

    if (label.toLowerCase() === 'result' || label.toLowerCase() === 'status') {
      return renderBadge(value);
    }

    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return (
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px' }}>
            {value.map((item, idx) => (
              <li key={idx}>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</li>
            ))}
          </ul>
        );
      }
      return <pre style={{ margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap' }}>{JSON.stringify(value, null, 2)}</pre>;
    }

    return <span style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: 500 }}>{String(value)}</span>;
  };

  const formatFieldName = (key) => {
    return String(key)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleDownloadPdf = () => {
    if (onDownloadPdf) {
      onDownloadPdf();
      return;
    }

    // Set document title temporarily to provide a clean default filename when saving as PDF
    const originalTitle = document.title;
    const moduleLabel = (data?.moduleName || 'HACCP_Log').replace(/[^a-zA-Z0-9]/g, '_');
    const logId = data?.log?.id ? `_${data.log.id}` : '';
    const logDate = data?.log?.log_date ? `_${data.log.log_date}` : '';
    const safeFileName = `${moduleLabel}_Log${logId}${logDate}`;

    try {
      document.title = safeFileName;
      window.print();
    } finally {
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div
      className="haccp-log-detail-drawer-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(7, 23, 19, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={handleOverlayClick}
    >
      <div
        className="haccp-log-detail-drawer-container"
        style={{
          width: '100%',
          maxWidth: '780px',
          height: '100vh',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-6px 0 28px rgba(0,0,0,0.16)',
          overflow: 'hidden',
        }}
      >
        {/* Drawer Sticky Top Header */}
        <div
          className="haccp-drawer-header"
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--color-border-light)',
            backgroundColor: '#FAFAFA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  {data?.moduleName || 'HACCP Log Record'}
                </h2>
                {data?.log?.id && (
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      backgroundColor: '#ECFDF5',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    #{data.log.id}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '2px 0 0 0' }}>
                Detailed compliance drill-down and audit verification view.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {data?.log?.status && renderBadge(data.log.status)}
            <button
              type="button"
              className="haccp-drawer-non-printable"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#6B7280',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Close Drawer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Quick Action Toolbar */}
        <div
          className="haccp-drawer-non-printable"
          style={{
            padding: '12px 24px',
            borderBottom: '1px solid var(--color-border-light)',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            {data?.log?.log_date ? `Logged on ${data.log.log_date} at ${data.log.log_time || '12:00'}` : 'Log Record View'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              type="button"
              variant="secondary"
              icon={Download}
              onClick={handleDownloadPdf}
              disabled={loading || !data}
              style={{ fontSize: '12.5px', padding: '6px 12px' }}
              title="Choose 'Save as PDF' in the print dialog"
            >
              Download Single PDF
            </Button>
            <Button
              type="button"
              variant="secondary"
              icon={Printer}
              onClick={handlePrint}
              disabled={loading || !data}
              style={{ fontSize: '12.5px', padding: '6px 12px' }}
            >
              Print Log
            </Button>
          </div>
        </div>

        {/* Drawer Scrollable Body */}
        <div
          className="haccp-drawer-printable-body"
          style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          {loading && (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              <div style={{ fontSize: '15px', fontWeight: 600 }}>Loading detailed log records & audit history...</div>
            </div>
          )}

          {error && !loading && (
            <div
              style={{
                padding: '16px 20px',
                backgroundColor: '#FEF2F2',
                color: '#991B1B',
                borderRadius: '10px',
                border: '1px solid #FECACA',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* Dynamic Checkpoint Sections */}
              {Array.isArray(data.sections) && data.sections.map((section, sIdx) => (
                <div
                  key={sIdx}
                  className="haccp-drawer-section-card"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--color-border-light)',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      margin: '0 0 16px 0',
                      paddingBottom: '10px',
                      borderBottom: '1px solid var(--color-border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Tag size={16} />
                    <span>{section.title}</span>
                  </h3>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '14px 18px',
                    }}
                  >
                    {Array.isArray(section.fields) && section.fields.map((field, fIdx) => (
                      <div key={fIdx}>
                        <label
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--color-text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            display: 'block',
                            marginBottom: '3px',
                          }}
                        >
                          {field.label}
                        </label>
                        <div>{renderFieldValue(field.value, field.label)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Complete Audit & Amendment Trail Section */}
              <div
                className="haccp-drawer-section-card"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--color-border-light)',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid var(--color-border-light)',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: 'var(--color-text-primary)',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <History size={16} color="var(--color-primary)" />
                    <span>Audit Trail & Amendment History</span>
                  </h3>

                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#065F46',
                      backgroundColor: '#ECFDF5',
                      padding: '2px 8px',
                      borderRadius: '10px',
                    }}
                  >
                    {Array.isArray(data.auditHistory) ? data.auditHistory.length : 0} Amendments
                  </span>
                </div>

                {Array.isArray(data.auditHistory) && data.auditHistory.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {data.auditHistory.map((audit, aIdx) => (
                      <div
                        key={aIdx}
                        style={{
                          backgroundColor: '#F9FAFB',
                          border: '1px solid var(--color-border-light)',
                          borderRadius: '10px',
                          padding: '14px 16px',
                          fontSize: '13px',
                        }}
                      >
                        {/* Audit Header */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '8px',
                            marginBottom: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            <User size={14} color="var(--color-primary)" />
                            <span>{audit.amended_by_name || 'Staff Member'}</span>
                            {audit.manager_approved_by_name && (
                              <span style={{ fontSize: '11px', color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <ShieldCheck size={12} /> Approved by {audit.manager_approved_by_name}
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                            {audit.created_at ? new Date(audit.created_at).toLocaleString() : 'Date N/A'}
                          </div>
                        </div>

                        {/* Amendment Reason Box */}
                        <div
                          style={{
                            backgroundColor: '#FFFBEB',
                            color: '#92400E',
                            borderLeft: '3px solid #F59E0B',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            marginBottom: '10px',
                            fontSize: '12.5px',
                          }}
                        >
                          <strong>Reason for Amendment:</strong> {audit.reason || 'No reason specified'}
                        </div>

                        {/* Changed Fields Diff Grid */}
                        {audit.changed_fields && typeof audit.changed_fields === 'object' && Object.keys(audit.changed_fields).length > 0 && (
                          <div style={{ marginTop: '8px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                              Modified Fields:
                            </span>
                            <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {Object.entries(audit.changed_fields).map(([fieldName, diff], dIdx) => (
                                <div
                                  key={dIdx}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '12px',
                                    padding: '4px 8px',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: '6px',
                                    border: '1px solid #E5E7EB',
                                  }}
                                >
                                  <strong style={{ color: 'var(--color-text-primary)', minWidth: '140px' }}>
                                    {formatFieldName(fieldName)}:
                                  </strong>
                                  <span style={{ color: '#DC2626', textDecoration: 'line-through' }}>
                                    {diff?.old !== null && diff?.old !== undefined && diff?.old !== '' ? String(diff.old) : 'None'}
                                  </span>
                                  <span style={{ color: '#6B7280' }}>➔</span>
                                  <span style={{ color: '#059669', fontWeight: 600 }}>
                                    {diff?.new !== null && diff?.new !== undefined && diff?.new !== '' ? String(diff.new) : 'None'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '8px',
                      textAlign: 'center',
                      color: 'var(--color-text-muted)',
                      fontSize: '13px',
                      fontStyle: 'italic',
                    }}
                  >
                    No amendments recorded. This log record represents the original verified entry.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Drawer Sticky Bottom Footer */}
        <div
          className="haccp-drawer-non-printable"
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--color-border-light)',
            backgroundColor: '#FAFAFA',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HaccpLogDetailDrawer;
