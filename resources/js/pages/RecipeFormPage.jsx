import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
  ChefHat, ArrowLeft, PlusCircle, Plus, Trash, Save, AlertCircle 
} from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import axios from 'axios';

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Prep', 'Dessert'];
const UNITS = ['grams', 'kg', 'ml', 'liters', 'pcs', 'slices', 'tbsp', 'tsp'];

const RecipeFormPage = ({ recipeId }) => {
  const isEdit = !!recipeId;

  const [masterIngredients, setMasterIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Modal State for Quick Adding Master Ingredient
  const [modalOpen, setModalOpen] = useState(false);
  const [targetRowIdx, setTargetRowIdx] = useState(null);
  const [categories, setCategories] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const [newIngForm, setNewIngForm] = useState({
    name: '',
    ingredient_category_id: '',
    uom_id: '',
    status: 'Active'
  });

  const [form, setForm] = useState({
    name: '',
    category: 'Lunch',
    prep_time: '20m',
    servings: 1,
    description: '',
    haccp_notes: '',
    allergens: [],
    ingredients: [
      { ingredient_id: '', ingredient_name: '', quantity: '100', unit: 'grams' }
    ]
  });

  const availableUnits = useMemo(() => {
    const list = [...UNITS];
    uoms.forEach(u => {
      if (u.unit_code && !list.includes(u.unit_code)) {
        list.push(u.unit_code);
      }
    });
    return list;
  }, [uoms]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ingRes, uomRes, catRes] = await Promise.all([
          axios.get('/api/ingredients'),
          axios.get('/api/uoms'),
          axios.get('/api/ingredient-categories')
        ]);
        const ingList = ingRes.data || [];
        const uomList = (uomRes.data || []).filter(u => u.status === 'Active');
        const catList = catRes.data || [];

        setMasterIngredients(ingList);
        setUoms(uomList);
        setCategories(catList);

        if (isEdit) {
          const recipeRes = await axios.get(`/api/recipes/${recipeId}`);
          const rec = recipeRes.data;
          setForm({
            name: rec.name || '',
            category: rec.category || 'Lunch',
            prep_time: rec.prep_time || '20m',
            servings: rec.servings || 1,
            description: rec.description || '',
            haccp_notes: rec.haccp_notes || '',
            allergens: Array.isArray(rec.allergens) ? rec.allergens : [],
            ingredients: (rec.ingredients && rec.ingredients.length > 0)
              ? rec.ingredients.map(i => ({
                  ingredient_id: i.ingredient_id ? String(i.ingredient_id) : '',
                  ingredient_name: i.ingredient_name || '',
                  quantity: i.quantity || '',
                  unit: i.unit || 'grams'
                }))
              : [{ ingredient_id: '', ingredient_name: '', quantity: '', unit: 'grams' }]
          });
        }
      } catch (err) {
        console.error('Failed to load recipe data', err);
        setFormError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [recipeId, isEdit]);

  const handleOpenAddModal = async (rowIdx = null) => {
    setTargetRowIdx(rowIdx);
    setNewIngForm({ name: '', ingredient_category_id: '', uom_id: '', status: 'Active' });
    setModalError('');
    setModalOpen(true);

    if (categories.length === 0 || uoms.length === 0) {
      setModalLoading(true);
      try {
        const [catRes, uomRes] = await Promise.all([
          axios.get('/api/ingredient-categories'),
          axios.get('/api/uoms')
        ]);
        const catList = catRes.data || [];
        const uomList = (uomRes.data || []).filter(u => u.status === 'Active');
        setCategories(catList);
        setUoms(uomList);

        if (catList.length > 0) {
          setNewIngForm(prev => ({ ...prev, ingredient_category_id: catList[0].id }));
        }
      } catch (err) {
        console.error('Failed to load categories/UOMs for ingredient modal', err);
        setModalError('Failed to load ingredient categories & units.');
      } finally {
        setModalLoading(false);
      }
    } else {
      if (categories.length > 0) {
        setNewIngForm(prev => ({ ...prev, ingredient_category_id: categories[0].id }));
      }
    }
  };

  const handleSaveNewIngredient = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!newIngForm.name.trim()) {
      setModalError('Ingredient Name is required.');
      return;
    }
    if (!newIngForm.ingredient_category_id) {
      setModalError('Ingredient Category is required.');
      return;
    }

    setModalSaving(true);
    try {
      const res = await axios.post('/api/ingredients', newIngForm);
      const createdIng = res.data;

      // Update masterIngredients state
      setMasterIngredients(prev => [...prev, createdIng]);

      // If opened for a specific row index, auto-select in that row
      if (targetRowIdx !== null && targetRowIdx >= 0) {
        handleIngredientChange(targetRowIdx, 'ingredient_id', String(createdIng.id));
      } else {
        // Append a new ingredient line pre-selected with this new ingredient
        setForm(prev => ({
          ...prev,
          ingredients: [
            ...prev.ingredients,
            { ingredient_id: String(createdIng.id), ingredient_name: createdIng.name, quantity: '100', unit: 'grams' }
          ]
        }));
      }

      setModalOpen(false);
    } catch (err) {
      console.error('Failed to create new ingredient', err);
      if (err.response && err.response.data && err.response.data.errors && err.response.data.errors.name) {
        setModalError(err.response.data.errors.name[0]);
      } else {
        setModalError(err.response?.data?.message || 'Failed to create new ingredient.');
      }
    } finally {
      setModalSaving(false);
    }
  };

  const handleAddIngredientRow = () => {
    setForm(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { ingredient_id: '', ingredient_name: '', quantity: '', unit: 'grams' }]
    }));
  };

  const handleRemoveIngredientRow = (idx) => {
    setForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== idx)
    }));
  };

  const handleIngredientChange = (idx, field, value) => {
    setForm(prev => {
      const updated = [...prev.ingredients];
      if (field === 'ingredient_id') {
        const selectedMaster = masterIngredients.find(m => String(m.id) === String(value));
        const matchedUom = selectedMaster?.uom?.unit_code || selectedMaster?.uom?.unit_name;
        updated[idx] = {
          ...updated[idx],
          ingredient_id: value,
          ingredient_name: selectedMaster ? selectedMaster.name : updated[idx].ingredient_name,
          unit: matchedUom || updated[idx].unit
        };
      } else {
        updated[idx] = { ...updated[idx], [field]: value };
      }
      return { ...prev, ingredients: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // 1. Basic Name Validation
    if (!form.name.trim()) {
      setFormError('Recipe Dish Name is required.');
      return;
    }

    // 2. Ingredients empty check
    if (form.ingredients.length === 0) {
      setFormError('At least one ingredient is required.');
      return;
    }

    // 3. Ensure all lines have valid ingredient name and quantity
    for (let i = 0; i < form.ingredients.length; i++) {
      const line = form.ingredients[i];
      if (!line.ingredient_name.trim()) {
        setFormError(`Ingredient line #${i + 1} requires an ingredient selection or name.`);
        return;
      }
      if (!line.quantity || parseFloat(line.quantity) <= 0) {
        setFormError(`Ingredient line #${i + 1} (${line.ingredient_name}) requires a valid positive quantity.`);
        return;
      }
    }

    // 4. Duplicate Ingredient Check (Uniqueness Validation)
    const selectedIds = form.ingredients
      .map(i => String(i.ingredient_id || ''))
      .filter(id => id !== '');
    const selectedNames = form.ingredients
      .map(i => i.ingredient_name.trim().toLowerCase())
      .filter(name => name !== '');

    const hasDuplicateId = new Set(selectedIds).size !== selectedIds.length;
    const hasDuplicateName = new Set(selectedNames).size !== selectedNames.length;

    if (hasDuplicateId || hasDuplicateName) {
      setFormError('Each ingredient can only be added once to a recipe. Duplicate ingredients are not allowed.');
      return;
    }

    const parsedServings = parseInt(form.servings, 10);
    const validServings = (isNaN(parsedServings) || parsedServings < 1) ? 1 : parsedServings;
    const payload = {
      ...form,
      servings: validServings
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await axios.put(`/api/recipes/${recipeId}`, payload);
      } else {
        await axios.post('/api/recipes', payload);
      }
      router.visit('/recipes');
    } catch (err) {
      console.error('Failed to save recipe', err);
      setFormError(err.response?.data?.message || 'Failed to save recipe.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <Head title={isEdit ? 'Edit Recipe' : 'Create New Recipe'} />

      <div>
        {/* Header Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <button
              onClick={() => router.visit('/recipes')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: 0,
                marginBottom: '8px'
              }}
            >
              <ArrowLeft size={18} />
              Back to Recipes
            </button>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <ChefHat size={28} color="var(--color-primary)" />
              <span>{isEdit ? 'Edit Recipe' : 'Create New Recipe'}</span>
            </h1>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px', margin: 0 }}>
              {isEdit ? 'Update commercial kitchen recipe details and ingredient portions.' : 'Add a new commercial kitchen recipe and configure ingredient breakdown.'}
            </p>
          </div>
        </div>

        {loading ? (
          <Card>
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              Loading recipe form...
            </div>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {formError && (
              <div style={{
                padding: '14px 18px',
                backgroundColor: '#FEE2E2',
                color: '#B91C1C',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                border: '1px solid #FCA5A5'
              }}>
                <AlertCircle size={20} color="#B91C1C" />
                <span>{formError}</span>
              </div>
            )}

            {/* Section 1: Dish General Details */}
            <Card>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '10px' }}>
                1. Dish General Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Dish Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Grilled Salmon with Herbs"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Category *</label>
                  <select
                    className="form-input"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Prep Time (e.g. 20m)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 20m"
                    value={form.prep_time}
                    onChange={e => setForm({ ...form, prep_time: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Servings</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={form.servings}
                    onChange={e => setForm({ ...form, servings: e.target.value })}
                    onBlur={() => {
                      const parsed = parseInt(form.servings, 10);
                      if (isNaN(parsed) || parsed < 1) {
                        setForm(prev => ({ ...prev, servings: 1 }));
                      } else {
                        setForm(prev => ({ ...prev, servings: parsed }));
                      }
                    }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Brief description of the dish, preparation notes, or serving style..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </Card>

            {/* Section 2: Recipe Ingredients Dynamic Builder */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                    2. Recipe Ingredients (per serving)
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
                    Select unique ingredients and specify quantity required per dish serving.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={Plus}
                    onClick={() => handleOpenAddModal(null)}
                  >
                    Add Master Ingredient
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={PlusCircle}
                    onClick={handleAddIngredientRow}
                  >
                    Add Ingredient Line
                  </Button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {form.ingredients.map((ing, idx) => {
                  // Currently selected ingredient IDs in other rows
                  const otherSelectedIds = form.ingredients
                    .filter((_, i) => i !== idx)
                    .map(i => String(i.ingredient_id || ''))
                    .filter(id => id !== '');

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 40px',
                        gap: '12px',
                        alignItems: 'flex-end',
                        backgroundColor: '#F9FAFB',
                        padding: '14px 16px',
                        borderRadius: '10px',
                        border: '1px solid var(--color-border-light)'
                      }}
                    >
                      {/* Master Ingredient Select Column */}
                      <div>
                        <div style={{ marginBottom: '6px' }}>
                          <label className="form-label" style={{ fontSize: '12px', margin: 0, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            Master Ingredient *
                          </label>
                        </div>

                        {masterIngredients.length > 0 ? (
                          <select
                            className="form-input"
                            value={ing.ingredient_id}
                            onChange={e => handleIngredientChange(idx, 'ingredient_id', e.target.value)}
                          >
                            <option value="">-- Select from Master Ingredients --</option>
                            {masterIngredients.map(m => {
                              const isSelectedElsewhere = otherSelectedIds.includes(String(m.id));
                              return (
                                <option
                                  key={m.id}
                                  value={m.id}
                                  disabled={isSelectedElsewhere}
                                >
                                  {m.name} {isSelectedElsewhere ? '(Already Added)' : ''}
                                </option>
                              );
                            })}
                          </select>
                        ) : (
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Ingredient Name"
                            value={ing.ingredient_name}
                            onChange={e => handleIngredientChange(idx, 'ingredient_name', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Quantity Input Column */}
                      <div>
                        <div style={{ marginBottom: '6px' }}>
                          <label className="form-label" style={{ fontSize: '12px', margin: 0, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            Quantity *
                          </label>
                        </div>
                        <input
                          type="number"
                          step="any"
                          className="form-input"
                          placeholder="Quantity (e.g. 150)"
                          value={ing.quantity}
                          onChange={e => handleIngredientChange(idx, 'quantity', e.target.value)}
                        />
                      </div>

                      {/* Unit (UOM) Select Column */}
                      <div>
                        <div style={{ marginBottom: '6px' }}>
                          <label className="form-label" style={{ fontSize: '12px', margin: 0, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            Unit (UOM) *
                          </label>
                        </div>
                        <select
                          className="form-input"
                          value={ing.unit}
                          onChange={e => handleIngredientChange(idx, 'unit', e.target.value)}
                        >
                          {availableUnits.map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>

                      {/* Delete Action Column */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '38px' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredientRow(idx)}
                          disabled={form.ingredients.length <= 1}
                          title={form.ingredients.length <= 1 ? "Minimum 1 ingredient required" : "Remove ingredient"}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#EF4444',
                            cursor: form.ingredients.length > 1 ? 'pointer' : 'not-allowed',
                            opacity: form.ingredients.length > 1 ? 1 : 0.4,
                            padding: '4px'
                          }}
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Bottom Action Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.visit('/recipes')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={Save}
                disabled={submitting}
              >
                {submitting ? 'Saving Recipe...' : isEdit ? 'Update Recipe' : 'Save Recipe'}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Quick Add Master Ingredient Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Master Ingredient"
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={modalSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSaveNewIngredient}
              disabled={modalSaving || modalLoading}
            >
              {modalSaving ? 'Saving Ingredient...' : 'Save Ingredient'}
            </Button>
          </div>
        }
      >
        {modalLoading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Loading categories & units...
          </div>
        ) : (
          <form onSubmit={handleSaveNewIngredient} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {modalError && (
              <div style={{
                padding: '10px 14px',
                backgroundColor: '#FEE2E2',
                color: '#B91C1C',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600
              }}>
                {modalError}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Ingredient Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Fresh Basil Leaves"
                value={newIngForm.name}
                onChange={e => setNewIngForm({ ...newIngForm, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Ingredient Category *</label>
              <select
                className="form-input"
                value={newIngForm.ingredient_category_id}
                onChange={e => setNewIngForm({ ...newIngForm, ingredient_category_id: e.target.value })}
                required
              >
                <option value="">-- Select Category --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Default Unit of Measure (UOM)</label>
              <select
                className="form-input"
                value={newIngForm.uom_id}
                onChange={e => setNewIngForm({ ...newIngForm, uom_id: e.target.value })}
              >
                <option value="">-- Select UOM (Optional) --</option>
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
    </PageLayout>
  );
};

export default RecipeFormPage;
