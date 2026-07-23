import React from 'react';

const FormInput = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
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
      <input
        type={type}
        className="form-input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        {...props}
      />
      {error && <p className="form-error">{error}</p>}
    </div>
  );
};

export default FormInput;
