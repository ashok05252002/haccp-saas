import React, { useState, useEffect } from 'react';
import { Plus, Save, FileText, CalendarDays } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ToggleSwitch from '../components/common/ToggleSwitch';
import EmptyState from '../components/common/EmptyState';
import Loader from '../components/common/Loader';
import { getSavedPlans, savePlan } from '../services/planningService';
import { getAllRecipesList } from '../services/recipeService';
import { aggregateIngredients } from '../utils/calculationUtils';

const BulkPlanningPage = () => {
  const [savedPlans, setSavedPlans] = useState([]);
  const [allRecipes, setAllRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [planName, setPlanName] = useState('');
  const [weekStart, setWeekStart] = useState('');
  const [planRecipes, setPlanRecipes] = useState([]);
  const [buffer, setBuffer] = useState(false);
  const [addRecipeModal, setAddRecipeModal] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [recipeServings, setRecipeServings] = useState('');
  const [orderList, setOrderList] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plans, recipes] = await Promise.all([getSavedPlans(), getAllRecipesList()]);
        setSavedPlans(plans);
        setAllRecipes(recipes);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddRecipe = () => {
    if (!selectedRecipeId || !recipeServings) return;
    const recipe = allRecipes.find((r) => r.id === parseInt(selectedRecipeId));
    if (!recipe) return;
    setPlanRecipes([...planRecipes, { recipe, servings: parseInt(recipeServings) }]);
    setSelectedRecipeId('');
    setRecipeServings('');
    setAddRecipeModal(false);
  };

  const handleRemoveRecipe = (index) => {
    setPlanRecipes(planRecipes.filter((_, i) => i !== index));
  };

  const handleGenerateOrderList = () => {
    if (planRecipes.length === 0) return;
    const result = aggregateIngredients(planRecipes, buffer);
    setOrderList(result);
  };

  const handleSavePlan = async () => {
    if (!planName) return;
    await savePlan({
      name: planName,
      weekLabel: weekStart || '',
      recipeCount: planRecipes.length,
      recipes: planRecipes.map((pr) => ({
        recipeId: pr.recipe.id,
        recipeName: pr.recipe.name,
        servings: pr.servings,
      })),
    });
    const plans = await getSavedPlans();
    setSavedPlans(plans);
  };

  return (
    <PageLayout>
      <div className="page-header">
        <h1 className="page-title">Bulk Planning</h1>
        <p className="page-subtitle">Plan weekly production and generate supplier order lists</p>
      </div>

      {loading ? (
        <Loader message="Loading plans..." />
      ) : (
        <div style={{ display: 'flex', gap: '24px', marginTop: '24px', flexWrap: 'wrap' }}>
          {/* Left: Production Plan */}
          <Card style={{ flex: 2, minWidth: '320px' }}>
            <h3
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: '24px',
              }}
            >
              Production Plan
            </h3>

            <div className="form-group">
              <label className="form-label">Plan Name</label>
              <input
                className="form-input"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="e.g. Week 23, Saturday Event"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Week Starting (Target Date)</label>
              <input
                className="form-input"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                placeholder="dd/mm/yyyy"
              />
            </div>

            {/* Recipes section */}
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}
              >
                <h4
                  style={{
                    fontSize: 'var(--font-size-md)',
                    fontWeight: 'var(--font-weight-semibold)',
                  }}
                >
                  Recipes & Servings
                </h4>
                <Button variant="outline" size="sm" icon={Plus} onClick={() => setAddRecipeModal(true)}>
                  Add Recipe
                </Button>
              </div>

              {planRecipes.length === 0 ? (
                <div
                  style={{
                    border: '2px dashed var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '32px',
                    textAlign: 'center',
                    color: 'var(--color-text-muted)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  No recipes added yet. Click "Add Recipe" to start.
                </div>
              ) : (
                <div>
                  {planRecipes.map((pr, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-page-bg)',
                        marginBottom: '8px',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 500 }}>{pr.recipe.name}</span>
                        <span
                          style={{
                            marginLeft: '8px',
                            color: 'var(--color-text-muted)',
                            fontSize: 'var(--font-size-sm)',
                          }}
                        >
                          × {pr.servings} servings
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveRecipe(i)}
                        style={{
                          color: 'var(--color-danger)',
                          fontSize: 'var(--font-size-sm)',
                          cursor: 'pointer',
                          backgroundColor: 'transparent',
                          border: 'none',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Buffer */}
            <div
              style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-amber-pale)',
                border: '1px solid var(--color-amber-border)',
                marginBottom: '24px',
              }}
            >
              <ToggleSwitch
                checked={buffer}
                onChange={setBuffer}
                label="Add 20% Extra Buffer"
                sublabel="Safety margin for all ingredients"
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                variant="primary"
                onClick={handleGenerateOrderList}
                disabled={planRecipes.length === 0}
              >
                Generate Order Lists
              </Button>
              <Button variant="secondary" icon={Save} onClick={handleSavePlan} disabled={!planName}>
                Save Plan
              </Button>
            </div>

            {/* Order List Results */}
            {orderList && (
              <div style={{ marginTop: '24px' }}>
                <h4
                  style={{
                    fontSize: 'var(--font-size-md)',
                    fontWeight: 'var(--font-weight-semibold)',
                    marginBottom: '16px',
                  }}
                >
                  Generated Order List
                </h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={tableStyles.th}>Ingredient</th>
                        <th style={tableStyles.th}>Quantity</th>
                        <th style={tableStyles.th}>Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderList.map((item, i) => (
                        <tr key={i}>
                          <td style={tableStyles.td}>{item.name}</td>
                          <td
                            style={{
                              ...tableStyles.td,
                              fontWeight: 600,
                              color: 'var(--color-primary)',
                            }}
                          >
                            {item.quantity}
                          </td>
                          <td style={tableStyles.td}>{item.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>

          {/* Right: Saved Plans */}
          <Card style={{ flex: 1, minWidth: '260px', alignSelf: 'flex-start' }}>
            <h3
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: '20px',
              }}
            >
              Saved Plans
            </h3>

            {savedPlans.length === 0 ? (
              <EmptyState icon={CalendarDays} message="No saved plans yet" />
            ) : (
              <div>
                {savedPlans.map((plan) => (
                  <div
                    key={plan.id}
                    style={{
                      padding: '14px 0',
                      borderBottom: '1px solid var(--color-border-light)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 'var(--font-size-base)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--color-text-primary)',
                        marginBottom: '4px',
                      }}
                    >
                      {plan.name}
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {plan.weekLabel && <span>{plan.weekLabel} · </span>}
                      {plan.recipeCount} recipes · {plan.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Add Recipe Modal */}
      <Modal
        isOpen={addRecipeModal}
        onClose={() => setAddRecipeModal(false)}
        title="Add Recipe to Plan"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddRecipeModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAddRecipe}
              disabled={!selectedRecipeId || !recipeServings}
            >
              Add
            </Button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Recipe</label>
          <select
            className="form-select"
            value={selectedRecipeId}
            onChange={(e) => setSelectedRecipeId(e.target.value)}
          >
            <option value="">Choose a recipe...</option>
            {allRecipes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Number of Servings</label>
          <input
            className="form-input"
            type="number"
            min="1"
            placeholder="e.g. 50"
            value={recipeServings}
            onChange={(e) => setRecipeServings(e.target.value)}
          />
        </div>
      </Modal>
    </PageLayout>
  );
};

const tableStyles = {
  th: {
    textAlign: 'left',
    padding: '10px 14px',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    borderBottom: '2px solid var(--color-border-light)',
  },
  td: {
    padding: '10px 14px',
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-text-primary)',
    borderBottom: '1px solid var(--color-border-light)',
  },
};

export default BulkPlanningPage;
