import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
