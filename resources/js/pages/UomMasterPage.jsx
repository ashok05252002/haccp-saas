import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
  ArrowLeft, Plus, Pencil, Check, X, ShieldAlert, Search
} from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import axios from 'axios';

const Toggle = ({ checked, onChange }) => (
  <label style={styles.switch} onClick={(e) => { e.preventDefault(); onChange(!checked); }}>
    <span style={{ ...styles.slider, backgroundColor: checked ? 'var(--color-primary)' : '#E5E7EB' }}>
      <span style={{ ...styles.sliderKnob, transform: checked ? 'translateX(20px)' : 'translateX(0)' }} />
    </span>
  </label>
);

const UomMasterPage = () => {
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [uomSearchQuery, setUomSearchQuery] = useState('');

  // =========================================================================
  // UOM MASTER SYSTEM (TABBED INTERFACE)
  // =========================================================================
  const [uomActiveTab, setUomActiveTab] = useState('uoms'); // 'uoms' | 'base_units' | 'unit_types'

  const switchUomTab = (tab) => {
    setUomActiveTab(tab);
    setUomSearchQuery('');
  };

  const [unitTypes, setUnitTypes] = useState([]);
  const [baseUnits, setBaseUnits] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [uomLoading, setUomLoading] = useState(false);

  // CRUD Form States
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [typeEditId, setTypeEditId] = useState(null);
  const [typeForm, setTypeForm] = useState({ name: '', status: 'Active' });
  const [typeFormError, setTypeFormError] = useState('');

  const [baseModalOpen, setBaseModalOpen] = useState(false);
  const [baseEditId, setBaseEditId] = useState(null);
  const [baseForm, setBaseForm] = useState({ name: '', code: '', unit_type_id: '', status: 'Active' });
  const [baseFormErrors, setBaseFormErrors] = useState({});

  const [uomModalOpen, setUomModalOpen] = useState(false);
  const [uomEditId, setUomEditId] = useState(null);
  const [uomForm, setUomForm] = useState({
    unit_name: '', unit_code: '', unit_type_id: '', base_unit_id: '',
    conversion_factor: '1', decimal_allowed: true, display_order: '0', description: '', status: 'Active'
  });
  const [uomFormErrors, setUomFormErrors] = useState({});

  // Status confirm overlay states
  const [uomStatusConfirmModalOpen, setUomStatusConfirmModalOpen] = useState(false);
  const [uomStatusConfirmRecord, setUomStatusConfirmRecord] = useState(null);
  const [uomStatusConfirmType, setUomStatusConfirmType] = useState(''); // 'type' | 'base' | 'uom'
  const [uomStatusConfirmSaving, setUomStatusConfirmSaving] = useState(false);

  const fetchUomData = async () => {
    setUomLoading(true);
    try {
      const [typesRes, basesRes, uomsRes] = await Promise.all([
        axios.get('/api/unit-types'),
        axios.get('/api/base-units'),
        axios.get('/api/uoms')
      ]);
      setUnitTypes(typesRes.data);
      setBaseUnits(basesRes.data);
      setUoms(uomsRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch UOM data.');
    } finally {
      setUomLoading(false);
    }
  };

  useEffect(() => {
    fetchUomData();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // TAB 1: Unit Types Category Handlers
  // ─────────────────────────────────────────────────────────────────────────
  const handleSaveType = async (e) => {
    e.preventDefault();
    setTypeFormError('');
    if (!typeForm.name.trim()) {
      setTypeFormError('Category name is required.');
      return;
    }

    try {
      if (typeEditId) {
        await axios.put(`/api/unit-types/${typeEditId}`, typeForm);
        setSuccess('Category updated successfully!');
      } else {
        await axios.post('/api/unit-types', typeForm);
        setSuccess('Category added successfully!');
      }
      setTypeModalOpen(false);
      fetchUomData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.errors?.name?.[0] || 'Failed to save category.';
      setTypeFormError(msg);
    }
  };

  const handleEditTypeClick = (type) => {
    setTypeEditId(type.id);
    setTypeForm({ name: type.name, status: type.status });
    setTypeFormError('');
    setTypeModalOpen(true);
  };

  const handleToggleTypeStatus = (type) => {
    setUomStatusConfirmType('type');
    setUomStatusConfirmRecord(type);
    setUomStatusConfirmModalOpen(true);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // TAB 2: Base Units Handlers
  // ─────────────────────────────────────────────────────────────────────────
  const handleSaveBaseUnit = async (e) => {
    e.preventDefault();
    setBaseFormErrors({});
    const errors = {};
    if (!baseForm.name.trim()) errors.name = 'Base unit name is required.';
    if (!baseForm.code.trim()) errors.code = 'Base unit code is required.';
    if (!baseForm.unit_type_id) errors.unit_type_id = 'Please select a unit category.';

    if (Object.keys(errors).length > 0) {
      setBaseFormErrors(errors);
      return;
    }

    try {
      if (baseEditId) {
        await axios.put(`/api/base-units/${baseEditId}`, baseForm);
        setSuccess('Base Unit updated successfully!');
      } else {
        await axios.post('/api/base-units', baseForm);
        setSuccess('Base Unit registered successfully!');
      }
      setBaseModalOpen(false);
      fetchUomData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err.response && err.response.status === 422) {
        const backendErrors = err.response.data.errors;
        const mapped = {};
        Object.keys(backendErrors).forEach(key => {
          mapped[key] = backendErrors[key][0];
        });
        setBaseFormErrors(mapped);
      } else {
        setError('Failed to save Base Unit.');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleEditBaseClick = (base) => {
    setBaseEditId(base.id);
    setBaseForm({
      name: base.name,
      code: base.code,
      unit_type_id: String(base.unit_type_id),
      status: base.status
    });
    setBaseFormErrors({});
    setBaseModalOpen(true);
  };

  const handleToggleBaseStatus = (base) => {
    setUomStatusConfirmType('base');
    setUomStatusConfirmRecord(base);
    setUomStatusConfirmModalOpen(true);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // TAB 3: Selectable UOM Units Handlers
  // ─────────────────────────────────────────────────────────────────────────
  const handleSaveUom = async (e) => {
    e.preventDefault();
    setUomFormErrors({});

    const errors = {};
    if (!uomForm.unit_name.trim()) errors.unit_name = 'Unit name is required.';
    if (!uomForm.unit_code.trim()) errors.unit_code = 'Unit code is required.';
    if (!uomForm.unit_type_id) errors.unit_type_id = 'Category type is required.';
    if (!uomForm.base_unit_id) errors.base_unit_id = 'Base unit link is required.';
    if (uomForm.conversion_factor <= 0) errors.conversion_factor = 'Conversion factor must be greater than zero.';

    if (Object.keys(errors).length > 0) {
      setUomFormErrors(errors);
      return;
    }

    const payload = {
      ...uomForm,
      unit_type_id: parseInt(uomForm.unit_type_id),
      base_unit_id: parseInt(uomForm.base_unit_id),
      conversion_factor: parseFloat(uomForm.conversion_factor),
      display_order: parseInt(uomForm.display_order) || 0,
      decimal_allowed: !!uomForm.decimal_allowed
    };

    try {
      if (uomEditId) {
        await axios.put(`/api/uoms/${uomEditId}`, payload);
        setSuccess('UOM Unit updated successfully!');
      } else {
        await axios.post('/api/uoms', payload);
        setSuccess('UOM Unit registered successfully!');
      }
      setUomModalOpen(false);
      fetchUomData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err.response && err.response.status === 422) {
        const backendErrors = err.response.data.errors;
        const mapped = {};
        Object.keys(backendErrors).forEach(key => {
          mapped[key] = backendErrors[key][0];
        });
        setUomFormErrors(mapped);
      } else {
        setError('Failed to save UOM Unit.');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleEditUomClick = (uom) => {
    setUomEditId(uom.id);
    setUomForm({
      unit_name: uom.unit_name,
      unit_code: uom.unit_code,
      unit_type_id: String(uom.unit_type_id),
      base_unit_id: String(uom.base_unit_id),
      conversion_factor: String(uom.conversion_factor),
      decimal_allowed: !!uom.decimal_allowed,
      display_order: String(uom.display_order),
      description: uom.description || '',
      status: uom.status
    });
    setUomFormErrors({});
    setUomModalOpen(true);
  };

  const handleToggleUomStatus = (uom) => {
    setUomStatusConfirmType('uom');
    setUomStatusConfirmRecord(uom);
    setUomStatusConfirmModalOpen(true);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Shared Confirm Status toggler logic
  // ─────────────────────────────────────────────────────────────────────────
  const confirmToggleUomStatus = async () => {
    if (!uomStatusConfirmRecord) return;
    setUomStatusConfirmSaving(true);
    const nextStatus = uomStatusConfirmRecord.status === 'Active' ? 'Inactive' : 'Active';

    try {
      if (uomStatusConfirmType === 'type') {
        await axios.put(`/api/unit-types/${uomStatusConfirmRecord.id}`, {
          name: uomStatusConfirmRecord.name,
          status: nextStatus
        });
        setSuccess(`Category "${uomStatusConfirmRecord.name}" status updated to ${nextStatus}.`);
      } else if (uomStatusConfirmType === 'base') {
        await axios.put(`/api/base-units/${uomStatusConfirmRecord.id}`, {
          name: uomStatusConfirmRecord.name,
          code: uomStatusConfirmRecord.code,
          unit_type_id: uomStatusConfirmRecord.unit_type_id,
          status: nextStatus
        });
        setSuccess(`Base unit "${uomStatusConfirmRecord.code}" status updated to ${nextStatus}.`);
      } else {
        await axios.put(`/api/uoms/${uomStatusConfirmRecord.id}`, {
          unit_name: uomStatusConfirmRecord.unit_name,
          unit_code: uomStatusConfirmRecord.unit_code,
          unit_type_id: uomStatusConfirmRecord.unit_type_id,
          base_unit_id: uomStatusConfirmRecord.base_unit_id,
          conversion_factor: uomStatusConfirmRecord.conversion_factor,
          decimal_allowed: !!uomStatusConfirmRecord.decimal_allowed,
          status: nextStatus
        });
        setSuccess(`UOM "${uomStatusConfirmRecord.unit_code}" status updated to ${nextStatus}.`);
      }
      setUomStatusConfirmModalOpen(false);
      fetchUomData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to update status.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUomStatusConfirmSaving(false);
      setUomStatusConfirmRecord(null);
    }
  };

  // Form helpers
  const openAddTypeModal = () => {
    setTypeEditId(null);
    setTypeForm({ name: '', status: 'Active' });
    setTypeFormError('');
    setTypeModalOpen(true);
  };

  const openAddBaseModal = () => {
    setBaseEditId(null);
    setBaseForm({ name: '', code: '', unit_type_id: unitTypes[0]?.id ? String(unitTypes[0].id) : '', status: 'Active' });
    setBaseFormErrors({});
    setBaseModalOpen(true);
  };

  const openAddUomModal = () => {
    setUomEditId(null);
    const defaultTypeId = unitTypes[0]?.id ? String(unitTypes[0].id) : '';
    setUomForm({
      unit_name: '', unit_code: '', unit_type_id: defaultTypeId, base_unit_id: '',
      conversion_factor: '1', decimal_allowed: true, display_order: '0', description: '', status: 'Active'
    });
    setUomFormErrors({});
    setUomModalOpen(true);
  };

  // Filter base units belonging to the same category type and are active (used in dropdown)
  const filteredBaseUnits = baseUnits.filter(b => 
    String(b.unit_type_id) === String(uomForm.unit_type_id) && 
    b.status === 'Active'
  );

  // ─── UOM TAB filtered lists ──────────────────────────────────────────────
  const q = uomSearchQuery.toLowerCase();
  const filteredUoms = uoms.filter(u =>
    u.unit_name.toLowerCase().includes(q) ||
    u.unit_code.toLowerCase().includes(q) ||
    (u.unit_type?.name || '').toLowerCase().includes(q) ||
    (u.base_unit?.name || '').toLowerCase().includes(q) ||
    (u.base_unit?.code || '').toLowerCase().includes(q)
  );
  const filteredBaseUnitsList = baseUnits.filter(b =>
    b.name.toLowerCase().includes(q) ||
    b.code.toLowerCase().includes(q) ||
    (b.unit_type?.name || '').toLowerCase().includes(q)
  );
  const filteredUnitTypes = unitTypes.filter(t =>
    t.name.toLowerCase().includes(q)
  );

  return (
    <PageLayout>
      <Head title="Unit of Measurement (UOM) Master" />

      {/* Global Success / Error Banners */}
      {success && (
        <div className="alert-success">
          <Check size={16} />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="alert-error">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      <div>
        <button onClick={() => router.visit('/manager-hub')} className="back-btn">
          <ArrowLeft size={16} />
          <span>Back to Manager Hub</span>
        </button>

        <div className="panel-header-row">
          <div>
            <h1 className="page-title">Unit of Measurement (UOM) Master</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginTop: '2px' }}>
              Set up unit categories, reference base units, and conversions.
            </p>
          </div>
          {uomActiveTab === 'unit_types' && (
            <Button variant="primary" icon={Plus} onClick={openAddTypeModal}>
              Add Category Type
            </Button>
          )}
          {uomActiveTab === 'base_units' && (
            <Button variant="primary" icon={Plus} onClick={openAddBaseModal}>
              Add Base Unit
            </Button>
          )}
          {uomActiveTab === 'uoms' && (
            <Button variant="primary" icon={Plus} onClick={openAddUomModal}>
              Add Selectable UOM
            </Button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div style={styles.tabsHeader}>
          <button 
            onClick={() => switchUomTab('uoms')} 
            style={{ 
              ...styles.tabBtn, 
              borderBottomColor: uomActiveTab === 'uoms' ? 'var(--color-primary)' : 'transparent', 
              color: uomActiveTab === 'uoms' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: uomActiveTab === 'uoms' ? '700' : '500'
            }}
          >
            UOM Units List
          </button>
          <button 
            onClick={() => switchUomTab('base_units')} 
            style={{ 
              ...styles.tabBtn, 
              borderBottomColor: uomActiveTab === 'base_units' ? 'var(--color-primary)' : 'transparent', 
              color: uomActiveTab === 'base_units' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: uomActiveTab === 'base_units' ? '700' : '500'
            }}
          >
            Base Units Master
          </button>
          <button 
            onClick={() => switchUomTab('unit_types')} 
            style={{ 
              ...styles.tabBtn, 
              borderBottomColor: uomActiveTab === 'unit_types' ? 'var(--color-primary)' : 'transparent', 
              color: uomActiveTab === 'unit_types' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: uomActiveTab === 'unit_types' ? '700' : '500'
            }}
          >
            Unit Category Types
          </button>
        </div>

        {/* UOM Tab Search */}
        <div style={{ ...styles.searchBarWrapper, marginBottom: '16px' }}>
          <Search size={16} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder={
              uomActiveTab === 'uoms' ? 'Search by name, code, category or base unit...' :
              uomActiveTab === 'base_units' ? 'Search by name, code, or category...' :
              'Search by category name...'
            }
            value={uomSearchQuery}
            onChange={(e) => setUomSearchQuery(e.target.value)}
            className="search-bar-input"
          />
          {uomSearchQuery && (
            <button onClick={() => setUomSearchQuery('')} className="search-clear-btn">
              <X size={14} />
            </button>
          )}
        </div>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {uomLoading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              Loading master data...
            </div>
          ) : uomActiveTab === 'unit_types' ? (
            // TAB CONTENT: UNIT CATEGORY TYPES
            filteredUnitTypes.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                {uomSearchQuery ? `No category types match "${uomSearchQuery}".` : 'No category types registered. Click "Add Category Type" to create one.'}
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th >Category Name</th>
                    <th >Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUnitTypes.map((type) => (
                    <tr key={type.id}>
                      <td >
                        <strong style={{ color: 'var(--color-text-primary)' }}>{type.name}</strong>
                      </td>
                      <td >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Toggle
                            checked={type.status === 'Active'}
                            onChange={() => handleToggleTypeStatus(type)}
                          />
                          <span style={{ fontSize: '13px', fontWeight: 600, color: type.status === 'Active' ? 'var(--color-primary)' : '#6B7280' }}>
                            {type.status}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleEditTypeClick(type)}
                            className="action-icon-btn"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : uomActiveTab === 'base_units' ? (
            // TAB CONTENT: BASE UNITS MASTER
            filteredBaseUnitsList.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                {uomSearchQuery ? `No base units match "${uomSearchQuery}".` : 'No base units registered. Click "Add Base Unit" to create one.'}
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th >Base Unit Name</th>
                    <th >Unit Code</th>
                    <th >Category Type</th>
                    <th >Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBaseUnitsList.map((base) => (
                    <tr key={base.id}>
                      <td >
                        <strong style={{ color: 'var(--color-text-primary)' }}>{base.name}</strong>
                      </td>
                      <td >
                        <code style={styles.codeBadge}>{base.code}</code>
                      </td>
                      <td >{base.unit_type?.name}</td>
                      <td >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Toggle
                            checked={base.status === 'Active'}
                            onChange={() => handleToggleBaseStatus(base)}
                          />
                          <span style={{ fontSize: '13px', fontWeight: 600, color: base.status === 'Active' ? 'var(--color-primary)' : '#6B7280' }}>
                            {base.status}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleEditBaseClick(base)}
                            className="action-icon-btn"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            // TAB CONTENT: SELECTABLE UOMS LIST
            filteredUoms.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                {uomSearchQuery ? `No UOM units match "${uomSearchQuery}".` : 'No selectable UOMs registered. Click "Add Selectable UOM" to create one.'}
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th >Unit Name</th>
                    <th >Code</th>
                    <th >Category</th>
                    <th >Base Unit</th>
                    <th >Conversion Factor</th>
                    <th >Decimals</th>
                    <th >Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUoms.map((u) => (
                    <tr key={u.id}>
                      <td >
                        <strong style={{ color: 'var(--color-text-primary)' }}>{u.unit_name}</strong>
                      </td>
                      <td >
                        <code style={styles.codeBadge}>{u.unit_code}</code>
                      </td>
                      <td >{u.unit_type?.name}</td>
                      <td >
                        {u.base_unit ? (
                          <span style={styles.uomLink}>{u.base_unit.name} ({u.base_unit.code})</span>
                        ) : (
                          <span style={styles.baseLabel}>Base Unit</span>
                        )}
                      </td>
                      <td >
                        {u.base_unit ? (
                          <span>{parseFloat(u.conversion_factor)} {u.base_unit.code}</span>
                        ) : (
                          <span>1.0</span>
                        )}
                      </td>
                      <td >
                        {u.decimal_allowed ? 'Yes' : 'No'}
                      </td>
                      <td >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Toggle
                            checked={u.status === 'Active'}
                            onChange={() => handleToggleUomStatus(u)}
                          />
                          <span style={{ fontSize: '13px', fontWeight: 600, color: u.status === 'Active' ? 'var(--color-primary)' : '#6B7280' }}>
                            {u.status}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleEditUomClick(u)}
                            className="action-icon-btn"
                            title="Edit UOM"
                          >
                            <Pencil size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </Card>
      </div>

      {/* =====================================================================
          TAB 1 DIALOG MODAL: UNIT CATEGORY TYPE
          ===================================================================== */}
      <Modal
        isOpen={typeModalOpen}
        onClose={() => setTypeModalOpen(false)}
        title={typeEditId ? 'Edit Category Type' : 'Add Category Type'}
        footer={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" onClick={() => setTypeModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveType}>
              Save Category
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveType} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {typeFormError && (
            <div className="alert-error">
              <ShieldAlert size={16} />
              <span>{typeFormError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Category Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input
              type="text"
              className="form-input"
              value={typeForm.name}
              onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
              placeholder="e.g. Weight, Volume, Count, Length"
              style={{ width: '100%', boxSizing: 'border-box' }}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={typeForm.status}
              onChange={(e) => setTypeForm({ ...typeForm, status: e.target.value })}
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* =====================================================================
          TAB 2 DIALOG MODAL: BASE UNIT
          ===================================================================== */}
      <Modal
        isOpen={baseModalOpen}
        onClose={() => setBaseModalOpen(false)}
        title={baseEditId ? 'Edit Base Unit' : 'Add Base Unit'}
        footer={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" onClick={() => setBaseModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveBaseUnit}>
              Save Base Unit
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveBaseUnit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="form-group">
            <label className="form-label">Base Unit Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input
              type="text"
              className="form-input"
              value={baseForm.name}
              onChange={(e) => setBaseForm({ ...baseForm, name: e.target.value })}
              placeholder="e.g. Kilogram"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
            {baseFormErrors.name && (
              <span style={styles.fieldError}>{baseFormErrors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Base Unit Code <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input
              type="text"
              className="form-input"
              value={baseForm.code}
              onChange={(e) => setBaseForm({ ...baseForm, code: e.target.value })}
              placeholder="e.g. KG"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
            {baseFormErrors.code && (
              <span style={styles.fieldError}>{baseFormErrors.code}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Unit Category Type <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <select
              className="form-select"
              value={baseForm.unit_type_id}
              onChange={(e) => setBaseForm({ ...baseForm, unit_type_id: e.target.value })}
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              <option value="">-- Select Category --</option>
              {unitTypes.filter(t => t.status === 'Active').map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {baseFormErrors.unit_type_id && (
              <span style={styles.fieldError}>{baseFormErrors.unit_type_id}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={baseForm.status}
              onChange={(e) => setBaseForm({ ...baseForm, status: e.target.value })}
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* =====================================================================
          TAB 3 DIALOG MODAL: SELECTABLE UOM UNIT
          ===================================================================== */}
      <Modal
        isOpen={uomModalOpen}
        onClose={() => setUomModalOpen(false)}
        title={uomEditId ? 'Edit Selectable UOM' : 'Add Selectable UOM'}
        footer={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" onClick={() => setUomModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveUom}>
              Save Unit
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveUom} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Unit Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input
                type="text"
                className="form-input"
                value={uomForm.unit_name}
                onChange={(e) => setUomForm({ ...uomForm, unit_name: e.target.value })}
                placeholder="e.g. Gram"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
              {uomFormErrors.unit_name && (
                <span style={styles.fieldError}>{uomFormErrors.unit_name}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Unit Code <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input
                type="text"
                className="form-input"
                value={uomForm.unit_code}
                onChange={(e) => setUomForm({ ...uomForm, unit_code: e.target.value })}
                placeholder="e.g. G"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
              {uomFormErrors.unit_code && (
                <span style={styles.fieldError}>{uomFormErrors.unit_code}</span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Unit Category Type <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <select
                className="form-select"
                value={uomForm.unit_type_id}
                onChange={(e) => setUomForm({ ...uomForm, unit_type_id: e.target.value, base_unit_id: '' })}
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                <option value="">-- Select Category --</option>
                {unitTypes.filter(t => t.status === 'Active').map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {uomFormErrors.unit_type_id && (
                <span style={styles.fieldError}>{uomFormErrors.unit_type_id}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Base Unit Reference <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <select
                className="form-select"
                value={uomForm.base_unit_id}
                onChange={(e) => setUomForm({ ...uomForm, base_unit_id: e.target.value })}
                disabled={!uomForm.unit_type_id}
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                <option value="">-- Select Base Unit --</option>
                {filteredBaseUnits.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                ))}
              </select>
              {uomFormErrors.base_unit_id && (
                <span style={styles.fieldError}>{uomFormErrors.base_unit_id}</span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
            <div className="form-group">
              <label className="form-label">Conversion Factor <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input
                type="number"
                step="any"
                className="form-input"
                value={uomForm.conversion_factor}
                onChange={(e) => setUomForm({ ...uomForm, conversion_factor: e.target.value })}
                placeholder="Factor to Base Unit"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block', marginTop: '2px' }}>
                {`1 ${uomForm.unit_code || 'Unit'} = ${uomForm.conversion_factor || 0} of Base Unit`}
              </span>
              {uomFormErrors.conversion_factor && (
                <span style={styles.fieldError}>{uomFormErrors.conversion_factor}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Decimals Allowed</label>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', height: '38px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="uomDecimals" 
                    checked={uomForm.decimal_allowed === true} 
                    onChange={() => setUomForm({ ...uomForm, decimal_allowed: true })} 
                  />
                  <span>Yes</span>
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="uomDecimals" 
                    checked={uomForm.decimal_allowed === false} 
                    onChange={() => setUomForm({ ...uomForm, decimal_allowed: false })} 
                  />
                  <span>No</span>
                </label>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Display Order</label>
              <input
                type="number"
                className="form-input"
                value={uomForm.display_order}
                onChange={(e) => setUomForm({ ...uomForm, display_order: e.target.value })}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={uomForm.status}
                onChange={(e) => setUomForm({ ...uomForm, status: e.target.value })}
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description / Notes</label>
            <textarea
              className="form-input"
              value={uomForm.description}
              onChange={(e) => setUomForm({ ...uomForm, description: e.target.value })}
              placeholder="Provide a description of this selectable unit..."
              style={{ width: '100%', boxSizing: 'border-box', minHeight: '60px', fontFamily: 'inherit' }}
            />
          </div>
        </form>
      </Modal>

      {/* Global UOM Tab components confirmation modal */}
      <Modal
        isOpen={uomStatusConfirmModalOpen}
        onClose={() => setUomStatusConfirmModalOpen(false)}
        title="Confirm Status Change"
        footer={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" onClick={() => setUomStatusConfirmModalOpen(false)} disabled={uomStatusConfirmSaving}>
              Cancel
            </Button>
            <Button variant={uomStatusConfirmRecord?.status === 'Active' ? 'danger' : 'primary'} onClick={confirmToggleUomStatus} loading={uomStatusConfirmSaving}>
              {uomStatusConfirmRecord?.status === 'Active' ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '14px', color: 'var(--color-text-primary)', lineHeight: '1.5' }}>
            Are you sure you want to change the status of{' '}
            <strong>
              {uomStatusConfirmType === 'type' ? uomStatusConfirmRecord?.name : 
               uomStatusConfirmType === 'base' ? `${uomStatusConfirmRecord?.name} (${uomStatusConfirmRecord?.code})` :
               uomStatusConfirmRecord?.unit_name
              }
            </strong>{' '}
            to <strong>{uomStatusConfirmRecord?.status === 'Active' ? 'Inactive' : 'Active'}</strong>?
          </p>
          {uomStatusConfirmRecord?.status === 'Active' && (
            <div className="alert-error" style={{ margin: 0 }}>
              <ShieldAlert size={16} />
              <span>
                {uomStatusConfirmType === 'type' && 'Warning: Deactivating this category will disable all base units and UOMs mapped under it.'}
                {uomStatusConfirmType === 'base' && 'Warning: Deactivating this base unit will disable all UOM units pointing to it.'}
                {uomStatusConfirmType === 'uom' && 'Warning: Deactivating this unit will make it unavailable for selectable transactions.'}
              </span>
            </div>
          )}
        </div>
      </Modal>

    </PageLayout>
  );
};

const styles = {
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: 'var(--color-primary)',
    fontSize: '13px',
    fontWeight: 600,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    marginBottom: '20px',
    padding: 0,
  },
  panelHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  tabsHeader: {
    display: 'flex',
    gap: '24px',
    borderBottom: '1px solid var(--color-border-light)',
    marginBottom: '24px',
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    padding: '10px 4px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 150ms ease',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '12px 20px',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    borderBottom: '2px solid var(--color-border-light)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  td: {
    padding: '16px 20px',
    fontSize: '14px',
    color: 'var(--color-text-secondary)',
    borderBottom: '1px solid var(--color-border-light)',
    verticalAlign: 'middle',
  },
  codeBadge: {
    display: 'inline-block',
    padding: '2px 6px',
    backgroundColor: '#F3F4F6',
    border: '1px solid #E5E7EB',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontWeight: 600,
    color: '#374151',
    fontSize: '12px',
  },
  uomLink: {
    color: 'var(--color-primary)',
    fontWeight: 500,
  },
  baseLabel: {
    color: '#6B7280',
    fontSize: '12px',
    fontStyle: 'italic',
  },
  actionIconBtn: {
    width: '30px',
    height: '30px',
    borderRadius: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--color-border-light)',
    backgroundColor: '#fff',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    transition: 'all 150ms ease',
  },
  alertSuccess: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    backgroundColor: 'var(--color-primary-pale)',
    border: '1px solid #B8DBCA',
    color: 'var(--color-primary)',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '20px',
  },
  alertError: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    backgroundColor: 'var(--color-red-pale)',
    border: '1px solid var(--color-red-border)',
    color: 'var(--color-danger)',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '20px',
  },
  switch: {
    position: 'relative',
    display: 'inline-block',
    width: '40px',
    height: '20px',
    cursor: 'pointer',
  },
  slider: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: '20px',
    transition: 'background-color 200ms ease',
    display: 'flex',
    alignItems: 'center',
    padding: '0 2px',
  },
  sliderKnob: {
    height: '16px',
    width: '16px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    transition: 'transform 200ms ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
  },
  fieldError: {
    color: 'var(--color-danger)',
    fontSize: '12px',
    marginTop: '4px',
    display: 'block',
  },
  searchBarWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    backgroundColor: '#fff',
    border: '1px solid var(--color-border-light)',
    borderRadius: '8px',
    marginBottom: '24px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    color: 'var(--color-text-primary)',
    backgroundColor: 'transparent',
    fontFamily: 'inherit',
  },
  searchClearBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#E5E7EB',
    color: '#6B7280',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  },
};

export default UomMasterPage;
