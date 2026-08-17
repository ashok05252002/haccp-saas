import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Info, CheckCircle, AlertTriangle, Plus, Trash2, ShieldAlert } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SignaturePad from '../components/common/SignaturePad';
import axios from 'axios';

const UNITS = ['kg', 'g', 'litres', 'portions', 'units', 'trays'];

const createEmptyItem = (defaultType, defaultSource, defaultReason, defaultMethod) => ({
  id: 'w_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
  wasteType: defaultType || 'Organic / Processing Scraps',
  foodItem: '',
  source: defaultSource || 'Preparation',
  reason: defaultReason || 'Spoilage',
  quantity: '',
  unit: 'kg',
  estimatedCost: '',
  batchCode: '',
  expiryDate: '',
  disposalMethod: defaultMethod || 'Food waste bin',
  notes: '',
});

const FoodWasteFormPage = ({ logId }) => {
  const isEdit = Boolean(logId);
  const [staffList, setStaffList] = useState([]);
  const [foodItemsList, setFoodItemsList] = useState([]);
  const [typesList, setTypesList] = useState([]);
  const [reasonsList, setReasonsList] = useState([]);
  const [sourcesList, setSourcesList] = useState([]);
  const [methodsList, setMethodsList] = useState([]);

  // UOM & Storage Types for Manager Hub Master Creation
  const [uomList, setUomList] = useState([]);
  const [storageTypeList, setStorageTypeList] = useState([]);

  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  // Top Section
  const [logDate, setLogDate] = useState(today);
  const [logTime, setLogTime] = useState(nowTime);
  const [staffName, setStaffName] = useState('');

  // Waste Items List
  const [wasteItems, setWasteItems] = useState([]);

  // Final Section
  const [generalComments, setGeneralComments] = useState('');
  const [preventionAction, setPreventionAction] = useState('');
  const [signedByStaffName, setSignedByStaffName] = useState('');
  const [signature, setSignature] = useState('');

  // Inline Manager Hub Food Item Master Modal
  const [showAddFood, setShowAddFood] = useState(false);
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodUomId, setNewFoodUomId] = useState('');
  const [newFoodStorageTypeId, setNewFoodStorageTypeId] = useState('');
  const [addingFood, setAddingFood] = useState(false);
  const [addFoodError, setAddFoodError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Fetch Staff List
    axios.get('/api/tenant-users').then(res => {
      setStaffList(res.data || []);
      if (res.data && res.data.length > 0) {
        setStaffName(res.data[0].name);
        setSignedByStaffName(res.data[0].name);
      }
    }).catch(() => {});

    // Fetch Food Items (Manager Hub Master)
    axios.get('/api/food-items').then(res => {
      const fList = (res.data || []).map(f => typeof f === 'string' ? f : f.name);
      setFoodItemsList(fList.length > 0 ? fList : ['Minced Beef', 'Chicken Breast', 'Lettuce', 'Milk', 'Cooked Rice']);
    }).catch(() => {
      setFoodItemsList(['Minced Beef', 'Chicken Breast', 'Lettuce', 'Milk', 'Cooked Rice']);
    });

    // Fetch UOMs (Manager Hub Master)
    axios.get('/api/uoms').then(res => {
      const uList = res.data || [];
      setUomList(uList);
      if (uList.length > 0) setNewFoodUomId(uList[0].id);
    }).catch(() => {});

    // Fetch Storage Types (Manager Hub Master)
    axios.get('/api/storage-types').then(res => {
      const stList = res.data || [];
      setStorageTypeList(stList);
      if (stList.length > 0) setNewFoodStorageTypeId(stList[0].id);
    }).catch(() => {});

    // Fetch Waste Types (Manager Hub Master)
    axios.get('/api/waste-types').then(res => {
      const tList = (res.data || []).filter(t => t.status === 'Active' || !t.status).map(t => t.name || t.type_name);
      setTypesList(tList.length > 0 ? tList : ['Organic / Processing Scraps', 'Expired Stock', 'Damaged Goods', 'Overproduction', 'Customer Return', 'Spoilage']);
    }).catch(() => {
      setTypesList(['Organic / Processing Scraps', 'Expired Stock', 'Damaged Goods', 'Overproduction', 'Customer Return', 'Spoilage']);
    });

    // Fetch Waste Reasons (Manager Hub Master)
    axios.get('/api/waste-reasons').then(res => {
      const rList = (res.data || []).filter(r => r.status === 'Active' || !r.status).map(r => r.name || r.reason_name);
      setReasonsList(rList.length > 0 ? rList : ['Spoilage', 'Expired raw materials', 'Overproduction', 'Temperature abuse', 'Damaged packaging', 'Contamination risk', 'Returned plate', 'Trimming / Prep scrap']);
    }).catch(() => {
      setReasonsList(['Spoilage', 'Expired raw materials', 'Overproduction', 'Temperature abuse', 'Damaged packaging', 'Contamination risk', 'Returned plate', 'Trimming / Prep scrap']);
    });

    // Fetch Waste Sources (Manager Hub Master)
    axios.get('/api/waste-source-stages').then(res => {
      const sList = (res.data || []).filter(s => s.status === 'Active' || !s.status).map(s => s.name || s.stage_name);
      setSourcesList(sList.length > 0 ? sList : ['Preparation', 'Storage', 'Cooking / Hot Holding', 'Customer Plate', 'Receiving / Intake']);
    }).catch(() => {
      setSourcesList(['Preparation', 'Storage', 'Cooking / Hot Holding', 'Customer Plate', 'Receiving / Intake']);
    });

    // Fetch Waste Disposal Methods (Manager Hub Master)
    axios.get('/api/waste-disposal-methods').then(res => {
      const mList = (res.data || []).filter(m => m.status === 'Active' || !m.status).map(m => m.name || m.method_name);
      setMethodsList(mList.length > 0 ? mList : ['Food waste bin', 'Composting', 'Waste contractor', 'Sink disposal', 'Returned to supplier', 'Rendered / Animal feed']);
    }).catch(() => {
      setMethodsList(['Food waste bin', 'Composting', 'Waste contractor', 'Sink disposal', 'Returned to supplier', 'Rendered / Animal feed']);
    });

    // Initial 1 item row
    if (!logId) {
      const firstItem = createEmptyItem();
      firstItem.foodItem = 'Minced Beef';
      setWasteItems([firstItem]);
    }
  }, []);

  useEffect(() => {
    if (!logId) return;
    axios.get(`/api/food-waste-logs/${logId}`).then(res => {
      const data = res.data;
      if (data) {
        if (data.log_date) setLogDate(data.log_date);
        if (data.log_time) setLogTime(data.log_time);
        if (data.staff_name) setStaffName(data.staff_name);
        if (data.general_comments) setGeneralComments(data.general_comments);
        if (data.prevention_action) setPreventionAction(data.prevention_action);
        if (data.signed_by_staff_name) setSignedByStaffName(data.signed_by_staff_name);
        if (data.signature) setSignature(data.signature);

        let itemsData = data.items || [];
        if (typeof itemsData === 'string') {
          try { itemsData = JSON.parse(itemsData); } catch (e) { itemsData = []; }
        }

        if (Array.isArray(itemsData) && itemsData.length > 0) {
          const loadedItems = itemsData.map(item => ({
            id: 'w_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            wasteType: item.wasteType || item.waste_type || 'Organic / Processing Scraps',
            foodItem: item.foodItem || item.food_item || item.name || '',
            source: item.source || 'Preparation',
            reason: item.reason || 'Spoilage',
            quantity: item.quantity !== null && item.quantity !== undefined ? String(item.quantity) : '',
            unit: item.unit || 'kg',
            estimatedCost: item.estimatedCost !== null && item.estimatedCost !== undefined ? String(item.estimatedCost) : (item.cost ? String(item.cost) : ''),
            batchCode: item.batchCode || item.batch_code || '',
            expiryDate: item.expiryDate || item.expiry_date || '',
            disposalMethod: item.disposalMethod || item.disposal_method || 'Food waste bin',
            notes: item.notes || item.comments || '',
          }));
          setWasteItems(loadedItems);
        }
      }
    }).catch(err => {
      console.error('Failed to load food waste log for edit', err);
    });
  }, [logId]);

  /* Item Handlers */
  const handleAddItem = () => {
    const newItem = createEmptyItem(typesList[0], sourcesList[0], reasonsList[0], methodsList[0]);
    if (foodItemsList.length > 0) newItem.foodItem = foodItemsList[0];
    setWasteItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (id) => {
    if (wasteItems.length === 1) {
      alert('Log must contain at least one waste item.');
      return;
    }
    setWasteItems(prev => prev.filter(i => i.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setWasteItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      return { ...item, [field]: value };
    }));
  };

  /* Add New Manager Hub Food Item Master via API */
  const handleAddFoodItem = async () => {
    if (!newFoodName.trim()) {
      setAddFoodError('Food product name is required.');
      return;
    }

    if (!newFoodUomId) {
      setAddFoodError('Default UOM is required.');
      return;
    }

    if (!newFoodStorageTypeId) {
      setAddFoodError('Storage type is required.');
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

      const createdFood = res.data;
      const createdName = createdFood.name;

      // Add to local food items list
      setFoodItemsList(prev => [...prev.filter(f => f !== createdName), createdName]);

      // Set selected for active waste row
      if (wasteItems.length > 0) {
        handleItemChange(wasteItems[wasteItems.length - 1].id, 'foodItem', createdName);
      }

      setNewFoodName('');
      setShowAddFood(false);
    } catch (err) {
      console.error('Failed to create food item in Manager Hub', err);
      const errMsg = err.response?.data?.errors?.name?.[0] || err.response?.data?.message || 'Failed to create food item.';
      setAddFoodError(errMsg);
    } finally {
      setAddingFood(false);
    }
  };

  // Live Summary Calculations
  const totalEntries = wasteItems.length;
  const unitTotals = {};
  let totalCostSum = 0;

  wasteItems.forEach(item => {
    const q = parseFloat(item.quantity) || 0;
    const unit = item.unit || 'kg';
    unitTotals[unit] = (unitTotals[unit] || 0) + q;

    const c = parseFloat(item.estimatedCost) || 0;
    totalCostSum += c;
  });

  const quantitySummaryStr = Object.entries(unitTotals)
    .filter(([_, qty]) => qty > 0)
    .map(([unit, qty]) => `${qty} ${unit}`)
    .join(', ') || '0 kg';

  const reasonCounts = {};
  wasteItems.forEach(i => {
    if (i.reason) reasonCounts[i.reason] = (reasonCounts[i.reason] || 0) + 1;
  });
  let mainReason = 'N/A';
  let maxCount = 0;
  Object.entries(reasonCounts).forEach(([r, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mainReason = r;
    }
  });

  // Status Evaluation
  const severeReasons = ['Temperature abuse', 'Expired raw materials', 'Contamination risk'];
  const hasSevereReason = wasteItems.some(i => severeReasons.includes(i.reason));
  const passed = !hasSevereReason;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!staffName) newErrors.staffName = 'Staff member is required.';
    if (!signedByStaffName) newErrors.signedBy = 'Signed by staff member is required.';
    if (!signature) newErrors.signature = 'Signature is required.';

    let itemErrorMsg = null;
    wasteItems.forEach((item, idx) => {
      if (!item.foodItem) itemErrorMsg = `Item ${idx + 1}: Please select a food item.`;
      else if (!item.quantity || parseFloat(item.quantity) <= 0) itemErrorMsg = `Item ${idx + 1}: Please enter a valid quantity.`;
      else if (item.reason === 'Expired raw materials' && !item.expiryDate) {
        itemErrorMsg = `Item ${idx + 1}: Expiry / Use-by date is required for expired raw materials.`;
      }
    });

    if (itemErrorMsg) {
      newErrors.items = itemErrorMsg;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        log_date: logDate,
        log_time: logTime,
        staff_name: staffName,
        items: wasteItems,
        general_comments: generalComments,
        prevention_action: preventionAction,
        signed_by_staff_name: signedByStaffName,
        signature: signature,
      };

      if (logId) {
        await axios.put(`/api/food-waste-logs/${logId}`, payload);
      } else {
        await axios.post('/api/food-waste-logs', payload);
      }

      router.visit('/haccp-logs/food-waste');
    } catch (err) {
      console.error('Failed to submit food waste log', err);
      alert(err.response?.data?.message || 'Failed to submit food waste log.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <Head title="Log Food Waste" />

      <div>
        <button onClick={() => router.visit('/haccp-logs/food-waste')} className="back-btn" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} />
          <span>Back to Food Waste Logs</span>
        </button>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <h1 className="page-title">Food Waste & Disposal Log</h1>
            <span className="badge badge-prp">PRP</span>
            <span className="badge badge-standard">EC 852/2004 Annex II</span>
          </div>
          <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Record wasted food, reasons for disposal, quantities, financial cost impact, and corrective actions.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Guidance Info Banner */}
          <div style={{ display: 'flex', gap: '12px', padding: '14px 18px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', color: '#1E40AF', fontSize: '13px', lineHeight: '1.6' }}>
            <Info size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#2563EB' }} />
            <div>
              <strong>Food Waste Recording Guidance</strong>
              <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px' }}>
                <li>Record all wasted raw materials, prep scraps, expired stock, and plate waste.</li>
                <li>Ensure expired food is segregated and returned plate food is never re-served.</li>
                <li>Track estimated cost to support waste reduction and HACCP records.</li>
              </ul>
            </div>
          </div>

          {/* Unified Form Card */}
          <Card style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Top Bar Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input className="form-input" type="date" value={logDate} onChange={e => setLogDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Time *</label>
                <input className="form-input" type="time" value={logTime} onChange={e => setLogTime(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Staff Member *</label>
                {staffList.length > 0 ? (
                  <select className="form-select" value={staffName} onChange={e => { setStaffName(e.target.value); if (!signedByStaffName) setSignedByStaffName(e.target.value); }}>
                    {staffList.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                ) : (
                  <input className="form-input" type="text" placeholder="Staff Name" value={staffName} onChange={e => { setStaffName(e.target.value); setSignedByStaffName(e.target.value); }} required />
                )}
                {errors.staffName && <span style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{errors.staffName}</span>}
              </div>
            </div>

            {/* Waste Items Section */}
            <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  Waste Items ({wasteItems.length})
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="secondary" size="sm" type="button" icon={Plus} onClick={() => setShowAddFood(!showAddFood)}>
                    Add Food Item
                  </Button>
                  <Button variant="primary" size="sm" type="button" icon={Plus} onClick={handleAddItem}>
                    Add Waste Item
                  </Button>
                </div>
              </div>

              {/* Inline Add Food Item Box (Manager Hub Master Integration) */}
              {showAddFood && (
                <div style={{ padding: '16px 18px', backgroundColor: '#F9FAFB', border: '1px solid var(--color-border-light)', borderRadius: '10px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-primary)' }}>
                    Add New Food Item to Manager Hub Master
                  </div>

                  {addFoodError && <div style={{ color: 'var(--color-danger)', fontSize: '12.5px' }}>{addFoodError}</div>}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>Food Product Name *</label>
                      <input className="form-input" style={{ backgroundColor: '#fff' }} placeholder="e.g. Fresh Cod Fillet" value={newFoodName} onChange={e => setNewFoodName(e.target.value)} />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>Default UOM / Unit *</label>
                      <select className="form-select" style={{ backgroundColor: '#fff' }} value={newFoodUomId} onChange={e => setNewFoodUomId(e.target.value)}>
                        {uomList.map(u => (
                          <option key={u.id} value={u.id}>{u.unit_name} ({u.unit_symbol})</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>Storage Type / Area *</label>
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
                      {addingFood ? 'Saving Master...' : 'Save to Manager Hub'}
                    </Button>
                  </div>
                </div>
              )}

              {errors.items && <div style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '12px' }}>{errors.items}</div>}

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {wasteItems.map((item, index) => (
                  <div key={item.id} style={{ padding: '18px', backgroundColor: '#FAFAFA', border: '1px solid var(--color-border-light)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', paddingBottom: '8px' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--color-primary)' }}>
                        Item #{index + 1} {item.foodItem ? `— ${item.foodItem}` : ''}
                      </strong>
                      <button type="button" onClick={() => handleRemoveItem(item.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }} title="Remove Item">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                      {/* Waste Type */}
                      <div className="form-group">
                        <label className="form-label">Waste Type *</label>
                        <select className="form-select" value={item.wasteType} onChange={e => handleItemChange(item.id, 'wasteType', e.target.value)}>
                          {typesList.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      {/* Food Item */}
                      <div className="form-group">
                        <label className="form-label">Food Item / Product *</label>
                        <select className="form-select" value={item.foodItem} onChange={e => handleItemChange(item.id, 'foodItem', e.target.value)}>
                          {foodItemsList.map(fi => (
                            <option key={fi} value={fi}>{fi}</option>
                          ))}
                        </select>
                      </div>

                      {/* Waste Source */}
                      <div className="form-group">
                        <label className="form-label">Waste Source / Stage *</label>
                        <select className="form-select" value={item.source} onChange={e => handleItemChange(item.id, 'source', e.target.value)}>
                          {sourcesList.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      {/* Waste Reason */}
                      <div className="form-group">
                        <label className="form-label">Waste Reason *</label>
                        <select className="form-select" value={item.reason} onChange={e => handleItemChange(item.id, 'reason', e.target.value)}>
                          {reasonsList.map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="form-group">
                        <label className="form-label">Quantity / Weight *</label>
                        <input className="form-input" type="number" step="0.01" placeholder="e.g. 2.5" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', e.target.value)} required />
                      </div>

                      {/* Unit */}
                      <div className="form-group">
                        <label className="form-label">Unit *</label>
                        <select className="form-select" value={item.unit} onChange={e => handleItemChange(item.id, 'unit', e.target.value)}>
                          {UNITS.map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>

                      {/* Estimated Cost */}
                      <div className="form-group">
                        <label className="form-label">Estimated Cost (£)</label>
                        <input className="form-input" type="number" step="0.01" placeholder="e.g. 15.50" value={item.estimatedCost} onChange={e => handleItemChange(item.id, 'estimatedCost', e.target.value)} />
                      </div>

                      {/* Batch Code */}
                      <div className="form-group">
                        <label className="form-label">Batch / Lot Code</label>
                        <input className="form-input" placeholder="e.g. B-99120" value={item.batchCode} onChange={e => handleItemChange(item.id, 'batchCode', e.target.value)} />
                      </div>

                      {/* Expiry Date */}
                      <div className="form-group">
                        <label className="form-label">
                          Expiry Date {item.reason === 'Expired raw materials' ? '*' : ''}
                        </label>
                        <input className="form-input" type="date" value={item.expiryDate} onChange={e => handleItemChange(item.id, 'expiryDate', e.target.value)} />
                      </div>

                      {/* Disposal Method */}
                      <div className="form-group">
                        <label className="form-label">Disposal Method *</label>
                        <select className="form-select" value={item.disposalMethod} onChange={e => handleItemChange(item.id, 'disposalMethod', e.target.value)}>
                          {methodsList.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Notes / Comments</label>
                      <textarea className="form-input" rows={2} placeholder="Add observation or prevention note..." value={item.notes} onChange={e => handleItemChange(item.id, 'notes', e.target.value)} />
                    </div>

                    {/* Warning Banners */}
                    {item.reason === 'Returned plate' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#FEF2F2', border: '1px solid #F8B4B4', borderRadius: '6px', color: '#9B1C1C', fontSize: '12.5px', fontWeight: 600 }}>
                        <ShieldAlert size={15} /> Returned plate food must not be reused or served again.
                      </div>
                    )}
                    {item.reason === 'Expired raw materials' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px', color: '#92400E', fontSize: '12.5px', fontWeight: 600 }}>
                        <AlertTriangle size={15} /> Expired food must be segregated and disposed of safely.
                      </div>
                    )}
                    {item.reason === 'Temperature abuse' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#FEF2F2', border: '1px solid #F8B4B4', borderRadius: '6px', color: '#9B1C1C', fontSize: '12.5px', fontWeight: 600 }}>
                        <AlertTriangle size={15} /> Check related temperature records and do not use unsafe food.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Live Summary Box */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', backgroundColor: '#F9FAFB', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--color-border-light)' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Total Entries</span>
                <strong style={{ fontSize: '18px', display: 'block', color: 'var(--color-text-primary)' }}>{totalEntries}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Total Quantity</span>
                <strong style={{ fontSize: '16px', display: 'block', color: 'var(--color-text-primary)' }}>{quantitySummaryStr}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Main Waste Reason</span>
                <strong style={{ fontSize: '15px', display: 'block', color: 'var(--color-text-primary)' }}>{mainReason}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Total Cost Impact</span>
                <strong style={{ fontSize: '18px', display: 'block', color: totalCostSum > 0 ? '#9B1C1C' : 'var(--color-text-primary)' }}>
                  £{totalCostSum.toFixed(2)}
                </strong>
              </div>
            </div>

            {/* Prevention & Verification */}
            <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '20px' }}>
              <div className="form-group">
                <label className="form-label">General Comments</label>
                <textarea className="form-input" rows={2} placeholder="Add general waste observations..." value={generalComments} onChange={e => setGeneralComments(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Prevention Action / Follow-up</label>
                <textarea className="form-input" rows={2} placeholder="e.g. Adjust prep quantity, check stock rotation..." value={preventionAction} onChange={e => setPreventionAction(e.target.value)} />
              </div>

              {/* Status Banner */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: passed ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${passed ? '#A7F3D0' : '#F8B4B4'}`, borderRadius: '8px', color: passed ? '#047857' : '#9B1C1C', fontSize: '13.5px', fontWeight: 500, marginTop: '16px' }}>
                {passed ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                <span>
                  Evaluation: <strong>{passed ? 'Passed (Routine waste recorded)' : 'Attention Required (Temperature abuse, expired food, or contamination risk noted)'}</strong>
                </span>
              </div>
            </div>

            {/* Signature */}
            <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '20px' }}>
              <div className="form-group" style={{ maxWidth: '400px', marginBottom: '20px' }}>
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
                {errors.signedBy && <span style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{errors.signedBy}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Signature *</label>
                <SignaturePad value={signature} onChange={setSignature} />
                {errors.signature && <span style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{errors.signature}</span>}
              </div>
            </div>
          </Card>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '40px' }}>
            <Button variant="secondary" onClick={() => router.visit('/haccp-logs/food-waste')} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving Log...' : 'Save Waste Log'}
            </Button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
};

export default FoodWasteFormPage;
