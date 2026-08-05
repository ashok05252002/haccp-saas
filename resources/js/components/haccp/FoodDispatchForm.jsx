import React, { useState, useEffect, useRef } from 'react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import SignatureCanvas from 'react-signature-canvas';
import { AlertTriangle, CheckCircle, Plus, UserPlus, RotateCcw, Truck } from 'lucide-react';
import axios from 'axios';

// Temperature validation helpers matching mock
const getTempRange = (storageType) => {
  if (!storageType) return null;
  const st = storageType.toLowerCase();
  if (st.includes('chilled') || st.includes('fridge')) return { min: 0, max: 5, label: 'Chilled (0°C – 5°C)' };
  if (st.includes('frozen') || st.includes('freezer')) return { max: -18, label: 'Frozen (≤ −18°C)' };
  if (st.includes('hot')) return { min: 63, label: 'Hot (≥ 63°C)' };
  return null; // Ambient / Dry Store — no restriction
};

const isTempInRange = (temp, storageType) => {
  const range = getTempRange(storageType);
  if (!range) return true; // no restriction
  const t = parseFloat(temp);
  if (isNaN(t)) return true;
  if (range.min !== undefined && range.max !== undefined) return t >= range.min && t <= range.max;
  if (range.max !== undefined) return t <= range.max;
  if (range.min !== undefined) return t >= range.min;
  return true;
};

