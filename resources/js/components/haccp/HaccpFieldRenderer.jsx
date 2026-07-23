import React from 'react';
import { Camera } from 'lucide-react';

const HaccpFieldRenderer = ({ field, value, onChange }) => {
  const { name, label, type, placeholder, options, subtitle, required } = field;

  const handleChange = (e) => {
    let newValue;
    if (type === 'toggle') {
      newValue = e.target.checked;
    } else {
      newValue = e.target.value;
    }
    onChange(name, newValue);
  };

  const labelElement = (
    <label className="form-label">
      {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
    </label>
  );

  switch (type) {
    case 'toggle':
      return (
        <div style={styles.toggleRow}>
          <div style={styles.toggleInfo}>
            <div style={styles.toggleLabel}>{label}</div>
            {subtitle && <div style={styles.toggleSubtitle}>{subtitle}</div>}
          </div>
          <label style={styles.switch}>
            <input
              type="checkbox"
              checked={!!value}
              onChange={handleChange}
              style={{ display: 'none' }}
            />
            <span style={{
              ...styles.slider,
              backgroundColor: value ? 'var(--color-success)' : '#E5E7EB',
            }}>
              <span style={{
                ...styles.sliderKnob,
                transform: value ? 'translateX(20px)' : 'translateX(0)',
              }} />
            </span>
          </label>
        </div>
      );

    case 'select':
      return (
        <div className="form-group">
          {labelElement}
          <select className="form-select" value={value || ''} onChange={handleChange}>
            <option value="" disabled>{placeholder || 'Select an option'}</option>
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );

    case 'textarea':
      return (
        <div className="form-group">
          {labelElement}
          <textarea
            className="form-textarea"
            placeholder={placeholder}
            value={value || ''}
            onChange={handleChange}
          />
        </div>
      );

    case 'photo':
      return (
        <div className="form-group">
          {labelElement}
          <div style={styles.photoDropzone}>
            <Camera size={24} color="var(--color-text-muted)" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-primary)' }}>Click to add photo</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>PNG, JPG up to 5MB</div>
          </div>
        </div>
      );

    default: // text, number, date, time
      return (
        <div className="form-group">
          {labelElement}
          <input
            className="form-input"
            type={type}
            placeholder={placeholder}
            value={value || ''}
            onChange={handleChange}
          />
        </div>
      );
  }
};

const styles = {
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    backgroundColor: '#fff',
    border: '1px solid var(--color-border-light)',
    borderRadius: 'var(--radius-md)',
    marginBottom: '16px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
  },
  toggleInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  toggleLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
  },
  toggleSubtitle: {
    fontSize: '12px',
    color: 'var(--color-text-secondary)',
  },
  switch: {
    position: 'relative',
    display: 'inline-block',
    width: '44px',
    height: '24px',
    cursor: 'pointer',
  },
  slider: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    transition: '.2s',
    borderRadius: '24px',
  },
  sliderKnob: {
    position: 'absolute',
    height: '20px',
    width: '20px',
    left: '2px',
    bottom: '2px',
    backgroundColor: 'white',
    transition: '.2s',
    borderRadius: '50%',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  photoDropzone: {
    border: '2px dashed var(--color-border-light)',
    borderRadius: 'var(--radius-md)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-page-bg)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default HaccpFieldRenderer;
