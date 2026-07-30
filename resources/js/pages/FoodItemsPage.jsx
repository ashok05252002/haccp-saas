import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
  ArrowLeft, Plus, Pencil, Check, Search, X, Package, ShieldAlert, Thermometer
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

const FoodItemsPage = () => {
  const [activeTab, setActiveTab] = useState('food-items'); // 'food-items' | 'storage-types'
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  // =========================================================================
  // 1. FOOD ITEMS STATES & LOGIC
  // =========================================================================
  const [foodItems, setFoodItems] = useState([]);
  const [foodItemsLoading, setFoodItemsLoading] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemEditId, setItemEditId] = useState(null);
  const [itemForm, setItemForm] = useState({ name: '', uom_id: '', storage_type_id: '', status: 'Active' });
  const [itemFormError, setItemFormError] = useState('');
  const [uomList, setUomList] = useState([]);
  const [storageTypeList, setStorageTypeList] = useState([]);

  const [itemConfirmModalOpen, setItemConfirmModalOpen] = useState(false);
  const [itemConfirmRecord, setItemConfirmRecord] = useState(null);
  const [itemConfirmSaving, setItemConfirmSaving] = useState(false);

  // =========================================================================
  // 2. STORAGE TYPES STATES & LOGIC
  // =========================================================================
  const [storageTypes, setStorageTypes] = useState([]);
  const [storageTypesLoading, setStorageTypesLoading] = useState(false);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [typeEditId, setTypeEditId] = useState(null);
  const [typeForm, setTypeForm] = useState({
    name: '',
    temperature_required: false,
    min_temp: '',
    max_temp: '',
    rule_text: '',
    status: 'Active'
  });
  const [typeFormError, setTypeFormError] = useState('');

  const [typeConfirmModalOpen, setTypeConfirmModalOpen] = useState(false);
  const [typeConfirmRecord, setTypeConfirmRecord] = useState(null);
  const [typeConfirmSaving, setTypeConfirmSaving] = useState(false);

  // Fetch all master data
  const fetchData = async () => {
    setFoodItemsLoading(true);
    setStorageTypesLoading(true);
    try {
      const [itemsRes, uomRes, typesRes] = await Promise.all([
        axios.get('/api/food-items'),
        axios.get('/api/uoms'),
        axios.get('/api/storage-types'),
      ]);
      setFoodItems(itemsRes.data);
      setUomList(uomRes.data.filter(u => u.status === 'Active'));
      setStorageTypes(typesRes.data);
      setStorageTypeList(typesRes.data.filter(t => t.status === 'Active'));
    } catch (err) {
      console.error(err);
      setError('Failed to fetch food items master data.');
    } finally {
      setFoodItemsLoading(false);
      setStorageTypesLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // -------------------------------------------------------------------------
  // FOOD ITEM HANDLERS
  // -------------------------------------------------------------------------
  const handleSaveFoodItem = async (e) => {
    e.preventDefault();
    setItemFormError('');
    if (!itemForm.name.trim()) {
      setItemFormError('Food item name is required.');
      return;
    }
    if (!itemForm.uom_id) {
      setItemFormError('Default UOM is required.');
      return;
    }
    if (!itemForm.storage_type_id) {
      setItemFormError('Storage type is required.');
      return;
    }

    try {
      if (itemEditId) {
        await axios.put(`/api/food-items/${itemEditId}`, itemForm);
        setSuccess('Food item updated successfully!');
      } else {
        await axios.post('/api/food-items', itemForm);
        setSuccess('Food item added successfully!');
      }
      setItemForm({ name: '', uom_id: '', storage_type_id: '', status: 'Active' });
      setItemModalOpen(false);
      setItemEditId(null);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errMsg = err.response?.data?.errors?.name?.[0] || 
                     err.response?.data?.errors?.uom_id?.[0] || 
                     err.response?.data?.errors?.storage_type_id?.[0] || 
                     'An error occurred.';
      setItemFormError(errMsg);
    }
  };

  const handleEditItemClick = (item) => {
    setItemEditId(item.id);
    setItemForm({
      name: item.name,
      uom_id: item.uom_id ? String(item.uom_id) : '',
      storage_type_id: item.storage_type_id ? String(item.storage_type_id) : '',
      status: item.status || 'Active',
    });
    setItemFormError('');
    setItemModalOpen(true);
  };

  const handleToggleItemStatus = (item) => {
    setItemConfirmRecord(item);
    setItemConfirmModalOpen(true);
  };

  const confirmToggleItemStatus = async () => {
    if (!itemConfirmRecord) return;
    setItemConfirmSaving(true);
    const nextStatus = itemConfirmRecord.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await axios.put(`/api/food-items/${itemConfirmRecord.id}`, {
        name: itemConfirmRecord.name,
        uom_id: itemConfirmRecord.uom_id,
        storage_type_id: itemConfirmRecord.storage_type_id,
        status: nextStatus,
      });
      setItemConfirmModalOpen(false);
      setSuccess(`Food item "${itemConfirmRecord.name}" is now ${nextStatus}.`);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to toggle food item status.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setItemConfirmSaving(false);
      setItemConfirmRecord(null);
    }
  };

  const openAddFoodItemModal = () => {
    setItemEditId(null);
    setItemForm({ name: '', uom_id: '', storage_type_id: '', status: 'Active' });
    setItemFormError('');
    setItemModalOpen(true);
  };

  // -------------------------------------------------------------------------
  // STORAGE TYPE HANDLERS
  // -------------------------------------------------------------------------
  const handleSaveStorageType = async (e) => {
    e.preventDefault();
    setTypeFormError('');
    if (!typeForm.name.trim()) {
      setTypeFormError('Storage type name is required.');
      return;
    }

    try {
      const payload = {
        name: typeForm.name,
        temperature_required: typeForm.temperature_required,
        min_temp: typeForm.min_temp !== '' ? typeForm.min_temp : null,
        max_temp: typeForm.max_temp !== '' ? typeForm.max_temp : null,
        rule_text: typeForm.rule_text,
        status: typeForm.status,
      };

      if (typeEditId) {
        await axios.put(`/api/storage-types/${typeEditId}`, payload);
        setSuccess('Storage type updated successfully!');
      } else {
        await axios.post('/api/storage-types', payload);
        setSuccess('Storage type added successfully!');
      }
      setTypeForm({
        name: '',
        temperature_required: false,
        min_temp: '',
        max_temp: '',
        rule_text: '',
        status: 'Active'
      });
      setTypeModalOpen(false);
      setTypeEditId(null);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errMsg = err.response?.data?.errors?.name?.[0] || 
                     err.response?.data?.errors?.status?.[0] || 
                     'Failed to save storage type.';
      setTypeFormError(errMsg);
    }
  };

  const handleEditTypeClick = (st) => {
    setTypeEditId(st.id);
    setTypeForm({
      name: st.name,
      temperature_required: Boolean(st.temperature_required),
      min_temp: st.min_temp !== null && st.min_temp !== undefined ? String(st.min_temp) : '',
      max_temp: st.max_temp !== null && st.max_temp !== undefined ? String(st.max_temp) : '',
      rule_text: st.rule_text || '',
      status: st.status || 'Active',
    });
    setTypeFormError('');
    setTypeModalOpen(true);
  };

  const handleToggleTypeStatus = (st) => {
    setTypeConfirmRecord(st);
    setTypeConfirmModalOpen(true);
  };

  const confirmToggleTypeStatus = async () => {
    if (!typeConfirmRecord) return;
    setTypeConfirmSaving(true);
    const nextStatus = typeConfirmRecord.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await axios.put(`/api/storage-types/${typeConfirmRecord.id}`, {
        name: typeConfirmRecord.name,
        temperature_required: typeConfirmRecord.temperature_required,
        min_temp: typeConfirmRecord.min_temp,
        max_temp: typeConfirmRecord.max_temp,
        rule_text: typeConfirmRecord.rule_text,
        status: nextStatus,
      });
      setTypeConfirmModalOpen(false);
      setSuccess(`Storage type "${typeConfirmRecord.name}" is now ${nextStatus}.`);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to toggle storage type status.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setTypeConfirmSaving(false);
      setTypeConfirmRecord(null);
    }
  };

  const openAddStorageTypeModal = () => {
    setTypeEditId(null);
    setTypeForm({
      name: '',
      temperature_required: false,
      min_temp: '',
      max_temp: '',
      rule_text: '',
      status: 'Active'
    });
    setTypeFormError('');
    setTypeModalOpen(true);
  };

  // Filtered lists
  const q = searchQuery.toLowerCase();
  const filteredFoodItems = foodItems.filter(item => {
    const nameMatch = item.name.toLowerCase().includes(q);
    const uomName = (item.uom?.unit_name || item.uom?.unit_code || '').toLowerCase();
    const uomMatch = uomName.includes(q);
    const typeName = (item.storage_type?.name || '').toLowerCase();
    const typeMatch = typeName.includes(q);
    return nameMatch || uomMatch || typeMatch;
  });

  const filteredStorageTypes = storageTypes.filter(st => {
    const nameMatch = st.name.toLowerCase().includes(q);
    const ruleMatch = (st.rule_text || '').toLowerCase().includes(q);
    return nameMatch || ruleMatch;
  });

  return (
    <PageLayout>
      <Head title="Food Items Master" />

      <div>
        {/* Back Link */}
        <div 
          onClick={() => router.visit('/manager-hub')}
          style={styles.backLink}
        >
          <ArrowLeft size={16} />
          <span>Back to Manager Hub</span>
        </div>

        {/* Top Header */}
        <div style={styles.headerRow}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Package size={28} color="var(--color-primary)" />
              Food Items Master
            </h1>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Manage food items and their storage type classification.
            </p>
          </div>

          <Button 
            variant="primary" 
            onClick={activeTab === 'food-items' ? openAddFoodItemModal : openAddStorageTypeModal}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            <span>{activeTab === 'food-items' ? 'Add Food Item' : 'Add Storage Type'}</span>
          </Button>
        </div>

        {/* Global Toast Alerts */}
        {success && (
          <div style={styles.successToast}>
            <Check size={18} />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div style={styles.errorToast}>
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div style={styles.tabContainer}>
          <button
            style={{
              ...styles.tabButton,
              ...(activeTab === 'food-items' ? styles.activeTabButton : {}),
            }}
            onClick={() => switchTab('food-items')}
          >
            Food Items List ({foodItems.length})
          </button>
          <button
            style={{
              ...styles.tabButton,
              ...(activeTab === 'storage-types' ? styles.activeTabButton : {}),
            }}
            onClick={() => switchTab('storage-types')}
          >
            Storage Types ({storageTypes.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="search-bar-wrapper">
          <Search size={16} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder={
              activeTab === 'food-items'
                ? "Search food items by name, UOM, or storage type..."
                : "Search storage types by name or rule text..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-bar-input"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="search-clear-btn">
              <X size={14} />
            </button>
          )}
        </div>

        {/* TAB 1: FOOD ITEMS LIST */}
        {activeTab === 'food-items' && (
          <Card padding="0">
            {foodItemsLoading ? (
              <div style={styles.loadingState}>Loading food items...</div>
            ) : filteredFoodItems.length === 0 ? (
              <div style={styles.emptyState}>
                {searchQuery ? 'No food items found matching your search.' : 'No food items added yet. Click "+ Add Food Item" to get started.'}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th >Food Item Name</th>
                      <th >Default UOM</th>
                      <th >Storage Type</th>
                      <th >Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFoodItems.map((item) => {
                      const isActive = item.status === 'Active';
                      const uomText = item.uom 
                        ? `${item.uom.unit_name} (${item.uom.unit_code})`
                        : '-';
                      const storageTypeText = item.storage_type?.name || '-';

                      return (
                        <tr key={item.id} style={styles.tr}>
                          <td style={styles.tdBold}>{item.name}</td>
                          <td >{uomText}</td>
                          <td >
                            <span style={styles.storageTypeBadge}>
                              {storageTypeText}
                            </span>
                          </td>
                          <td >
                            <span style={{
                              ...styles.statusBadge,
                              backgroundColor: isActive ? '#E6F4EA' : '#F3F4F6',
                              color: isActive ? '#137333' : '#5F6368',
                            }}>
                              {item.status || 'Active'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={styles.actionCell}>
                              <button 
                                onClick={() => handleEditItemClick(item)} 
                                style={styles.actionBtn}
                                title="Edit Food Item"
                              >
                                <Pencil size={15} color="var(--color-primary)" />
                              </button>

                              <Toggle 
                                checked={isActive}
                                onChange={() => handleToggleItemStatus(item)}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* TAB 2: STORAGE TYPES */}
        {activeTab === 'storage-types' && (
          <Card padding="0">
            {storageTypesLoading ? (
              <div style={styles.loadingState}>Loading storage types...</div>
            ) : filteredStorageTypes.length === 0 ? (
              <div style={styles.emptyState}>
                {searchQuery ? 'No storage types found matching your search.' : 'No storage types available. Click "+ Add Storage Type" to create one.'}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th >Storage Type Name</th>
                      <th >Temp Check Required</th>
                      <th >Min Temp (°C)</th>
                      <th >Max Temp (°C)</th>
                      <th >Temperature Rule Text</th>
                      <th >Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStorageTypes.map((st) => {
                      const isActive = st.status === 'Active';
                      const isTempReq = Boolean(st.temperature_required);

                      return (
                        <tr key={st.id} style={styles.tr}>
                          <td style={styles.tdBold}>{st.name}</td>
                          <td >
                            <span style={{
                              ...styles.statusBadge,
                              backgroundColor: isTempReq ? '#FEF3C7' : '#F3F4F6',
                              color: isTempReq ? '#92400E' : '#6B7280',
                            }}>
                              {isTempReq ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td >{st.min_temp !== null && st.min_temp !== undefined ? `${st.min_temp}°C` : '-'}</td>
                          <td >{st.max_temp !== null && st.max_temp !== undefined ? `${st.max_temp}°C` : '-'}</td>
                          <td >{st.rule_text || '-'}</td>
                          <td >
                            <span style={{
                              ...styles.statusBadge,
                              backgroundColor: isActive ? '#E6F4EA' : '#F3F4F6',
                              color: isActive ? '#137333' : '#5F6368',
                            }}>
                              {st.status || 'Active'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={styles.actionCell}>
                              <button 
                                onClick={() => handleEditTypeClick(st)} 
                                style={styles.actionBtn}
                                title="Edit Storage Type"
                              >
                                <Pencil size={15} color="var(--color-primary)" />
                              </button>

                              <Toggle 
                                checked={isActive}
                                onChange={() => handleToggleTypeStatus(st)}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* ========================================================================= */}
        {/* ADD / EDIT FOOD ITEM MODAL */}
        {/* ========================================================================= */}
        <Modal
          isOpen={itemModalOpen}
          onClose={() => setItemModalOpen(false)}
          title={itemEditId ? "Edit Food Item" : "Add New Food Item"}
        >
          <form onSubmit={handleSaveFoodItem} style={styles.form}>
            {itemFormError && (
              <div style={styles.formErrorMsg}>
                <ShieldAlert size={16} />
                <span>{itemFormError}</span>
              </div>
            )}

            {/* Food Item Name */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Food Item Name *</label>
              <input
                type="text"
                placeholder="e.g. Chicken Breast, Beef, Salmon, Cooked Rice"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                style={styles.input}
                required
              />
            </div>

            {/* Default UOM Dropdown */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Default Unit of Measurement (UOM) *</label>
              <select
                value={itemForm.uom_id}
                onChange={(e) => setItemForm({ ...itemForm, uom_id: e.target.value })}
                style={styles.select}
                required
              >
                <option value="">Select Default UOM...</option>
                {uomList.map((uom) => (
                  <option key={uom.id} value={uom.id}>
                    {uom.unit_name} ({uom.unit_code})
                  </option>
                ))}
              </select>
            </div>

            {/* Storage Type Dropdown */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Storage Type *</label>
              <select
                value={itemForm.storage_type_id}
                onChange={(e) => setItemForm({ ...itemForm, storage_type_id: e.target.value })}
                style={styles.select}
                required
              >
                <option value="">Select Storage Type...</option>
                {storageTypeList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} {st.rule_text ? `(${st.rule_text})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Active Toggle */}
            <div style={styles.toggleRow}>
              <div>
                <div style={styles.toggleLabel}>Active Status</div>
                <div style={styles.toggleDesc}>Inactive food items are hidden from operational logs.</div>
              </div>
              <Toggle
                checked={itemForm.status === 'Active'}
                onChange={(val) => setItemForm({ ...itemForm, status: val ? 'Active' : 'Inactive' })}
              />
            </div>

            <div style={styles.modalActions}>
              <Button type="button" variant="secondary" onClick={() => setItemModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {itemEditId ? 'Update Food Item' : 'Save Food Item'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* ========================================================================= */}
        {/* ADD / EDIT STORAGE TYPE MODAL */}
        {/* ========================================================================= */}
        <Modal
          isOpen={typeModalOpen}
          onClose={() => setTypeModalOpen(false)}
          title={typeEditId ? "Edit Storage Type" : "Add New Storage Type"}
        >
          <form onSubmit={handleSaveStorageType} style={styles.form}>
            {typeFormError && (
              <div style={styles.formErrorMsg}>
                <ShieldAlert size={16} />
                <span>{typeFormError}</span>
              </div>
            )}

            {/* Storage Type Name */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Storage Type Name *</label>
              <input
                type="text"
                placeholder="e.g. Chilled food, Walk-in Freezer, Hot Holding"
                value={typeForm.name}
                onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                style={styles.input}
                required
              />
            </div>

            {/* Temperature Required Toggle */}
            <div style={styles.toggleRow}>
              <div>
                <div style={styles.toggleLabel}>Temperature Required?</div>
                <div style={styles.toggleDesc}>Requires temperature check in logs</div>
              </div>
              <Toggle
                checked={typeForm.temperature_required}
                onChange={(val) => setTypeForm({ ...typeForm, temperature_required: val })}
              />
            </div>

            {/* Min & Max Temp Inputs */}
            <div style={styles.rowTwoCol}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Min Temp (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 0"
                  value={typeForm.min_temp}
                  onChange={(e) => setTypeForm({ ...typeForm, min_temp: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Max Temp (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 5 or -18"
                  value={typeForm.max_temp}
                  onChange={(e) => setTypeForm({ ...typeForm, max_temp: e.target.value })}
                  style={styles.input}
                />
              </div>
            </div>

            {/* Temperature Rule Text */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Temperature Rule Text</label>
              <input
                type="text"
                placeholder="e.g. 0°C to 5°C, ≤ -18°C, or Room temperature"
                value={typeForm.rule_text}
                onChange={(e) => setTypeForm({ ...typeForm, rule_text: e.target.value })}
                style={styles.input}
              />
            </div>

            {/* Status Active Toggle */}
            <div style={styles.toggleRow}>
              <div>
                <div style={styles.toggleLabel}>Active Status</div>
                <div style={styles.toggleDesc}>Inactive storage types cannot be selected for new items.</div>
              </div>
              <Toggle
                checked={typeForm.status === 'Active'}
                onChange={(val) => setTypeForm({ ...typeForm, status: val ? 'Active' : 'Inactive' })}
              />
            </div>

            <div style={styles.modalActions}>
              <Button type="button" variant="secondary" onClick={() => setTypeModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {typeEditId ? 'Update Storage Type' : 'Save Storage Type'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* ========================================================================= */}
        {/* CONFIRMATION MODAL - FOOD ITEM TOGGLE STATUS */}
        {/* ========================================================================= */}
        <Modal
          isOpen={itemConfirmModalOpen}
          onClose={() => setItemConfirmModalOpen(false)}
          title="Change Food Item Status"
        >
          {itemConfirmRecord && (
            <div>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
                Are you sure you want to change the status of <strong>"{itemConfirmRecord.name}"</strong> to{' '}
                <strong style={{ color: itemConfirmRecord.status === 'Active' ? '#D97706' : 'var(--color-primary)' }}>
                  {itemConfirmRecord.status === 'Active' ? 'Inactive' : 'Active'}
                </strong>?
              </p>
              <div style={styles.modalActions}>
                <Button variant="secondary" onClick={() => setItemConfirmModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={confirmToggleItemStatus}
                  disabled={itemConfirmSaving}
                >
                  {itemConfirmSaving ? 'Saving...' : 'Confirm Change'}
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* ========================================================================= */}
        {/* CONFIRMATION MODAL - STORAGE TYPE TOGGLE STATUS */}
        {/* ========================================================================= */}
        <Modal
          isOpen={typeConfirmModalOpen}
          onClose={() => setTypeConfirmModalOpen(false)}
          title="Change Storage Type Status"
        >
          {typeConfirmRecord && (
            <div>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
                Are you sure you want to change the status of storage type <strong>"{typeConfirmRecord.name}"</strong> to{' '}
                <strong style={{ color: typeConfirmRecord.status === 'Active' ? '#D97706' : 'var(--color-primary)' }}>
                  {typeConfirmRecord.status === 'Active' ? 'Inactive' : 'Active'}
                </strong>?
              </p>
              <div style={styles.modalActions}>
                <Button variant="secondary" onClick={() => setTypeConfirmModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={confirmToggleTypeStatus}
                  disabled={typeConfirmSaving}
                >
                  {typeConfirmSaving ? 'Saving...' : 'Confirm Change'}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </PageLayout>
  );
};

const styles = {
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--color-primary)',
    cursor: 'pointer',
    marginBottom: '16px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  tabContainer: {
    display: 'flex',
    gap: '8px',
    borderBottom: '2px solid var(--color-border-light)',
    marginBottom: '20px',
  },
  tabButton: {
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    marginBottom: '-2px',
    cursor: 'pointer',
    transition: 'all 150ms ease',
  },
  activeTabButton: {
    color: 'var(--color-primary)',
    borderBottomColor: 'var(--color-primary)',
  },
  searchBarWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    backgroundColor: '#fff',
    border: '1px solid var(--color-border-light)',
    borderRadius: '8px',
    marginBottom: '20px',
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
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '14px',
  },
  th: {
    padding: '12px 16px',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    backgroundColor: '#F9FAFB',
    borderBottom: '1px solid var(--color-border-light)',
  },
  tr: {
    borderBottom: '1px solid var(--color-border-light)',
  },
  td: {
    padding: '14px 16px',
    color: 'var(--color-text-primary)',
    verticalAlign: 'middle',
  },
  tdBold: {
    padding: '14px 16px',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    verticalAlign: 'middle',
  },
  storageTypeBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '6px',
    backgroundColor: 'var(--color-primary-pale)',
    color: 'var(--color-primary)',
    fontSize: '12px',
    fontWeight: 600,
  },
  statusBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
  },
  actionCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: '20px',
    transition: 'background-color 200ms ease',
  },
  sliderKnob: {
    position: 'absolute',
    top: '2px',
    left: '2px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    transition: 'transform 200ms ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  },
  loadingState: {
    padding: '40px',
    textAlign: 'center',
    color: 'var(--color-text-secondary)',
  },
  emptyState: {
    padding: '40px',
    textAlign: 'center',
    color: 'var(--color-text-secondary)',
  },
  successToast: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    backgroundColor: '#E6F4EA',
    color: '#137333',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    fontWeight: 500,
  },
  errorToast: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    backgroundColor: '#FCE8E6',
    color: '#C5221F',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    fontWeight: 500,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  rowTwoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--color-border-light)',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
  },
  select: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--color-border-light)',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#fff',
    fontFamily: 'inherit',
  },
  toggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    border: '1px solid var(--color-border-light)',
  },
  toggleLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
  },
  toggleDesc: {
    fontSize: '11px',
    color: 'var(--color-text-secondary)',
    marginTop: '2px',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px',
  },
  formErrorMsg: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    backgroundColor: '#FCE8E6',
    color: '#C5221F',
    borderRadius: '6px',
    fontSize: '13px',
  },
};

export default FoodItemsPage;
