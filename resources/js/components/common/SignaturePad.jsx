import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser } from 'lucide-react';

const SignaturePad = ({ value, onChange }) => {
  const sigCanvas = useRef(null);

  const handleEnd = () => {
    if (sigCanvas.current) {
      onChange(sigCanvas.current.toDataURL());
    }
  };

  const clear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      onChange(null);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.padWrapper}>
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          canvasProps={{ className: 'sigCanvas', style: styles.canvas }}
          onEnd={handleEnd}
        />
        {!value && (
          <div style={styles.placeholder}>
            Sign here
          </div>
        )}
      </div>
      <div style={styles.footer}>
        <button type="button" onClick={clear} style={styles.clearBtn}>
          <Eraser size={14} style={{ marginRight: '4px' }} />
          Clear
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    border: '1px solid var(--color-border-light)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  padWrapper: {
    position: 'relative',
    height: '150px',
    backgroundColor: '#FAFAFA',
  },
  canvas: {
    width: '100%',
    height: '100%',
    cursor: 'crosshair',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 2,
  },
  placeholder: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: '#D1D5DB',
    fontSize: '20px',
    fontWeight: 600,
    pointerEvents: 'none',
    zIndex: 1,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '8px 12px',
    backgroundColor: '#fff',
    borderTop: '1px solid var(--color-border-light)',
  },
  clearBtn: {
    display: 'flex',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    color: 'var(--color-text-secondary)',
    fontSize: '13px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background 0.2s',
  },
};

export default SignaturePad;
