import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Info, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SignaturePad from '../components/common/SignaturePad';
import AmendmentReasonModal from '../components/common/AmendmentReasonModal';
import axios from 'axios';

const DEFAULT_METHODS = [
  'Refrigerator / Chiller',
  'Controlled cold water',
  'Microwave then cook immediately',
  'Other controlled method',
];

const DEFAULT_FOODS = ['Frozen Beef Patties', 'Frozen Chicken Breasts', 'Frozen Salmon Fillets', 'Frozen Pastry Sheets'];
const DEFAULT_STORAGE_LOCATIONS = ['Prep Chiller 1', 'Walk-in Fridge', 'Raw Meat Chiller', 'Chiller / Defrosting Area'];

const ThawingFormPage = ({ logId }) => {
  const isEdit = Boolean(logId);
  const [defrostMethods, setDefrostMethods] = useState(DEFAULT_METHODS);
  const [defrostMethod, setDefrostMethod] = useState(DEFAULT_METHODS[0]);

  const [staffList, setStaffList] = useState([]);
  const [foodItemsList, setFoodItemsList] = useState([]);
  const [storageLocationList, setStorageLocationList] = useState(DEFAULT_STORAGE_LOCATIONS);

  // UOM & Storage Types for Master Creation
  const [uomList, setUomList] = useState([]);
  const [storageTypeList, setStorageTypeList] = useState([]);

  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  // Form Fields
  const [foodItemName, setFoodItemName] = useState('');
  const [storageLocation, setStorageLocation] = useState(DEFAULT_STORAGE_LOCATIONS[0]);
  const [startDate, setStartDate] = useState(today);
  const [startTime, setStartTime] = useState(nowTime);
  const [completedDate, setCompletedDate] = useState(today);
  const [completedTime, setCompletedTime] = useState(nowTime);
  const [defrostTemp, setDefrostTemp] = useState('');
  const [comments, setComments] = useState('');

  // Signature
  const [staffName, setStaffName] = useState('');
  const [signedByStaffName, setSignedByStaffName] = useState('');
  const [signature, setSignature] = useState('');

  // Inline Master Food Item Modal
  const [showAddFood, setShowAddFood] = useState(false);
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodUomId, setNewFoodUomId] = useState('');
  const [newFoodStorageTypeId, setNewFoodStorageTypeId] = useState('');
  const [addingFood, setAddingFood] = useState(false);
  const [addFoodError, setAddFoodError] = useState('');

  // Inline Master Storage Location Modal
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationType, setNewLocationType] = useState('Fridge');
  const [addingLocation, setAddingLocation] = useState(false);
  const [addLocationError, setAddLocationError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showReasonModal, setShowReasonModal] = useState(false);

  useEffect(() => {
    // Fetch Staff List
    axios.get('/api/tenant-users').then(res => {
      setStaffList(res.data || []);
      if (res.data && res.data.length > 0) {
        setStaffName(res.data[0].name);
        setSignedByStaffName(res.data[0].name);
      }
    }).catch(() => {});

    // Fetch Defrosting Methods Master
    axios.get('/api/defrosting-methods').then(res => {
      const mList = (res.data || []).map(m => typeof m === 'string' ? m : m.name);
      if (mList.length > 0) {
        setDefrostMethods(mList);
        setDefrostMethod(mList[0]);
      }
    }).catch(() => {});

    // Fetch Food Items Master
    axios.get('/api/food-items').then(res => {
      const fList = (res.data || []).map(f => typeof f === 'string' ? f : f.name);
      setFoodItemsList(fList.length > 0 ? fList : DEFAULT_FOODS);
      if (fList.length > 0) setFoodItemName(fList[0]);
      else setFoodItemName(DEFAULT_FOODS[0]);
    }).catch(() => {
      setFoodItemsList(DEFAULT_FOODS);
      setFoodItemName(DEFAULT_FOODS[0]);
    });

    // Fetch Storage Zones Master
    axios.get('/api/storage-zones').then(res => {
      const sList = (res.data || []).map(s => typeof s === 'string' ? s : s.name);
      if (sList.length > 0) {
        setStorageLocationList(sList);
        setStorageLocation(sList[0]);
      }
    }).catch(() => {});

    // Fetch UOMs & Storage Types
    axios.get('/api/uoms').then(res => {
      setUomList(res.data || []);
      if (res.data && res.data.length > 0) setNewFoodUomId(res.data[0].id);
    }).catch(() => {});

    axios.get('/api/storage-types').then(res => {
      setStorageTypeList(res.data || []);
      if (res.data && res.data.length > 0) setNewFoodStorageTypeId(res.data[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!logId) return;
    axios.get(`/api/thawing-logs/${logId}`).then(res => {
      const data = res.data;
      if (data) {
        if (data.food_item_name) setFoodItemName(data.food_item_name);
        if (data.defrost_method) setDefrostMethod(data.defrost_method);
        if (data.storage_location) setStorageLocation(data.storage_location);
        if (data.start_date) setStartDate(data.start_date);
        if (data.start_time) setStartTime(data.start_time);
        if (data.completed_date) setCompletedDate(data.completed_date);
        if (data.completed_time) setCompletedTime(data.completed_time);
        if (data.defrost_temp !== null && data.defrost_temp !== undefined) setDefrostTemp(String(data.defrost_temp));
        if (data.comments) setComments(data.comments);
        if (data.signed_by_staff_name) setSignedByStaffName(data.signed_by_staff_name);
        if (data.signature) setSignature(data.signature);
      }
    }).catch(err => {
      console.error('Failed to fetch thawing log for edit', err);
    });
  }, [logId]);

  // Temperature Compliance Validation (<= 5.0°C for chilled methods)
  const tempNum = parseFloat(defrostTemp);
  const isChilledMethod = strContains(defrostMethod, 'refrigerator') ||
                         strContains(defrostMethod, 'chiller') ||
                         strContains(defrostMethod, 'water');
  const isMicrowave = strContains(defrostMethod, 'microwave');

  const isTempHigh = isChilledMethod && !isNaN(tempNum) && tempNum > 5.0;
  const passed = defrostTemp !== '' && !isTempHigh;

  function strContains(str, substr) {
    return (str || '').toLowerCase().includes(substr);
  }

  /* Inline Food Master Creation */
  const handleAddFoodItem = async () => {
    if (!newFoodName.trim()) {
      setAddFoodError('Product name is required.');
      return;
    }

    setAddingFood(true);
    setAddFoodError('');

    try {
      const res = await axios.post('/api/food-items', {
        name: newFoodName.trim(),
        uom_id: newFoodUomId,
        storage_type_id: newFoodStorageTypeId,
        status: 'Active',
      });

      const createdName = res.data.name;
      setFoodItemsList(prev => [...prev.filter(f => f !== createdName), createdName]);
      setFoodItemName(createdName);

      setNewFoodName('');
      setShowAddFood(false);
    } catch (err) {
      console.error('Failed to add food item to Manager Hub', err);
      setAddFoodError(err.response?.data?.errors?.name?.[0] || 'Failed to add food item.');
    } finally {
      setAddingFood(false);
    }
  };

  /* Inline Storage Location Master Creation */
  const handleAddStorageLocation = async () => {
    if (!newLocationName.trim()) {
      setAddLocationError('Storage location name is required.');
      return;
    }

    setAddingLocation(true);
    setAddLocationError('');

    try {
      const res = await axios.post('/api/storage-zones', {
        name: newLocationName.trim(),
        type: newLocationType,
        status: 'Active',
      });

      const createdName = res.data.name;
      setStorageLocationList(prev => [...prev.filter(s => s !== createdName), createdName]);
      setStorageLocation(createdName);

      setNewLocationName('');
      setShowAddLocation(false);
    } catch (err) {
      console.error('Failed to add storage location to Manager Hub', err);
      setAddLocationError(err.response?.data?.errors?.name?.[0] || 'Failed to add storage location.');
    } finally {
      setAddingLocation(false);
    }
  };

  const handleFinalSubmit = async (amendmentReason = '') => {
    setSubmitting(true);
    try {
      const payload = {
        log_date: today,
        log_time: nowTime,
        food_item_name: foodItemName,
        defrost_method: defrostMethod,
        storage_location: storageLocation,
        start_date: startDate,
        start_time: startTime,
        completed_date: completedDate,
        completed_time: completedTime,
        defrost_temp: parseFloat(defrostTemp),
        comments: comments,
        signed_by_staff_name: signedByStaffName,
        signature: signature,
      };

      if (logId) {
        payload.amendment_reason = amendmentReason;
        await axios.put(`/api/thawing-logs/${logId}`, payload);
      } else {
        await axios.post('/api/thawing-logs', payload);
      }

      router.visit('/haccp-logs/thawing');
    } catch (err) {
      console.error('Failed to submit thawing log', err);
      alert(err.response?.data?.message || 'Failed to submit thawing log.');
    } finally {
      setSubmitting(false);
      setShowReasonModal(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const newErrors = {};

    if (!foodItemName) newErrors.foodItemName = 'Food item is required.';
    if (!startDate) newErrors.startDate = 'Defrost start date is required.';
    if (!startTime) newErrors.startTime = 'Defrost start time is required.';
    if (!completedDate) newErrors.completedDate = 'Defrost completed date is required.';
    if (!completedTime) newErrors.completedTime = 'Defrost completed time is required.';
    if (defrostTemp === '' || isNaN(parseFloat(defrostTemp))) newErrors.defrostTemp = 'Temperature after defrosting is required.';

    if (isTempHigh && !comments.trim()) {
      newErrors.comments = 'Comments / corrective action required when temperature exceeds 5°C limit.';
    }

    if (!signedByStaffName) newErrors.signedBy = 'Signed by staff member is required.';
    if (!signature) newErrors.signature = 'Signature is required.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (logId) {
      setShowReasonModal(true);
    } else {
      handleFinalSubmit();
    }
  };

  return (
    <PageLayout>
      <Head title="Log Thawing / Defrosting Record" />

      <div>
        <button onClick={() => router.visit('/haccp-logs/thawing')} className="back-btn" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} />
          <span>Back to Thawing Logs</span>
        </button>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <h1 className="page-title">Thawing / Defrosting Record</h1>
            <span className="badge badge-ccp">CCP</span>
            <span className="badge badge-standard">EC 852/2004 Annex II</span>
          </div>
          <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Log controlled defrosting methods, completion times, and core temperatures to ensure safe food thawing (≤5°C).
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Critical Limits Info Banner */}
          <div style={{ display: 'flex', gap: '12px', padding: '14px 18px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', color: '#1E40AF', fontSize: '13px', lineHeight: '1.6' }}>
            <Info size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#2563EB' }} />
            <div>
              <strong>Critical Limits & Guidelines</strong>
              <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px' }}>
                <li>Thaw food under controlled conditions, preferably in a refrigerator/chiller.</li>
                <li>Keep thawed food chilled at <strong>5°C or below</strong> unless it is cooked immediately.</li>
                <li>Do not thaw food at room temperature.</li>
                <li>Record comments/actions if the temperature is outside the safe limit (&gt;5°C).</li>
              </ul>
            </div>
          </div>

          {/* Defrosting Details Card */}
          <Card style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '8px', margin: 0 }}>
              Defrosting Details
            </h3>

            {/* Food Item Selection with Inline Master Creation */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Food Product / Item *</label>
                <Button variant="secondary" size="sm" type="button" icon={Plus} onClick={() => setShowAddFood(!showAddFood)}>
                  Add Food Item
                </Button>
              </div>

              <select className="form-select" value={foodItemName} onChange={e => setFoodItemName(e.target.value)}>
                {foodItemsList.map(fi => (
                  <option key={fi} value={fi}>{fi}</option>
                ))}
              </select>
            </div>

            {/* Inline Add Food Item Box */}
            {showAddFood && (
              <div style={{ padding: '16px 18px', backgroundColor: '#F9FAFB', border: '1px solid var(--color-border-light)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-primary)' }}>
                  Add New Food Product to Manager Hub Master
                </div>

                {addFoodError && <div style={{ color: 'var(--color-danger)', fontSize: '12.5px' }}>{addFoodError}</div>}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Product Name *</label>
                    <input className="form-input" style={{ backgroundColor: '#fff' }} placeholder="e.g. Frozen Beef Patties" value={newFoodName} onChange={e => setNewFoodName(e.target.value)} />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Default UOM *</label>
                    <select className="form-select" style={{ backgroundColor: '#fff' }} value={newFoodUomId} onChange={e => setNewFoodUomId(e.target.value)}>
                      {uomList.map(u => (
                        <option key={u.id} value={u.id}>{u.unit_name} ({u.unit_symbol})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Storage Type *</label>
                    <select className="form-select" style={{ backgroundColor: '#fff' }} value={newFoodStorageTypeId} onChange={e => setNewFoodStorageTypeId(e.target.value)}>
                      {storageTypeList.map(st => (
                        <option key={st.id} value={st.id}>{st.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                  <Button variant="secondary" size="sm" type="button" onClick={() => setShowAddFood(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="button" onClick={handleAddFoodItem} disabled={addingFood || !newFoodName.trim()}>
                    {addingFood ? 'Saving...' : 'Save to Manager Hub'}
                  </Button>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Defrosting Method *</label>
                <select className="form-select" value={defrostMethod} onChange={e => setDefrostMethod(e.target.value)}>
                  {defrostMethods.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Storage Location Dropdown with Master Addition */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Storage / Location *</label>
                  <Button variant="secondary" size="sm" type="button" icon={Plus} onClick={() => setShowAddLocation(!showAddLocation)}>
                    Add Location
                  </Button>
                </div>

                <select className="form-select" value={storageLocation} onChange={e => setStorageLocation(e.target.value)}>
                  {storageLocationList.map(sl => (
                    <option key={sl} value={sl}>{sl}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Inline Add Storage Location Box */}
            {showAddLocation && (
              <div style={{ padding: '16px 18px', backgroundColor: '#F9FAFB', border: '1px solid var(--color-border-light)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-primary)' }}>
                  Add New Storage Location to Manager Hub Master
                </div>

                {addLocationError && <div style={{ color: 'var(--color-danger)', fontSize: '12.5px' }}>{addLocationError}</div>}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Location Name *</label>
                    <input className="form-input" style={{ backgroundColor: '#fff' }} placeholder="e.g. Prep Chiller 2" value={newLocationName} onChange={e => setNewLocationName(e.target.value)} />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Location Type *</label>
                    <select className="form-select" style={{ backgroundColor: '#fff' }} value={newLocationType} onChange={e => setNewLocationType(e.target.value)}>
                      <option value="Fridge">Fridge</option>
                      <option value="Freezer">Freezer</option>
                      <option value="Hot Cabinet">Hot Cabinet</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                  <Button variant="secondary" size="sm" type="button" onClick={() => setShowAddLocation(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="button" onClick={handleAddStorageLocation} disabled={addingLocation || !newLocationName.trim()}>
                    {addingLocation ? 'Saving...' : 'Save to Manager Hub'}
                  </Button>
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Defrost Start Date *</label>
                <input className="form-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Defrost Start Time *</label>
                <input className="form-input" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Defrost Completed Date *</label>
                <input className="form-input" type="date" value={completedDate} onChange={e => setCompletedDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Defrost Completed Time *</label>
                <input className="form-input" type="time" value={completedTime} onChange={e => setCompletedTime(e.target.value)} required />
              </div>
            </div>

            {/* Core Temperature */}
            <div className="form-group" style={{ maxWidth: '340px' }}>
              <label className="form-label">Temperature After Defrosting (°C) *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 3.5"
                  className="form-input"
                  style={{
                    backgroundColor: isTempHigh ? '#FEF2F2' : '#fff',
                    borderColor: isTempHigh ? '#EF4444' : 'var(--color-border-light)',
                  }}
                  value={defrostTemp}
                  onChange={e => setDefrostTemp(e.target.value)}
                  required
                />
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>°C</span>
              </div>
              {errors.defrostTemp && <span style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{errors.defrostTemp}</span>}

              {isTempHigh && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: '#FEF2F2', border: '1px solid #F8B4B4', borderRadius: '8px', color: '#9B1C1C', fontSize: '12.5px', marginTop: '8px' }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>Temperature is above safe chilled limit (&gt;5°C). Comments/corrective action required.</span>
                </div>
              )}

              {isMicrowave && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', color: '#1E40AF', fontSize: '12.5px', marginTop: '8px' }}>
                  <Info size={16} style={{ flexShrink: 0 }} />
                  <span>Food must be cooked immediately after microwave thawing.</span>
                </div>
              )}
            </div>

            {/* Evaluation Status Banner */}
            {defrostTemp !== '' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: passed ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${passed ? '#A7F3D0' : '#F8B4B4'}`, borderRadius: '8px', color: passed ? '#047857' : '#9B1C1C', fontSize: '13.5px', fontWeight: 500 }}>
                {passed ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                <span>
                  Evaluation: <strong>{passed ? 'Passed (Safe Chilled Limit ≤ 5°C)' : 'Needs Review (Temperature above 5°C limit)'}</strong>
                </span>
              </div>
            )}
          </Card>

          {/* Comments Card */}
          <Card style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '8px', margin: 0 }}>
              Comments / Observations
            </h3>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Enter comments, observations, or corrective action taken if temperature exceeds 5°C..."
                value={comments}
                onChange={e => setComments(e.target.value)}
              />
              {errors.comments && <span style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{errors.comments}</span>}
            </div>
          </Card>

          {/* Signature Card */}
          <Card style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '8px', margin: 0 }}>
              Staff Verification
            </h3>

            <div className="form-group" style={{ maxWidth: '400px', marginBottom: 0 }}>
              <label className="form-label">Signed By *</label>
              {staffList.length > 0 ? (
                <select className="form-select" value={signedByStaffName} onChange={e => setSignedByStaffName(e.target.value)}>
                  {staffList.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              ) : (
                <input className="form-input" type="text" placeholder="Signed By Name" value={signedByStaffName} onChange={e => setSignedByStaffName(e.target.value)} required />
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Signature *</label>
              <SignaturePad value={signature} onChange={setSignature} />
              {errors.signature && <span style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{errors.signature}</span>}
            </div>
          </Card>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '40px' }}>
            <Button variant="secondary" onClick={() => router.visit('/haccp-logs/thawing')} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving Log...' : 'Save Thawing Log'}
            </Button>
          </div>
        </form>

        <AmendmentReasonModal
          isOpen={showReasonModal}
          onClose={() => setShowReasonModal(false)}
          onConfirm={handleFinalSubmit}
          loading={submitting}
        />
      </div>
    </PageLayout>
  );
};

export default ThawingFormPage;
