import React, { useState, useEffect, useRef } from 'react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import SignatureCanvas from 'react-signature-canvas';
import { AlertTriangle, Save, Flame, Snowflake, Snowflake as RefrigeratorIcon, RefreshCw, Soup, CheckCircle, ArrowRight, ArrowLeft, Plus } from 'lucide-react';
import axios from 'axios';

const CookingTemperatureForm = ({ onSave, onCancel, logId }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [existingSignature, setExistingSignature] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // Stepper State (Step 0 to 5 -> 6 steps total)
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1: Base & Food Details
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logTime, setLogTime] = useState(
    new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
  );
  const [staffName, setStaffName] = useState('');
  const [foodItem, setFoodItem] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [probeId, setProbeId] = useState('');

  // Manager Hub Master Data
  const [managerFoodItems, setManagerFoodItems] = useState([]);
  const [managerThermometers, setManagerThermometers] = useState([]);
  const [managerStaff, setManagerStaff] = useState([]);

  // Quick Add Food Item Modal State
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

  useEffect(() => {
    const fetchManagerData = async () => {
      try {
        const [foodRes, thermoRes, staffRes, zoneRes] = await Promise.all([
          axios.get('/api/food-items'),
          axios.get('/api/thermometers'),
          axios.get('/api/tenant-users'),
          axios.get('/api/storage-zones')
        ]);
        setManagerFoodItems(foodRes.data || []);
        setManagerThermometers(thermoRes.data || []);
        setManagerStaff((staffRes.data || []).filter(s => s.status !== 'Inactive'));
        setManagerStorageZones((zoneRes.data || []).filter(z => z.status !== 'Inactive'));
      } catch (err) {
        console.error('Failed to fetch master data from Manager Hub', err);
      }
    };
    fetchManagerData();
  }, []);

  useEffect(() => {
    if (!logId) return;
    const fetchExisting = async () => {
      try {
        setLoadingExisting(true);
        const res = await axios.get(`/api/cooking-logs/${logId}`);
        const data = res.data;
        if (data) {
          if (data.log_date) setLogDate(data.log_date);
          if (data.log_time) setLogTime(data.log_time);
          if (data.staff_name) setStaffName(data.staff_name);
          if (data.food_item) setFoodItem(data.food_item);
          if (data.batch_code) setBatchCode(data.batch_code);
          if (data.probe_id) setProbeId(data.probe_id);

          if (data.cooking_temp !== null && data.cooking_temp !== undefined) setCookingTemp(String(data.cooking_temp));
          if (data.cooking_target) setCookingTarget(data.cooking_target);
          if (data.cooking_method === 'N/A' && !data.time_finished_cooking) {
            setCookingNa(true);
          }
          if (data.time_finished_cooking) {
            setTimeFinishedCooking(data.time_finished_cooking);
          }

          if (data.chilling_method) {
            if (data.chilling_method === 'N/A') setChillingNa(true);
            else setChillingMethod(data.chilling_method);
          }
          if (data.chilling_start_time) setChillingStartTime(data.chilling_start_time);
          if (data.chilling_end_time) setChillingEndTime(data.chilling_end_time);
          if (data.chilling_start_temp !== null && data.chilling_start_temp !== undefined) setChillingStartTemp(String(data.chilling_start_temp));
          if (data.chilling_end_temp !== null && data.chilling_end_temp !== undefined) setChillingEndTemp(String(data.chilling_end_temp));
          if (data.chilling_duration_minutes !== null && data.chilling_duration_minutes !== undefined) setChillingDurationMinutes(String(data.chilling_duration_minutes));
          if (data.chilling_corrective_action) setChillingCorrectiveAction(data.chilling_corrective_action);

          if (data.chiller_location) {
            if (data.chiller_location === 'N/A') setChillerNa(true);
            else setChillerLocation(data.chiller_location);
          }
          if (data.chiller_temp !== null && data.chiller_temp !== undefined) setChillerTemp(String(data.chiller_temp));

          if (data.reheating_temp !== null && data.reheating_temp !== undefined) setReheatingTemp(String(data.reheating_temp));
          if (data.reheating_method) {
            if (data.reheating_method === 'N/A') setReheatingNa(true);
            else setReheatingMethod(data.reheating_method);
          }

          if (data.hot_holding_location) {
            if (data.hot_holding_location === 'N/A') setHotHoldingNa(true);
            else setHotHoldingLocation(data.hot_holding_location);
          }
          if (data.hot_holding_temp !== null && data.hot_holding_temp !== undefined) setHotHoldingTemp(String(data.hot_holding_temp));

          if (data.corrective_action) setCorrectiveAction(data.corrective_action);
          if (data.notes) setNotes(data.notes);
          if (data.signature) setExistingSignature(data.signature);
        }
      } catch (err) {
        console.error('Failed to load existing cooking log for edit', err);
        setError('Failed to load existing log data.');
      } finally {
        setLoadingExisting(false);
      }
    };
    fetchExisting();
  }, [logId]);

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
        setFoodModalError('Failed to load master options.');
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
      if (err.response && err.response.data && err.response.data.errors && err.response.data.errors.name) {
        setFoodModalError(err.response.data.errors.name[0]);
      } else {
        setFoodModalError(err.response?.data?.message || 'Failed to create new food item.');
      }
    } finally {
      setFoodModalSaving(false);
    }
  };

  // Stage N/A Checkboxes
  const [cookingNa, setCookingNa] = useState(false);
  const [chillingNa, setChillingNa] = useState(false);
  const [chillerNa, setChillerNa] = useState(false);
  const [reheatingNa, setReheatingNa] = useState(false);
  const [hotHoldingNa, setHotHoldingNa] = useState(false);

  // Step 2: Cooking Process (CCP-3)
  const [cookingTemp, setCookingTemp] = useState('');
  const [timeFinishedCooking, setTimeFinishedCooking] = useState('');
  const [cookingTarget, setCookingTarget] = useState('≥ 75°C');

  // Step 3: Blast Chilling (CCP-4)
  const [chillingMethod, setChillingMethod] = useState('Blast Chiller');
  const [chillingStartTime, setChillingStartTime] = useState('');
  const [chillingEndTime, setChillingEndTime] = useState('');
  const [chillingStartTemp, setChillingStartTemp] = useState('');
  const [chillingEndTemp, setChillingEndTemp] = useState('');
  const [chillingDurationMinutes, setChillingDurationMinutes] = useState('');
  const [chillingCorrectiveAction, setChillingCorrectiveAction] = useState('');
  const [managerStorageZones, setManagerStorageZones] = useState([]);

  // Step 4: Chiller Hold
  const [chillerLocation, setChillerLocation] = useState('Main Walk-in Fridge');
  const [chillerTemp, setChillerTemp] = useState('');

  // Step 5: Reheating
  const [reheatingMethod, setReheatingMethod] = useState('Combi Oven');
  const [reheatingTemp, setReheatingTemp] = useState('');

  // Step 6: Hot Holding (CCP-5) & Final Notes
  const [hotHoldingLocation, setHotHoldingLocation] = useState('Bain Marie 1');
  const [hotHoldingTemp, setHotHoldingTemp] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [notes, setNotes] = useState('');

  const sigPad = useRef(null);

  // Live Validations
  const validateCooking = () => {
    if (cookingNa) return true;
    if (!cookingTemp) return null;
    const temp = parseFloat(cookingTemp);
    if (isNaN(temp)) return false;
    return temp >= 75.0; // Target >= 75°C
  };

  // Auto calculate chilling duration in minutes when start and end time are entered
  useEffect(() => {
    if (chillingStartTime && chillingEndTime) {
      const [sH, sM] = chillingStartTime.split(':').map(Number);
      const [eH, eM] = chillingEndTime.split(':').map(Number);
      if (!isNaN(sH) && !isNaN(sM) && !isNaN(eH) && !isNaN(eM)) {
        let diff = (eH * 60 + eM) - (sH * 60 + sM);
        if (diff < 0) diff += 24 * 60;
        setChillingDurationMinutes(diff);
      }
    }
  }, [chillingStartTime, chillingEndTime]);

  const validateChilling = () => {
    if (chillingNa) return true;
    if (!chillingEndTemp) return null;
    const end = parseFloat(chillingEndTemp);
    if (isNaN(end)) return false;
    const duration = parseInt(chillingDurationMinutes || 0, 10);
    if (end <= 3.0 && (duration === 0 || duration <= 90)) {
      return true;
    }
    return false;
  };

  const validateChiller = () => {
    if (chillerNa) return true;
    if (!chillerTemp) return null;
    const temp = parseFloat(chillerTemp);
    if (isNaN(temp)) return false;
    return temp >= 0.0 && temp <= 5.0; // 0 to 5°C
  };

  const validateReheating = () => {
    if (reheatingNa) return true;
    if (!reheatingTemp) return null;
    const temp = parseFloat(reheatingTemp);
    if (isNaN(temp)) return false;
    return temp >= 75.0; // Target >= 75°C
  };

  const validateHotHolding = () => {
    if (hotHoldingNa) return true;
    if (!hotHoldingTemp) return null;
    const temp = parseFloat(hotHoldingTemp);
    if (isNaN(temp)) return false;
    return temp >= 63.0; // Target >= 63°C
  };

  const stepsList = [
    { title: 'Food Details', icon: CheckCircle },
    { title: 'Cooking', icon: Flame },
    { title: 'Blast Chilling', icon: Snowflake },
    { title: 'Chiller Hold', icon: RefrigeratorIcon },
    { title: 'Reheating', icon: RefreshCw },
    { title: 'Hot Holding & Final', icon: Soup },
  ];

  const handleNext = () => {
    setError(null);
    if (currentStep === 0) {
      if (!logDate || !logTime || !foodItem) {
        setError('Date, Time, and Food Item are mandatory.');
        return;
      }
    } else if (currentStep === 1) {
      if (!cookingNa && (cookingTemp === '' || cookingTemp === null)) {
        setError('Core Cooking Temperature is mandatory. If cooking was not performed, check "Stage Not Applicable / Skip Stage".');
        return;
      }
    } else if (currentStep === 2) {
      if (!chillingNa && (chillingEndTemp === '' || chillingEndTemp === null)) {
        setError('Blast Chilling End Temperature is mandatory. If blast chilling was not performed, check "Stage Not Applicable / Skip Stage".');
        return;
      }
    } else if (currentStep === 3) {
      if (!chillerNa && (chillerTemp === '' || chillerTemp === null)) {
        setError('Storage Temperature is mandatory. If cold storage was not performed, check "Stage Not Applicable / Skip Stage".');
        return;
      }
    } else if (currentStep === 4) {
      if (!reheatingNa && (reheatingTemp === '' || reheatingTemp === null)) {
        setError('Reheating Core Temperature is mandatory. If reheating was not performed, check "Stage Not Applicable / Skip Stage".');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, stepsList.length - 1));
  };

  const handlePrev = () => {
    setError(null);
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    setError(null);

    // Validate Step 6 before submitting
    if (!hotHoldingNa && (hotHoldingTemp === '' || hotHoldingTemp === null)) {
      setError('Hot Holding Temperature is mandatory. If hot holding was not performed, check "Stage Not Applicable / Skip Stage".');
      return;
    }

    // Validate Signature
    let signatureData = existingSignature;
    if (sigPad.current && !sigPad.current.isEmpty()) {
      signatureData = sigPad.current.getCanvas().toDataURL('image/png');
    }

    if (!signatureData) {
      setError('Staff Verification Signature is mandatory. Please provide a signature before submitting.');
      return;
    }

    setSubmitting(true);

    const payload = {
      log_date: logDate,
      log_time: logTime,
      staff_name: staffName || null,
      food_item: foodItem,
      batch_code: batchCode || null,
      probe_id: probeId || null,

      cooking_temp: !cookingNa && cookingTemp !== '' ? parseFloat(cookingTemp) : null,
      cooking_target: cookingTarget,
      cooking_method: cookingNa ? 'N/A' : null,
      time_finished_cooking: cookingNa ? null : (timeFinishedCooking || null),
      cooking_passed: validateCooking() ?? true,

      chilling_method: chillingNa ? 'N/A' : chillingMethod,
      chilling_start_time: chillingStartTime || null,
      chilling_end_time: chillingEndTime || null,
      chilling_start_temp: !chillingNa && chillingStartTemp !== '' ? parseFloat(chillingStartTemp) : null,
      chilling_end_temp: !chillingNa && chillingEndTemp !== '' ? parseFloat(chillingEndTemp) : null,
      chilling_duration_minutes: !chillingNa && chillingDurationMinutes !== '' ? parseInt(chillingDurationMinutes, 10) : null,
      chilling_passed: validateChilling() ?? true,
      chilling_corrective_action: chillingCorrectiveAction || null,

      chiller_location: chillerNa ? 'N/A' : chillerLocation,
      chiller_temp: !chillerNa && chillerTemp !== '' ? parseFloat(chillerTemp) : null,
      chiller_passed: validateChiller() ?? true,

      reheating_temp: !reheatingNa && reheatingTemp !== '' ? parseFloat(reheatingTemp) : null,
      reheating_method: reheatingNa ? 'N/A' : reheatingMethod,
      reheating_passed: validateReheating() ?? true,

      hot_holding_location: hotHoldingNa ? 'N/A' : hotHoldingLocation,
      hot_holding_temp: !hotHoldingNa && hotHoldingTemp !== '' ? parseFloat(hotHoldingTemp) : null,
      hot_holding_passed: validateHotHolding() ?? true,

      corrective_action: correctiveAction || null,
      notes: notes || null,
      signature: signatureData,
    };

    try {
      if (logId) {
        await axios.put(`/api/cooking-logs/${logId}`, payload);
      } else {
        await axios.post('/api/cooking-logs', payload);
      }
      onSave();
    } catch (err) {
      console.error('Failed to save cooking log', err);
      setError(err.response?.data?.message || 'Failed to save log.');
      setSubmitting(false);
    }
  };

  const progressPercent = ((currentStep + 1) / stepsList.length) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', borderRadius: '12px' }}>
      
      {/* 1 - 2 - 3 - 4 - 5 - 6 Stepper Progress Header */}
      <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--color-border-light)', backgroundColor: '#FAFAFA', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              STEP {currentStep + 1} OF {stepsList.length}
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0 0 0', color: 'var(--color-text-primary)' }}>
              {stepsList[currentStep].title}
            </h2>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            {Math.round(progressPercent)}% Completed
          </div>
        </div>

        {/* Progress Bar Line */}
        <div style={{ width: '100%', height: '6px', backgroundColor: '#E5E7EB', borderRadius: '3px', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: 'var(--color-primary)', transition: 'width 0.3s ease' }}></div>
        </div>

        {/* Step Circles Row */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stepsList.length}, 1fr)`, gap: '8px' }}>
          {stepsList.map((step, idx) => {
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;
            return (
              <div 
                key={idx}
                onClick={() => { if (idx < currentStep) setCurrentStep(idx); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  cursor: idx <= currentStep ? 'pointer' : 'default',
                  backgroundColor: isActive ? '#ECFDF5' : isCompleted ? '#ffffff' : '#F3F4F6',
                  border: isActive ? '2px solid #10B981' : isCompleted ? '1px solid #A7F3D0' : '1px solid transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  backgroundColor: isActive ? '#10B981' : isCompleted ? '#059669' : '#D1D5DB',
                  color: '#ffffff'
                }}>
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span style={{ fontSize: '13px', fontWeight: isActive ? 700 : 500, color: isActive ? '#047857' : isCompleted ? '#065F46' : '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content Container (Using div to prevent form auto-submit) */}
      <div style={{ padding: '32px' }}>
        {error && (
          <div style={{ padding: '14px 18px', backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: '10px', marginBottom: '24px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #FECACA' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Food Details */}
        {currentStep === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ backgroundColor: '#F9FAFB', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border-light)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--color-text-primary)' }}>Batch & Item Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Date *</label>
                  <input type="date" className="form-input" value={logDate} onChange={e => setLogDate(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Time *</label>
                  <input type="time" className="form-input" value={logTime} onChange={e => setLogTime(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>
                      Food Item / Product *
                    </label>
                    <button
                      type="button"
                      onClick={handleOpenFoodModal}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-primary)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: 0
                      }}
                    >
                      <Plus size={13} /> Add to Master
                    </button>
                  </div>
                  <select 
                    className="form-input" 
                    value={foodItem} 
                    onChange={e => setFoodItem(e.target.value)} 
                    required
                  >
                    <option value="">-- Select Food Item from Manager Hub --</option>
                    {managerFoodItems.map(item => (
                      <option key={item.id} value={item.name}>
                        {item.name} {item.storage_type ? `(${item.storage_type.name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Staff Name</label>
                  <select 
                    className="form-input" 
                    value={staffName} 
                    onChange={e => setStaffName(e.target.value)}
                  >
                    <option value="">-- Select Staff Member --</option>
                    {managerStaff.map(s => (
                      <option key={s.id} value={s.name}>
                        {s.name} {s.assigned_role ? `(${s.assigned_role.name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Batch / Lot Code</label>
                  <input type="text" className="form-input" placeholder="e.g. BATCH-2026-08A" value={batchCode} onChange={e => setBatchCode(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Probe / Thermometer Used</label>
                  <select 
                    className="form-input" 
                    value={probeId} 
                    onChange={e => setProbeId(e.target.value)}
                  >
                    <option value="">-- Select Thermometer from Master --</option>
                    {managerThermometers.map(t => (
                      <option key={t.id} value={t.name}>
                        {t.name} {t.serial_number ? `(${t.serial_number})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Cooking (CCP-3) */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ backgroundColor: '#FFF7ED', padding: '24px', borderRadius: '12px', border: '1px solid #FFEDD5' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Flame size={24} color="#EA580C" />
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#9A3412' }}>Cooking Core Temperature (CCP-3)</h3>
                </div>
                
                {/* N/A Checkbox */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', backgroundColor: '#ffffff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #FDBA74', fontSize: '13px', fontWeight: 700, color: '#9A3412' }}>
                  <input type="checkbox" checked={cookingNa} onChange={e => setCookingNa(e.target.checked)} style={{ accentColor: '#EA580C' }} />
                  <span>Stage Not Applicable / Skip Stage</span>
                </label>
              </div>

              {!cookingNa ? (
                <>
                  <div style={{ fontSize: '14px', color: '#C2410C', marginBottom: '20px', fontWeight: 500 }}>
                    Target Requirement: Core temperature must reach <strong>≥ 75°C</strong> (or 70°C for at least 2 minutes) to destroy pathogens.
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ color: '#9A3412' }}>Core Temperature (°C) *</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        className="form-input" 
                        placeholder="e.g. 78.5" 
                        value={cookingTemp} 
                        onChange={e => setCookingTemp(e.target.value)} 
                        style={{
                          borderColor: validateCooking() === false ? '#EF4444' : validateCooking() === true ? '#10B981' : undefined,
                          backgroundColor: validateCooking() === false ? '#FEF2F2' : validateCooking() === true ? '#ECFDF5' : '#ffffff',
                          fontWeight: 700,
                          fontSize: '18px'
                        }}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ color: '#9A3412' }}>Time Finished Cooking</label>
                      <input 
                        type="time" 
                        className="form-input" 
                        value={timeFinishedCooking} 
                        onChange={e => setTimeFinishedCooking(e.target.value)} 
                        style={{ fontWeight: 600 }}
                      />
                    </div>
                  </div>

                  {cookingTemp !== '' && (
                    <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: validateCooking() ? '#ECFDF5' : '#FEF2F2', color: validateCooking() ? '#047857' : '#B91C1C', border: validateCooking() ? '1px solid #A7F3D0' : '1px solid #FECACA' }}>
                      {validateCooking() ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                      <span>{validateCooking() ? 'Critical Limit Passed (≥ 75°C)' : 'FAILED: Temperature below 75°C limit!'}</span>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px dashed #FDBA74', color: '#C2410C', fontWeight: 600, fontSize: '14px', textAlign: 'center' }}>
                  Cooking stage marked as Not Applicable for this food item.
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Blast Chilling (CCP-4) */}
        {currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ backgroundColor: '#ECFEFF', padding: '24px', borderRadius: '12px', border: '1px solid #CFFAFE' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Snowflake size={24} color="#0891B2" />
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#155E75' }}>Blast Chilling / Rapid Cooling (CCP-4)</h3>
                </div>

                {/* N/A Checkbox */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', backgroundColor: '#ffffff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #67E8F9', fontSize: '13px', fontWeight: 700, color: '#155E75' }}>
                  <input type="checkbox" checked={chillingNa} onChange={e => setChillingNa(e.target.checked)} style={{ accentColor: '#0891B2' }} />
                  <span>Stage Not Applicable / Skip Stage</span>
                </label>
              </div>

              {!chillingNa ? (
                <>
                  <div style={{ fontSize: '14px', color: '#0E7490', marginBottom: '20px', fontWeight: 500 }}>
                    Target Requirement: Rapidly cool cooked food from <strong>≥ 63°C to ≤ 3°C</strong> within <strong>90 minutes max</strong>.
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ color: '#155E75' }}>Chilling Start Time</label>
                      <input type="time" className="form-input" value={chillingStartTime} onChange={e => setChillingStartTime(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ color: '#155E75' }}>Chilling End Time</label>
                      <input type="time" className="form-input" value={chillingEndTime} onChange={e => setChillingEndTime(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ color: '#155E75' }}>Start Temp (°C)</label>
                      <input type="number" step="0.1" className="form-input" placeholder="e.g. 65.0" value={chillingStartTemp} onChange={e => setChillingStartTemp(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ color: '#155E75' }}>End Temp (°C) *</label>
                      <input type="number" step="0.1" className="form-input" placeholder="e.g. 2.5" value={chillingEndTemp} onChange={e => setChillingEndTemp(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ color: '#155E75' }}>Duration (Minutes)</label>
                      <input type="number" className="form-input" placeholder="Auto-calculated" value={chillingDurationMinutes} onChange={e => setChillingDurationMinutes(e.target.value)} />
                    </div>
                  </div>

                  {chillingEndTemp !== '' && (
                    <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: validateChilling() ? '#ECFDF5' : '#FEF2F2', color: validateChilling() ? '#047857' : '#B91C1C', border: validateChilling() ? '1px solid #A7F3D0' : '1px solid #FECACA' }}>
                      {validateChilling() ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                      <span>
                        {validateChilling() 
                          ? `CCP-4 Limit Passed (End Temp ${chillingEndTemp}°C ≤ 3°C, Duration ${chillingDurationMinutes ? chillingDurationMinutes + ' mins' : '< 90 mins'})` 
                          : `FAILED: Blast chilling limit exceeded! (End Temp > 3°C or Duration > 90 mins)`}
                      </span>
                    </div>
                  )}

                  {validateChilling() === false && (
                    <div style={{ marginTop: '16px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', padding: '16px', borderRadius: '8px' }}>
                      <label className="form-label" style={{ color: '#991B1B', fontWeight: 700 }}>
                        Mandatory Corrective Action Required *
                      </label>
                      <textarea
                        className="form-input"
                        rows="2"
                        placeholder="Describe action taken (e.g. Returned to blast chiller for extra 15 mins, re-tested at 2.1°C)..."
                        value={chillingCorrectiveAction}
                        onChange={e => setChillingCorrectiveAction(e.target.value)}
                        style={{ borderColor: '#FCA5A5' }}
                        required
                      />
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px dashed #67E8F9', color: '#0E7490', fontWeight: 600, fontSize: '14px', textAlign: 'center' }}>
                  Blast Chilling stage marked as Not Applicable for this food item.
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: Chiller Hold */}
        {currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ backgroundColor: '#EFF6FF', padding: '24px', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <RefrigeratorIcon size={24} color="#2563EB" />
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#1E40AF' }}>Cold Storage / Chiller Hold</h3>
                </div>

                {/* N/A Checkbox */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', backgroundColor: '#ffffff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #93C5FD', fontSize: '13px', fontWeight: 700, color: '#1E40AF' }}>
                  <input type="checkbox" checked={chillerNa} onChange={e => setChillerNa(e.target.checked)} style={{ accentColor: '#2563EB' }} />
                  <span>Stage Not Applicable / Skip Stage</span>
                </label>
              </div>

              {!chillerNa ? (
                <>
                  <div style={{ fontSize: '14px', color: '#1D4ED8', marginBottom: '20px', fontWeight: 500 }}>
                    Target Requirement: Maintain refrigerated storage temperature between <strong>0°C and 5°C</strong>.
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ color: '#1E40AF' }}>Chiller / Storage Location</label>
                      {managerStorageZones.length > 0 ? (
                        <select className="form-input" value={chillerLocation} onChange={e => setChillerLocation(e.target.value)}>
                          {managerStorageZones.map(zone => (
                            <option key={zone.id} value={zone.name}>
                              {zone.name} {zone.type ? `(${zone.type})` : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input type="text" className="form-input" placeholder="e.g. Walk-in Fridge 1" value={chillerLocation} onChange={e => setChillerLocation(e.target.value)} />
                      )}
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ color: '#1E40AF' }}>Storage Temp (°C) *</label>
                      <input type="number" step="0.1" className="form-input" placeholder="e.g. 3.2" value={chillerTemp} onChange={e => setChillerTemp(e.target.value)} />
                    </div>
                  </div>

                  {chillerTemp !== '' && (
                    <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: validateChiller() ? '#ECFDF5' : '#FEF2F2', color: validateChiller() ? '#047857' : '#B91C1C', border: validateChiller() ? '1px solid #A7F3D0' : '1px solid #FECACA' }}>
                      {validateChiller() ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                      <span>{validateChiller() ? 'Chiller Temp Passed (0°C to 5°C)' : 'FAILED: Chiller temperature out of safe bounds!'}</span>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px dashed #93C5FD', color: '#1D4ED8', fontWeight: 600, fontSize: '14px', textAlign: 'center' }}>
                  Chiller Hold stage marked as Not Applicable for this food item.
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 5: Reheating */}
        {currentStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ backgroundColor: '#FFFBEB', padding: '24px', borderRadius: '12px', border: '1px solid #FDE68A' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <RefreshCw size={24} color="#D97706" />
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#B45309' }}>Reheating Process</h3>
                </div>

                {/* N/A Checkbox */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', backgroundColor: '#ffffff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #FCD34D', fontSize: '13px', fontWeight: 700, color: '#B45309' }}>
                  <input type="checkbox" checked={reheatingNa} onChange={e => setReheatingNa(e.target.checked)} style={{ accentColor: '#D97706' }} />
                  <span>Stage Not Applicable / Skip Stage</span>
                </label>
              </div>

              {!reheatingNa ? (
                <>
                  <div style={{ fontSize: '14px', color: '#92400E', marginBottom: '20px', fontWeight: 500 }}>
                    Target Requirement: Rapidly reheat food to a core temperature of <strong>≥ 75°C</strong>.
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ color: '#B45309' }}>Reheated Core Temp (°C) *</label>
                      <input type="number" step="0.1" className="form-input" placeholder="e.g. 76.5" value={reheatingTemp} onChange={e => setReheatingTemp(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ color: '#B45309' }}>Reheating Method</label>
                      <select className="form-input" value={reheatingMethod} onChange={e => setReheatingMethod(e.target.value)}>
                        <option value="Combi Oven">Combi Oven</option>
                        <option value="Microwave">Microwave</option>
                        <option value="Steamer">Steamer</option>
                        <option value="Stove Top">Stove Top</option>
                      </select>
                    </div>
                  </div>

                  {reheatingTemp !== '' && (
                    <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: validateReheating() ? '#ECFDF5' : '#FEF2F2', color: validateReheating() ? '#047857' : '#B91C1C', border: validateReheating() ? '1px solid #A7F3D0' : '1px solid #FECACA' }}>
                      {validateReheating() ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                      <span>{validateReheating() ? 'Reheating Passed (≥ 75°C)' : 'FAILED: Reheating temperature below 75°C!'}</span>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px dashed #FCD34D', color: '#92400E', fontWeight: 600, fontSize: '14px', textAlign: 'center' }}>
                  Reheating stage marked as Not Applicable for this food item.
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 6: Hot Holding & Final Verification */}
        {currentStep === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ backgroundColor: '#FDF2F8', padding: '24px', borderRadius: '12px', border: '1px solid #FBCFE8' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Soup size={24} color="#DB2777" />
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#9D174D' }}>Hot Holding & Service (CCP-5)</h3>
                </div>

                {/* N/A Checkbox */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', backgroundColor: '#ffffff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #F472B6', fontSize: '13px', fontWeight: 700, color: '#9D174D' }}>
                  <input type="checkbox" checked={hotHoldingNa} onChange={e => setHotHoldingNa(e.target.checked)} style={{ accentColor: '#DB2777' }} />
                  <span>Stage Not Applicable / Skip Stage</span>
                </label>
              </div>

              {!hotHoldingNa ? (
                <>
                  <div style={{ fontSize: '14px', color: '#BE185D', marginBottom: '20px', fontWeight: 500 }}>
                    Target Requirement: Maintain hot holding temperature at <strong>≥ 63°C</strong> at all times during service.
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ color: '#9D174D' }}>Hot Holding Location</label>
                      <input type="text" className="form-input" placeholder="e.g. Bain Marie 1" value={hotHoldingLocation} onChange={e => setHotHoldingLocation(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ color: '#9D174D' }}>Holding Temp (°C) *</label>
                      <input type="number" step="0.1" className="form-input" placeholder="e.g. 66.0" value={hotHoldingTemp} onChange={e => setHotHoldingTemp(e.target.value)} />
                    </div>
                  </div>

                  {hotHoldingTemp !== '' && (
                    <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: validateHotHolding() ? '#ECFDF5' : '#FEF2F2', color: validateHotHolding() ? '#047857' : '#B91C1C', border: validateHotHolding() ? '1px solid #A7F3D0' : '1px solid #FECACA' }}>
                      {validateHotHolding() ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                      <span>{validateHotHolding() ? 'Hot Holding Passed (≥ 63°C)' : 'FAILED: Hot holding temperature below 63°C!'}</span>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px dashed #F472B6', color: '#BE185D', fontWeight: 600, fontSize: '14px', textAlign: 'center' }}>
                  Hot Holding stage marked as Not Applicable for this food item.
                </div>
              )}
            </div>

            {/* Corrective Action & Notes */}
            <div style={{ backgroundColor: '#FAFAFA', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border-light)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Corrective Action (if any check failed)</label>
                <textarea className="form-input" rows="2" placeholder="e.g. Reheated food to 80°C / Adjusted oven temp" value={correctiveAction} onChange={e => setCorrectiveAction(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">General Notes / Observations</label>
                <textarea className="form-input" rows="2" placeholder="Optional comments..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>

            {/* Signature Pad */}
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>Staff Verification Signature *</h4>
                <button type="button" onClick={() => sigPad.current?.clear()} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  Clear Signature
                </button>
              </div>
              <div style={{ border: '1px solid var(--color-border-light)', borderRadius: '10px', overflow: 'hidden' }}>
                <SignatureCanvas 
                  penColor="black"
                  canvasProps={{ width: 800, height: 140, className: 'sigCanvas' }} 
                  ref={sigPad}
                  backgroundColor="#FAFAFA"
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--color-border-light)' }}>
          <Button type="button" variant="secondary" onClick={currentStep === 0 ? onCancel : handlePrev} disabled={submitting}>
            <ArrowLeft size={16} style={{ marginRight: '6px' }} />
            {currentStep === 0 ? 'Cancel' : 'Previous Step'}
          </Button>

          {currentStep < stepsList.length - 1 ? (
            <Button type="button" variant="primary" onClick={handleNext}>
              Next Step
              <ArrowRight size={16} style={{ marginLeft: '6px' }} />
            </Button>
          ) : (
            <Button type="button" variant="primary" icon={Save} onClick={handleSubmit} disabled={submitting} style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}>
              {submitting ? 'Saving Log...' : 'Save & Submit Log'}
            </Button>
          )}
        </div>
      </div>

      {/* Quick Add Food Item Modal */}
      <Modal
        isOpen={foodModalOpen}
        onClose={() => setFoodModalOpen(false)}
        title="Add New Master Food Item"
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFoodModalOpen(false)}
              disabled={foodModalSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSaveNewFoodItem}
              disabled={foodModalSaving || foodModalLoading}
            >
              {foodModalSaving ? 'Saving...' : 'Save Food Item'}
            </Button>
          </div>
        }
      >
        {foodModalLoading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Loading storage types & units...
          </div>
        ) : (
          <form onSubmit={handleSaveNewFoodItem} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {foodModalError && (
              <div style={{
                padding: '10px 14px',
                backgroundColor: '#FEE2E2',
                color: '#B91C1C',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600
              }}>
                {foodModalError}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Food Item Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Fresh Chicken Breast"
                value={newFoodItemForm.name}
                onChange={e => setNewFoodItemForm({ ...newFoodItemForm, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Storage Type *</label>
              <select
                className="form-select"
                value={newFoodItemForm.storage_type_id}
                onChange={e => setNewFoodItemForm({ ...newFoodItemForm, storage_type_id: e.target.value })}
                required
              >
                <option value="">-- Select Storage Type --</option>
                {storageTypes.map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Default Unit of Measure (UOM) *</label>
              <select
                className="form-select"
                value={newFoodItemForm.uom_id}
                onChange={e => setNewFoodItemForm({ ...newFoodItemForm, uom_id: e.target.value })}
                required
              >
                <option value="">-- Select UOM --</option>
                {uoms.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.unit_code} — {u.unit_name}
                  </option>
                ))}
              </select>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default CookingTemperatureForm;
