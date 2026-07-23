import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import RecipeCard from '../components/recipes/RecipeCard';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { getRecipes, createRecipe } from '../services/recipeService';

const RecipesPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Update state to match new screenshot requirements
  const [newRecipe, setNewRecipe] = useState({
    name: '',
    category: 'Lunch',
    prepTime: '',
    description: '',
    ingredients: [{ id: 1, name: '', qty: '', unit: 'grams', supplierCategory: '', supplierName: '' }],
  });

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const data = await getRecipes(search);
      setRecipes(data);
    } catch (err) {
      console.error('Failed to load recipes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [search]);

  const handleSaveRecipe = async () => {
    if (!newRecipe.name) return;
    setSaving(true);
    try {
      const formattedIngredients = newRecipe.ingredients.map(ing => ({
        name: ing.name,
        quantity: parseFloat(ing.qty) || 0,
        unit: ing.unit,
        supplierCategory: ing.supplierCategory,
        supplierName: ing.supplierName
      }));

      await createRecipe({
        name: newRecipe.name,
        category: newRecipe.category,
        prepTime: newRecipe.prepTime,
        description: newRecipe.description,
        ingredients: formattedIngredients,
        servings: 1,
      });
      setModalOpen(false);
      setNewRecipe({
        name: '',
        category: 'Lunch',
        prepTime: '',
        description: '',
        ingredients: [{ id: 1, name: '', qty: '', unit: 'grams', supplierCategory: '', supplierName: '' }],
      });
      fetchRecipes();
    } catch (err) {
      console.error('Failed to save recipe:', err);
    } finally {
      setSaving(false);
    }
  };

  const addIngredient = () => {
    setNewRecipe(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { id: Date.now(), name: '', qty: '', unit: 'grams', supplierCategory: '', supplierName: '' }]
    }));
  };

  const removeIngredient = (id) => {
    setNewRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter(ing => ing.id !== id)
    }));
  };

  const updateIngredient = (id, field, value) => {
    setNewRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.map(ing => ing.id === id ? { ...ing, [field]: value } : ing)
    }));
  };

  return (
    <PageLayout>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Recipes</h1>
          <p className="page-subtitle">Manage your recipe library</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>
          New Recipe
        </Button>
      </div>

      {/* Main Content or Inline Form */}
      {!modalOpen ? (
        <>
          {/* Search */}
          <div style={{ position: 'relative', marginTop: '20px', marginBottom: '24px' }}>
            <Search
              size={16}
              color="var(--color-text-muted)"
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            />
            <input
              className="form-input"
              type="text"
              placeholder="Search recipes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '40px', maxWidth: '400px' }}
            />
          </div>

          {loading ? (
            <Loader message="Loading recipes..." />
          ) : recipes.length === 0 ? (
            <EmptyState message="No recipes found" submessage="Try a different search or add a new recipe." />
          ) : (
            <div className="grid-2">
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={styles.sheetCard}>
          <h2 style={styles.sheetTitle}>New Recipe</h2>
          
          <div style={styles.formGrid}>
            <div className="form-group">
              <label className="form-label">Recipe Name *</label>
              <input
                className="form-input"
                value={newRecipe.name}
                onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
                placeholder="e.g. English Breakfast"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={newRecipe.category}
                onChange={(e) => setNewRecipe({ ...newRecipe, category: e.target.value })}
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Dessert">Dessert</option>
                <option value="Snack">Snack</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={newRecipe.description}
              onChange={(e) => setNewRecipe({ ...newRecipe, description: e.target.value })}
              placeholder="Brief recipe description..."
              style={{ minHeight: '80px' }}
            />
          </div>

          <div className="form-group" style={{ maxWidth: '300px' }}>
            <label className="form-label">Prep Time (minutes)</label>
            <input
              className="form-input"
              value={newRecipe.prepTime}
              onChange={(e) => setNewRecipe({ ...newRecipe, prepTime: e.target.value })}
              placeholder="e.g. 30"
            />
          </div>

          <div style={styles.sectionHeaderRow}>
            <h3 style={styles.sectionTitle}>Ingredients (per serving)</h3>
            <button style={styles.addBtn} onClick={addIngredient}>
              <Plus size={16} /> Add
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
            {newRecipe.ingredients.map((ing) => (
              <div key={ing.id} style={styles.ingredientRow}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input
                    className="form-input"
                    placeholder="Ingredient name"
                    value={ing.name}
                    onChange={(e) => updateIngredient(ing.id, 'name', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <input
                    className="form-input"
                    placeholder="Qty"
                    value={ing.qty}
                    onChange={(e) => updateIngredient(ing.id, 'qty', e.target.value)}
                    style={{ width: '80px' }}
                  />
                  <select
                    className="form-select"
                    value={ing.unit}
                    onChange={(e) => updateIngredient(ing.id, 'unit', e.target.value)}
                    style={{ width: '120px' }}
                  >
                    <option value="grams">grams</option>
                    <option value="ml">ml</option>
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                  </select>
                  <button style={styles.deleteBtn} onClick={() => removeIngredient(ing.id)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <select
                    className="form-select"
                    value={ing.supplierCategory}
                    onChange={(e) => updateIngredient(ing.id, 'supplierCategory', e.target.value)}
                    style={{ flex: 1 }}
                  >
                    <option value="" disabled>Supplier category...</option>
                    <option value="Grocery">Grocery</option>
                    <option value="Meat">Meat</option>
                    <option value="Produce">Produce</option>
                    <option value="Dairy">Dairy</option>
                  </select>
                  <input
                    className="form-input"
                    placeholder="Supplier name (optional)"
                    value={ing.supplierName}
                    onChange={(e) => updateIngredient(ing.id, 'supplierName', e.target.value)}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={styles.sheetFooter}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              ✕ Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveRecipe} disabled={saving || !newRecipe.name}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              Create Recipe
            </Button>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

const styles = {
  sheetCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '32px',
    border: '1px solid var(--color-border-light)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
    marginTop: '20px',
  },
  sheetTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--color-text-primary)',
    marginBottom: '24px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    marginBottom: '8px',
  },
  sectionHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '32px',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--color-text-primary)',
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    backgroundColor: '#fff',
    border: '1px solid var(--color-border-light)',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
  },
  ingredientRow: {
    backgroundColor: '#FAFAFA',
    border: '1px solid var(--color-border-light)',
    borderRadius: '12px',
    padding: '16px',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    paddingTop: '24px',
    borderTop: '1px solid var(--color-border-light)',
  },
};

export default RecipesPage;
