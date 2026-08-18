import React, { useState, useEffect, useRef } from 'react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import axios from 'axios';
import { Save, AlertCircle, Trash2, Plus, X, Info } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

const getStorageTypeRuleText = (st) => {
  if (!st) return '';
  if (st.rule_text && typeof st.rule_text === 'string' && st.rule_text.trim()) {
    return st.rule_text.trim();
  }
  const nameLower = (st.name || '').toLowerCase().trim();
  if (nameLower.includes('chilled')) {
    return '0°C to 5°C';
  }
  if (nameLower.includes('frozen')) {
    return '≤ -18°C';
  }
  if (nameLower.includes('hot')) {
    return '≥ 63°C';
  }
  if (nameLower.includes('ambient')) {
    return 'Room temperature / no strict temperature limit';
  }
  if (st.min_temp !== null && st.min_temp !== undefined && st.max_temp !== null && st.max_temp !== undefined) {
    return `${st.min_temp}°C to ${st.max_temp}°C`;
  }
  if (st.min_temp !== null && st.min_temp !== undefined) {
    return `≥ ${st.min_temp}°C`;
  }
  if (st.max_temp !== null && st.max_temp !== undefined) {
    return `≤ ${st.max_temp}°C`;
  }
  return 'Room temperature / no strict temperature limit';
};

const isTemperatureInvalid = (temperatureVal, foodItem) => {
  if (!foodItem || temperatureVal === undefined || temperatureVal === null) return false;
  const strVal = String(temperatureVal).trim();
  if (strVal === '') return false;

  const temp = parseFloat(strVal);
  if (isNaN(temp)) return false;

  const st = foodItem.storage_type || foodItem.storageType;
  if (!st) return false;

  const nameLower = (st.name || '').toLowerCase().trim();

  // 1. Chilled food: 0°C to 5°C inclusive
  if (nameLower.includes('chilled')) {
    const min = (st.min_temp !== null && st.min_temp !== undefined) ? Number(st.min_temp) : 0;
    const max = (st.max_temp !== null && st.max_temp !== undefined) ? Number(st.max_temp) : 5;
    return temp < min || temp > max;
  }

  // 2. Frozen food: <= -18°C
  if (nameLower.includes('frozen')) {
    const max = (st.max_temp !== null && st.max_temp !== undefined) ? Number(st.max_temp) : -18;
    return temp > max;
  }

  // 3. Hot food: >= 63°C
  if (nameLower.includes('hot')) {
    const min = (st.min_temp !== null && st.min_temp !== undefined) ? Number(st.min_temp) : 63;
    return temp < min;
  }

  // 4. Ambient food: no strict temperature limit
  if (nameLower.includes('ambient')) {
    return false;
  }

  // Fallback for custom storage types
  if (st.min_temp !== null && st.min_temp !== undefined) {
    if (temp < Number(st.min_temp)) return true;
  }
  if (st.max_temp !== null && st.max_temp !== undefined) {
    if (temp > Number(st.max_temp)) return true;
  }

  return false;
};

