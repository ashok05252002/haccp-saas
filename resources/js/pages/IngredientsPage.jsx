import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
  ArrowLeft, Plus, Pencil, Check, ShieldAlert, Search, X
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

const IngredientsPage = () => {
  const [activeTab, setActiveTab] = useState('ingredients'); // 'ingredients' | 'categories'
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  // =========================================================================
  // 1. INGREDIENTS STATES & LOGIC
  // =========================================================================
  const [ingredients, setIngredients] = useState([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);
  const [ingModalOpen, setIngModalOpen] = useState(false);
  const [ingEditId, setIngEditId] = useState(null);
  const [ingForm, setIngForm] = useState({ 
    name: '', 
    uom_id: '', 
    ingredient_category_id: '', 
    cost_price: '', 
    cost_quantity: '1', 
    status: 'Active' 
  });
  const [ingFormError, setIngFormError] = useState('');
  const [uomListForIng, setUomListForIng] = useState([]);

  const [ingConfirmModalOpen, setIngConfirmModalOpen] = useState(false);
  const [ingConfirmRecord, setIngConfirmRecord] = useState(null);
  const [ingConfirmSaving, setIngConfirmSaving] = useState(false);

  // =========================================================================
  // 2. INGREDIENT CATEGORIES STATES & LOGIC
  // =========================================================================
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catEditId, setCatEditId] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', status: 'Active' });
  const [catFormError, setCatFormError] = useState('');

  const [catConfirmModalOpen, setCatConfirmModalOpen] = useState(false);
  const [catConfirmRecord, setCatConfirmRecord] = useState(null);
  const [catConfirmSaving, setCatConfirmSaving] = useState(false);

  // Fetch all master data
  const fetchData = async () => {
    setIngredientsLoading(true);
    setCategoriesLoading(true);
    try {
      const [ingRes, uomRes, catRes] = await Promise.all([
        axios.get('/api/ingredients'),
        axios.get('/api/uoms'),
        axios.get('/api/ingredient-categories'),
      ]);
      setIngredients(ingRes.data);
      setUomListForIng(uomRes.data.filter(u => u.status === 'Active'));
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch ingredients master data.');
    } finally {
      setIngredientsLoading(false);
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // -------------------------------------------------------------------------
  // INGREDIENT HANDLERS
  // -------------------------------------------------------------------------
  const handleSaveIngredient = async (e) => {
    e.preventDefault();
    setIngFormError('');
    if (!ingForm.name.trim()) {
      setIngFormError('Ingredient name is required.');
      return;
    }

    if (!ingForm.ingredient_category_id) {
      setIngFormError('Ingredient Category is required.');
      return;
    }

    if (!ingForm.uom_id) {
      setIngFormError('Please select Default UOM.');
      return;
    }

    try {
      const payload = {
        name: ingForm.name,
        uom_id: ingForm.uom_id,
        ingredient_category_id: ingForm.ingredient_category_id,
        cost_price: ingForm.cost_price !== '' ? parseFloat(ingForm.cost_price) : null,
        cost_quantity: ingForm.cost_price !== '' ? (parseFloat(ingForm.cost_quantity) || 1) : null,
        status: ingForm.status,
      };

      if (ingEditId) {
        await axios.put(`/api/ingredients/${ingEditId}`, payload);
        setSuccess('Ingredient updated successfully!');
      } else {
        await axios.post('/api/ingredients', payload);
        setSuccess('Ingredient added successfully!');
      }
      setIngForm({ name: '', uom_id: '', ingredient_category_id: '', cost_price: '', cost_quantity: '1', status: 'Active' });
      setIngModalOpen(false);
      setIngEditId(null);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errMsg = err.response?.data?.errors?.name?.[0] || 
                     err.response?.data?.errors?.ingredient_category_id?.[0] || 
                     err.response?.data?.errors?.uom_id?.[0] || 
                     err.response?.data?.errors?.cost_price?.[0] || 
                     err.response?.data?.errors?.cost_quantity?.[0] || 
                     'An error occurred.';
      setIngFormError(errMsg);
    }
  };

  const handleEditIngClick = (ing) => {
    setIngEditId(ing.id);
    setIngForm({
      name: ing.name,
      uom_id: ing.uom_id ? String(ing.uom_id) : '',
      ingredient_category_id: ing.ingredient_category_id ? String(ing.ingredient_category_id) : '',
      cost_price: ing.cost_price !== null && ing.cost_price !== undefined ? String(ing.cost_price) : '',
      cost_quantity: ing.cost_quantity !== null && ing.cost_quantity !== undefined ? String(ing.cost_quantity) : '1',
      status: ing.status,
    });
    setIngFormError('');
    setIngModalOpen(true);
  };

  const handleToggleIngStatus = (ing) => {
    setIngConfirmRecord(ing);
    setIngConfirmModalOpen(true);
  };

  const confirmToggleIngStatus = async () => {
    if (!ingConfirmRecord) return;
    setIngConfirmSaving(true);
    const nextStatus = ingConfirmRecord.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await axios.put(`/api/ingredients/${ingConfirmRecord.id}`, {
        name: ingConfirmRecord.name,
        uom_id: ingConfirmRecord.uom_id || null,
        ingredient_category_id: ingConfirmRecord.ingredient_category_id || null,
        cost_price: ingConfirmRecord.cost_price !== null ? ingConfirmRecord.cost_price : null,
        cost_quantity: ingConfirmRecord.cost_quantity !== null ? ingConfirmRecord.cost_quantity : null,
        status: nextStatus,
      });
      setIngConfirmModalOpen(false);
      setSuccess(`Ingredient "${ingConfirmRecord.name}" is now ${nextStatus}.`);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to toggle ingredient status.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIngConfirmSaving(false);
      setIngConfirmRecord(null);
    }
  };

  const openAddIngModal = () => {
    setIngEditId(null);
    setIngForm({ name: '', uom_id: '', ingredient_category_id: '', cost_price: '', cost_quantity: '1', status: 'Active' });
    setIngFormError('');
    setIngModalOpen(true);
  };

  // -------------------------------------------------------------------------
  // INGREDIENT CATEGORY HANDLERS
  // -------------------------------------------------------------------------
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setCatFormError('');
    if (!catForm.name.trim()) {
      setCatFormError('Category name is required.');
      return;
    }

    try {
      if (catEditId) {
        await axios.put(`/api/ingredient-categories/${catEditId}`, catForm);
        setSuccess('Category updated successfully!');
      } else {
        await axios.post('/api/ingredient-categories', catForm);
        setSuccess('Category created successfully!');
      }
      setCatForm({ name: '', status: 'Active' });
      setCatModalOpen(false);
      setCatEditId(null);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errMsg = err.response?.data?.errors?.name?.[0] || 
                     err.response?.data?.errors?.status?.[0] || 
                     'Failed to save category.';
      setCatFormError(errMsg);
    }
  };

  const handleEditCatClick = (cat) => {
    setCatEditId(cat.id);
    setCatForm({ name: cat.name, status: cat.status });
    setCatFormError('');
    setCatModalOpen(true);
  };

  const handleToggleCatStatus = (cat) => {
    setCatConfirmRecord(cat);
    setCatConfirmModalOpen(true);
  };

  const confirmToggleCatStatus = async () => {
    if (!catConfirmRecord) return;
    setCatConfirmSaving(true);
    const nextStatus = catConfirmRecord.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await axios.put(`/api/ingredient-categories/${catConfirmRecord.id}`, {
        name: catConfirmRecord.name,
        status: nextStatus,
      });
      setCatConfirmModalOpen(false);
      setSuccess(`Category "${catConfirmRecord.name}" is now ${nextStatus}.`);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.errors?.status?.[0] || 'Failed to toggle category status.';
      setError(errMsg);
      setCatConfirmModalOpen(false);
      setTimeout(() => setError(''), 4000);
    } finally {
      setCatConfirmSaving(false);
      setCatConfirmRecord(null);
    }
  };

  const openAddCatModal = () => {
    setCatEditId(null);
    setCatForm({ name: '', status: 'Active' });
    setCatFormError('');
    setCatModalOpen(true);
  };

  // Filtered lists
  const q = searchQuery.toLowerCase();
  const filteredIngredients = ingredients.filter(ing =>
    ing.name.toLowerCase().includes(q) ||
    (ing.category?.name || '').toLowerCase().includes(q) ||
    (ing.uom?.unit_name || '').toLowerCase().includes(q) ||
    (ing.uom?.unit_code || '').toLowerCase().includes(q)
  );

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(q)
  );

  return (
    <PageLayout>
      <Head title="Ingredients & Categories Master" />

      {/* Global Banners */}
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
            <h1 className="page-title">Ingredients Master</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginTop: '2px' }}>
              Manage ingredients list and category classifications.
            </p>
          </div>
          {activeTab === 'ingredients' ? (
            <Button variant="primary" icon={Plus} onClick={openAddIngModal}>
              Add Ingredient
            </Button>
          ) : (
            <Button variant="primary" icon={Plus} onClick={openAddCatModal}>
              Add Ingredient Category
            </Button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div style={styles.tabsHeader}>
          <button 
            onClick={() => switchTab('ingredients')} 
            style={{ 
              ...styles.tabBtn, 
              borderBottomColor: activeTab === 'ingredients' ? 'var(--color-primary)' : 'transparent', 
              color: activeTab === 'ingredients' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === 'ingredients' ? '700' : '500'
            }}
          >
            Ingredients List
          </button>
          <button 
            onClick={() => switchTab('categories')} 
            style={{ 
              ...styles.tabBtn, 
              borderBottomColor: activeTab === 'categories' ? 'var(--color-primary)' : 'transparent', 
              color: activeTab === 'categories' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === 'categories' ? '700' : '500'
            }}
          >
            Ingredient Categories
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ ...styles.searchBarWrapper, marginBottom: '20px' }}>
          <Search size={16} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder={
              activeTab === 'ingredients'
                ? 'Search ingredients by name, category, or UOM...'
                : 'Search categories by name...'
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

        {/* TAB 1: INGREDIENTS LIST */}
        {activeTab === 'ingredients' && (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {ingredientsLoading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                Loading ingredients...
              </div>
            ) : ingredients.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                No ingredients registered yet. Click "Add Ingredient" to create one.
              </div>
            ) : filteredIngredients.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                {searchQuery ? `No ingredients found matching "${searchQuery}".` : 'No ingredients registered yet.'}
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ingredient Name</th>
                    <th>Category</th>
                    <th>Default UOM</th>
                    <th>Package Price</th>
                    <th>Unit Cost</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIngredients.map((ing) => (
                    <tr key={ing.id}>
                      <td>
                        <strong style={{ color: 'var(--color-text-primary)' }}>{ing.name}</strong>
                      </td>
                      <td>
                        {ing.category ? (
                          <span style={styles.categoryBadge}>{ing.category.name}</span>
                        ) : (
                          <span style={{ fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic' }}>Unassigned</span>
                        )}
                      </td>
                      <td>
                        {ing.uom ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <code style={styles.codeBadge}>{ing.uom.unit_code}</code>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{ing.uom.unit_name}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#D97706', fontWeight: 500, fontStyle: 'italic' }}>⚠️ UOM missing</span>
                        )}
                      </td>
                      <td>
                        {ing.cost_price !== null && ing.cost_price !== undefined ? (
                          <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                            €{parseFloat(ing.cost_price).toFixed(2)} <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>for {parseFloat(ing.cost_quantity || 1)} {ing.uom?.unit_code || ''}</span>
                          </span>
                        ) : (
                          <span style={{ fontSize: '13px', color: '#9CA3AF' }}>—</span>
                        )}
                      </td>
                      <td>
                        {ing.unit_cost !== null && ing.unit_cost !== undefined ? (
                          <strong style={{ fontSize: '13px', color: 'var(--color-primary)' }}>
                            €{parseFloat(ing.unit_cost).toFixed(2)} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>/ {ing.uom?.unit_code || 'unit'}</span>
                          </strong>
                        ) : (
                          <span style={{ fontSize: '13px', color: '#9CA3AF' }}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Toggle
                            checked={ing.status === 'Active'}
                            onChange={() => handleToggleIngStatus(ing)}
                          />
                          <span style={{ fontSize: '13px', fontWeight: 600, color: ing.status === 'Active' ? 'var(--color-primary)' : '#6B7280' }}>
                            {ing.status}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleEditIngClick(ing)}
                            className="action-icon-btn"
                            title="Edit Ingredient"
                          >
                            <Pencil size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}

        {/* TAB 2: INGREDIENT CATEGORIES */}
        {activeTab === 'categories' && (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {categoriesLoading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                Loading categories...
              </div>
            ) : categories.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                No ingredient categories registered yet. Click "Add Ingredient Category" to create one.
              </div>
            ) : filteredCategories.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                {searchQuery ? `No categories found matching "${searchQuery}".` : 'No categories registered yet.'}
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th >Category Name</th>
                    <th >Assigned Active Ingredients</th>
                    <th >Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((cat) => (
                    <tr key={cat.id}>
                      <td >
                        <strong style={{ color: 'var(--color-text-primary)' }}>{cat.name}</strong>
                      </td>
                      <td >
                        <span style={styles.countBadge}>
                          {cat.ingredients_count ?? 0} Item(s)
                        </span>
                      </td>
                      <td >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Toggle
                            checked={cat.status === 'Active'}
                            onChange={() => handleToggleCatStatus(cat)}
                          />
                          <span style={{ fontSize: '13px', fontWeight: 600, color: cat.status === 'Active' ? 'var(--color-primary)' : '#6B7280' }}>
                            {cat.status}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleEditCatClick(cat)}
                            className="action-icon-btn"
                            title="Edit Category"
                          >
                            <Pencil size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}
      </div>

      {/* =====================================================================
          1. INGREDIENTS MODAL
          ===================================================================== */}
      <Modal
        isOpen={ingModalOpen}
        onClose={() => setIngModalOpen(false)}
        title={ingEditId ? 'Edit Ingredient' : 'Add Ingredient'}
        footer={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" onClick={() => setIngModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveIngredient}>
              Save Ingredient
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveIngredient} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {ingFormError && (
            <div className="alert-error">
              <ShieldAlert size={16} />
              <span>{ingFormError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Ingredient Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input
              type="text"
              className="form-input"
              value={ingForm.name}
              onChange={(e) => setIngForm({ ...ingForm, name: e.target.value })}
              placeholder="e.g. Fresh Milk, Tomatoes, Chicken Breast"
              style={{ width: '100%', boxSizing: 'border-box' }}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ingredient Category <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <select
              className="form-select"
              value={ingForm.ingredient_category_id}
              onChange={(e) => setIngForm({ ...ingForm, ingredient_category_id: e.target.value })}
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              <option value="">-- Select Category * --</option>
              {categories.filter(c => c.status === 'Active').map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
              Select category classification (e.g. Dairy, Meat, Produce, Spices).
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Default Unit of Measurement (UOM) <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <select
              className="form-select"
              value={ingForm.uom_id}
              onChange={(e) => setIngForm({ ...ingForm, uom_id: e.target.value })}
              style={{ width: '100%', boxSizing: 'border-box' }}
              required
            >
              <option value="">-- Select Default UOM * --</option>
              {uomListForIng.map(u => (
                <option key={u.id} value={u.id}>
                  {u.unit_code} — {u.unit_name}
                </option>
              ))}
            </select>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
              Select the standard measurement unit used to track this ingredient.
            </span>
          </div>

          {/* Pricing & Package Quantity Section */}
          <div style={{
            padding: '14px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Purchase Pricing & Package Quantity <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 400 }}>(Optional)</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '12px' }}>Purchase Price (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  value={ingForm.cost_price}
                  onChange={(e) => setIngForm({ ...ingForm, cost_price: e.target.value })}
                  placeholder="e.g. 15.00"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '12px' }}>Package Quantity</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  className="form-input"
                  value={ingForm.cost_quantity}
                  onChange={(e) => setIngForm({ ...ingForm, cost_quantity: e.target.value })}
                  placeholder="e.g. 5"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Live Rate Preview */}
            {ingForm.cost_price !== '' && !isNaN(parseFloat(ingForm.cost_price)) && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                backgroundColor: '#EFF6FF',
                borderRadius: '6px',
                border: '1px solid #BFDBFE',
                fontSize: '12px',
                color: '#1E40AF'
              }}>
                <span>Calculated Unit Rate:</span>
                <strong>
                  {(() => {
                    const p = parseFloat(ingForm.cost_price);
                    const q = parseFloat(ingForm.cost_quantity) || 1;
                    if (isNaN(p) || q <= 0) return '—';
                    const selectedUom = uomListForIng.find(u => String(u.id) === String(ingForm.uom_id));
                    const unitLabel = selectedUom ? selectedUom.unit_code : 'unit';
                    return `€${(p / q).toFixed(2)} / ${unitLabel}`;
                  })()}
                </strong>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={ingForm.status}
              onChange={(e) => setIngForm({ ...ingForm, status: e.target.value })}
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Ingredient status toggle confirm modal */}
      <Modal
        isOpen={ingConfirmModalOpen}
        onClose={() => setIngConfirmModalOpen(false)}
        title="Confirm Status Change"
        footer={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" onClick={() => setIngConfirmModalOpen(false)} disabled={ingConfirmSaving}>
              Cancel
            </Button>
            <Button variant={ingConfirmRecord?.status === 'Active' ? 'danger' : 'primary'} onClick={confirmToggleIngStatus} loading={ingConfirmSaving}>
              {ingConfirmRecord?.status === 'Active' ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '14px', color: 'var(--color-text-primary)', lineHeight: '1.5' }}>
            Are you sure you want to change the status of ingredient <strong>{ingConfirmRecord?.name}</strong> to{' '}
            <strong>{ingConfirmRecord?.status === 'Active' ? 'Inactive' : 'Active'}</strong>?
          </p>
          {ingConfirmRecord?.status === 'Active' && (
            <div className="alert-error" style={{ margin: 0 }}>
              <ShieldAlert size={16} />
              <span>Warning: Deactivating this ingredient may affect recipes or logs referencing it.</span>
            </div>
          )}
        </div>
      </Modal>

      {/* =====================================================================
          2. INGREDIENT CATEGORY MODAL
          ===================================================================== */}
      <Modal
        isOpen={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={catEditId ? 'Edit Ingredient Category' : 'Add Ingredient Category'}
        footer={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" onClick={() => setCatModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveCategory}>
              Save Category
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {catFormError && (
            <div className="alert-error">
              <ShieldAlert size={16} />
              <span>{catFormError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Category Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input
              type="text"
              className="form-input"
              value={catForm.name}
              onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              placeholder="e.g. Dairy, Meat, Produce, Spices, Dry Goods"
              style={{ width: '100%', boxSizing: 'border-box' }}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={catForm.status}
              onChange={(e) => setCatForm({ ...catForm, status: e.target.value })}
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Category status toggle confirm modal */}
      <Modal
        isOpen={catConfirmModalOpen}
        onClose={() => setCatConfirmModalOpen(false)}
        title="Confirm Status Change"
        footer={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" onClick={() => setCatConfirmModalOpen(false)} disabled={catConfirmSaving}>
              Cancel
            </Button>
            <Button variant={catConfirmRecord?.status === 'Active' ? 'danger' : 'primary'} onClick={confirmToggleCatStatus} loading={catConfirmSaving}>
              {catConfirmRecord?.status === 'Active' ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '14px', color: 'var(--color-text-primary)', lineHeight: '1.5' }}>
            Are you sure you want to change the status of category <strong>{catConfirmRecord?.name}</strong> to{' '}
            <strong>{catConfirmRecord?.status === 'Active' ? 'Inactive' : 'Active'}</strong>?
          </p>
          {catConfirmRecord?.status === 'Active' && (
            <div className="alert-error" style={{ margin: 0 }}>
              <ShieldAlert size={16} />
              <span>Warning: Deactivating this category will disallow selecting it for new ingredients.</span>
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
  categoryBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    backgroundColor: '#EFF6FF',
    border: '1px solid #BFDBFE',
    borderRadius: '12px',
    color: '#1D4ED8',
    fontSize: '12px',
    fontWeight: 600,
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
  countBadge: {
    display: 'inline-block',
    padding: '3px 8px',
    backgroundColor: '#F3F4F6',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    color: '#4B5563',
    fontSize: '12px',
    fontWeight: 600,
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

export default IngredientsPage;
