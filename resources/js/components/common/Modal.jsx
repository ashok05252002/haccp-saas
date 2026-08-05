import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="overlay" onClick={handleOverlayClick}>
      <div className={`modal ${size === 'lg' ? 'modal-lg' : ''}`} style={{ backgroundColor: '#ffffff', color: '#071713' }}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ color: '#071713', margin: 0 }}>{title}</h3>
          <button className="modal-close" onClick={onClose} style={{ color: '#688078' }}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body" style={{ color: '#071713' }}>{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
