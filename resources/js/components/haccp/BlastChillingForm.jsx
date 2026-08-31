import React, { useState, useEffect, useRef } from 'react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import AmendmentReasonModal from '../common/AmendmentReasonModal';
import SignatureCanvas from 'react-signature-canvas';
import { Snowflake, AlertTriangle, CheckCircle, Plus, ShieldCheck } from 'lucide-react';
import axios from 'axios';

// Helper to add minutes to an "HH:mm" time string
const addMinutesToTime = (timeStr, mins) => {
  if (!timeStr || mins === '' || mins === null || isNaN(mins)) return '';
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return '';
  let totalMins = h * 60 + m + parseInt(mins, 10);
  totalMins = (totalMins % 1440 + 1440) % 1440; // Handle 24-hour wraparound
  const newH = String(Math.floor(totalMins / 60)).padStart(2, '0');
  const newM = String(totalMins % 60).padStart(2, '0');
  return `${newH}:${newM}`;
};

// Helper to calculate duration in minutes between two "HH:mm" strings
const calculateDurationMins = (startTime, endTime) => {
  if (!startTime || !endTime) return '';
  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);
  if (isNaN(sH) || isNaN(sM) || isNaN(eH) || isNaN(eM)) return '';
  let diff = (eH * 60 + eM) - (sH * 60 + sM);
  if (diff < 0) diff += 24 * 60; // Handle cross-midnight
  return diff;
};

