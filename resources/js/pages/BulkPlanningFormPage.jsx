import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
  CalendarDays, ArrowLeft, PlusCircle, Trash, Save, Truck, Package, AlertCircle 
} from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import axios from 'axios';
import { getPlanById, savePlan } from '../services/planningService';

const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

const BulkPlanningFormPage = ({ planId }) => {
  const isEdit = !!planId;

  const [masterRecipes, setMasterRecipes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // In-line supplier selection overrides: { [mapKey]: supplierId }
  const [supplierOverrides, setSupplierOverrides] = useState({});

  const [form, setForm] = useState({
    name: '',
    planned_date: getTodayDateString(),
    recipes: [
      { recipe_id: '', recipe_name: '', base_servings: 1, target_servings: 10, extra_buffer: false }
    ]
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [recRes, supRes] = await Promise.all([
          axios.get('/api/recipes'),
          axios.get('/api/suppliers')
        ]);

        const recList = recRes.data || [];
        const supList = (supRes.data || []).filter(s => s.status === 'Active');

        setMasterRecipes(recList);
        setSuppliers(supList);

        if (isEdit) {
          const plan = await getPlanById(planId);
          if (plan) {
            setForm({
              id: plan.id,
              name: plan.name || '',
              planned_date: plan.planned_date || plan.weekLabel || getTodayDateString(),
              recipes: (plan.recipes && plan.recipes.length > 0)
                ? plan.recipes.map(r => ({
                    recipe_id: r.recipe_id ? String(r.recipe_id) : '',
                    recipe_name: r.recipe_name || '',
                    base_servings: r.base_servings || 1,
                    target_servings: r.target_servings || 10,
                    extra_buffer: !!r.extra_buffer
                  }))
                : [{ recipe_id: '', recipe_name: '', base_servings: 1, target_servings: 10, extra_buffer: false }]
            });
            if (plan.supplier_overrides) {
              setSupplierOverrides(plan.supplier_overrides);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load data for bulk planning form', err);
        setFormError('Failed to load recipe & supplier library.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [planId, isEdit]);

  const handleAddDishRow = () => {
    setForm(prev => ({
      ...prev,
      recipes: [
        ...prev.recipes,
        { recipe_id: '', recipe_name: '', base_servings: 1, target_servings: 10, extra_buffer: false }
      ]
    }));
  };

  const handleRemoveDishRow = (idx) => {
    setForm(prev => ({
      ...prev,
      recipes: prev.recipes.filter((_, i) => i !== idx)
    }));
  };

  const handleDishChange = (idx, field, value) => {
    setForm(prev => {
      const updated = [...prev.recipes];
      if (field === 'recipe_id') {
        const selectedMaster = masterRecipes.find(m => String(m.id) === String(value));
        updated[idx] = {
          ...updated[idx],
          recipe_id: value,
          recipe_name: selectedMaster ? selectedMaster.name : updated[idx].recipe_name,
          base_servings: selectedMaster ? (selectedMaster.servings || 1) : 1,
          target_servings: selectedMaster ? (selectedMaster.servings || 1) * 10 : updated[idx].target_servings
        };
      } else {
        updated[idx] = { ...updated[idx], [field]: value };
      }
      return { ...prev, recipes: updated };
    });
  };

  // 1. Aggregated Raw Ingredients Calculation
  const aggregatedOrderList = useMemo(() => {
    const map = {};

    form.recipes.forEach(item => {
      if (!item.recipe_id) return;
      const rec = masterRecipes.find(m => String(m.id) === String(item.recipe_id));
      if (!rec || !rec.ingredients) return;

      const baseServ = rec.servings || 1;
      const targetServ = parseFloat(item.target_servings) || 1;
      const bufferMultiplier = item.extra_buffer ? 1.20 : 1.0;
      const multiplier = (targetServ / baseServ) * bufferMultiplier;

      rec.ingredients.forEach(ing => {
        const ingId = ing.ingredient_id ? String(ing.ingredient_id) : '';
        const nameKey = (ing.ingredient_name || '').trim().toLowerCase();
        const unitKey = (ing.unit || '').trim();
        const mapKey = ingId ? `id_${ingId}` : `name_${nameKey}__${unitKey}`;

        const baseQty = parseFloat(ing.quantity) || 0;
        const totalLineQty = baseQty * multiplier;

        if (map[mapKey]) {
          map[mapKey].quantity += totalLineQty;
          map[mapKey].dishes.push(rec.name);
        } else {
          map[mapKey] = {
            mapKey,
            ingredient_id: ingId,
            name: ing.ingredient_name,
            quantity: totalLineQty,
            unit: ing.unit,
            dishes: [rec.name]
          };
        }
      });
    });

    return Object.values(map).map(item => {
      const qty = item.quantity;
      const formattedQty = Number.isInteger(qty) ? qty : Math.round(qty * 100) / 100;
      return {
        ...item,
        quantity: formattedQty,
        dishesText: Array.from(new Set(item.dishes)).join(', ')
      };
    });
  }, [form.recipes, masterRecipes]);

  // 2. Group Aggregated Ingredients BY SUPPLIER (Which Supplier -> Which Product -> How Much)
  const supplierPurchaseGroups = useMemo(() => {
    if (aggregatedOrderList.length === 0) return [];

    // Map each ingredient key to all matching suppliers from supplier.ingredients
    const ingredientSupplierMap = {};

    aggregatedOrderList.forEach(ing => {
      const matchingSups = suppliers.filter(sup => {
        if (!sup.ingredients || sup.ingredients.length === 0) return false;
        return sup.ingredients.some(m => {
          if (ing.ingredient_id && String(m.id) === String(ing.ingredient_id)) return true;
          return m.name.trim().toLowerCase() === ing.name.trim().toLowerCase();
        });
      });

      ingredientSupplierMap[ing.mapKey] = matchingSups;
    });

    // Group items under assigned suppliers
    const grouped = {};

    aggregatedOrderList.forEach(ing => {
      const eligibleSuppliers = ingredientSupplierMap[ing.mapKey] || [];
      const overrideId = supplierOverrides[ing.mapKey];

      let selectedSup = null;

      if (overrideId) {
        if (overrideId === 'unassigned') {
          selectedSup = null;
        } else {
          selectedSup = suppliers.find(s => String(s.id) === String(overrideId));
        }
      } else if (eligibleSuppliers.length > 0) {
        // Default to Primary/First matched supplier
        selectedSup = eligibleSuppliers[0];
      }

      const groupKey = selectedSup ? `sup_${selectedSup.id}` : 'unassigned';
      const groupName = selectedSup ? selectedSup.name : 'Unassigned / General Supplier';

      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          supplierId: selectedSup ? selectedSup.id : null,
          supplierName: groupName,
          supplierPhone: selectedSup ? selectedSup.phone : null,
          supplierEmail: selectedSup ? selectedSup.email : null,
          items: []
        };
      }

      grouped[groupKey].items.push({
        ...ing,
        eligibleSuppliers,
        selectedSupplierId: selectedSup ? String(selectedSup.id) : 'unassigned'
      });
    });

    return Object.values(grouped);
  }, [aggregatedOrderList, suppliers, supplierOverrides]);

  const handleSupplierOverrideChange = (mapKey, newSupplierId) => {
    setSupplierOverrides(prev => ({
      ...prev,
      [mapKey]: newSupplierId
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // 1. Basic Plan Name check
    if (!form.name.trim()) {
      setFormError('Plan Name is required.');
      return;
    }

    // 2. Ensure all dish lines have a recipe selected
    if (form.recipes.length === 0 || form.recipes.some(r => !r.recipe_id)) {
      setFormError('Please ensure all dish lines have a recipe selected.');
      return;
    }

    // 3. Restrict Duplicate Recipes (recipe uniqueness check)
    const selectedIds = form.recipes.map(r => String(r.recipe_id)).filter(Boolean);
    const hasDuplicateRecipe = new Set(selectedIds).size !== selectedIds.length;

    if (hasDuplicateRecipe) {
      setFormError('Each dish recipe can only be added once to a production plan. Duplicate recipes are not allowed.');
      return;
    }

    setSubmitting(true);
    try {
      await savePlan({
        ...form,
        supplier_overrides: supplierOverrides
      });
      router.visit('/bulk-planning');
    } catch (err) {
      console.error('Failed to save bulk production plan', err);
      setFormError('Failed to save production plan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <Head title={isEdit ? 'Edit Production Plan' : 'Create New Production Plan'} />

      <div>
        {/* Header Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <button
              onClick={() => router.visit('/bulk-planning')}
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
              Back to Bulk Planning
            </button>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <CalendarDays size={28} color="var(--color-primary)" />
              <span>{isEdit ? 'Edit Production Plan' : 'Create New Production Plan'}</span>
            </h1>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px', margin: 0 }}>
              Schedule dishes, scale servings, and generate automated purchase orders grouped by supplier.
            </p>
          </div>
        </div>

        {loading ? (
          <Card>
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              Loading production plan builder...
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

            {/* Section 1: Plan General Info */}
            <Card>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '10px' }}>
                1. Plan Specifications
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Plan Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Week 34 Production"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Planned Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.planned_date}
                    onChange={e => setForm({ ...form, planned_date: e.target.value })}
                    required
                  />
                </div>
              </div>
            </Card>

            {/* Section 2: Planned Dishes Builder */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                    2. Planned Dishes & Target Servings
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
                    Select unique dish recipes and specify planned target servings.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={PlusCircle}
                  onClick={handleAddDishRow}
                >
                  Add Dish Line
                </Button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {form.recipes.map((item, idx) => {
                  // Get recipe IDs selected in other rows to disable duplicates
                  const otherSelectedRecipeIds = form.recipes
                    .filter((_, i) => i !== idx)
                    .map(r => String(r.recipe_id))
                    .filter(Boolean);

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 40px',
                        gap: '14px',
                        alignItems: 'center',
                        backgroundColor: '#F9FAFB',
                        padding: '14px 18px',
                        borderRadius: '12px',
                        border: '1px solid var(--color-border-light)'
                      }}
                    >
                      {/* Recipe Dropdown Select */}
                      <div>
                        <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>
                          Dish Recipe *
                        </label>
                        <select
                          className="form-input"
                          value={item.recipe_id}
                          onChange={e => handleDishChange(idx, 'recipe_id', e.target.value)}
                        >
                          <option value="">-- Select Dish Recipe --</option>
                          {masterRecipes.map(m => {
                            const isSelectedElsewhere = otherSelectedRecipeIds.includes(String(m.id));
                            return (
                              <option
                                key={m.id}
                                value={m.id}
                                disabled={isSelectedElsewhere}
                              >
                                {m.name} ({m.category} • Base: {m.servings || 1} serv) {isSelectedElsewhere ? '(Already Added)' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Target Servings Input */}
                      <div>
                        <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>
                          Planned Servings *
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="form-input"
                          placeholder="e.g. 50"
                          value={item.target_servings}
                          onChange={e => handleDishChange(idx, 'target_servings', parseInt(e.target.value, 10) || 1)}
                        />
                      </div>

                      {/* +20% Buffer Checkbox */}
                      <div style={{ display: 'flex', alignItems: 'center', paddingTop: '18px' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none', fontSize: '13px', fontWeight: 600, color: 'var(--color-primary-darker)' }}>
                          <input
                            type="checkbox"
                            checked={item.extra_buffer}
                            onChange={e => handleDishChange(idx, 'extra_buffer', e.target.checked)}
                            style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                          />
                          <span>+20% Buffer</span>
                        </label>
                      </div>

                      {/* Remove Dish Line Button */}
                      <div style={{ textAlign: 'center', paddingTop: '18px' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveDishRow(idx)}
                          disabled={form.recipes.length <= 1}
                          title="Remove Dish"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#EF4444',
                            cursor: form.recipes.length > 1 ? 'pointer' : 'not-allowed',
                            opacity: form.recipes.length > 1 ? 1 : 0.4,
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

            {/* Section 3: Supplier Purchase Breakdown (Which Supplier -> Which Product -> How Much) */}
            <Card padding="0">
              <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Truck size={20} color="var(--color-primary)" />
                    <span>3. Supplier Purchase Order Breakdown</span>
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
                    Commercial raw ingredients grouped by Supplier for easy purchase order creation.
                  </p>
                </div>

                <div style={{ backgroundColor: 'var(--color-primary-pale)', color: 'var(--color-primary)', padding: '6px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '13px' }}>
                  {supplierPurchaseGroups.length} Supplier Orders
                </div>
              </div>

              {supplierPurchaseGroups.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Select planned dishes above to calculate supplier purchase order breakdowns.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
                  {supplierPurchaseGroups.map((group, gIdx) => (
                    <div
                      key={gIdx}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid var(--color-border-light)',
                        overflow: 'hidden',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                      }}
                    >
                      {/* Supplier Group Header */}
                      <div style={{
                        backgroundColor: '#F9FAFB',
                        padding: '14px 18px',
                        borderBottom: '1px solid var(--color-border-light)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Truck size={18} color="var(--color-primary)" />
                          <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                            {group.supplierName}
                          </h4>
                          {group.supplierPhone && (
                            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                              📞 {group.supplierPhone}
                            </span>
                          )}
                        </div>

                        <span style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                          {group.items.length} {group.items.length === 1 ? 'Product' : 'Products'} to Order
                        </span>
                      </div>

                      {/* Products Table */}
                      <div style={{ overflowX: 'auto' }}>
                        <table className="data-table" style={{ margin: 0 }}>
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Product / Ingredient Name</th>
                              <th>Assigned Supplier</th>
                              <th style={{ backgroundColor: '#F0FDF4', color: '#15803D', fontWeight: 800 }}>
                                Required Purchase Qty
                              </th>
                              <th>Unit</th>
                              <th>Referenced Dishes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.items.map((item, iIdx) => (
                              <tr key={iIdx}>
                                <td style={{ color: 'var(--color-text-muted)', fontWeight: 600, width: '40px' }}>
                                  {iIdx + 1}
                                </td>
                                <td>
                                  <strong style={{ color: 'var(--color-text-primary)', fontSize: '14px' }}>
                                    {item.name}
                                  </strong>
                                </td>

                                {/* Supplier Selector (If 2+ suppliers supply this item) */}
                                <td>
                                  {item.eligibleSuppliers && item.eligibleSuppliers.length > 1 ? (
                                    <select
                                      className="form-input"
                                      style={{ fontSize: '12px', padding: '4px 8px', borderColor: 'var(--color-primary)' }}
                                      value={item.selectedSupplierId}
                                      onChange={e => handleSupplierOverrideChange(item.mapKey, e.target.value)}
                                    >
                                      {item.eligibleSuppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} (Supplier)</option>
                                      ))}
                                      <option value="unassigned">Unassigned / General</option>
                                    </select>
                                  ) : (
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                                      {group.supplierName}
                                    </span>
                                  )}
                                </td>

                                <td style={{ backgroundColor: '#F0FDF4', color: '#15803D', fontWeight: 800, fontSize: '15px' }}>
                                  {item.quantity}
                                </td>
                                <td>
                                  <span style={{ backgroundColor: '#F3F4F6', color: '#4B5563', padding: '3px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>
                                    {item.unit}
                                  </span>
                                </td>
                                <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                                  {item.dishesText}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.visit('/bulk-planning')}
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
                {submitting ? 'Saving Plan...' : isEdit ? 'Update Production Plan' : 'Save Production Plan'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </PageLayout>
  );
};

export default BulkPlanningFormPage;