const FoodDispatchForm = ({ onSave, onCancel }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

  // Form Fields
  const [logDate, setLogDate] = useState(todayStr);
  const [logTime, setLogTime] = useState(nowTimeStr);

  const [staffName, setStaffName] = useState('');
  const [selectedFoodObj, setSelectedFoodObj] = useState(null);
  const [foodItem, setFoodItem] = useState('');
  const [foodCategory, setFoodCategory] = useState('');
  const [storageType, setStorageType] = useState('');

  const [batchCode, setBatchCode] = useState('');
  const [destination, setDestination] = useState('');
  const [useByDate, setUseByDate] = useState('');
  const [temperature, setTemperature] = useState('');
  const [separation, setSeparation] = useState(true); // default Yes
  const [comments, setComments] = useState('');

  const sigPad = useRef(null);
  const [isSignatureEmpty, setIsSignatureEmpty] = useState(true);

  // Master Data State
  const [staffList, setStaffList] = useState([]);
  const [foodItemsList, setFoodItemsList] = useState([]);

  // In-Place Modals State
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({ name: '', email: '', role_id: '' });
  const [staffRoles, setStaffRoles] = useState([]);
  const [staffModalSaving, setStaffModalSaving] = useState(false);
  const [staffModalError, setStaffModalError] = useState('');

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    storage_type_id: '',
    uom_id: '',
    status: 'Active'
  });
  const [storageTypes, setStorageTypes] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [productModalSaving, setProductModalSaving] = useState(false);
  const [productModalError, setProductModalError] = useState('');

  // Fetch Master Data on Mount
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [staffRes, foodRes] = await Promise.all([
          axios.get('/api/tenant-users'),
          axios.get('/api/food-items'),
        ]);

        setStaffList((staffRes.data || []).filter(s => s.status !== 'Inactive'));
        setFoodItemsList((foodRes.data || []).filter(f => f.status !== 'Inactive'));
      } catch (err) {
        console.error('Failed to fetch master data for food dispatch form', err);
      }
    };
    fetchMasterData();
  }, []);

  // Temperature Validation Derived Values
  const tempInRange = isTempInRange(temperature, storageType);
  const tempRange = getTempRange(storageType);
  const needsReview = (temperature !== '' && !tempInRange) || !separation;

  // Handle Food Selection Change
  const handleFoodSelectChange = (e) => {
    const val = e.target.value;
    if (!val) {
      setSelectedFoodObj(null);
      setFoodItem('');
      setFoodCategory('');
      setStorageType('');
      return;
    }

    try {
      const parsed = JSON.parse(val);
      setSelectedFoodObj(parsed);
      setFoodItem(parsed.name);
      setFoodCategory(parsed.category || '');
      setStorageType(parsed.storage_type?.name || parsed.storage_type || '');
    } catch (err) {
      setFoodItem(val);
      setFoodCategory('');
      setStorageType('');
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

  // Open Add Product Modal
  const handleOpenProductModal = async () => {
    setNewProductForm({ name: '', storage_type_id: '', uom_id: '', status: 'Active' });
    setProductModalError('');
    setProductModalOpen(true);

    if (storageTypes.length === 0 || uoms.length === 0) {
      try {
        const [stRes, uomRes] = await Promise.all([
          axios.get('/api/storage-types'),
          axios.get('/api/uoms')
        ]);
        const stList = stRes.data || [];
        const uomList = (uomRes.data || []).filter(u => u.status === 'Active');
        setStorageTypes(stList);
        setUoms(uomList);

        setNewProductForm(prev => ({
          ...prev,
          storage_type_id: stList.length > 0 ? stList[0].id : '',
          uom_id: uomList.length > 0 ? uomList[0].id : ''
        }));
      } catch (err) {
        console.error('Failed to load options for product modal', err);
      }
    }
  };

  // Save New Food Product
  const handleSaveNewProduct = async (e) => {
    e.preventDefault();
    setProductModalError('');

    if (!newProductForm.name.trim()) {
      setProductModalError('Product Name is required.');
      return;
    }

    setProductModalSaving(true);
    try {
      const res = await axios.post('/api/food-items', newProductForm);
      const createdProduct = res.data;
      setFoodItemsList(prev => [...prev, createdProduct]);

      const stName = storageTypes.find(s => String(s.id) === String(createdProduct.storage_type_id))?.name || 'Transport';
      const objVal = JSON.stringify({ id: createdProduct.id, name: createdProduct.name, storage_type: stName });
      setFoodItem(createdProduct.name);
      setStorageType(stName);
      setSelectedFoodObj(objVal);

      setProductModalOpen(false);
    } catch (err) {
      console.error('Failed to create new food product', err);
      setProductModalError(err.response?.data?.message || 'Failed to create product.');
    } finally {
      setProductModalSaving(false);
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
    if (!foodItem.trim()) {
      setError('Food / Product selection is required.');
      return;
    }
    if (!destination.trim()) {
      setError('Destination / Transfer Location is required.');
      return;
    }
    if (!useByDate) {
      setError('Use By Date is required.');
      return;
    }
    if (temperature === '' || temperature === null) {
      setError('Dispatch Temperature is required.');
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
      food_item: foodItem,
      food_category: foodCategory || null,
      storage_type: storageType || null,
      batch_code: batchCode || null,
      destination: destination,
      use_by_date: useByDate,
      temperature: parseFloat(temperature),
      separation: separation,
      comments: comments || null,
      signature: signatureData,
    };

    try {
      await axios.post('/api/food-dispatch-logs', payload);
      if (onSave) onSave();
    } catch (err) {
      console.error('Failed to save food dispatch log', err);
      if (err.response?.data?.errors) {
        const firstErr = Object.values(err.response.data.errors)[0];
        setError(Array.isArray(firstErr) ? firstErr[0] : firstErr);
      } else {
        setError(err.response?.data?.message || 'Failed to save dispatch log.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Standard Header Banner */}
      <div className="card" style={{ padding: '20px 24px', backgroundColor: 'var(--color-primary-pale)', border: '1px solid var(--color-border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck size={24} color="var(--color-primary)" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--color-primary-dark)' }}>
              Food Dispatch & Transfer Log
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Record safe dispatch/transport of food to another location, branch, event site, or customer.
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Section 1: Dispatch Details */}
        <div className="card card-padded">
          <div style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: '12px', marginBottom: '20px' }}>
            <h3 className="section-title" style={{ fontSize: '16px', margin: 0, color: 'var(--color-text-primary)' }}>
              Dispatch Details
            </h3>
          </div>

          {/* Row 1: Date | Staff Member | Food / Product */}
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

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>Food / Product *</label>
                <button
                  type="button"
                  onClick={handleOpenProductModal}
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
                  <Plus size={14} /> Add Product
                </button>
              </div>
              {foodItemsList.length > 0 ? (
                <select
                  className="form-select"
                  value={typeof selectedFoodObj === 'string' ? selectedFoodObj : JSON.stringify({ id: selectedFoodObj?.id, name: foodItem, storage_type: storageType })}
                  onChange={handleFoodSelectChange}
                  required
                >
                  <option value="">Select food / product...</option>
                  {foodItemsList.map(item => {
                    const objVal = JSON.stringify({ id: item.id, name: item.name, storage_type: item.storage_type?.name || item.storage_type });
                    return (
                      <option key={item.id} value={objVal}>
                        {item.name} {item.storage_type ? `(${item.storage_type.name || item.storage_type})` : ''}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <input
                  type="text"
                  className="form-input"
                  placeholder="Select food / product..."
                  value={foodItem}
                  onChange={e => setFoodItem(e.target.value)}
                  required
                />
              )}
            </div>
          </div>

          {/* Destination */}
          <div className="form-group" style={{ marginTop: '8px' }}>
            <label className="form-label">Destination / Transfer Location *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter delivery location, branch, event site, or customer location"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              required
            />
          </div>

          {/* Row 3: Batch Code | Use By Date | Dispatch Temperature */}
          <div className="grid-3" style={{ marginTop: '8px' }}>
            <div className="form-group">
              <label className="form-label">Batch Code</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. BATCH-2026-0801"
                value={batchCode}
                onChange={e => setBatchCode(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Use By Date *</label>
              <input
                type="date"
                className="form-input"
                value={useByDate}
                onChange={e => setUseByDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Dispatch Temperature (°C) *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  placeholder="e.g. 3.5"
                  value={temperature}
                  onChange={e => setTemperature(e.target.value)}
                  style={{
                    paddingRight: '40px',
                    borderColor: temperature !== '' && !tempInRange ? '#EF4444' : temperature !== '' && tempInRange ? '#10B981' : undefined,
                    fontWeight: 600
                  }}
                  required
                />
                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '14px', fontWeight: 600, pointerEvents: 'none' }}>
                  °C
                </span>
              </div>
              {tempRange && (
                <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                  Expected: {tempRange.label}
                </span>
              )}
              {temperature !== '' && !tempInRange && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#FEF2F2', border: '1px solid #F8B4B4', borderRadius: '8px', color: '#9B1C1C', fontSize: '12.5px', fontWeight: 500, marginTop: '8px' }}>
                  <AlertTriangle size={15} />
                  <span>Temperature outside expected safe range for {storageType || 'food'}. Log will be marked "Needs Review".</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Food Safety Check (Separation) */}
        <div className="card card-padded">
          <div style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: '12px', marginBottom: '20px' }}>
            <h3 className="section-title" style={{ fontSize: '16px', margin: 0, color: 'var(--color-text-primary)' }}>
              Food Safety Check
            </h3>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Adequate Separation of Raw and Ready-to-Eat Foods *</label>
            <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '10px',
                  textAlign: 'center',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: separation ? 'none' : '1px solid var(--color-border-input)',
                  backgroundColor: separation ? 'var(--color-success)' : '#ffffff',
                  color: separation ? '#ffffff' : 'var(--color-text-secondary)',
                  transition: 'all 0.2s'
                }}
                onClick={() => setSeparation(true)}
              >
                Yes
              </button>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '10px',
                  textAlign: 'center',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: !separation ? 'none' : '1px solid var(--color-border-input)',
                  backgroundColor: !separation ? 'var(--color-danger)' : '#ffffff',
                  color: !separation ? '#ffffff' : 'var(--color-text-secondary)',
                  transition: 'all 0.2s'
                }}
                onClick={() => setSeparation(false)}
              >
                No
              </button>
            </div>
            {separation === false && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: '#FEF2F2', border: '1px solid #F8B4B4', borderRadius: '8px', color: '#9B1C1C', fontSize: '13px', fontWeight: 500, marginTop: '12px' }}>
                <AlertTriangle size={16} />
                <span>Separation issue flagged. Log will be marked "Needs Review".</span>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Live Status Indicator Banner */}
        {(foodItem || temperature !== '') && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: needsReview ? '#FEF2F2' : '#ECFDF5',
              color: needsReview ? '#9B1C1C' : '#047857',
              border: needsReview ? '1px solid #F8B4B4' : '1px solid #A7F3D0'
            }}
          >
            {needsReview ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
            <span>
              Status: <strong>{needsReview ? 'Needs Review' : 'Passed'}</strong>
            </span>
          </div>
        )}

        {/* Section 4: Comments / Actions */}
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

        {/* Section 5: Signature */}
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
            {submitting ? 'Saving Log...' : 'Save Dispatch Log'}
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

      {/* Quick Add Product Modal */}
      <Modal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title="Add Food Product"
        size="md"
      >
        <form onSubmit={handleSaveNewProduct}>
          {productModalError && (
            <div className="alert alert-error" style={{ marginBottom: '16px' }}>
              <AlertTriangle size={16} />
              <span>{productModalError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Cooked Chicken Breasts"
              value={newProductForm.name}
              onChange={e => setNewProductForm({ ...newProductForm, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Storage Type *</label>
            <select
              className="form-select"
              value={newProductForm.storage_type_id}
              onChange={e => setNewProductForm({ ...newProductForm, storage_type_id: e.target.value })}
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
              value={newProductForm.uom_id}
              onChange={e => setNewProductForm({ ...newProductForm, uom_id: e.target.value })}
              required
            >
              <option value="">Select UOM</option>
              {uoms.map(uom => (
                <option key={uom.id} value={uom.id}>{uom.unit_name || uom.name} ({uom.unit_symbol || uom.symbol})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setProductModalOpen(false)} disabled={productModalSaving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={productModalSaving}>
              {productModalSaving ? 'Saving...' : 'Save & Select Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FoodDispatchForm;
