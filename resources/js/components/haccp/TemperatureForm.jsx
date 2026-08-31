import React, { useState, useEffect, useRef } from 'react';
import Button from '../common/Button';
import AmendmentReasonModal from '../common/AmendmentReasonModal';
import SignatureCanvas from 'react-signature-canvas';
import { Snowflake, AlertTriangle, CheckCircle, Save, Droplets, Thermometer, Box } from 'lucide-react';
import axios from 'axios';

const TemperatureForm = ({ onSave, onCancel, logId }) => {
  const isEdit = Boolean(logId);
  const [loading, setLoading] = useState(true);
  const [storageZones, setStorageZones] = useState([]);
  const [thermometers, setThermometers] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [existingSignature, setExistingSignature] = useState(null);
  const [editZoneId, setEditZoneId] = useState(null);
  const [reasonModalOpen, setReasonModalOpen] = useState(false);

  // Form State
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logTime, setLogTime] = useState(
    new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
  );
  const [staffName, setStaffName] = useState('');
  const [thermometerId, setThermometerId] = useState('');
  const [readings, setReadings] = useState({});
  const sigPad = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [zonesRes, thermoRes, staffRes] = await Promise.all([
          axios.get('/api/storage-zones'),
          axios.get('/api/thermometers'),
          axios.get('/api/tenant-users')
        ]);
        
        const activeZones = (zonesRes.data || []).filter(z => z.status === 'Active');
        setStorageZones(activeZones);
        setThermometers((thermoRes.data || []).filter(t => t.status === 'Active'));
        setStaffMembers((staffRes.data || []).filter(s => s.status !== 'Inactive'));

        // Initialize readings
        const initialReadings = {};
        activeZones.forEach(zone => {
          initialReadings[zone.id] = { temperature: '', comment: '' };
        });

        if (logId) {
          try {
            const logRes = await axios.get(`/api/temperature-logs/${logId}`);
            const logData = logRes.data;
            if (logData) {
              if (logData.log_date) setLogDate(logData.log_date);
              if (logData.log_time) setLogTime(logData.log_time);
              if (logData.staff_name) setStaffName(logData.staff_name);
              if (logData.thermometer_id) setThermometerId(String(logData.thermometer_id));
              if (logData.signature) setExistingSignature(logData.signature);
              if (logData.storage_zone_id) {
                setEditZoneId(logData.storage_zone_id);
                initialReadings[logData.storage_zone_id] = {
                  temperature: logData.temperature !== null ? String(logData.temperature) : '',
                  comment: logData.comment || ''
                };
              }
            }
          } catch (fetchErr) {
            console.error('Failed to load existing temperature log', fetchErr);
            setError('Failed to load existing log data.');
          }
        }

        setReadings(initialReadings);

      } catch (err) {
        console.error('Failed to load form data', err);
        setError('Failed to load required data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [logId]);

  const handleRowChange = (id, field, val) => {
    setReadings(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: val
      }
    }));
  };

  const validateTemperature = (zone, tempStr) => {
    if (tempStr === '' || tempStr === undefined || tempStr === null) return null;
    const temp = parseFloat(tempStr);
    if (isNaN(temp)) return false;

    // Use min_temp and max_temp from the database record
    if (zone.min_temp !== null && temp < parseFloat(zone.min_temp)) return false;
    if (zone.max_temp !== null && temp > parseFloat(zone.max_temp)) return false;

    return true;
  };

  const handleConfirmAmendment = async (amendmentReason) => {
    setSubmitting(true);
    setError(null);

    let signatureData = null;
    if (sigPad.current && !sigPad.current.isEmpty()) {
      signatureData = sigPad.current.getCanvas
        ? sigPad.current.getCanvas().toDataURL('image/png')
        : sigPad.current.toDataURL('image/png');
    } else if (existingSignature && typeof existingSignature === 'string' && existingSignature.trim()) {
      signatureData = existingSignature.trim();
    }

    const targetZoneId = editZoneId || Object.keys(readings).find(k => readings[k]?.temperature !== '');
    const reading = targetZoneId ? readings[targetZoneId] : null;
    const targetZone = storageZones.find(z => String(z.id) === String(targetZoneId));
    const isValid = targetZone ? (validateTemperature(targetZone, reading.temperature) ?? true) : true;

    try {
      await axios.put(`/api/temperature-logs/${logId}`, {
        log_date: logDate,
        log_time: logTime,
        staff_name: staffName,
        thermometer_id: parseInt(thermometerId),
        storage_zone_id: targetZone ? targetZone.id : undefined,
        temperature: parseFloat(reading.temperature),
        is_valid: isValid,
        comment: reading.comment,
        signature: signatureData,
        amendment_reason: amendmentReason
      });
      setReasonModalOpen(false);
      if (onSave) onSave();
    } catch (err) {
      console.error('Failed to update log', err);
      const errMsg = err.response?.data?.errors?.staff_name?.[0] ||
                     err.response?.data?.errors?.thermometer_id?.[0] ||
                     err.response?.data?.errors?.signature?.[0] ||
                     err.response?.data?.message || 'Failed to update temperature log.';
      setError(errMsg);
      setReasonModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // 1. Staff Member validation
    if (!staffName || !staffName.trim()) {
      setError("Please select staff member.");
      return;
    }

    // 2. Thermometer Used validation
    if (!thermometerId) {
      setError("Please select thermometer used.");
      return;
    }

    // 3. Signature validation
    let signatureData = null;
    if (sigPad.current && !sigPad.current.isEmpty()) {
      signatureData = sigPad.current.getCanvas
        ? sigPad.current.getCanvas().toDataURL('image/png')
        : sigPad.current.toDataURL('image/png');
    } else if (existingSignature && typeof existingSignature === 'string' && existingSignature.trim()) {
      signatureData = existingSignature.trim();
    }

    if (!signatureData || !signatureData.trim()) {
      setError("Please add signature before saving.");
      return;
    }

    if (isEdit) {
      // In edit mode, check readings first, then open Reason for Amendment modal
      const targetZoneId = editZoneId || Object.keys(readings).find(k => readings[k]?.temperature !== '');
      const reading = targetZoneId ? readings[targetZoneId] : null;

      if (!reading || reading.temperature === '') {
        setError('Please enter a valid temperature for the equipment.');
        return;
      }

      setReasonModalOpen(true);
      return;
    }

    setSubmitting(true);

    // Filter out readings that are empty for Add mode
    const validReadings = [];
    storageZones.forEach(zone => {
      const reading = readings[zone.id];
      if (reading && reading.temperature !== '') {
        const isValid = validateTemperature(zone, reading.temperature) ?? true;
        validReadings.push({
          storage_zone_id: zone.id,
          temperature: parseFloat(reading.temperature),
          is_valid: isValid,
          comment: reading.comment
        });
      }
    });

    if (validReadings.length === 0) {
      setError('Please enter a temperature for at least one equipment.');
      setSubmitting(false);
      return;
    }

    try {
      await axios.post('/api/temperature-logs', {
        log_date: logDate,
        log_time: logTime,
        staff_name: staffName,
        thermometer_id: parseInt(thermometerId),
        readings: validReadings,
        signature: signatureData
      });
      if (onSave) onSave();
    } catch (err) {
      console.error('Failed to save logs', err);
      const errMsg = err.response?.data?.errors?.staff_name?.[0] ||
                     err.response?.data?.errors?.thermometer_id?.[0] ||
                     err.response?.data?.errors?.signature?.[0] ||
                     err.response?.data?.message || 'Failed to save logs.';
      setError(errMsg);
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: '15px' }}>Loading form...</div>;
  }

  const renderUnitList = (title, units, theme) => {
    if (units.length === 0) return null;

    let Icon = Thermometer;
    if (theme.id === 'fridge') Icon = Droplets;
    if (theme.id === 'freezer') Icon = Snowflake;
    if (theme.id === 'other') Icon = Box;

    return (
      <div style={styles.section} key={title}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ ...styles.iconWrapper, backgroundColor: theme.iconBg, color: theme.iconColor }}>
            <Icon size={16} strokeWidth={2.5} />
          </div>
          <h4 style={{ ...styles.sectionTitle, color: theme.titleColor }}>{title}</h4>
        </div>
        
        <div style={styles.list}>
          {units.map(unit => {
            const rowData = readings[unit.id] || { temperature: '', comment: '' };
            const isValid = validateTemperature(unit, rowData.temperature);
            
            let cardStyle = { ...styles.card };
            
            // Default Theme Styling
            cardStyle.backgroundColor = theme.cardBg;
            cardStyle.borderColor = theme.cardBorder;

            if (isValid === true) {
              cardStyle.borderColor = 'var(--color-success)';
              cardStyle.boxShadow = '0 0 0 1px var(--color-success)';
            }
            if (isValid === false) {
              cardStyle.borderColor = 'var(--color-danger)';
              cardStyle.backgroundColor = '#FEF2F2';
              cardStyle.boxShadow = '0 0 0 1px var(--color-danger)';
            }

            return (
              <div key={unit.id} style={cardStyle} className="equipment-card">
                <div style={styles.cardHeader}>
                  <div style={styles.unitInfo}>
                    <div style={styles.unitName}>{unit.name}</div>
                    {unit.rule_text && <div style={styles.unitDesc}>{unit.rule_text}</div>}
                    {!unit.rule_text && (unit.min_temp !== null || unit.max_temp !== null) && (
                      <div style={styles.unitDesc}>
                        Target: <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{unit.min_temp !== null ? unit.min_temp + '°C' : '-'} to {unit.max_temp !== null ? unit.max_temp + '°C' : '-'}</span>
                      </div>
                    )}
                  </div>
                  <div style={styles.statusIndicator}>
                    {isValid === true && <CheckCircle size={22} color="var(--color-success)" style={{ filter: 'drop-shadow(0 2px 4px rgba(32,178,107,0.3))' }} />}
                    {isValid === false && <AlertTriangle size={22} color="var(--color-danger)" style={{ filter: 'drop-shadow(0 2px 4px rgba(229,72,77,0.3))' }} />}
                  </div>
                </div>
                
                <div style={styles.cardBody}>
                  <div className="form-group" style={{ marginBottom: 0, width: '130px', flexShrink: 0 }}>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="number" 
                        step="0.1"
                        className="form-input" 
                        placeholder="e.g. 4.5"
                        value={rowData.temperature}
                        onChange={(e) => handleRowChange(unit.id, 'temperature', e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        style={{
                           borderColor: isValid === false ? 'var(--color-danger)' : undefined,
                           backgroundColor: isValid === false ? '#FFF5F5' : '#ffffff',
                           paddingRight: '30px',
                           fontWeight: 600,
                           boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                        }}
                      />
                      <span style={styles.unitLabel}>°C</span>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Optional comment"
                      value={rowData.comment}
                      onChange={(e) => handleRowChange(unit.id, 'comment', e.target.value)}
                      style={{ backgroundColor: '#ffffff', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const fridges = storageZones.filter(z => z.type === 'Fridge');
  const freezers = storageZones.filter(z => z.type === 'Freezer');
  const others = storageZones.filter(z => z.type !== 'Fridge' && z.type !== 'Freezer');

  return (
    <form onSubmit={handleSubmit} style={styles.formContainer}>
      <style>
        {`
          .equipment-card {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .equipment-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          }
        `}
      </style>
      
      <div style={styles.modalBody}>
        {error && (
          <div style={{ padding: '12px 16px', backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        <div style={styles.generalDetailsWrapper}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ color: '#4B5563' }}>Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={logDate}
                onChange={e => setLogDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ color: '#4B5563' }}>Time</label>
              <input 
                type="time" 
                className="form-input" 
                value={logTime}
                onChange={e => setLogTime(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ color: '#4B5563' }}>
                Staff Name <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <select 
                className="form-input" 
                value={staffName}
                onChange={e => setStaffName(e.target.value)}
                required
              >
                <option value="">-- Select Staff Member * --</option>
                {staffMembers.map(s => (
                  <option key={s.id} value={s.name}>
                    {s.name} {s.assigned_role ? `(${s.assigned_role.name})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ color: '#4B5563' }}>
                Thermometer Used <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <select 
                className="form-input"
                value={thermometerId}
                onChange={e => setThermometerId(e.target.value)}
                required
              >
                <option value="">-- Select Thermometer * --</option>
                {thermometers.map(t => (
                  <option key={t.id} value={t.id}>{t.name} {t.serial_number ? `(${t.serial_number})` : ''}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {storageZones.length === 0 ? (
          <div style={styles.emptyState}>
            <Snowflake size={32} color="var(--color-primary)" style={{ marginBottom: '12px', opacity: 0.5 }} />
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '16px' }}>No equipment found</div>
            <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '6px', textAlign: 'center', maxWidth: '300px' }}>
              Add storage zones like fridges and freezers in the Manager Hub first.
            </div>
          </div>
        ) : (
          <div style={styles.equipmentContainer}>
            {renderUnitList('Fridges', fridges, {
              id: 'fridge',
              iconBg: '#DBEAFE',
              iconColor: '#2563EB',
              titleColor: '#1E40AF',
              cardBg: '#EFF6FF',
              cardBorder: '#BFDBFE'
            })}
            
            {renderUnitList('Freezers', freezers, {
              id: 'freezer',
              iconBg: '#F3E8FF',
              iconColor: '#9333EA',
              titleColor: '#6B21A8',
              cardBg: '#FAF5FF',
              cardBorder: '#E9D5FF'
            })}
            
            {renderUnitList('Other Storage', others, {
              id: 'other',
              iconBg: '#CCFBF1',
              iconColor: '#0D9488',
              titleColor: '#115E59',
              cardBg: '#F0FDFA',
              cardBorder: '#99F6E4'
            })}
          </div>
        )}
        
        {/* Signature Pad */}
        <div style={{ marginTop: '36px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ ...styles.sectionTitle, color: 'var(--color-text-primary)' }}>
              Signature <span style={{ color: 'var(--color-danger)' }}>*</span>
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {existingSignature && (
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  (Existing signature preserved unless redrawn)
                </span>
              )}
              <button onClick={() => { if (sigPad.current) sigPad.current.clear(); setExistingSignature(null); }} type="button" style={styles.clearBtn}>
                Clear Signature
              </button>
            </div>
          </div>
          <div style={styles.sigPadWrapper}>
            <SignatureCanvas 
              penColor="black"
              canvasProps={{ width: 800, height: 160, className: 'sigCanvas' }} 
              ref={sigPad}
              backgroundColor="#FAFAFA"
            />
          </div>
        </div>
      </div>

      <div style={styles.modalFooter}>
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" icon={Save} disabled={submitting || storageZones.length === 0} style={styles.saveBtn}>
          {submitting ? 'Saving...' : (isEdit ? 'Update Entry' : 'Save Entries')}
        </Button>
      </div>

      <AmendmentReasonModal
        isOpen={reasonModalOpen}
        onClose={() => setReasonModalOpen(false)}
        onConfirm={handleConfirmAmendment}
        loading={submitting}
      />
    </form>
  );
};

const styles = {
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
  },
  modalBody: {
    padding: '32px',
    overflowY: 'auto',
    flex: 1,
  },
  generalDetailsWrapper: {
    backgroundColor: '#F9FAFB',
    border: '1px solid var(--color-border-light)',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '32px',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)'
  },
  equipmentContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '36px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  iconWrapper: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: '17px',
    fontWeight: 700,
    letterSpacing: '0.01em',
    margin: 0,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  card: {
    borderRadius: '12px',
    padding: '20px',
    borderStyle: 'solid',
    borderWidth: '1px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  unitInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  unitName: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
    letterSpacing: '-0.01em',
  },
  unitDesc: {
    fontSize: '13px',
    color: 'var(--color-text-secondary)',
    marginTop: '4px',
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '24px',
    width: '24px',
  },
  cardBody: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  unitLabel: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--color-text-muted)',
    fontSize: '14px',
    fontWeight: 500,
    pointerEvents: 'none',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-danger)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  sigPadWrapper: {
    border: '1px solid var(--color-border-light)',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)'
  },
  emptyState: {
    padding: '48px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px dashed var(--color-border-light)',
    borderRadius: '16px',
    backgroundColor: '#FAFAFA',
    margin: '32px 0',
  },
  modalFooter: {
    padding: '20px 32px',
    borderTop: '1px solid var(--color-border-light)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    backgroundColor: '#FAFAFA',
    borderBottomLeftRadius: '12px',
    borderBottomRightRadius: '12px',
  },
  saveBtn: {
    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
    boxShadow: '0 4px 12px rgba(26, 138, 99, 0.25)',
    border: 'none',
  }
};

export default TemperatureForm;
