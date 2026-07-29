import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
  ArrowLeft, ShieldAlert, Truck, Layers, ChefHat, Save, Search, X, CheckSquare, Square
} from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import axios from 'axios';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SupplierFormPage = ({ supplierId }) => {
  const isEdit = !!supplierId;

  const [form, setForm] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    order_day: '',
    address: '',
    status: 'Active',
  });

  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [selectedIngredientIds, setSelectedIngredientIds] = useState([]);
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState('');

  // Master data
  const [allCategories, setAllCategories] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const fetchMasterData = async () => {
      setLoading(true);
      try {
        const [catRes, ingRes] = await Promise.all([
          axios.get('/api/ingredient-categories'),
          axios.get('/api/ingredients'),
        ]);
        setAllCategories(catRes.data.filter(c => c.status === 'Active'));
        setAllIngredients(ingRes.data.filter(i => i.status === 'Active'));

        if (isEdit) {
          const supRes = await axios.get(`/api/suppliers/${supplierId}`);
          const sup = supRes.data;
          setForm({
            name: sup.name || '',
            contact_person: sup.contact_person || '',
            phone: sup.phone || '',
            email: sup.email || '',
            order_day: sup.order_day || '',
            address: sup.address || '',
            status: sup.status || 'Active',
          });
          setSelectedCategoryIds((sup.categories || []).map(c => c.id));
          setSelectedIngredientIds((sup.ingredients || []).map(i => i.id));
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load supplier form data.');
      } finally {
        setLoading(false);
      }
    };

    fetchMasterData();
  }, [supplierId, isEdit]);

  const toggleCategorySelect = (catId) => {
    setSelectedCategoryIds(prev => {
      if (prev.includes(catId)) {
        return prev.filter(id => id !== catId);
      } else {
        return [...prev, catId];
      }
    });
  };

  const toggleIngredientSelect = (ingId) => {
    setSelectedIngredientIds(prev => {
      if (prev.includes(ingId)) {
        return prev.filter(id => id !== ingId);
      } else {
        return [...prev, ingId];
      }
    });
  };

  // Ingredients filtered by selected categories AND search query
  const categoryFilteredIngredients = selectedCategoryIds.length > 0
    ? allIngredients.filter(ing => ing.ingredient_category_id && selectedCategoryIds.includes(ing.ingredient_category_id))
    : allIngredients;

  const searchedIngredients = categoryFilteredIngredients.filter(ing =>
    ing.name.toLowerCase().includes(ingredientSearchQuery.toLowerCase()) ||
    (ing.category?.name || '').toLowerCase().includes(ingredientSearchQuery.toLowerCase())
  );

  const handleSelectAllShown = () => {
    const shownIds = searchedIngredients.map(i => i.id);
    setSelectedIngredientIds(prev => Array.from(new Set([...prev, ...shownIds])));
  };

  const handleDeselectAllShown = () => {
    const shownIds = new Set(searchedIngredients.map(i => i.id));
    setSelectedIngredientIds(prev => prev.filter(id => !shownIds.has(id)));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setError('');

    if (!form.name.trim()) {
      setFormErrors({ name: 'Supplier name is required.' });
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      category_ids: selectedCategoryIds,
      ingredient_ids: selectedIngredientIds,
    };

    try {
      if (isEdit) {
        await axios.put(`/api/suppliers/${supplierId}`, payload);
      } else {
        await axios.post('/api/suppliers', payload);
      }
      router.visit('/manager-hub/suppliers');
    } catch (err) {
      console.error(err);
      if (err.response?.status === 422) {
        const backendErrors = err.response.data.errors;
        const mapped = {};
        Object.keys(backendErrors).forEach(key => {
          mapped[key] = backendErrors[key][0];
        });
        setFormErrors(mapped);
      } else {
        setError('Failed to save supplier. Please check fields and try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout>
      <Head title={isEdit ? 'Edit Supplier' : 'Add Supplier'} />

      <div>
        <button onClick={() => router.visit('/manager-hub/suppliers')} style={styles.backBtn}>
          <ArrowLeft size={16} />
          <span>Back to Suppliers List</span>
        </button>

        <div style={styles.panelHeaderRow}>
          <div>
            <h1 className="page-title">{isEdit ? 'Edit Supplier' : 'Add New Supplier'}</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginTop: '2px' }}>
              Configure supplier contact details, order schedules, supplied categories, and ingredients.
            </p>
          </div>
        </div>

        {error && (
          <div style={styles.alertError}>
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <Card style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Loading supplier details...
          </Card>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* SECTION 1: GENERAL INFORMATION */}
            <Card style={{ padding: '28px' }}>
              <div style={styles.sectionHeader}>
                <Truck size={20} color="var(--color-primary)" />
                <h2 style={styles.sectionTitle}>General Supplier Information</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Supplier Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Local Farms Co., Ocean Catch Seafood"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    autoFocus
                  />
                  {formErrors.name && <span style={styles.fieldError}>{formErrors.name}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Person</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.contact_person}
                    onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                    placeholder="e.g. John Smith"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g. 555-0101"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. orders@supplier.com"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Regular Order Day</label>
                  <select
                    className="form-select"
                    value={form.order_day}
                    onChange={(e) => setForm({ ...form, order_day: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    <option value="">-- Any / Flexible Day --</option>
                    {DAYS.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    <option value="Active">Active (Approved Supplier)</option>
                    <option value="Inactive">Inactive (Suspended)</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '20px' }}>
                <label className="form-label">Address / Location Details</label>
                <textarea
                  className="form-input"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Enter vendor street address, dock, or delivery notes..."
                  style={{ width: '100%', boxSizing: 'border-box', minHeight: '70px', fontFamily: 'inherit' }}
                />
              </div>
            </Card>

            {/* SECTION 2: MULTI-SELECT CATEGORIES */}
            <Card style={{ padding: '28px' }}>
              <div style={styles.sectionHeader}>
                <Layers size={20} color="var(--color-primary)" />
                <h2 style={styles.sectionTitle}>Supplied Ingredient Categories (Multi-select)</h2>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                Select all categories of ingredients provided by this supplier. Multiple categories can be selected.
              </p>

              {allCategories.length === 0 ? (
                <div style={{ padding: '20px', color: '#9CA3AF', fontStyle: 'italic' }}>
                  No active ingredient categories available. Please create categories under Ingredients Master first.
                </div>
              ) : (
                <div style={styles.chipsGrid}>
                  {allCategories.map(cat => {
                    const isSelected = selectedCategoryIds.includes(cat.id);
                    return (
                      <div
                        key={cat.id}
                        onClick={() => toggleCategorySelect(cat.id)}
                        style={{
                          ...styles.chipItem,
                          backgroundColor: isSelected ? 'var(--color-primary-pale)' : '#F9FAFB',
                          borderColor: isSelected ? 'var(--color-primary)' : '#E5E7EB',
                          color: isSelected ? 'var(--color-primary)' : '#374151',
                          fontWeight: isSelected ? 700 : 500,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          style={{ cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                        />
                        <span>{cat.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* SECTION 3: CATEGORY & SEARCH-FILTERED INGREDIENTS ASSIGNMENT */}
            <Card style={{ padding: '28px' }}>
              <div style={styles.sectionHeaderRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ChefHat size={20} color="var(--color-primary)" />
                  <h2 style={styles.sectionTitle}>Supplied Ingredients Selection</h2>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleSelectAllShown}
                    style={styles.quickActionBtn}
                  >
                    <CheckSquare size={13} /> Select All Shown ({searchedIngredients.length})
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAllShown}
                    style={styles.quickActionBtn}
                  >
                    <Square size={13} /> Deselect All Shown
                  </button>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                {selectedCategoryIds.length > 0
                  ? 'Check all specific ingredients provided by this supplier (filtered by selected categories above):'
                  : 'Check all specific ingredients provided by this supplier:'}
              </p>

              {/* Ingredient Search Filter Bar */}
              <div style={styles.ingredientSearchBar}>
                <Search size={16} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search ingredients by name or category..."
                  value={ingredientSearchQuery}
                  onChange={(e) => setIngredientSearchQuery(e.target.value)}
                  style={styles.ingredientSearchInput}
                />
                {ingredientSearchQuery && (
                  <button 
                    type="button" 
                    onClick={() => setIngredientSearchQuery('')} 
                    style={styles.searchClearBtn}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {searchedIngredients.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF', fontStyle: 'italic' }}>
                  {ingredientSearchQuery 
                    ? `No ingredients match "${ingredientSearchQuery}".`
                    : 'No ingredients match the selected categories.'}
                </div>
              ) : (
                <div style={styles.ingredientsGrid}>
                  {searchedIngredients.map(ing => {
                    const isSelected = selectedIngredientIds.includes(ing.id);
                    return (
                      <label
                        key={ing.id}
                        style={{
                          ...styles.ingCheckCard,
                          backgroundColor: isSelected ? 'var(--color-primary-pale)' : '#fff',
                          borderColor: isSelected ? 'var(--color-primary)' : '#E5E7EB',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleIngredientSelect(ing.id)}
                          style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {ing.name}
                          </span>
                          {ing.category && (
                            <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 500 }}>
                              {ing.category.name}
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button
                variant="secondary"
                type="button"
                onClick={() => router.visit('/manager-hub/suppliers')}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                icon={Save}
                loading={saving}
              >
                {isEdit ? 'Update Supplier' : 'Save Supplier'}
              </Button>
            </div>
          </form>
        )}
      </div>
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
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    paddingBottom: '14px',
    borderBottom: '1px solid var(--color-border-light)',
    marginBottom: '20px',
  },
  sectionHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '14px',
    borderBottom: '1px solid var(--color-border-light)',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
    margin: 0,
  },
  fieldError: {
    color: 'var(--color-danger)',
    fontSize: '12px',
    marginTop: '4px',
    display: 'block',
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
  chipsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '12px',
  },
  chipItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1.5px solid',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    userSelect: 'none',
  },
  ingredientSearchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    backgroundColor: '#FAFAFA',
    border: '1px solid var(--color-border-light)',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  ingredientSearchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '13px',
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
  quickActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--color-primary)',
    backgroundColor: 'var(--color-primary-pale)',
    border: '1px solid #B8DBCA',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 150ms ease',
  },
  ingredientsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '12px',
    maxHeight: '400px',
    overflowY: 'auto',
    paddingRight: '4px',
  },
  ingCheckCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1.5px solid',
    cursor: 'pointer',
    transition: 'all 150ms ease',
  },
};

export default SupplierFormPage;