const DeliveryIntakeForm = ({ onSave, onCancel, logId }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Quick Add Food Item Modal State
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [targetProductId, setTargetProductId] = useState(null);
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

  const sigCanvas = useRef(null);

  const [form, setForm] = useState({
    log_date: new Date().toISOString().split('T')[0],
    log_time: new Date().toTimeString().slice(0, 5),
    supplier_id: '',
    staff_name: '',
    packaging_intact: true,
    vehicle_safe: true,
    comment: '',
    signature: ''
  });

  const [products, setProducts] = useState([
    { id: Date.now(), food_item_id: '', batch_number: '', use_by_date: '', quantity: '', temperature: '' }
  ]);

  useEffect(() => {
    const fetchMasterData = async () => {
      setLoading(true);
      try {
        const [suppliersRes, foodItemsRes, staffRes] = await Promise.all([
          axios.get('/api/suppliers'),
          axios.get('/api/food-items'),
          axios.get('/api/tenant-users')
        ]);
        setSuppliers(suppliersRes.data.filter(s => s.status === 'Active') || []);
        setFoodItems(foodItemsRes.data.filter(f => f.status === 'Active') || []);
        setStaffMembers((staffRes.data || []).filter(s => s.status !== 'Inactive'));
      } catch (err) {
        console.error('Failed to fetch master data', err);
        setError('Could not load master data. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    fetchMasterData();
  }, []);

  useEffect(() => {
    if (!logId) return;
    const fetchExisting = async () => {
      try {
        const res = await axios.get(`/api/delivery-intake/${logId}`);
        const data = res.data;
        if (data) {
          setForm({
            log_date: data.log_date || new Date().toISOString().split('T')[0],
            log_time: data.log_time || new Date().toTimeString().slice(0, 5),
            supplier_id: data.supplier_id ? String(data.supplier_id) : '',
            staff_name: data.staff_name || '',
            packaging_intact: data.packaging_intact !== undefined ? Boolean(data.packaging_intact) : true,
            vehicle_safe: data.vehicle_safe !== undefined ? Boolean(data.vehicle_safe) : true,
            comment: data.comment || '',
            signature: data.signature || '',
          });
          if (Array.isArray(data.products) && data.products.length > 0) {
            setProducts(data.products.map(p => ({
              id: p.id || Date.now() + Math.random(),
              food_item_id: p.food_item_id ? String(p.food_item_id) : '',
              batch_number: p.batch_number || '',
              use_by_date: p.use_by_date || '',
              quantity: p.quantity ? String(p.quantity) : '',
              temperature: p.temperature !== null && p.temperature !== undefined ? String(p.temperature) : '',
            })));
          }
        }
      } catch (err) {
        console.error('Failed to load delivery intake log for edit', err);
        setError('Failed to load existing delivery intake data.');
      }
    };
    fetchExisting();
  }, [logId]);

  const handleOpenFoodModal = async (productId = null) => {
    setTargetProductId(productId);
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
        console.error('Failed to load storage types/UOMs for food item modal', err);
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

      setFoodItems(prev => [...prev, createdItem]);

      if (targetProductId) {
        handleProductChange(targetProductId, 'food_item_id', String(createdItem.id));
      }

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleProductChange = (id, field, value) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const addProduct = () => {
    setProducts([...products, { id: Date.now(), food_item_id: '', batch_number: '', use_by_date: '', quantity: '', temperature: '' }]);
  };

  const removeProduct = (id) => {
    if (products.length > 1) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
    setForm(prev => ({ ...prev, signature: '' }));
  };

  const handleSignatureEnd = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const dataUrl = sigCanvas.current.getCanvas
        ? sigCanvas.current.getCanvas().toDataURL('image/png')
        : sigCanvas.current.toDataURL('image/png');
      setForm(prev => ({ ...prev, signature: dataUrl }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // 1. Staff Member validation
    if (!form.staff_name || !form.staff_name.trim()) {
      setError('Please select staff member.');
      setSaving(false);
      return;
    }

    // 2. Signature validation
    let sigData = form.signature;
    if (sigCanvas.current) {
      if (!sigCanvas.current.isEmpty()) {
        sigData = sigCanvas.current.getCanvas
          ? sigCanvas.current.getCanvas().toDataURL('image/png')
          : sigCanvas.current.toDataURL('image/png');
      } else {
        sigData = '';
      }
    }

    if (!sigData || !sigData.trim()) {
      setError('Please add signature before saving.');
      setSaving(false);
      return;
    }

    // 3. Products validation
    if (products.some(p => !p.food_item_id || !p.quantity)) {
      setError('All products must have a Food Item and Quantity selected.');
      setSaving(false);
      return;
    }

    const hasEmptyTemp = products.some(p => p.temperature === undefined || p.temperature === null || String(p.temperature).trim() === '');
    if (hasEmptyTemp) {
      setError('Please enter temperature for all products.');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        ...form,
        signature: sigData,
        supplier_id: form.supplier_id ? parseInt(form.supplier_id) : null,
        products: products.map(p => ({
          food_item_id: parseInt(p.food_item_id),
          batch_number: p.batch_number || null,
          use_by_date: p.use_by_date || null,
          quantity: p.quantity,
          temperature: parseFloat(p.temperature),
        }))
      };

      if (logId) {
        await axios.put(`/api/delivery-intake/${logId}`, payload);
      } else {
        await axios.post('/api/delivery-intake', payload);
      }
      
      if (onSave) {
        onSave();
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.errors?.staff_name?.[0] ||
                     err.response?.data?.errors?.signature?.[0] ||
                     err.response?.data?.errors?.['products.0.temperature']?.[0] ||
                     err.response?.data?.errors?.products?.[0] ||
                     err.response?.data?.error ||
                     'Failed to save delivery intake. Please verify all required fields.';
      setError(errMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading form...</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ padding: '24px 32px' }}>
        {error && (
          <div style={styles.errorAlert}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* CCP-1 Critical Limits Info Banner */}
        <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Info size={20} color="#16A34A" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '13px', color: '#166534', lineHeight: 1.5 }}>
            <strong>CCP-1 Delivery Acceptance Limits:</strong> Chilled foods ≤ 5°C &bull; Frozen foods ≤ -18°C &bull; Packaging clean and intact &bull; Vehicle hygienic &bull; Check expiration dates.
          </div>
        </div>

        {/* General Intake Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={styles.sectionTitle}>Intake Info</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Date <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input type="date" className="form-input" name="log_date" value={form.log_date} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Time <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                <input type="time" className="form-input" name="log_time" value={form.log_time} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Supplier</label>
              <select className="form-select" name="supplier_id" value={form.supplier_id} onChange={handleChange}>
                <option value="">Select Supplier...</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Staff Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <select className="form-select" name="staff_name" value={form.staff_name} onChange={handleChange} required>
                <option value="">-- Select Staff Member * --</option>
                {staffMembers.map(s => (
                  <option key={s.id} value={s.name}>
                    {s.name} {s.assigned_role ? `(${s.assigned_role.name})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={styles.sectionTitle}>Checklist & Notes</h4>
            
            <div style={styles.toggleRow}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>Packaging Intact?</label>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>Is the outer packaging free of damage?</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" name="packaging_intact" checked={form.packaging_intact} onChange={handleChange} />
                <span className="slider"></span>
              </label>
            </div>

            <div style={styles.toggleRow}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>Is delivery vehicle safe?</label>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>Clean and at correct temperature?</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" name="vehicle_safe" checked={form.vehicle_safe} onChange={handleChange} />
                <span className="slider"></span>
              </label>
            </div>

            <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: '8px' }}>
              <label className="form-label">Comments / Issues</label>
              <textarea 
                className="form-input" 
                name="comment" 
                value={form.comment} 
                onChange={handleChange} 
                placeholder="Enter any comments or note issues..." 
                style={{ flex: 1, resize: 'none', minHeight: '60px', fontFamily: 'inherit' }}
              />
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '8px', marginBottom: '16px' }}>
            <h4 style={{ ...styles.sectionTitle, borderBottom: 'none', paddingBottom: 0 }}>Products Received</h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {products.map((p, index) => {
              const selectedFoodItem = foodItems.find(f => String(f.id) === String(p.food_item_id));
              const st = selectedFoodItem?.storage_type || selectedFoodItem?.storageType;
              const isInvalid = isTemperatureInvalid(p.temperature, selectedFoodItem);

              return (
                <div key={p.id} style={styles.productRow}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)' }}>Product #{index + 1}</span>
                    {products.length > 1 && (
                      <button type="button" onClick={() => removeProduct(p.id)} style={styles.removeBtn}>
                        <X size={14} /> Remove
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>
                          Food Item / Product <span style={{ color: 'var(--color-danger)' }}>*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleOpenFoodModal(p.id)}
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
                      <select className="form-select" value={p.food_item_id} onChange={(e) => handleProductChange(p.id, 'food_item_id', e.target.value)} required>
                        <option value="">Select product...</option>
                        {foodItems.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>

                      {/* Rule Text Display below Food Item / Product dropdown */}
                      {p.food_item_id && st && (
                        <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--color-primary-darker)', fontWeight: 500, lineHeight: 1.4 }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-primary-darker)' }}>Storage Type:</span> {st.name} <span style={{ margin: '0 6px', color: 'var(--color-border)' }}>|</span> <span style={{ fontWeight: 700, color: 'var(--color-primary-darker)' }}>Rule:</span> {getStorageTypeRuleText(st)}
                        </div>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Quantity / Weight <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                      <input type="text" className="form-input" value={p.quantity} onChange={(e) => handleProductChange(p.id, 'quantity', e.target.value)} placeholder="e.g. 5kg, 2 boxes" required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Batch / Lot Code</label>
                      <input type="text" className="form-input" value={p.batch_number} onChange={(e) => handleProductChange(p.id, 'batch_number', e.target.value)} placeholder="Enter code" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">Use-By Date</label>
                        <input type="date" className="form-input" value={p.use_by_date} onChange={(e) => handleProductChange(p.id, 'use_by_date', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Temp (°C) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                        <input 
                          type="number" 
                          step="0.1" 
                          className="form-input" 
                          value={p.temperature} 
                          onChange={(e) => handleProductChange(p.id, 'temperature', e.target.value)} 
                          placeholder="e.g. 4.5" 
                          required
                          style={isInvalid ? { borderColor: 'var(--color-danger)', color: 'var(--color-danger)' } : {}}
                        />
                        {isInvalid && (
                          <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--color-danger)', fontWeight: 500 }}>
                              Out of bounds
                            </span>
                            <div className="tooltip-container">
                              <Info size={14} color="var(--color-danger)" style={{ cursor: 'help' }} />
                              <span className="tooltip-text">
                                {selectedFoodItem?.name} ({st?.name}) should follow rule: {getStorageTypeRuleText(st)}.
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Button type="button" variant="secondary" icon={Plus} onClick={addProduct} style={{ marginTop: '16px' }}>
            Add Another Product
          </Button>
        </div>

        {/* Signature */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={styles.sectionTitle}>Signature <span style={{ color: 'var(--color-danger)' }}>*</span></h4>
            {form.signature && (
              <button type="button" onClick={clearSignature} style={styles.clearSigBtn}>
                <Trash2 size={13} /> Clear
              </button>
            )}
          </div>
          <div style={styles.sigPadWrapper}>
            <SignatureCanvas 
              ref={sigCanvas} 
              penColor="black"
              canvasProps={{ width: 800, height: 160, className: 'sigCanvas' }}
              onEnd={handleSignatureEnd}
              backgroundColor="#FAFAFA"
            />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Sign above using your mouse or touch screen to confirm this intake log.</p>
        </div>
      </div>

      <div style={styles.formFooter}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" icon={Save} loading={saving}>
          Save Intake Log
        </Button>
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
    </form>
  );
};

const styles = {
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
    margin: 0,
    borderBottom: '1px solid var(--color-border-light)',
    paddingBottom: '8px',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '13px',
    fontWeight: 500,
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid var(--color-border-light)'
  },
  productRow: {
    backgroundColor: '#fff',
    border: '1px solid var(--color-border-light)',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-danger)',
    fontSize: '12px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
  },
  formFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '20px 32px',
    backgroundColor: '#FAFAFA',
    borderTop: '1px solid var(--color-border-light)',
    borderBottomLeftRadius: '12px',
    borderBottomRightRadius: '12px',
  },
  sigPadWrapper: {
    border: '1px solid var(--color-border-light)',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#FAFAFA',
    maxWidth: '100%',
    overflowX: 'auto',
  },
  clearSigBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: 'var(--color-danger)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
  }
};

export default DeliveryIntakeForm;
