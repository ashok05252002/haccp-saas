import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Flame, Info, CheckCircle, AlertTriangle, Check, X } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SignaturePad from '../components/common/SignaturePad';
import axios from 'axios';

const OIL_CONDITIONS = [
  'Good – clear / normal',
  'Slightly dark but acceptable',
  'Dark / degraded',
  'Foaming',
  'Smoking',
  'Strong smell',
  'Food debris present',
];

const OIL_ACTIONS = [
  'Continued use',
  'Filtered oil',
  'Topped up oil',
  'Changed oil',
  'Fryer cleaned',
  'Oil discarded',
];

const DISPOSAL_TYPES = [
  'Used oil disposal',
  'Grease trap cleaning',
  'Fryer deep clean',
  'Contractor grease removal',
  'Other',
];

const FryerOilFormPage = ({ logId }) => {
  const isEdit = Boolean(logId);
  const [staffList, setStaffList] = useState([]);
  const [fryersList, setFryersList] = useState([]);
  const [greaseAreasList, setGreaseAreasList] = useState([]);
  const [disposalMethodsList, setDisposalMethodsList] = useState([]);
  const [contractorsList, setContractorsList] = useState([]);

  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  // Top Section
  const [logDate, setLogDate] = useState(today);
  const [logTime, setLogTime] = useState(nowTime);
  const [staffName, setStaffName] = useState('');

  // Step 1: Fryer Oil Check
  const [fryerStation, setFryerStation] = useState('');
  const [fryingTemp, setFryingTemp] = useState('');
  const [oilCondition, setOilCondition] = useState(OIL_CONDITIONS[0]);
  const [oilQualityAcceptable, setOilQualityAcceptable] = useState(true);
  const [oilActionTaken, setOilActionTaken] = useState(OIL_ACTIONS[0]);
  const [quantityRemoved, setQuantityRemoved] = useState('');
  const [step1Comments, setStep1Comments] = useState('');

  // Step 2: Grease / Used Oil Disposal Record
  const [disposalType, setDisposalType] = useState(DISPOSAL_TYPES[0]);
  const [greaseArea, setGreaseArea] = useState('');
  const [disposalQuantity, setDisposalQuantity] = useState('');
  const [disposalMethod, setDisposalMethod] = useState('');
  const [wasteContractor, setWasteContractor] = useState('');
  const [collectionRefNumber, setCollectionRefNumber] = useState('');
  const [nextCleaningDueDate, setNextCleaningDueDate] = useState('');
  const [step2Comments, setStep2Comments] = useState('');

  // Signature Section
  const [signedByStaffName, setSignedByStaffName] = useState('');
  const [signature, setSignature] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Load staff & master data options from API
    axios.get('/api/tenant-users').then(res => {
      setStaffList(res.data || []);
      if (res.data && res.data.length > 0) {
        setStaffName(res.data[0].name);
        setSignedByStaffName(res.data[0].name);
      }
    }).catch(() => {});

    axios.get('/api/fryer-stations').then(res => {
      setFryersList(res.data || []);
      if (res.data && res.data.length > 0) setFryerStation(res.data[0].name);
      else setFryerStation('Main Fryer 1');
    }).catch(() => setFryerStation('Main Fryer 1'));

    axios.get('/api/grease-trap-areas').then(res => {
      setGreaseAreasList(res.data || []);
      if (res.data && res.data.length > 0) setGreaseArea(res.data[0].area_name || res.data[0].name);
      else setGreaseArea('Main Kitchen Grease Trap');
    }).catch(() => setGreaseArea('Main Kitchen Grease Trap'));

    axios.get('/api/grease-disposal-methods').then(res => {
      setDisposalMethodsList(res.data || []);
      if (res.data && res.data.length > 0) setDisposalMethod(res.data[0].method_name || res.data[0].name);
      else setDisposalMethod('Licensed Waste Contractor');
    }).catch(() => setDisposalMethod('Licensed Waste Contractor'));

    axios.get('/api/waste-contractors').then(res => {
      setContractorsList(res.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!logId) return;
    axios.get(`/api/fryer-oil-logs/${logId}`).then(res => {
      const data = res.data;
      if (data) {
        if (data.log_date) setLogDate(data.log_date);
        if (data.log_time) setLogTime(data.log_time);
        if (data.staff_name) setStaffName(data.staff_name);
        if (data.fryer_station) setFryerStation(data.fryer_station);
        if (data.frying_temp !== null && data.frying_temp !== undefined) setFryingTemp(String(data.frying_temp));
        if (data.oil_condition) setOilCondition(data.oil_condition);
        if (data.oil_quality_acceptable !== undefined) setOilQualityAcceptable(Boolean(data.oil_quality_acceptable));
        if (data.oil_action_taken) setOilActionTaken(data.oil_action_taken);
        if (data.quantity_removed !== null && data.quantity_removed !== undefined) setQuantityRemoved(String(data.quantity_removed));
        if (data.step1_comments) setStep1Comments(data.step1_comments);

        if (data.disposal_type) setDisposalType(data.disposal_type);
        if (data.grease_area) setGreaseArea(data.grease_area);
        if (data.disposal_quantity !== null && data.disposal_quantity !== undefined) setDisposalQuantity(String(data.disposal_quantity));
        if (data.disposal_method) setDisposalMethod(data.disposal_method);
        if (data.waste_contractor) setWasteContractor(data.waste_contractor);
        if (data.collection_ref_number) setCollectionRefNumber(data.collection_ref_number);
        if (data.next_cleaning_due_date) setNextCleaningDueDate(data.next_cleaning_due_date);
        if (data.step2_comments) setStep2Comments(data.step2_comments);

        if (data.signed_by_staff_name) setSignedByStaffName(data.signed_by_staff_name);
        if (data.signature) setSignature(data.signature);
      }
    }).catch(err => {
      console.error('Failed to load fryer oil log for edit', err);
    });
  }, [logId]);

  const handleOilConditionChange = (condition) => {
    setOilCondition(condition);
    const degradedConditions = ['Dark / degraded', 'Foaming', 'Smoking', 'Strong smell', 'Food debris present'];
    if (degradedConditions.includes(condition)) {
      setOilQualityAcceptable(false);
      if (oilActionTaken === 'Continued use') {
        setOilActionTaken('Changed oil');
      }
    } else {
      setOilQualityAcceptable(true);
    }
  };

  const handleQualityToggle = (acceptable) => {
    setOilQualityAcceptable(acceptable);
    if (!acceptable && oilActionTaken === 'Continued use') {
      setOilActionTaken('Changed oil');
    }
  };

  // Validation
  const tempNum = parseFloat(fryingTemp);
  const isTempHigh = !isNaN(tempNum) && tempNum > 175;
  const isTempSafe = !isNaN(tempNum) && tempNum >= 160 && tempNum <= 175;
  const passed = oilQualityAcceptable && !isTempHigh;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!staffName) newErrors.staffName = 'Staff member is required.';
    if (!fryerStation) newErrors.fryerStation = 'Fryer station is required.';
    if (!fryingTemp && fryingTemp !== '0') newErrors.fryingTemp = 'Frying temperature is required.';
    if (!oilCondition) newErrors.oilCondition = 'Oil condition is required.';
    if (!oilActionTaken) newErrors.oilActionTaken = 'Oil action taken is required.';
    if (!disposalType) newErrors.disposalType = 'Disposal type is required.';
    if (!greaseArea) newErrors.greaseArea = 'Grease trap area is required.';
    if (!disposalMethod) newErrors.disposalMethod = 'Disposal method is required.';
    if (!signedByStaffName) newErrors.signedBy = 'Signed by staff member is required.';
    if (!signature) newErrors.signature = 'Signature is required.';

    if (!oilQualityAcceptable && oilActionTaken === 'Continued use') {
      newErrors.oilActionTaken = 'Continued use is not allowed when oil quality is Not Acceptable.';
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
        fryer_station: fryerStation,
        frying_temp: parseFloat(fryingTemp),
        oil_condition: oilCondition,
        oil_quality_acceptable: oilQualityAcceptable,
        oil_action_taken: oilActionTaken,
        quantity_removed: quantityRemoved ? parseFloat(quantityRemoved) : null,
        step1_comments: step1Comments,
        disposal_type: disposalType,
        grease_area: greaseArea,
        disposal_quantity: disposalQuantity ? parseFloat(disposalQuantity) : null,
        disposal_method: disposalMethod,
        waste_contractor: wasteContractor || null,
        collection_ref_number: collectionRefNumber || null,
        next_cleaning_due_date: nextCleaningDueDate || null,
        step2_comments: step2Comments,
        signed_by_staff_name: signedByStaffName,
        signature: signature,
      };

      if (logId) {
        await axios.put(`/api/fryer-oil-logs/${logId}`, payload);
      } else {
        await axios.post('/api/fryer-oil-logs', payload);
      }

      router.visit('/haccp-logs/fryer-oil');
    } catch (err) {
      console.error('Failed to submit fryer oil log', err);
      alert(err.response?.data?.message || 'Failed to submit fryer oil log.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <Head title="Log Fryer Oil & Grease Check" />

      <div>
        <button onClick={() => router.visit('/haccp-logs/fryer-oil')} className="back-btn" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} />
          <span>Back to Fryer Oil Logs</span>
        </button>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <h1 className="page-title">Fryer Oil & Grease Management Log</h1>
            <span className="badge badge-prp">PRP</span>
            <span className="badge badge-standard">EU 2017/2158 Acrylamide Control</span>
          </div>
          <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Record cooking oil condition, temperature checks, replacement actions, and grease trap disposal.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Top Bar Card */}
          <Card>
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
          </Card>

          {/* STEP 1: Fryer Oil Check */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '12px', marginBottom: '20px' }}>
              <Flame size={22} color="#D97706" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                STEP 1: Fryer Oil Check
              </h3>
            </div>

            {/* Guidance Info Banner */}
            <div style={{ display: 'flex', gap: '12px', padding: '14px 18px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', color: '#1E40AF', fontSize: '13px', lineHeight: '1.6', marginBottom: '20px' }}>
              <Info size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#2563EB' }} />
              <div>
                <strong>Fryer Oil Guidance (EU 2017/2158)</strong>
                <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px' }}>
                  <li>Maintain frying temperature between 160°C–175°C to minimize acrylamide risk.</li>
                  <li>Replace oil if it becomes dark, foamy, smoky, smells unpleasant, or contains excessive food debris.</li>
                </ul>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {/* Station */}
              <div className="form-group">
                <label className="form-label">Fryer / Cooking Station *</label>
                {fryersList.length > 0 ? (
                  <select className="form-select" value={fryerStation} onChange={e => setFryerStation(e.target.value)}>
                    {fryersList.map(f => (
                      <option key={f.id} value={f.name}>{f.name}</option>
                    ))}
                  </select>
                ) : (
                  <input className="form-input" type="text" placeholder="e.g. Main Fryer 1" value={fryerStation} onChange={e => setFryerStation(e.target.value)} required />
                )}
                {errors.fryerStation && <span style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{errors.fryerStation}</span>}
              </div>

              {/* Temp */}
              <div className="form-group">
                <label className="form-label">Frying Temperature (°C) *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    className="form-input"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 170"
                    value={fryingTemp}
                    onChange={e => setFryingTemp(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>°C</span>
                </div>
                {errors.fryingTemp && <span style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{errors.fryingTemp}</span>}

                {isTempHigh && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#FEF2F2', border: '1px solid #F8B4B4', borderRadius: '6px', color: '#9B1C1C', fontSize: '12.5px', marginTop: '6px' }}>
                    <AlertTriangle size={15} /> High frying temp (&gt;175°C). Acrylamide risk warning!
                  </div>
                )}
                {isTempSafe && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '6px', color: '#047857', fontSize: '12.5px', marginTop: '6px' }}>
                    <CheckCircle size={15} /> Optimal frying temperature (160°C–175°C).
                  </div>
                )}
              </div>

              {/* Condition */}
              <div className="form-group">
                <label className="form-label">Oil Condition *</label>
                <select className="form-select" value={oilCondition} onChange={e => handleOilConditionChange(e.target.value)}>
                  {OIL_CONDITIONS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Quality Result */}
              <div className="form-group">
                <label className="form-label">Oil Quality Result *</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => handleQualityToggle(true)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      border: `1px solid ${oilQualityAcceptable ? 'var(--color-primary)' : 'var(--color-border-light)'}`,
                      backgroundColor: oilQualityAcceptable ? 'var(--color-primary)' : '#fff',
                      color: oilQualityAcceptable ? '#fff' : 'var(--color-text-secondary)',
                    }}
                  >
                    <Check size={15} /> Acceptable
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQualityToggle(false)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      border: `1px solid ${!oilQualityAcceptable ? '#DC2626' : 'var(--color-border-light)'}`,
                      backgroundColor: !oilQualityAcceptable ? '#DC2626' : '#fff',
                      color: !oilQualityAcceptable ? '#fff' : 'var(--color-text-secondary)',
                    }}
                  >
                    <X size={15} /> Not Acceptable
                  </button>
                </div>
              </div>

              {/* Action Taken */}
              <div className="form-group">
                <label className="form-label">Oil Action Taken *</label>
                <select className="form-select" value={oilActionTaken} onChange={e => setOilActionTaken(e.target.value)}>
                  {OIL_ACTIONS.map(a => (
                    <option key={a} value={a} disabled={!oilQualityAcceptable && a === 'Continued use'}>
                      {a} {!oilQualityAcceptable && a === 'Continued use' ? '(Not allowed when Not Acceptable)' : ''}
                    </option>
                  ))}
                </select>
                {errors.oilActionTaken && <span style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{errors.oilActionTaken}</span>}
              </div>

              {/* Quantity Removed */}
              <div className="form-group">
                <label className="form-label">Quantity Removed / Replaced (Litres)</label>
                <input className="form-input" type="number" step="0.5" placeholder="e.g. 15" value={quantityRemoved} onChange={e => setQuantityRemoved(e.target.value)} />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Step 1 Observations / Comments</label>
              <textarea className="form-input" rows={2} placeholder="Add observations or reason for oil change..." value={step1Comments} onChange={e => setStep1Comments(e.target.value)} />
            </div>
          </Card>

          {/* STEP 2: Grease / Used Oil Disposal Record */}
          <Card>
            <div style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: '12px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                STEP 2: Grease / Used Oil Disposal Record
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {/* Disposal Type */}
              <div className="form-group">
                <label className="form-label">Disposal / Cleaning Type *</label>
                <select className="form-select" value={disposalType} onChange={e => setDisposalType(e.target.value)}>
                  {DISPOSAL_TYPES.map(dt => (
                    <option key={dt} value={dt}>{dt}</option>
                  ))}
                </select>
              </div>

              {/* Grease Area */}
              <div className="form-group">
                <label className="form-label">Grease Trap / Area Details *</label>
                {greaseAreasList.length > 0 ? (
                  <select className="form-select" value={greaseArea} onChange={e => setGreaseArea(e.target.value)}>
                    {greaseAreasList.map((ga, idx) => (
                      <option key={idx} value={typeof ga === 'object' ? (ga.area_name || ga.name) : ga}>
                        {typeof ga === 'object' ? (ga.area_name || ga.name) : ga}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input className="form-input" type="text" placeholder="e.g. Main Kitchen Grease Trap" value={greaseArea} onChange={e => setGreaseArea(e.target.value)} required />
                )}
              </div>

              {/* Disposal Quantity */}
              <div className="form-group">
                <label className="form-label">Disposal Quantity (Litres)</label>
                <input className="form-input" type="number" step="0.5" placeholder="e.g. 20" value={disposalQuantity} onChange={e => setDisposalQuantity(e.target.value)} />
              </div>

              {/* Method */}
              <div className="form-group">
                <label className="form-label">Disposal Method *</label>
                {disposalMethodsList.length > 0 ? (
                  <select className="form-select" value={disposalMethod} onChange={e => setDisposalMethod(e.target.value)}>
                    {disposalMethodsList.map((dm, idx) => (
                      <option key={idx} value={typeof dm === 'object' ? (dm.method_name || dm.name) : dm}>
                        {typeof dm === 'object' ? (dm.method_name || dm.name) : dm}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input className="form-input" type="text" placeholder="e.g. Licensed Waste Contractor" value={disposalMethod} onChange={e => setDisposalMethod(e.target.value)} required />
                )}
              </div>

              {/* Waste Contractor */}
              <div className="form-group">
                <label className="form-label">Waste Contractor Name</label>
                <select className="form-select" value={wasteContractor} onChange={e => setWasteContractor(e.target.value)}>
                  <option value="">None / Internal</option>
                  {contractorsList.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Collection Ref */}
              <div className="form-group">
                <label className="form-label">Collection / Reference Number</label>
                <input className="form-input" type="text" placeholder="e.g. REF-44021" value={collectionRefNumber} onChange={e => setCollectionRefNumber(e.target.value)} />
              </div>

              {/* Next Cleaning Due */}
              <div className="form-group">
                <label className="form-label">Next Cleaning Due Date</label>
                <input className="form-input" type="date" value={nextCleaningDueDate} onChange={e => setNextCleaningDueDate(e.target.value)} />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Step 2 Disposal / Cleaning Notes</label>
              <textarea className="form-input" rows={2} placeholder="Add disposal or contractor notes..." value={step2Comments} onChange={e => setStep2Comments(e.target.value)} />
            </div>

            {/* Evaluation Status Banner */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: passed ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${passed ? '#A7F3D0' : '#F8B4B4'}`, borderRadius: '8px', color: passed ? '#047857' : '#9B1C1C', fontSize: '13.5px', fontWeight: 500, marginTop: '16px' }}>
              {passed ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
              <span>
                Evaluation: <strong>{passed ? 'Passed (Oil quality acceptable & temperature ≤175°C)' : 'Attention Required (Oil quality degraded or high temperature)'}</strong>
              </span>
            </div>
          </Card>

          {/* Verification & Signature */}
          <Card>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginTop: 0, marginBottom: '16px', color: 'var(--color-text-primary)' }}>
              Staff Verification & Signature
            </h3>

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
          </Card>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '40px' }}>
            <Button variant="secondary" onClick={() => router.visit('/haccp-logs/fryer-oil')} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving Log...' : 'Save Fryer Oil Log'}
            </Button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
};

export default FryerOilFormPage;
