import React, { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import ToggleSwitch from '../components/common/ToggleSwitch';
import { getAllRecipesList } from '../services/recipeService';
import { calculateIngredients } from '../utils/calculationUtils';

const CalculatorPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [servings, setServings] = useState('');
  const [buffer, setBuffer] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      const data = await getAllRecipesList();
      setRecipes(data);
    };
    fetchRecipes();
  }, []);

  const handleCalculate = () => {
    if (!selectedRecipeId || !servings) return;
    const recipe = recipes.find((r) => r.id === parseInt(selectedRecipeId));
    if (!recipe) return;
    const calculated = calculateIngredients(recipe.ingredients, parseInt(servings), buffer);
    setResults(calculated);
  };

  const handleReset = () => {
    setSelectedRecipeId('');
    setServings('');
    setBuffer(false);
    setResults(null);
  };

  const canCalculate = selectedRecipeId && servings && parseInt(servings) > 0;

  return (
    <PageLayout>
      <div className="page-header">
        <h1 className="page-title">Ingredient Calculator</h1>
        <p className="page-subtitle">Calculate Bill of Materials for any recipe</p>
      </div>

      <Card style={{ marginTop: '24px' }}>
        <h3
          style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: '24px',
          }}
        >
          Calculate Ingredients
        </h3>

        <div className="form-group">
          <label className="form-label">Select Recipe</label>
          <select
            className="form-select"
            value={selectedRecipeId}
            onChange={(e) => setSelectedRecipeId(e.target.value)}
          >
            <option value="">Choose a recipe...</option>
            {recipes.map((r) => (
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
            placeholder="e.g. 100"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
          />
        </div>

        {/* Buffer Toggle */}
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
            sublabel="Increases all quantities by 20% for safety margin"
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="primary" onClick={handleCalculate} disabled={!canCalculate}>
            Calculate
          </Button>
          <Button variant="secondary" icon={RotateCcw} onClick={handleReset}>
            Reset
          </Button>
        </div>
      </Card>

      {/* Results */}
      {results && (
        <Card style={{ marginTop: '24px' }}>
          <h3
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: '20px',
            }}
          >
            Calculated Ingredients
            {buffer && (
              <span
                style={{
                  marginLeft: '10px',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-warning)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                (includes 20% buffer)
              </span>
            )}
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Ingredient</th>
                  <th style={styles.th}>Base Qty (per serving)</th>
                  <th style={styles.th}>Required Qty</th>
                  <th style={styles.th}>Unit</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item, i) => (
                  <tr key={i}>
                    <td style={styles.td}>{item.name}</td>
                    <td style={styles.td}>{item.baseQuantity}</td>
                    <td style={{ ...styles.td, fontWeight: 600, color: 'var(--color-primary)' }}>
                      {item.requiredQuantity}
                    </td>
                    <td style={styles.td}>{item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </PageLayout>
  );
};

const styles = {
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-text-secondary)',
    borderBottom: '2px solid var(--color-border-light)',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '12px 16px',
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-text-primary)',
    borderBottom: '1px solid var(--color-border-light)',
  },
};

export default CalculatorPage;
