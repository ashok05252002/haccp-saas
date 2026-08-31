import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Info, CheckCircle, AlertTriangle, Plus, Trash2, Clock, UserPlus } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SignaturePad from '../components/common/SignaturePad';
import AmendmentReasonModal from '../components/common/AmendmentReasonModal';
import axios from 'axios';

const DEFAULT_UNITS = ['Bain Marie', 'Hot Display Counter', 'Soup Station', 'Buffet Counter'];
const DEFAULT_FOODS = ['Tomato Soup', 'Gravy', 'Sausages', 'Cooked Rice', 'Chicken Curry'];

const createEmptyRow = (foodName = '', defaultTime = '') => ({
  id: 'h_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
  foodName: foodName || 'Tomato Soup',
  timeIntoHold: defaultTime || '11:30',
  check1: '',
  check2: '',
  check3: '',
  check4: '',
  comments: '',
});

const HotHoldingFormPage = ({ logId }) => {
  const isEdit = Boolean(logId);
  const [holdingUnits, setHoldingUnits] = useState(DEFAULT_UNITS);
  const [selectedUnit, setSelectedUnit] = useState(DEFAULT_UNITS[0]);

  const [staffList, setStaffList] = useState([]);
  const [foodItemsList, setFoodItemsList] = useState([]);

  // UOM & Storage Types for Master Creation
  const [uomList, setUomList] = useState([]);
  const [storageTypeList, setStorageTypeList] = useState([]);

  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  // Top Section
  const [logDate, setLogDate] = useState(today);
  const [logTime, setLogTime] = useState(nowTime);
  const [staffName, setStaffName] = useState('');

  // Rows Table (Default 1 Row only)
  const [rows, setRows] = useState([]);
  const [visibleChecksCount, setVisibleChecksCount] = useState(1); // Default 1 check column

  // Final Section
  const [generalComments, setGeneralComments] = useState('');
  const [signedByStaffName, setSignedByStaffName] = useState('');
  const [signature, setSignature] = useState('');

  // Inline Add Food Product Modal
  const [showAddFood, setShowAddFood] = useState(false);
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodUomId, setNewFoodUomId] = useState('');
  const [newFoodStorageTypeId, setNewFoodStorageTypeId] = useState('');
  const [addingFood, setAddingFood] = useState(false);
  const [addFoodError, setAddFoodError] = useState('');

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

    // Fetch Holding Stations
    axios.get('/api/holding-stations').then(res => {
      const uList = (res.data || []).map(u => typeof u === 'string' ? u : u.name);
      if (uList.length > 0) {
        setHoldingUnits(uList);
        setSelectedUnit(uList[0]);
      }
    }).catch(() => {});

    // Fetch Food Items
    axios.get('/api/food-items').then(res => {
      const fList = (res.data || []).map(f => typeof f === 'string' ? f : f.name);
      setFoodItemsList(fList.length > 0 ? fList : DEFAULT_FOODS);
    }).catch(() => {
      setFoodItemsList(DEFAULT_FOODS);
    });

    // Fetch UOMs & Storage Types
    axios.get('/api/uoms').then(res => {
      setUomList(res.data || []);
      if (res.data && res.data.length > 0) setNewFoodUomId(res.data[0].id);
    }).catch(() => {});

    axios.get('/api/storage-types').then(res => {
      setStorageTypeList(res.data || []);
      if (res.data && res.data.length > 0) setNewFoodStorageTypeId(res.data[0].id);
    }).catch(() => {});

    // Initial 1 Row Only
    if (!logId) {
      setRows([
        createEmptyRow('Tomato Soup', nowTime),
      ]);
    }
  }, []);

  useEffect(() => {
    if (!logId) return;
    axios.get(`/api/hot-holding-logs/${logId}`).then(res => {
      const data = res.data;
      if (data) {
        if (data.log_date) setLogDate(data.log_date);
        if (data.log_time) setLogTime(data.log_time);
        if (data.holding_unit) setSelectedUnit(data.holding_unit);
        if (data.staff_name) setStaffName(data.staff_name);
        if (data.general_comments) setGeneralComments(data.general_comments);
        if (data.signed_by_staff_name) setSignedByStaffName(data.signed_by_staff_name);
        if (data.signature) setSignature(data.signature);

        let itemsData = data.items || [];
        if (typeof itemsData === 'string') {
          try { itemsData = JSON.parse(itemsData); } catch (e) { itemsData = []; }
        }

        if (Array.isArray(itemsData) && itemsData.length > 0) {
          const loadedRows = itemsData.map(item => ({
            id: 'h_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            foodName: item.foodName || item.food_name || item.name || '',
            timeIntoHold: item.timeIntoHold || item.time_into_hold || item.time || '',
            check1: item.check1 !== undefined && item.check1 !== null ? item.check1 : (item.temp1 || item.temp || ''),
            check2: item.check2 !== undefined && item.check2 !== null ? item.check2 : (item.temp2 || ''),
            check3: item.check3 !== undefined && item.check3 !== null ? item.check3 : (item.temp3 || ''),
            check4: item.check4 !== undefined && item.check4 !== null ? item.check4 : (item.temp4 || ''),
            comments: item.comments || item.notes || '',
          }));
          setRows(loadedRows);

          // Check if any row has check2, 3, or 4
          const hasCheck4 = loadedRows.some(r => r.check4 !== '');
          const hasCheck3 = loadedRows.some(r => r.check3 !== '');
          const hasCheck2 = loadedRows.some(r => r.check2 !== '');
          if (hasCheck4) setVisibleChecksCount(4);
          else if (hasCheck3) setVisibleChecksCount(3);
          else if (hasCheck2) setVisibleChecksCount(2);
          else setVisibleChecksCount(1);
        }
      }
    }).catch(err => {
      console.error('Failed to fetch hot holding log for edit', err);
    });
  }, [logId]);

  /* Row Handlers */
  const handleRowChange = (id, field, value) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleAddRow = (fName = '') => {
    const name = fName || (foodItemsList[rows.length % foodItemsList.length] || 'Hot Food Item');
    setRows(prev => [...prev, createEmptyRow(name, nowTime)]);
  };

  const handleRemoveRow = (id) => {
    if (rows.length <= 1) {
      alert('Log must contain at least one item.');
      return;
    }
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const handleSetTimeForAll = () => {
    setRows(prev => prev.map(r => ({ ...r, timeIntoHold: nowTime })));
  };

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
      handleAddRow(createdName);

      setNewFoodName('');
      setShowAddFood(false);
    } catch (err) {
      console.error('Failed to add food item to Manager Hub', err);
      setAddFoodError(err.response?.data?.errors?.name?.[0] || 'Failed to add food item.');
    } finally {
      setAddingFood(false);
    }
  };

  // Temperature Compliance Validation
  const isTempInvalid = (val) => {
    if (val === '' || val === null || val === undefined) return false;
    const num = parseFloat(val);
    return isNaN(num) || num < 63.0;
  };

  const hasAnyEnteredTemp = rows.some(r => r.check1 !== '' || r.check2 !== '' || r.check3 !== '' || r.check4 !== '');
  const hasAnyTempBelowLimit = rows.some(r => isTempInvalid(r.check1) || isTempInvalid(r.check2) || isTempInvalid(r.check3) || isTempInvalid(r.check4));
  const passed = hasAnyEnteredTemp && !hasAnyTempBelowLimit;

  const handleFinalSubmit = async (amendmentReason = '') => {
    const sanitizedItems = rows.map(r => ({
      id: r.id || ('h_' + Date.now()),
      foodName: r.foodName || 'Hot Food Item',
      timeIntoHold: r.timeIntoHold || logTime,
      check1: (r.check1 !== undefined && r.check1 !== null && r.check1 !== '') ? String(r.check1) : '',
      check2: (r.check2 !== undefined && r.check2 !== null && r.check2 !== '') ? String(r.check2) : '',
      check3: (r.check3 !== undefined && r.check3 !== null && r.check3 !== '') ? String(r.check3) : '',
      check4: (r.check4 !== undefined && r.check4 !== null && r.check4 !== '') ? String(r.check4) : '',
      comments: r.comments || '',
    }));

    setSubmitting(true);
    try {
      const payload = {
        log_date: logDate,
        log_time: logTime,
        holding_unit: selectedUnit,
        staff_name: staffName,
        items: sanitizedItems,
        general_comments: generalComments,
        signed_by_staff_name: signedByStaffName,
        signature: signature,
      };

      if (logId) {
        payload.amendment_reason = amendmentReason;
        await axios.put(`/api/hot-holding-logs/${logId}`, payload);
      } else {
        await axios.post('/api/hot-holding-logs', payload);
      }

      router.visit('/haccp-logs/hot-holding');
    } catch (err) {
      console.error('Failed to submit hot holding log', err);
      alert(err.response?.data?.message || 'Failed to submit hot holding log.');
    } finally {
      setSubmitting(false);
      setShowReasonModal(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const newErrors = {};

    if (!staffName) newErrors.staffName = 'Staff member is required.';
    if (!signedByStaffName) newErrors.signedBy = 'Signed by staff member is required.';
    if (!signature) newErrors.signature = 'Signature is required.';

    if (!hasAnyEnteredTemp) {
      newErrors.temps = 'Please enter at least one temperature check.';
    }

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
      <Head title="Log Hot Holding" />

      <div>
        <button onClick={() => router.visit('/haccp-logs/hot-holding')} className="back-btn" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} />
          <span>Back to Hot Holding Logs</span>
        </button>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <h1 className="page-title">Hot Holding / Bain Marie</h1>
            <span className="badge badge-ccp">CCP</span>
            <span className="badge badge-standard">EC 852/2004 Annex II</span>
          </div>
          <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Monitor bain marie, hot display counters, and heated units to verify safe holding temperatures (≥63°C).
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Critical Limits Info Banner */}
          <div style={{ display: 'flex', gap: '12px', padding: '14px 18px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', color: '#1E40AF', fontSize: '13px', lineHeight: '1.6' }}>
            <Info size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#2563EB' }} />
            <div>
              <strong>Critical Limits & Guidelines</strong>
              <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px' }}>
                <li>Hot food should be held at <strong>63°C or above</strong>.</li>
                <li>Food below 63°C must be reheated to ≥75°C, served immediately, or safely discarded.</li>
                <li>Record corrective action comments whenever a temperature is below 63°C.</li>
              </ul>
            </div>
          </div>

          {/* Form Card */}
          <Card style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Top Bar */}
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
              </div>
            </div>

            {/* Holding Unit Tabs */}
            <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '20px' }}>
              <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Holding Unit / Station *</label>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {holdingUnits.map(unit => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => setSelectedUnit(unit)}
                    style={{
                      padding: '8px 16px', borderRadius: '8px', fontSize: '13.5px', fontWeight: 600,
                      cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                      border: `1px solid ${selectedUnit === unit ? 'var(--color-primary)' : 'var(--color-border-light)'}`,
                      backgroundColor: selectedUnit === unit ? 'var(--color-primary)' : '#fff',
                      color: selectedUnit === unit ? '#fff' : 'var(--color-text-primary)',
                    }}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>

            {/* Temperature Checks Table */}
            <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  Food Temperature Checks ({selectedUnit})
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {visibleChecksCount < 4 && (
                    <Button variant="secondary" size="sm" type="button" icon={Plus} onClick={() => setVisibleChecksCount(prev => Math.min(4, prev + 1))}>
                      Add Check {visibleChecksCount + 1} Column
                    </Button>
                  )}
                  <Button variant="secondary" size="sm" type="button" icon={Plus} onClick={() => setShowAddFood(!showAddFood)}>
                    Add Food Item
                  </Button>
                  <Button variant="secondary" size="sm" type="button" icon={Clock} onClick={handleSetTimeForAll}>
                    Set Time for All
                  </Button>
                </div>
              </div>

              {/* Inline Add Food Item Box */}
              {showAddFood && (
                <div style={{ padding: '16px 18px', backgroundColor: '#F9FAFB', border: '1px solid var(--color-border-light)', borderRadius: '10px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-primary)' }}>
                    Add New Food Item to Manager Hub Master
                  </div>

                  {addFoodError && <div style={{ color: 'var(--color-danger)', fontSize: '12.5px' }}>{addFoodError}</div>}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>Product Name *</label>
                      <input className="form-input" style={{ backgroundColor: '#fff' }} placeholder="e.g. Minestrone Soup" value={newFoodName} onChange={e => setNewFoodName(e.target.value)} />
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

              {errors.temps && <div style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '12px' }}>{errors.temps}</div>}

              {/* Table */}
              <div style={{ overflowX: 'auto', border: '1px solid var(--color-border-light)', borderRadius: '8px' }}>
                <table className="data-table" style={{ minWidth: '700px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '200px' }}>Food Item</th>
                      <th style={{ width: '130px' }}>Time into Hold</th>
                      <th style={{ width: '110px' }}>Check 1 °C</th>
                      {visibleChecksCount >= 2 && <th style={{ width: '110px' }}>Check 2 °C</th>}
                      {visibleChecksCount >= 3 && <th style={{ width: '110px' }}>Check 3 °C</th>}
                      {visibleChecksCount >= 4 && <th style={{ width: '110px' }}>Check 4 °C</th>}
                      <th>Comments</th>
                      <th style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(row => {
                      const c1Invalid = isTempInvalid(row.check1);
                      const c2Invalid = isTempInvalid(row.check2);
                      const c3Invalid = isTempInvalid(row.check3);
                      const c4Invalid = isTempInvalid(row.check4);

                      return (
                        <tr key={row.id}>
                          <td>
                            <select
                              className="form-select"
                              style={{ fontSize: '13px', padding: '6px 8px' }}
                              value={row.foodName}
                              onChange={e => handleRowChange(row.id, 'foodName', e.target.value)}
                            >
                              {foodItemsList.map(fi => (
                                <option key={fi} value={fi}>{fi}</option>
                              ))}
                            </select>
                          </td>

                          <td>
                            <input
                              className="form-input"
                              type="time"
                              style={{ fontSize: '13px', padding: '6px 8px' }}
                              value={row.timeIntoHold}
                              onChange={e => handleRowChange(row.id, 'timeIntoHold', e.target.value)}
                            />
                          </td>

                          <td>
                            <input
                              type="number"
                              step="0.1"
                              placeholder="°C"
                              className="form-input"
                              style={{
                                width: '80px', padding: '6px 8px', fontSize: '13px',
                                backgroundColor: c1Invalid ? '#FEF2F2' : '#fff',
                                borderColor: c1Invalid ? '#EF4444' : 'var(--color-border-light)',
                              }}
                              value={row.check1}
                              onChange={e => handleRowChange(row.id, 'check1', e.target.value)}
                            />
                            {c1Invalid && <div style={{ color: '#DC2626', fontSize: '10.5px', marginTop: '2px', fontWeight: 600 }}>&lt;63°C</div>}
                          </td>

                          {visibleChecksCount >= 2 && (
                            <td>
                              <input
                                type="number"
                                step="0.1"
                                placeholder="°C"
                                className="form-input"
                                style={{
                                  width: '80px', padding: '6px 8px', fontSize: '13px',
                                  backgroundColor: c2Invalid ? '#FEF2F2' : '#fff',
                                  borderColor: c2Invalid ? '#EF4444' : 'var(--color-border-light)',
                                }}
                                value={row.check2}
                                onChange={e => handleRowChange(row.id, 'check2', e.target.value)}
                              />
                              {c2Invalid && <div style={{ color: '#DC2626', fontSize: '10.5px', marginTop: '2px', fontWeight: 600 }}>&lt;63°C</div>}
                            </td>
                          )}

                          {visibleChecksCount >= 3 && (
                            <td>
                              <input
                                type="number"
                                step="0.1"
                                placeholder="°C"
                                className="form-input"
                                style={{
                                  width: '80px', padding: '6px 8px', fontSize: '13px',
                                  backgroundColor: c3Invalid ? '#FEF2F2' : '#fff',
                                  borderColor: c3Invalid ? '#EF4444' : 'var(--color-border-light)',
                                }}
                                value={row.check3}
                                onChange={e => handleRowChange(row.id, 'check3', e.target.value)}
                              />
                              {c3Invalid && <div style={{ color: '#DC2626', fontSize: '10.5px', marginTop: '2px', fontWeight: 600 }}>&lt;63°C</div>}
                            </td>
                          )}

                          {visibleChecksCount >= 4 && (
                            <td>
                              <input
                                type="number"
                                step="0.1"
                                placeholder="°C"
                                className="form-input"
                                style={{
                                  width: '80px', padding: '6px 8px', fontSize: '13px',
                                  backgroundColor: c4Invalid ? '#FEF2F2' : '#fff',
                                  borderColor: c4Invalid ? '#EF4444' : 'var(--color-border-light)',
                                }}
                                value={row.check4}
                                onChange={e => handleRowChange(row.id, 'check4', e.target.value)}
                              />
                              {c4Invalid && <div style={{ color: '#DC2626', fontSize: '10.5px', marginTop: '2px', fontWeight: 600 }}>&lt;63°C</div>}
                            </td>
                          )}

                          <td>
                            <input
                              className="form-input"
                              placeholder="Corrective action..."
                              style={{ fontSize: '13px', padding: '6px 8px' }}
                              value={row.comments}
                              onChange={e => handleRowChange(row.id, 'comments', e.target.value)}
                            />
                          </td>

                          <td>
                            <button type="button" onClick={() => handleRemoveRow(row.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}>
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '12px' }}>
                <Button variant="secondary" size="sm" type="button" icon={Plus} onClick={() => handleAddRow()}>
                  Add Food Row
                </Button>
              </div>

              {/* Status Banner */}
              {hasAnyEnteredTemp && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: passed ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${passed ? '#A7F3D0' : '#F8B4B4'}`, borderRadius: '8px', color: passed ? '#047857' : '#9B1C1C', fontSize: '13.5px', fontWeight: 500, marginTop: '16px' }}>
                  {passed ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                  <span>
                    Evaluation: <strong>{passed ? 'Passed (All checks ≥ 63°C)' : 'Needs Review (Temperature below 63°C detected)'}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* General Comments */}
            <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '20px' }}>
              <div className="form-group">
                <label className="form-label">General Comments for {selectedUnit}</label>
                <textarea className="form-input" rows={2} placeholder="Add general holding comments..." value={generalComments} onChange={e => setGeneralComments(e.target.value)} />
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
              </div>

              <div className="form-group">
                <label className="form-label">Signature *</label>
                <SignaturePad value={signature} onChange={setSignature} />
                {errors.signature && <span style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{errors.signature}</span>}
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '40px' }}>
            <Button variant="secondary" onClick={() => router.visit('/haccp-logs/hot-holding')} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving Log...' : 'Save Hot Holding Log'}
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

export default HotHoldingFormPage;
