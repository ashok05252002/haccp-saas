import React, { useState, useEffect, useRef } from 'react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import SignatureCanvas from 'react-signature-canvas';
import { Info, AlertTriangle, Plus, RotateCcw } from 'lucide-react';
import axios from 'axios';

const CoolingProcessForm = ({ onSave, onCancel, logId }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [existingSignature, setExistingSignature] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

  // Section 1: Cooling Process Details
  const [foodItem, setFoodItem] = useState('');
  const [coolingMethod, setCoolingMethod] = useState('Shallow tray / small portions');
  const [storageLocation, setStorageLocation] = useState('');

  const [startDate, setStartDate] = useState(todayStr);
  const [startTime, setStartTime] = useState(nowTimeStr);
  const [startTemp, setStartTemp] = useState('');

  const [endDate, setEndDate] = useState(todayStr);
  const [endTime, setEndTime] = useState(nowTimeStr);
  const [endTemp, setEndTemp] = useState('');

  const [durationMinutes, setDurationMinutes] = useState(0);

  // Section 2: Comments / Observations
  const [comments, setComments] = useState('');

  // Section 3: Staff Verification
  const [staffName, setStaffName] = useState('');
  const sigPad = useRef(null);
  const [isSignatureEmpty, setIsSignatureEmpty] = useState(true);

  // Master Data
  const [managerFoodItems, setManagerFoodItems] = useState([]);
  const [managerStaff, setManagerStaff] = useState([]);
  const [managerStorageZones, setManagerStorageZones] = useState([]);

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

  // Fetch Master Data on Mount
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [foodRes, staffRes, zoneRes] = await Promise.all([
          axios.get('/api/food-items'),
          axios.get('/api/tenant-users'),
          axios.get('/api/storage-zones'),
        ]);

        setManagerFoodItems(foodRes.data || []);
        setManagerStaff((staffRes.data || []).filter(s => s.status !== 'Inactive'));
        setManagerStorageZones((zoneRes.data || []).filter(z => z.status !== 'Inactive'));
      } catch (err) {
        console.error('Failed to fetch master data for Cooling Process form', err);
      }
    };
    fetchMasterData();
  }, []);

  useEffect(() => {
    if (!logId) return;
    const fetchExisting = async () => {
      try {
        setLoadingExisting(true);
        const res = await axios.get(`/api/cooling-process-logs/${logId}`);
        const data = res.data;
        if (data) {
          if (data.food_item) setFoodItem(data.food_item);
          if (data.cooling_method) setCoolingMethod(data.cooling_method);
          if (data.storage_location) setStorageLocation(data.storage_location);
          if (data.start_date) setStartDate(data.start_date);
          if (data.start_time) setStartTime(data.start_time);
          if (data.start_temp !== null && data.start_temp !== undefined) setStartTemp(String(data.start_temp));
          if (data.end_date) setEndDate(data.end_date);
          if (data.end_time) setEndTime(data.end_time);
          if (data.end_temp !== null && data.end_temp !== undefined) setEndTemp(String(data.end_temp));
          if (data.duration_minutes !== null && data.duration_minutes !== undefined) setDurationMinutes(data.duration_minutes);
          if (data.comments) setComments(data.comments);
          if (data.staff_name) setStaffName(data.staff_name);
          if (data.signature) setExistingSignature(data.signature);
        }
      } catch (err) {
        console.error('Failed to fetch cooling process log for edit', err);
        setError('Failed to load existing log data.');
      } finally {
        setLoadingExisting(false);
      }
    };
    fetchExisting();
  }, [logId]);

  // Calculate Duration in minutes whenever start/end date and start/end time change
  useEffect(() => {
    if (startDate && startTime && endDate && endTime) {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);
      if (!isNaN(startDateTime.getTime()) && !isNaN(endDateTime.getTime())) {
        let diffMs = endDateTime.getTime() - startDateTime.getTime();
        let diffMins = Math.round(diffMs / (1000 * 60));
        if (diffMins < 0) diffMins = 0;
        setDurationMinutes(diffMins);
      }
    }
  }, [startDate, startTime, endDate, endTime]);

  // Evaluate CCP-6 Limit: End Temp <= 8.0°C and Duration <= 120 mins
  const isWithinLimit = () => {
    const finalT = parseFloat(endTemp);
    const endTempOk = isNaN(finalT) || finalT <= 8.0;
    const durationOk = durationMinutes <= 120;
    return endTempOk && durationOk;
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

  const handleClearSignature = () => {
    if (sigPad.current) {
      sigPad.current.clear();
      setIsSignatureEmpty(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!foodItem.trim()) {
      setError('Food Item is required.');
      return;
    }
    if (!coolingMethod.trim()) {
      setError('Cooling Method is required.');
      return;
    }
    if (!startDate || !startTime || startTemp === '') {
      setError('Cooling Start Date, Start Time, and Start Temperature are required.');
      return;
    }
    if (!endDate || !endTime || endTemp === '') {
      setError('Cooling End Date, End Time, and Final Temperature are required.');
      return;
    }
    if (!staffName.trim()) {
      setError('Staff Member selection is required.');
      return;
    }

    const isLimitPassed = isWithinLimit();
    if (!isLimitPassed && !comments.trim()) {
      setError('If cooling time or final temperature is outside the limit, record comments before saving.');
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

    setSubmitting(true);

    const payload = {
      food_item: foodItem,
      cooling_method: coolingMethod,
      storage_location: storageLocation || null,
      start_date: startDate,
      start_time: startTime,
      start_temp: parseFloat(startTemp),
      end_date: endDate,
      end_time: endTime,
      end_temp: parseFloat(endTemp),
      duration_minutes: durationMinutes,
      comments: comments || null,
      staff_name: staffName,
      signature: signatureData,
    };

    try {
      if (logId) {
        await axios.put(`/api/cooling-process-logs/${logId}`, payload);
      } else {
        await axios.post('/api/cooling-process-logs', payload);
      }
      if (onSave) onSave();
    } catch (err) {
      console.error('Failed to save cooling process log', err);
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

  const limitPassed = isWithinLimit();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner matching mockup pixel for pixel */}
      <div className="card" style={{ padding: '20px 24px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
            <Info size={18} />
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#1E40AF' }}>
            Critical Limits
          </h2>
        </div>
        <ul style={{ margin: 0, paddingLeft: '24px', color: '#1D4ED8', fontSize: '13px', lineHeight: '1.7', fontWeight: 500 }}>
          <li>Cool cooked food as quickly as possible.</li>
          <li>Food should reach <strong>≤8°C within 2 hours</strong> before chilled storage.</li>
          <li>Use shallow containers, smaller portions, ice bath, or controlled chilling methods.</li>
          <li>Do not leave food in the danger zone for long periods.</li>
          <li>If cooling time or final temperature is outside the limit, record comments before saving.</li>
        </ul>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Section 1: Cooling Process Details (Exact Mockup Layout) */}
        <div className="card card-padded">
          <div style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: '12px', marginBottom: '20px' }}>
            <h3 className="section-title" style={{ fontSize: '16px', margin: 0, color: 'var(--color-text-primary)' }}>
              Cooling Process Details
            </h3>
          </div>

          {/* Row 1 (3 fields): Food Item * | Cooling Method * | Storage Location / Chiller */}
          <div className="grid-3">
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>Food Item *</label>
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
                  <Plus size={14} /> Add Food Item
                </button>
              </div>
              {managerFoodItems.length > 0 ? (
                <select
                  className="form-select"
                  value={foodItem}
                  onChange={e => setFoodItem(e.target.value)}
                  required
                >
                  <option value="">Select food item...</option>
                  {managerFoodItems.map(item => (
                    <option key={item.id} value={item.name}>{item.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="form-input"
                  placeholder="Select food item..."
                  value={foodItem}
                  onChange={e => setFoodItem(e.target.value)}
                  required
                />
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Cooling Method *</label>
              <select
                className="form-select"
                value={coolingMethod}
                onChange={e => setCoolingMethod(e.target.value)}
                required
              >
                <option value="Shallow tray / small portions">Shallow tray / small portions</option>
                <option value="Ice bath / cold water cooling">Ice bath / cold water cooling</option>
                <option value="Cooling rack / ambient ventilation">Cooling rack / ambient ventilation</option>
                <option value="Blast chiller / rapid cooling">Blast chiller / rapid cooling</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Storage Location / Chiller</label>
              {managerStorageZones.length > 0 ? (
                <select
                  className="form-select"
                  value={storageLocation}
                  onChange={e => setStorageLocation(e.target.value)}
                >
                  <option value="">Select or type location...</option>
                  {managerStorageZones.map(zone => (
                    <option key={zone.id} value={zone.name}>{zone.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="form-input"
                  placeholder="Select or type location..."
                  value={storageLocation}
                  onChange={e => setStorageLocation(e.target.value)}
                />
              )}
            </div>
          </div>

          {/* Row 2 (3 fields): Cooling Start Date * | Cooling Start Time * | Start Temperature (°C) * */}
          <div className="grid-3" style={{ marginTop: '8px' }}>
            <div className="form-group">
              <label className="form-label">Cooling Start Date *</label>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Cooling Start Time *</label>
              <input
                type="time"
                className="form-input"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Start Temperature (°C) *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  placeholder="e.g. 63"
                  value={startTemp}
                  onChange={e => setStartTemp(e.target.value)}
                  style={{ paddingRight: '40px' }}
                  required
                />
                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '14px', fontWeight: 600, pointerEvents: 'none' }}>
                  °C
                </span>
              </div>
            </div>
          </div>

          {/* Row 3 (3 fields): Cooling End Date * | Cooling End Time * | Final Temperature (°C) * */}
          <div className="grid-3" style={{ marginTop: '8px' }}>
            <div className="form-group">
              <label className="form-label">Cooling End Date *</label>
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Cooling End Time *</label>
              <input
                type="time"
                className="form-input"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Final Temperature (°C) *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  placeholder="e.g. 8"
                  value={endTemp}
                  onChange={e => setEndTemp(e.target.value)}
                  style={{ paddingRight: '40px' }}
                  required
                />
                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '14px', fontWeight: 600, pointerEvents: 'none' }}>
                  °C
                </span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                Target: ≤ 8°C
              </span>
            </div>
          </div>

          {/* Calculated Duration Pill Badge matching mockup */}
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              Calculated Cooling Duration:
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor: limitPassed ? '#DCFCE7' : '#FEE2E2',
                color: limitPassed ? '#15803D' : '#991B1B',
                border: limitPassed ? '1px solid #BBF7D0' : '1px solid #FECACA'
              }}
            >
              {durationMinutes} minutes ({limitPassed ? 'Within ≤2 hour limit' : 'Exceeds ≤2 hour limit'})
            </span>
          </div>
        </div>

        {/* Section 2: Comments / Observations */}
        <div className="card card-padded">
          <div style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: '12px', marginBottom: '20px' }}>
            <h3 className="section-title" style={{ fontSize: '16px', margin: 0, color: 'var(--color-text-primary)' }}>
              Comments / Observations
            </h3>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <textarea
              className="form-textarea"
              rows="4"
              placeholder="Enter comments or corrective action taken if temperature or duration exceeded limits..."
              value={comments}
              onChange={e => setComments(e.target.value)}
            />
          </div>
        </div>

        {/* Section 3: Staff Verification */}
        <div className="card card-padded">
          <div style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: '12px', marginBottom: '20px' }}>
            <h3 className="section-title" style={{ fontSize: '16px', margin: 0, color: 'var(--color-text-primary)' }}>
              Staff Verification
            </h3>
          </div>

          <div className="form-group" style={{ maxWidth: '400px', marginBottom: '20px' }}>
            <label className="form-label">Staff Member *</label>
            {managerStaff.length > 0 ? (
              <select
                className="form-select"
                value={staffName}
                onChange={e => setStaffName(e.target.value)}
                required
              >
                <option value="">Select staff member...</option>
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
                placeholder="Select staff member..."
                value={staffName}
                onChange={e => setStaffName(e.target.value)}
                required
              />
            )}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Signature *</label>
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
            {submitting ? 'Saving Log...' : 'Save Cooling Process Log'}
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
                placeholder="e.g. Cooked Rice"
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
    </div>
  );
};

export default CoolingProcessForm;