const BlastChillingForm = ({ onSave, onCancel, logId }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [existingSignature, setExistingSignature] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);

  // Form Fields matching mock schema
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logTime, setLogTime] = useState(
    new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
  );
  const [staffName, setStaffName] = useState('');
  const [foodItem, setFoodItem] = useState('');
  const [probeId, setProbeId] = useState('');

  // Blast Chilling Execution Parameters
  const [chillingStartTime, setChillingStartTime] = useState(
    new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
  );
  const [chillingEndTime, setChillingEndTime] = useState('');
  const [startTemp, setStartTemp] = useState('');
  const [endTemp, setEndTemp] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [notes, setNotes] = useState('');

  // Master Data State
  const [managerFoodItems, setManagerFoodItems] = useState([]);
  const [managerThermometers, setManagerThermometers] = useState([]);
  const [managerStaff, setManagerStaff] = useState([]);

  // In-Place Quick Add Food Item Modal State
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [storageTypes, setStorageTypes] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [foodModalLoading, setFoodModalLoading] = useState(false);
  const [foodModalSaving, setFoodModalSaving] = useState(false);
  const [foodModalError, setFoodModalError] = useState('');

  const [newFoodItemForm, setNewFoodItemForm] = useState({
    name: '',
    storage_type_id: '',
    uom_id: '',
    status: 'Active'
  });

  const sigPad = useRef(null);

  // Fetch Master Data on Mount
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [foodRes, thermoRes, staffRes] = await Promise.all([
          axios.get('/api/food-items'),
          axios.get('/api/thermometers'),
          axios.get('/api/tenant-users'),
        ]);

        const foodList = foodRes.data || [];
        const thermoList = thermoRes.data || [];
        const staffList = (staffRes.data || []).filter(s => s.status !== 'Inactive');

        setManagerFoodItems(foodList);
        setManagerThermometers(thermoList);
        setManagerStaff(staffList);
      } catch (err) {
        console.error('Failed to fetch master data for Blast Chilling form', err);
      }
    };
    fetchMasterData();
  }, []);

  useEffect(() => {
    if (!logId) return;
    const fetchExisting = async () => {
      try {
        setLoadingExisting(true);
        const res = await axios.get(`/api/blast-chilling-logs/${logId}`);
        const data = res.data;
        if (data) {
          if (data.log_date) setLogDate(data.log_date);
          if (data.log_time) setLogTime(data.log_time);
          if (data.staff_name) setStaffName(data.staff_name);
          if (data.food_item) setFoodItem(data.food_item);
          if (data.probe_id) setProbeId(data.probe_id);
          if (data.chilling_start_time) setChillingStartTime(data.chilling_start_time);
          if (data.chilling_end_time) setChillingEndTime(data.chilling_end_time);
          if (data.start_temp !== null && data.start_temp !== undefined) setStartTemp(String(data.start_temp));
          if (data.end_temp !== null && data.end_temp !== undefined) setEndTemp(String(data.end_temp));
          if (data.duration_minutes !== null && data.duration_minutes !== undefined) setDurationMinutes(String(data.duration_minutes));
          if (data.corrective_action) setCorrectiveAction(data.corrective_action);
          if (data.notes) setNotes(data.notes);
          if (data.signature) setExistingSignature(data.signature);
        }
      } catch (err) {
        console.error('Failed to fetch blast chilling log for edit', err);
        setError('Failed to load existing log data.');
      } finally {
        setLoadingExisting(false);
      }
    };
    fetchExisting();
  }, [logId]);

  // Handler when Start Time changes
  const handleStartTimeChange = (val) => {
    setChillingStartTime(val);
    if (val && durationMinutes !== '' && !isNaN(durationMinutes)) {
      // Calculate new end time based on duration
      const newEndTime = addMinutesToTime(val, durationMinutes);
      setChillingEndTime(newEndTime);
    } else if (val && chillingEndTime) {
      // Recalculate duration
      const dur = calculateDurationMins(val, chillingEndTime);
      setDurationMinutes(dur);
    }
  };

  // Handler when End Time changes
  const handleEndTimeChange = (val) => {
    setChillingEndTime(val);
    if (chillingStartTime && val) {
      const dur = calculateDurationMins(chillingStartTime, val);
      setDurationMinutes(dur);
    }
  };

  // Handler when Duration Minutes changes -> Automatically update End Time!
  const handleDurationMinutesChange = (val) => {
    setDurationMinutes(val);
    if (chillingStartTime && val !== '' && !isNaN(val)) {
      const newEndTime = addMinutesToTime(chillingStartTime, val);
      setChillingEndTime(newEndTime);
    }
  };

  // Live CCP-4 Limit Validation Check: End Temp <= 3.0°C and Duration <= 90 mins
  const validateBlastChilling = () => {
    if (endTemp === '' || endTemp === null) return null;
    const end = parseFloat(endTemp);
    if (isNaN(end)) return false;
    const duration = parseInt(durationMinutes || 0, 10);
    return end <= 3.0 && (duration === 0 || duration <= 90);
  };

  // Open Quick Add Food Item Modal & Load Options
  const handleOpenFoodModal = async () => {
    setNewFoodItemForm({ name: '', storage_type_id: '', uom_id: '', status: 'Active' });
    setFoodModalError('');
    setFoodModalOpen(true);

    if (storageTypes.length === 0 || uoms.length === 0) {
      setFoodModalLoading(true);
      try {
        const [stRes, uomRes] = await Promise.all([
          axios.get('/api/storage-types'),
          axios.get('/api/uoms')
        ]);
        const stList = stRes.data || [];
        const uomList = (uomRes.data || []).filter(u => u.status === 'Active');
        setStorageTypes(stList);
        setUoms(uomList);

        setNewFoodItemForm(prev => ({
          ...prev,
          storage_type_id: stList.length > 0 ? stList[0].id : '',
          uom_id: uomList.length > 0 ? uomList[0].id : ''
        }));
      } catch (err) {
        console.error('Failed to load options for food item modal', err);
        setFoodModalError('Failed to load storage types or unit of measures.');
      } finally {
        setFoodModalLoading(false);
      }
    } else {
      setNewFoodItemForm(prev => ({
        ...prev,
        storage_type_id: storageTypes.length > 0 ? storageTypes[0].id : '',
        uom_id: uoms.length > 0 ? uoms[0].id : ''
      }));
    }
  };

  // Save New Food Item
  const handleSaveNewFoodItem = async (e) => {
    e.preventDefault();
    setFoodModalError('');

    if (!newFoodItemForm.name.trim()) {
      setFoodModalError('Food Item Name is required.');
      return;
    }
    if (!newFoodItemForm.storage_type_id) {
      setFoodModalError('Storage Type is required.');
      return;
    }
    if (!newFoodItemForm.uom_id) {
      setFoodModalError('Default UOM is required.');
      return;
    }

    setFoodModalSaving(true);
    try {
      const res = await axios.post('/api/food-items', newFoodItemForm);
      const createdItem = res.data;

      setManagerFoodItems(prev => [...prev, createdItem]);
      setFoodItem(createdItem.name);
      setFoodModalOpen(false);
    } catch (err) {
      console.error('Failed to create new food item', err);
      if (err.response?.data?.errors?.name) {
        setFoodModalError(err.response.data.errors.name[0]);
      } else {
        setFoodModalError(err.response?.data?.message || 'Failed to create new food item.');
      }
    } finally {
      setFoodModalSaving(false);
    }
  };

  const handleFinalSubmit = async (amendmentReason = '') => {
    let signatureData = existingSignature;
    if (sigPad.current && !sigPad.current.isEmpty()) {
      signatureData = sigPad.current.getCanvas().toDataURL('image/png');
    }

    setSubmitting(true);

    const payload = {
      log_date: logDate,
      log_time: logTime,
      staff_name: staffName || null,
      food_item: foodItem,
      probe_id: probeId || null,
      chilling_start_time: chillingStartTime || null,
      chilling_end_time: chillingEndTime || null,
      start_temp: startTemp !== '' ? parseFloat(startTemp) : null,
      end_temp: parseFloat(endTemp),
      duration_minutes: durationMinutes !== '' ? parseInt(durationMinutes, 10) : null,
      corrective_action: correctiveAction || null,
      notes: notes || null,
      signature: signatureData,
    };

    try {
      if (logId) {
        payload.amendment_reason = amendmentReason;
        await axios.put(`/api/blast-chilling-logs/${logId}`, payload);
      } else {
        await axios.post('/api/blast-chilling-logs', payload);
      }
      if (onSave) onSave();
    } catch (err) {
      console.error('Failed to save blast chilling log', err);
      if (err.response?.data?.errors) {
        const firstErr = Object.values(err.response.data.errors)[0];
        setError(Array.isArray(firstErr) ? firstErr[0] : firstErr);
      } else {
        setError(err.response?.data?.message || 'Failed to save log.');
      }
    } finally {
      setSubmitting(false);
      setShowReasonModal(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);

    if (!logDate || !logTime || !foodItem.trim()) {
      setError('Date, Time, and Food Item are mandatory.');
      return;
    }

    if (endTemp === '' || endTemp === null) {
      setError('Blast Chilling End Temperature is mandatory.');
      return;
    }

    const isPassed = validateBlastChilling();
    if (isPassed === false && !correctiveAction.trim()) {
      setError('Mandatory Corrective Action is required when CCP-4 limit is failed.');
      return;
    }

    let signatureData = existingSignature;
    if (sigPad.current && !sigPad.current.isEmpty()) {
      signatureData = sigPad.current.getCanvas().toDataURL('image/png');
    }

    if (!signatureData) {
      setError('Staff Verification Signature is mandatory.');
      return;
    }

    if (logId) {
      setShowReasonModal(true);
    } else {
      handleFinalSubmit();
    }
  };

  const isCcpPassed = validateBlastChilling();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Standard Header Banner */}
      <div className="card" style={{ padding: '20px 24px', backgroundColor: 'var(--color-cyan-pale)', border: '1px solid var(--color-cyan-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#CFFAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Snowflake size={24} color="#0891B2" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#155E75' }}>
                Blast Chilling & Rapid Cooling Log
              </h2>
              <span style={{ fontSize: '12px', color: '#0E7490' }}>Codex HACCP Critical Control Point 4</span>
            </div>
          </div>
          <span className="badge badge-ccp" style={{ backgroundColor: '#0891B2', color: '#ffffff', padding: '6px 14px', fontSize: '13px', fontWeight: 700 }}>
            CCP-4
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#155E75', fontWeight: 500, marginTop: '8px' }}>
          <ShieldCheck size={16} />
          <span><strong>Required Standard:</strong> Rapidly cool cooked food from ≥63°C to ≤3°C within 90 minutes max.</span>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Section 1: Basic & Product Information */}
        <div className="card card-padded">
          <div style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: '12px', marginBottom: '20px' }}>
            <h3 className="section-title" style={{ fontSize: '16px', margin: 0, color: 'var(--color-text-primary)' }}>
              1. Basic & Product Information
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Log timestamp, operator name, food item, and thermometer equipment ID.
            </span>
          </div>

          {/* Row 1 (3 Fields): Date | Time | Staff Member */}
          <div className="grid-3">
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

            <div className="form-group">
              <label className="form-label">Time *</label>
              <input
                type="time"
                className="form-input"
                value={logTime}
                onChange={e => setLogTime(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Staff Member (Completed By) *</label>
              {managerStaff.length > 0 ? (
                <select
                  className="form-select"
                  value={staffName}
                  onChange={e => setStaffName(e.target.value)}
                >
                  <option value="">Select Staff Member</option>
                  {managerStaff.map(staff => (
                    <option key={staff.id} value={staff.name}>
                      {staff.name} {staff.role ? `(${staff.role.name || staff.role})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="form-input"
                  placeholder="Staff member name"
                  value={staffName}
                  onChange={e => setStaffName(e.target.value)}
                />
              )}
            </div>
          </div>

          {/* Row 2 (2 Fields): Food Item | Probe / Thermometer ID */}
          <div className="grid-2" style={{ marginTop: '8px' }}>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>Food Item / Product *</label>
                <button
                  type="button"
                  onClick={handleOpenFoodModal}
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
                  <Plus size={14} /> Add Item
                </button>
              </div>
              {managerFoodItems.length > 0 ? (
                <select
                  className="form-select"
                  value={foodItem}
                  onChange={e => setFoodItem(e.target.value)}
                  required
                >
                  <option value="">Select Food Item</option>
                  {managerFoodItems.map(item => (
                    <option key={item.id} value={item.name}>{item.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Chicken Noodle Soup"
                  value={foodItem}
                  onChange={e => setFoodItem(e.target.value)}
                  required
                />
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Probe / Thermometer ID</label>
              {managerThermometers.length > 0 ? (
                <select
                  className="form-select"
                  value={probeId}
                  onChange={e => setProbeId(e.target.value)}
                >
                  <option value="">Select Thermometer / Probe</option>
                  {managerThermometers.map(t => (
                    <option key={t.id} value={t.name || t.serial_number}>
                      {t.name || t.serial_number}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. PROBE-01"
                  value={probeId}
                  onChange={e => setProbeId(e.target.value)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Blast Chilling Temperature & Duration (CCP-4) */}
        <div className="card card-padded" style={{ backgroundColor: 'var(--color-cyan-pale)', border: '1px solid var(--color-cyan-border)' }}>
          <div style={{ borderBottom: '1px solid #CFFAFE', paddingBottom: '12px', marginBottom: '20px' }}>
            <h3 className="section-title" style={{ fontSize: '16px', margin: 0, color: '#155E75' }}>
              2. Temperature & Timing Checks (CCP-4)
            </h3>
            <span style={{ fontSize: '12px', color: '#0E7490' }}>
              Record initial core temperature, end temperature, duration, or times.
            </span>
          </div>

          {/* Row 1 (3 Fields): Start Temp | End Temp | Duration (Auto-updates End Time) */}
          <div className="grid-3">
            <div className="form-group">
              <label className="form-label" style={{ color: '#155E75' }}>Start Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                placeholder="e.g. 65.0"
                value={startTemp}
                onChange={e => setStartTemp(e.target.value)}
                style={{ backgroundColor: '#ffffff' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: '#155E75' }}>End Temperature (°C) *</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                placeholder="e.g. 3.0"
                value={endTemp}
                onChange={e => setEndTemp(e.target.value)}
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: isCcpPassed === false ? '#EF4444' : isCcpPassed === true ? '#10B981' : undefined,
                  fontWeight: 700
                }}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: '#155E75' }}>Duration (minutes) *</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 90"
                value={durationMinutes}
                onChange={e => handleDurationMinutesChange(e.target.value)}
                style={{ backgroundColor: '#ffffff', fontWeight: 600 }}
              />
              <span style={{ fontSize: '11px', color: '#0E7490', marginTop: '4px', display: 'block' }}>
                Typing duration automatically updates End Time below.
              </span>
            </div>
          </div>

          {/* Row 2: Start Time & End Time (Auto-calculated from Duration or updates Duration) */}
          <div className="grid-2" style={{ marginTop: '8px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ color: '#155E75', fontSize: '13px' }}>Chilling Start Time</label>
              <input
                type="time"
                className="form-input"
                value={chillingStartTime}
                onChange={e => handleStartTimeChange(e.target.value)}
                style={{ backgroundColor: '#ffffff' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ color: '#155E75', fontSize: '13px' }}>Chilling End Time (Auto-calculated)</label>
              <input
                type="time"
                className="form-input"
                value={chillingEndTime}
                onChange={e => handleEndTimeChange(e.target.value)}
                style={{ backgroundColor: '#ffffff', fontWeight: 600 }}
              />
            </div>
          </div>

          {/* Live CCP-4 Limit Result Banner */}
          {endTemp !== '' && (
            <div
              style={{
                marginTop: '16px',
                padding: '14px 18px',
                borderRadius: '8px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: isCcpPassed ? '#ECFDF5' : '#FEF2F2',
                color: isCcpPassed ? '#047857' : '#B91C1C',
                border: isCcpPassed ? '1px solid #A7F3D0' : '1px solid #FECACA'
              }}
            >
              {isCcpPassed ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
              <span>
                {isCcpPassed
                  ? `CCP-4 Limit Passed: End Temp ${endTemp}°C ≤ 3.0°C within ${durationMinutes || 0} mins`
                  : `CCP-4 LIMIT BREACH: End Temp (${endTemp}°C) > 3.0°C or Duration (${durationMinutes || 0} mins) > 90 mins!`}
              </span>
            </div>
          )}

          {/* Mandatory Corrective Action text area if CCP breached */}
          {isCcpPassed === false && (
            <div style={{ marginTop: '16px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', padding: '16px', borderRadius: '8px' }}>
              <label className="form-label" style={{ color: '#991B1B', fontWeight: 700 }}>
                Mandatory Corrective Action Taken *
              </label>
              <textarea
                className="form-textarea"
                rows="2"
                placeholder="Describe corrective action taken if check failed..."
                value={correctiveAction}
                onChange={e => setCorrectiveAction(e.target.value)}
                style={{ borderColor: '#FCA5A5', backgroundColor: '#ffffff' }}
                required
              />
            </div>
          )}
        </div>

        {/* Section 3: Notes & Staff Verification */}
        <div className="card card-padded">
          <div style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: '12px', marginBottom: '20px' }}>
            <h3 className="section-title" style={{ fontSize: '16px', margin: 0, color: 'var(--color-text-primary)' }}>
              3. Verification & Notes
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Add observations and provide a staff digital signature to complete the entry.
            </span>
          </div>

          <div className="grid-2">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Notes / Observations</label>
              <textarea
                className="form-textarea"
                rows="4"
                placeholder="Any additional notes..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>Staff Verification Signature *</label>
                <button
                  type="button"
                  onClick={() => sigPad.current?.clear()}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Clear Signature
                </button>
              </div>
              <div style={{ border: '1px solid var(--color-border-input)', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: '#ffffff' }}>
                <SignatureCanvas
                  ref={sigPad}
                  penColor="#071713"
                  canvasProps={{ width: 450, height: 110, className: 'sigCanvas' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? 'Saving Log...' : 'Save Blast Chilling Log'}
          </Button>
        </div>
      </form>

      {/* Quick Add Food Item Modal */}
      <Modal
        isOpen={foodModalOpen}
        onClose={() => setFoodModalOpen(false)}
        title="Add New Food Item"
        size="md"
      >
        {foodModalLoading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Loading storage types and unit of measures...
          </div>
        ) : (
          <form onSubmit={handleSaveNewFoodItem}>
            {foodModalError && (
              <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                <AlertTriangle size={16} />
                <span>{foodModalError}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Food Item Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Chicken Noodle Soup"
                value={newFoodItemForm.name}
                onChange={e => setNewFoodItemForm({ ...newFoodItemForm, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Storage Type *</label>
              <select
                className="form-select"
                value={newFoodItemForm.storage_type_id}
                onChange={e => setNewFoodItemForm({ ...newFoodItemForm, storage_type_id: e.target.value })}
                required
              >
                <option value="">Select Storage Type</option>
                {storageTypes.map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Default Unit of Measure (UOM) *</label>
              <select
                className="form-select"
                value={newFoodItemForm.uom_id}
                onChange={e => setNewFoodItemForm({ ...newFoodItemForm, uom_id: e.target.value })}
                required
              >
                <option value="">Select UOM</option>
                {uoms.map(uom => (
                  <option key={uom.id} value={uom.id}>{uom.unit_name || uom.name} ({uom.unit_symbol || uom.symbol})</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Status</label>
              <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="status"
                    value="Active"
                    checked={newFoodItemForm.status === 'Active'}
                    onChange={e => setNewFoodItemForm({ ...newFoodItemForm, status: e.target.value })}
                  />
                  <span>Active</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="status"
                    value="Inactive"
                    checked={newFoodItemForm.status === 'Inactive'}
                    onChange={e => setNewFoodItemForm({ ...newFoodItemForm, status: e.target.value })}
                  />
                  <span>Inactive</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button variant="secondary" onClick={() => setFoodModalOpen(false)} disabled={foodModalSaving}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={foodModalSaving}>
                {foodModalSaving ? 'Saving Item...' : 'Save & Select Item'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <AmendmentReasonModal
        isOpen={showReasonModal}
        onClose={() => setShowReasonModal(false)}
        onConfirm={handleFinalSubmit}
        loading={submitting}
      />
    </div>
  );
};

export default BlastChillingForm;
