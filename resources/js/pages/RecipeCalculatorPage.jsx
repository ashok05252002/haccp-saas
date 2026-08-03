import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
  Calculator, ChefHat, Printer, RefreshCw, Clock, Scale, AlertCircle
} from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import axios from 'axios';

const RecipeCalculatorPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [targetServings, setTargetServings] = useState(1);
  const [extraBuffer, setExtraBuffer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all recipes
  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/recipes');
        const list = res.data || [];
        setRecipes(list);
        setSelectedRecipeId('');
      } catch (err) {
        console.error('Failed to fetch recipes for calculator', err);
        setError('Failed to load recipes.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  // Selected Recipe Object
  const selectedRecipe = useMemo(() => {
    return recipes.find(r => String(r.id) === String(selectedRecipeId)) || null;
  }, [recipes, selectedRecipeId]);

  // When recipe selection changes, set target servings to recipe base servings
  const handleSelectRecipe = (id) => {
    setSelectedRecipeId(id);
    const rec = recipes.find(r => String(r.id) === String(id));
    if (rec) {
      setTargetServings(rec.servings || 1);
    }
  };

  const baseServings = selectedRecipe ? (selectedRecipe.servings || 1) : 1;
  const baseMultiplier = baseServings > 0 ? (targetServings / baseServings) : 1;
  const effectiveMultiplier = extraBuffer ? baseMultiplier * 1.20 : baseMultiplier;

  // Formatted ingredients with live scaled math
  const scaledIngredients = useMemo(() => {
    if (!selectedRecipe || !selectedRecipe.ingredients) return [];
    return selectedRecipe.ingredients.map(ing => {
      const baseQty = parseFloat(ing.quantity) || 0;
      const scaledQty = baseQty * effectiveMultiplier;
      // Format number neatly: integer if whole, else max 2 decimal places
      const formattedQty = Number.isInteger(scaledQty) ? scaledQty : Math.round(scaledQty * 100) / 100;

      return {
        ...ing,
        baseQuantity: baseQty,
        scaledQuantity: formattedQty,
      };
    });
  }, [selectedRecipe, effectiveMultiplier]);

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    if (selectedRecipe) {
      setTargetServings(selectedRecipe.servings || 1);
      setExtraBuffer(false);
    }
  };

  return (
    <PageLayout>
      <Head title="Recipe Calculator & Batch Scaler" />

      {/* Print Specific CSS Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-batch-sheet, #printable-batch-sheet * {
            visibility: visible;
          }
          #printable-batch-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: #fff;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div>
        {/* Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calculator size={28} color="var(--color-primary)" />
              <span>Recipe Calculator & Batch Scaler</span>
            </h1>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Scale dish recipes dynamically for bulk batch cooking, catering, and commercial prep.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="secondary" icon={RefreshCw} onClick={handleReset} disabled={!selectedRecipe}>
              Reset Scale
            </Button>
            <Button variant="primary" icon={Printer} onClick={handlePrint} disabled={!selectedRecipe}>
              Print Batch Sheet
            </Button>
          </div>
        </div>

        {loading ? (
          <Card>
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              Loading recipe calculator...
            </div>
          </Card>
        ) : recipes.length === 0 ? (
          <Card>
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <ChefHat size={48} color="#D1D5DB" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)' }}>No Recipes Found</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '20px' }}>
                Please create dish recipes first before using the calculator.
              </p>
              <Button variant="primary" onClick={() => router.visit('/recipes/create')}>
                Create First Recipe
              </Button>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Top Selector Card */}
            <Card padding="20px">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label className="form-label" style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>
                  Select Recipe to Scale *
                </label>

                <select
                  className="form-input"
                  style={{ fontSize: '15px', fontWeight: 600, padding: '12px 16px' }}
                  value={selectedRecipeId}
                  onChange={e => handleSelectRecipe(e.target.value)}
                >
                  <option value="">-- Select a Recipe to Scale --</option>
                  {recipes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.category} • Base: {r.servings || 1} {r.servings === 1 ? 'serving' : 'servings'})
                    </option>
                  ))}
                </select>
              </div>
            </Card>

            {!selectedRecipe ? (
              <Card>
                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <ChefHat size={48} color="#D1D5DB" style={{ marginBottom: '12px' }} />
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 6px 0' }}>
                    No Recipe Selected
                  </h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', margin: 0 }}>
                    Please select a dish recipe from the dropdown above to calculate scaled batch ingredients.
                  </p>
                </div>
              </Card>
            ) : (
              <div id="printable-batch-sheet" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Dish Base Overview Header */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid var(--color-border-light)',
                  padding: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '4px 12px', borderRadius: '12px', fontWeight: 700, fontSize: '12px' }}>
                        {selectedRecipe.category}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                        <Clock size={14} />
                        {selectedRecipe.prep_time || '20m'}
                      </span>
                    </div>

                    <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 6px 0' }}>
                      {selectedRecipe.name}
                    </h2>

                    {selectedRecipe.description && (
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: 0 }}>
                        {selectedRecipe.description}
                      </p>
                    )}
                  </div>

                  <div style={{
                    backgroundColor: '#F9FAFB',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    minWidth: '200px'
                  }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Recipe Specs
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      Base Servings: <strong>{baseServings}</strong>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      Ingredients: <strong>{selectedRecipe.ingredients ? selectedRecipe.ingredients.length : 0} items</strong>
                    </div>
                  </div>
                </div>

                {/* Batch Scaler Controls (Hidden on Print) */}
                <div className="no-print" style={{
                  backgroundColor: 'var(--color-primary-pale)',
                  borderRadius: '16px',
                  border: '1px solid #A7F3D0',
                  padding: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary-darker)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Scale size={20} color="var(--color-primary)" />
                    <span>Target Batch Scaling</span>
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', alignItems: 'center' }}>
                    {/* Target Servings Input */}
                    <div>
                      <label className="form-label" style={{ color: 'var(--color-primary-darker)', fontWeight: 700 }}>
                        Target Servings Required *
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="number"
                          min="1"
                          className="form-input"
                          style={{ fontSize: '18px', fontWeight: 700, padding: '10px 14px', width: '100%', backgroundColor: '#ffffff' }}
                          value={targetServings}
                          onChange={e => setTargetServings(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        />
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                          servings
                        </span>
                      </div>
                    </div>

                    {/* Scale Multiplier Badge */}
                    <div style={{ backgroundColor: '#ffffff', padding: '14px 20px', borderRadius: '12px', border: '1px solid #A7F3D0', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Calculated Scale Ratio
                      </div>
                      <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-primary)', marginTop: '2px' }}>
                        {effectiveMultiplier.toFixed(2)}x {extraBuffer ? '(+20% Margin)' : ''}
                      </div>
                    </div>
                  </div>

                  {/* 20% Extra Buffer Toggle */}
                  <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #A7F3D0' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                      <input
                        type="checkbox"
                        checked={extraBuffer}
                        onChange={e => setExtraBuffer(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary-darker)' }}>
                        Add 20% Extra Buffer (Safety Margin)
                      </span>
                    </label>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 0 28px' }}>
                      Increases all ingredient quantities by 20% safety margin for prep loss and waste control.
                    </p>
                  </div>
                </div>

                {/* Scaled Ingredients Output Table */}
                <Card padding="0">
                  <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                        Required Ingredient Quantities ({targetServings} Servings{extraBuffer ? ' + 20% Buffer' : ''})
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
                        Batch scaled ingredient measurements for commercial prep station.
                      </p>
                    </div>

                    <div style={{ backgroundColor: 'var(--color-primary-pale)', color: 'var(--color-primary)', padding: '6px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '13px' }}>
                      Scaled Batch: {targetServings} Servings {extraBuffer ? '(+20% Buffer)' : ''}
                    </div>
                  </div>

                  {scaledIngredients.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      No ingredients defined for this recipe.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="data-table" style={{ margin: 0 }}>
                        <thead>
                          <tr>
                            <th>Ingredient Name</th>
                            <th>Base Qty (per serving)</th>
                            <th style={{ backgroundColor: extraBuffer ? '#FEF3C7' : '#ECFDF5', color: extraBuffer ? '#92400E' : '#047857', fontWeight: 800 }}>
                              Required Qty for {targetServings} Servings {extraBuffer ? '(+20% Buffer)' : ''}
                            </th>
                            <th>Unit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scaledIngredients.map((ing, idx) => (
                            <tr key={idx}>
                              <td>
                                <strong style={{ color: 'var(--color-text-primary)', fontSize: '14px' }}>
                                  {ing.ingredient_name}
                                </strong>
                              </td>
                              <td style={{ color: 'var(--color-text-secondary)' }}>
                                {ing.baseQuantity} {ing.unit}
                              </td>
                              <td style={{ backgroundColor: '#F0FDF4', color: '#15803D', fontWeight: 800, fontSize: '16px' }}>
                                {ing.scaledQuantity}
                              </td>
                              <td>
                                <span style={{ backgroundColor: '#F3F4F6', padding: '3px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>
                                  {ing.unit}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default RecipeCalculatorPage;
