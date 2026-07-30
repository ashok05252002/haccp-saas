import React from 'react';
import { ShieldAlert, Check } from 'lucide-react';

const Alert = ({ type = 'success', message, className = '' }) => {
  if (!message) return null;

  const isSuccess = type === 'success';
  const alertClass = isSuccess ? 'alert-success' : 'alert-error';
  const Icon = isSuccess ? Check : ShieldAlert;

  return (
    <div className={`${alertClass} ${className}`}>
      <Icon size={16} />
      <span>{message}</span>
    </div>
  );
};

export default Alert;
