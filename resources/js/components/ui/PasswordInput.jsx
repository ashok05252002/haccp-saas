import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

const PasswordInput = ({ value, onChange, placeholder = "Enter password", style = {}, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div style={styles.inputWrapper}>
      <Lock
        size={16}
        color="var(--color-text-muted)"
        style={styles.inputIcon}
      />
      <input
        className="form-input"
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ 
          paddingLeft: 38, 
          paddingRight: 38, 
          width: '100%', 
          boxSizing: 'border-box',
          ...style 
        }}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        style={styles.eyeBtn}
      >
        {showPassword ? (
          <EyeOff size={16} color="var(--color-text-muted)" />
        ) : (
          <Eye size={16} color="var(--color-text-muted)" />
        )}
      </button>
    </div>
  );
};

const styles = {
  inputWrapper: {
    position: 'relative',
    width: '100%',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },
  eyeBtn: {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '6px',
  },
};

export default PasswordInput;
