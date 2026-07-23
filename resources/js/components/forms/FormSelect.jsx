import React from 'react';

const FormSelect = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  required = false,
  error,
  ...props
}) => {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label">
          {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
        </label>
      )}
      <select
        className="form-select"
        value={value}
        onChange={onChange}
        required={required}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
};

export default FormSelect;
