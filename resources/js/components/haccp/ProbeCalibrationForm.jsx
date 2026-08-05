import React, { useState, useEffect, useRef } from 'react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import SignatureCanvas from 'react-signature-canvas';
import { Info, AlertTriangle, CheckCircle, Plus, UserPlus, RotateCcw } from 'lucide-react';
import axios from 'axios';

// Validation Helpers matching mock
const isBoilingInRange = (temp) => {
  const t = parseFloat(temp);
  if (isNaN(t)) return true;
  return t >= 99.0 && t <= 101.0;
};

const isIceInRange = (temp) => {
  const t = parseFloat(temp);
  if (isNaN(t)) return true;
  return t >= -1.0 && t <= 1.0;
};

const ProbeCalibrationForm = ({ onSave, onCancel }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

  // Form Fields
  const [logDate, setLogDate] = useState(todayStr);
  const [logTime, setLogTime] = useState(nowTimeStr);

  const [staffName, setStaffName] = useState('');
  const [selectedProbe, setSelectedProbe] = useState(''); // probe_name or JSON
  const [probeName, setProbeName] = useState('');
  const [probeSerialNumber, setProbeSerialNumber] = useState('');

  const [boilingTemp, setBoilingTemp] = useState('');
  const [iceTemp, setIceTemp] = useState('');
  const [comments, setComments] = useState('');

  const sigPad = useRef(null);
  const [isSignatureEmpty, setIsSignatureEmpty] = useState(true);

  // Master Data
  const [staffList, setStaffList] = useState([]);
  const [probeList, setProbeList] = useState([]);

  // In-Place Modals State
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({ name: '', email: '', role_id: '' });
  const [staffRoles, setStaffRoles] = useState([]);
  const [staffModalSaving, setStaffModalSaving] = useState(false);
  const [staffModalError, setStaffModalError] = useState('');

  const [probeModalOpen, setProbeModalOpen] = useState(false);
  const [newProbeForm, setNewProbeForm] = useState({ name: '', serial_number: '', status: 'Active' });
  const [probeModalSaving, setProbeModalSaving] = useState(false);
  const [probeModalError, setProbeModalError] = useState('');

  // Fetch Master Data on Mount
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [staffRes, probeRes] = await Promise.all([
          axios.get('/api/tenant-users'),
          axios.get('/api/thermometers'),
        ]);

        setStaffList((staffRes.data || []).filter(s => s.status !== 'Inactive'));
        setProbeList((probeRes.data || []).filter(p => p.status !== 'Inactive'));
      } catch (err) {
        console.error('Failed to fetch master data for probe calibration form', err);
      }
    };
    fetchMasterData();
  }, []);

  // Validation Evaluations
  const boilingValid = isBoilingInRange(boilingTemp);
  const iceValid = isIceInRange(iceTemp);
  const isComplete = boilingTemp !== '' && iceTemp !== '';
  const passed = isComplete && boilingValid && iceValid;

  // Handle Thermometer / Probe Selection
  const handleProbeSelectChange = (e) => {
    const val = e.target.value;
    setSelectedProbe(val);

    if (!val) {
      setProbeName('');
      setProbeSerialNumber('');
      return;
    }

    try {
      const parsed = JSON.parse(val);
      setProbeName(parsed.name);
      setProbeSerialNumber(parsed.serial_number || '');
    } catch (err) {
      setProbeName(val);
      setProbeSerialNumber('');
    }
  };

  // Open Add Staff Modal
  const handleOpenStaffModal = async () => {
    setNewStaffForm({ name: '', email: '', role_id: '' });
    setStaffModalError('');
    setStaffModalOpen(true);

    if (staffRoles.length === 0) {
      try {
        const res = await axios.get('/api/roles');
        setStaffRoles(res.data || []);
        if (res.data?.length > 0) {
          setNewStaffForm(prev => ({ ...prev, role_id: res.data[0].id }));
        }
      } catch (err) {
        console.error('Failed to fetch roles', err);
      }
    }
  };

  // Save New Staff Member
  const handleSaveNewStaff = async (e) => {
    e.preventDefault();
    setStaffModalError('');

    if (!newStaffForm.name.trim()) {
      setStaffModalError('Staff name is required.');
      return;
    }

    setStaffModalSaving(true);
    try {
      const res = await axios.post('/api/restaurant-users', {
        name: newStaffForm.name,
        email: newStaffForm.email || `${newStaffForm.name.toLowerCase().replace(/\s+/g, '.')}@kitchen.local`,
        role_id: newStaffForm.role_id || (staffRoles.length > 0 ? staffRoles[0].id : 1),
        status: 'Active'
      });
      const createdStaff = res.data.user || res.data;
      setStaffList(prev => [...prev, createdStaff]);
      setStaffName(createdStaff.name);
      setStaffModalOpen(false);
    } catch (err) {
      console.error('Failed to create staff member', err);
      setStaffModalError(err.response?.data?.message || 'Failed to create staff member.');
    } finally {
      setStaffModalSaving(false);
    }
  };

  // Save New Thermometer / Probe
  const handleSaveNewProbe = async (e) => {
    e.preventDefault();
    setProbeModalError('');

    if (!newProbeForm.name.trim()) {
      setProbeModalError('Probe name is required.');
      return;
    }

    setProbeModalSaving(true);
    try {
      const res = await axios.post('/api/thermometers', newProbeForm);
      const createdProbe = res.data;
      setProbeList(prev => [...prev, createdProbe]);

      const probeObj = { id: createdProbe.id, name: createdProbe.name, serial_number: createdProbe.serial_number || '' };
      setSelectedProbe(JSON.stringify(probeObj));
      setProbeName(createdProbe.name);
      setProbeSerialNumber(createdProbe.serial_number || '');

      setProbeModalOpen(false);
    } catch (err) {
      console.error('Failed to create thermometer probe', err);
      setProbeModalError(err.response?.data?.message || 'Failed to create probe.');
    } finally {
      setProbeModalSaving(false);
    }
  };

  const handleClearSignature = () => {
    if (sigPad.current) {
      sigPad.current.clear();
      setIsSignatureEmpty(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!staffName.trim()) {
      setError('Staff Member selection is required.');
      return;
    }
    if (!probeName.trim()) {
      setError('Thermometer / Probe selection is required.');
      return;
    }
    if (boilingTemp === '' || boilingTemp === null) {
      setError('Boiling water test reading is required.');
      return;
    }
    if (iceTemp === '' || iceTemp === null) {
      setError('Ice water test reading is required.');
      return;
    }
    if (!sigPad.current || sigPad.current.isEmpty()) {
      setError('Staff Verification Signature is mandatory.');
      return;
    }

    setSubmitting(true);
    const signatureData = sigPad.current.getCanvas().toDataURL('image/png');

    const payload = {
      log_date: logDate,
      log_time: logTime,
      staff_name: staffName,
      probe_name: probeName,
      probe_serial_number: probeSerialNumber || null,
      boiling_temp: parseFloat(boilingTemp),
      ice_temp: parseFloat(iceTemp),
      comments: comments || null,
      signature: signatureData,
    };

    try {
      await axios.post('/api/probe-calibration-logs', payload);
      if (onSave) onSave();
    } catch (err) {
      console.error('Failed to save probe calibration check', err);
      if (err.response?.data?.errors) {
        const firstErr = Object.values(err.response.data.errors)[0];
        setError(Array.isArray(firstErr) ? firstErr[0] : firstErr);
      } else {
        setError(err.response?.data?.message || 'Failed to save log.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Accuracy Check Guidance Box Banner */}
      <div className="card" style={{ padding: '20px 24px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
            <Info size={18} />
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#1E40AF' }}>
            Accuracy Check Guide
          </h2>
        </div>
        <ul style={{ margin: 0, paddingLeft: '24px', color: '#1E3A8A', fontSize: '13.5px', lineHeight: '1.7', fontWeight: 500 }}>
          <li><strong>Boiling water check:</strong> Place the probe tip in boiling water and record the reading. Expected range: <strong>99°C to 101°C</strong>.</li>
          <li><strong>Ice water check:</strong> Place the probe tip in crushed ice water and record the reading. Expected range: <strong>−1°C to 1°C</strong>.</li>
          <li>If either reading is outside range, the probe should be checked, replaced, or recalibrated before use.</li>
        </ul>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Section 1: Check Information */}
        <div className="card card-padded">
          <div style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: '12px', marginBottom: '20px' }}>
            <h3 className="section-title" style={{ fontSize: '16px', margin: 0, color: 'var(--color-text-primary)' }}>
              Check Information
            </h3>
          </div>

          <div className="grid-3">
            {/* Date & Time */}
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input
                type="date"
                className="form-input"
                value={logDate}
                onChange={e => setLogDate(e.target.value)}
                required
              />
            </div>

            {/* Staff Member */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>Staff Member *</label>
                <button
                  type="button"
                  onClick={handleOpenStaffModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 0
                  }}
                >
                  <UserPlus size={14} /> Add Team Member
                </button>
              </div>
              {staffList.length > 0 ? (
                <select
                  className="form-select"
                  value={staffName}
                  onChange={e => setStaffName(e.target.value)}
                  required
                >
                  <option value="">Select staff member...</option>
                  {staffList.map(staff => (
                    <option key={staff.id} value={staff.name}>
                      {staff.name} {staff.role ? `(${staff.role.name || staff.role})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="form-input"
                  placeholder="Select staff member..."
                  value={staffName}
                  onChange={e => setStaffName(e.target.value)}
                  required
                />
              )}
            </div>

            {/* Thermometer / Probe */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>Thermometer / Probe *</label>
                <button
                  type="button"
                  onClick={() => { setProbeModalError(''); setProbeModalOpen(true); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 0
                  }}
                >
                  <Plus size={14} /> Add Probe
                </button>
              </div>
              {probeList.length > 0 ? (
                <select
                  className="form-select"
                  value={selectedProbe}
                  onChange={handleProbeSelectChange}
                  required
                >
                  <option value="">Select thermometer / probe...</option>
                  {probeList.map(probe => {
                    const objVal = JSON.stringify({ id: probe.id, name: probe.name, serial_number: probe.serial_number || '' });
                    return (
                      <option key={probe.id} value={objVal}>
                        {probe.name} {probe.serial_number ? `(${probe.serial_number})` : ''}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <input
                  type="text"
                  className="form-input"
                  placeholder="Select thermometer / probe..."
                  value={probeName}
                  onChange={e => { setProbeName(e.target.value); setSelectedProbe(e.target.value); }}
                  required
                />
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Temperature Readings */}
        <div className="card card-padded">
          <div style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: '12px', marginBottom: '20px' }}>
            <h3 className="section-title" style={{ fontSize: '16px', margin: 0, color: 'var(--color-text-primary)' }}>
              Temperature Readings
            </h3>
          </div>

          <div className="grid-2">
            {/* Boiling Water Test */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Boiling Water Test (°C) *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  placeholder="e.g. 100.0"
                  value={boilingTemp}
                  onChange={e => setBoilingTemp(e.target.value)}
                  style={{
                    paddingRight: '40px',
                    borderColor: boilingTemp !== '' && !boilingValid ? '#EF4444' : boilingTemp !== '' && boilingValid ? '#10B981' : undefined,
                    fontWeight: 600
                  }}
                  required
                />
                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '14px', fontWeight: 600, pointerEvents: 'none' }}>
                  °C
                </span>
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                Expected range: 99°C to 101°C
              </span>
              {boilingTemp !== '' && !boilingValid && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: '#FEF2F2', border: '1px solid #F8B4B4', borderRadius: '8px', color: '#9B1C1C', fontSize: '13px', fontWeight: 500, marginTop: '8px' }}>
                  <AlertTriangle size={16} />
                  <span>Reading outside expected boiling water range (99°C to 101°C).</span>
                </div>
              )}
            </div>

            {/* Ice Water Test */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Ice Water Test (°C) *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  placeholder="e.g. 0.0"
                  value={iceTemp}
                  onChange={e => setIceTemp(e.target.value)}
                  style={{
                    paddingRight: '40px',
                    borderColor: iceTemp !== '' && !iceValid ? '#EF4444' : iceTemp !== '' && iceValid ? '#10B981' : undefined,
                    fontWeight: 600
                  }}
                  required
                />
                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '14px', fontWeight: 600, pointerEvents: 'none' }}>
                  °C
                </span>
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                Expected range: −1°C to 1°C
              </span>
              {iceTemp !== '' && !iceValid && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: '#FEF2F2', border: '1px solid #F8B4B4', borderRadius: '8px', color: '#9B1C1C', fontSize: '13px', fontWeight: 500, marginTop: '8px' }}>
                  <AlertTriangle size={16} />
                  <span>Reading outside expected ice water range (−1°C to 1°C).</span>
                </div>
              )}
            </div>
          </div>

          {/* Overall Status Indicator Banner */}
          {(boilingTemp !== '' || iceTemp !== '') && (
            <div
              style={{
                marginTop: '20px',
                padding: '12px 18px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: passed ? '#ECFDF5' : '#FEF2F2',
                color: passed ? '#047857' : '#9B1C1C',
                border: passed ? '1px solid #A7F3D0' : '1px solid #F8B4B4'
              }}
            >
              {passed ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
              <span>
                Overall Evaluation: <strong>{passed ? 'Passed (Accurate)' : 'Needs Review (Outside Expected Range)'}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Section 3: Comments / Actions */}
        <div className="card card-padded">
          <div style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: '12px', marginBottom: '20px' }}>
            <h3 className="section-title" style={{ fontSize: '16px', margin: 0, color: 'var(--color-text-primary)' }}>
              Comments / Actions
            </h3>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <textarea
              className="form-textarea"
              rows="3"
              placeholder="Enter comments or action taken if needed..."
              value={comments}
              onChange={e => setComments(e.target.value)}
            />
          </div>
        </div>

        {/* Section 4: Signature */}
        <div className="card card-padded">
          <div style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: '12px', marginBottom: '20px' }}>
            <h3 className="section-title" style={{ fontSize: '16px', margin: 0, color: 'var(--color-text-primary)' }}>
              Signature *
            </h3>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <div style={{ position: 'relative', border: '1px solid var(--color-border-input)', borderRadius: 'var(--radius-md)', backgroundColor: '#FAFAFA', overflow: 'hidden' }}>
              {isSignatureEmpty && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D1D5DB', fontSize: '20px', fontWeight: 600, pointerEvents: 'none' }}>
                  Sign here
                </div>
              )}
              <SignatureCanvas
                ref={sigPad}
                penColor="#071713"
                onBegin={() => setIsSignatureEmpty(false)}
                canvasProps={{ width: 700, height: 140, className: 'sigCanvas', style: { width: '100%', display: 'block' } }}
              />
              <button
                type="button"
                onClick={handleClearSignature}
                style={{
                  position: 'absolute',
                  right: '12px',
                  bottom: '12px',
                  background: '#ffffff',
                  border: '1px solid var(--color-border-input)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RotateCcw size={13} /> Clear
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? 'Saving Check...' : 'Save Probe Check'}
          </Button>
        </div>
      </form>

      {/* Quick Add Staff Modal */}
      <Modal
        isOpen={staffModalOpen}
        onClose={() => setStaffModalOpen(false)}
        title="Add Team Member"
        size="md"
      >
        <form onSubmit={handleSaveNewStaff}>
          {staffModalError && (
            <div className="alert alert-error" style={{ marginBottom: '16px' }}>
              <AlertTriangle size={16} />
              <span>{staffModalError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Staff Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Alex Morgan"
              value={newStaffForm.name}
              onChange={e => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select
              className="form-select"
              value={newStaffForm.role_id}
              onChange={e => setNewStaffForm({ ...newStaffForm, role_id: e.target.value })}
            >
              {staffRoles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setStaffModalOpen(false)} disabled={staffModalSaving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={staffModalSaving}>
              {staffModalSaving ? 'Saving...' : 'Save & Select Staff'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quick Add Probe Modal */}
      <Modal
        isOpen={probeModalOpen}
        onClose={() => setProbeModalOpen(false)}
        title="Add Thermometer / Probe"
        size="md"
      >
        <form onSubmit={handleSaveNewProbe}>
          {probeModalError && (
            <div className="alert alert-error" style={{ marginBottom: '16px' }}>
              <AlertTriangle size={16} />
              <span>{probeModalError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Probe / Thermometer Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Digital Probe A1"
              value={newProbeForm.name}
              onChange={e => setNewProbeForm({ ...newProbeForm, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Serial Number / Asset Tag</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. SN-88402"
              value={newProbeForm.serial_number}
              onChange={e => setNewProbeForm({ ...newProbeForm, serial_number: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setProbeModalOpen(false)} disabled={probeModalSaving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={probeModalSaving}>
              {probeModalSaving ? 'Saving...' : 'Save & Select Probe'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProbeCalibrationForm;
