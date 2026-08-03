import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
  Plus, Search, Clock, ChefHat, Edit2, Trash2, Eye, CheckCircle2, ShieldAlert
} from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import Modal from '../components/common/Modal';
import axios from 'axios';

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Prep', 'Dessert'];

const RecipesPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal State for Viewing Recipe Details
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingRecipe, setViewingRecipe] = useState(null);

  // Fetch Recipes
  const fetchRecipes = useCallback(async () => {
    try {
      setLoading(true);
      const recRes = await axios.get('/api/recipes');
      setRecipes(recRes.data || []);
    } catch (err) {
      console.error('Failed to fetch recipes data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  // Filter Recipes
  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      const matchSearch = searchQuery === '' || 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCategory = selectedCategory === 'All' || r.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [recipes, searchQuery, selectedCategory]);

  const handleOpenAdd = () => {
    router.visit('/recipes/create');
  };

  const handleOpenEdit = (recipe) => {
    router.visit(`/recipes/${recipe.id}/edit`);
  };

  const handleOpenView = (recipe) => {
    setViewingRecipe(recipe);
    setViewModalOpen(true);
  };

  const handleDelete = async (recipeId) => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) return;
    try {
      await axios.delete(`/api/recipes/${recipeId}`);
      fetchRecipes();
    } catch (err) {
      alert('Failed to delete recipe.');
    }
  };

  return (
    <PageLayout>
      <Head title="Recipes Management" />

      <div>
        {/* Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ChefHat size={28} color="var(--color-primary)" />
              <span>Recipes Management</span>
            </h1>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Manage commercial kitchen dish recipes, ingredients, allergens, and HACCP prep guidelines.
            </p>
          </div>

          <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
            Create New Recipe
          </Button>
        </div>

        {/* Search Bar */}
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search recipes by name or description..." />

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: selectedCategory === cat ? 'var(--color-primary)' : '#ffffff',
                color: selectedCategory === cat ? '#ffffff' : 'var(--color-text-secondary)',
                boxShadow: 'var(--shadow-sm)',
                border: selectedCategory === cat ? 'none' : '1px solid var(--color-border-light)',
                transition: 'all 0.2s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Recipes Grid */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading recipes...</div>
        ) : filteredRecipes.length === 0 ? (
          <div style={{ backgroundColor: '#ffffff', padding: '60px 20px', textAlign: 'center', borderRadius: '16px', border: '1px dashed var(--color-border-light)' }}>
            <ChefHat size={48} color="#D1D5DB" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 6px 0' }}>No Recipes Found</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', margin: '0 0 20px 0' }}>
              {searchQuery ? 'No recipes match your search criteria.' : 'Create your first commercial kitchen recipe to get started.'}
            </p>
            <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
              Create New Recipe
            </Button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {filteredRecipes.map(recipe => (
              <div
                key={recipe.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid var(--color-border-light)',
                  padding: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer',
                }}
                onClick={() => handleOpenView(recipe)}
              >
                <div>
                  {/* Category & Prep Time */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '4px 10px', borderRadius: '12px', fontWeight: 700, fontSize: '12px' }}>
                      {recipe.category}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                      <Clock size={14} />
                      <span>{recipe.prep_time || '20m'}</span>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 8px 0', lineHeight: 1.3 }}>
                    {recipe.name}
                  </h3>

                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 16px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '36px' }}>
                    {recipe.description || 'No description provided.'}
                  </p>

                  <div style={{ height: '1px', backgroundColor: 'var(--color-border-light)', marginBottom: '14px' }} />

                  {/* Ingredients Count & Chips */}
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                    {recipe.ingredients ? recipe.ingredients.length : 0} Ingredients (per serving)
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                    {(recipe.ingredients || []).slice(0, 4).map((ing, idx) => (
                      <span key={idx} style={{ backgroundColor: '#F3F4F6', color: '#4B5563', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                        {ing.ingredient_name} ({ing.quantity} {ing.unit})
                      </span>
                    ))}
                    {(recipe.ingredients || []).length > 4 && (
                      <span style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                        +{(recipe.ingredients || []).length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--color-border-light)' }} onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => handleOpenView(recipe)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Eye size={15} />
                    <span>View Recipe</span>
                  </button>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Button variant="secondary" size="sm" icon={Edit2} onClick={() => handleOpenEdit(recipe)} />
                    <Button variant="secondary" size="sm" icon={Trash2} onClick={() => handleDelete(recipe.id)} style={{ color: '#EF4444' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* QUICK VIEW RECIPE SUMMARY MODAL */}
        {viewingRecipe && (
          <Modal
            isOpen={viewModalOpen}
            onClose={() => setViewModalOpen(false)}
            title={viewingRecipe.name}
            maxWidth="550px"
            footer={
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
                <Button variant="secondary" onClick={() => setViewModalOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  icon={Eye}
                  onClick={() => {
                    setViewModalOpen(false);
                    router.visit(`/recipes/${viewingRecipe.id}`);
                  }}
                >
                  View Full Details
                </Button>
              </div>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Top Meta Info */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '4px 12px', borderRadius: '12px', fontWeight: 700, fontSize: '13px' }}>
                  {viewingRecipe.category}
                </span>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px', fontWeight: 600 }}>
                  ⏱ Prep Time: {viewingRecipe.prep_time || '20m'}
                </span>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px', fontWeight: 600 }}>
                  🍽 Servings: {viewingRecipe.servings || 1}
                </span>
              </div>

              {viewingRecipe.description && (
                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  {viewingRecipe.description}
                </p>
              )}

              {/* Ingredients Summary Box */}
              <div style={{ backgroundColor: '#F9FAFB', padding: '18px', borderRadius: '12px', border: '1px solid var(--color-border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                    Ingredients Summary
                  </h4>
                  <span style={{ backgroundColor: 'var(--color-primary-pale)', color: 'var(--color-primary)', padding: '2px 10px', borderRadius: '10px', fontWeight: 700, fontSize: '12px' }}>
                    {viewingRecipe.ingredients ? viewingRecipe.ingredients.length : 0} Ingredients
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  {(viewingRecipe.ingredients || []).slice(0, 4).map((ing, idx) => (
                    <span key={idx} style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-border-light)', color: 'var(--color-text-primary)', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                      {ing.ingredient_name} ({ing.quantity} {ing.unit})
                    </span>
                  ))}
                  {(viewingRecipe.ingredients || []).length > 4 && (
                    <span style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                      +{(viewingRecipe.ingredients || []).length - 4} more
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
                  Click <strong>View Full Details</strong> below to inspect complete ingredient lists, UOM measurements, and HACCP guidelines.
                </p>
              </div>
            </div>
          </Modal>
        )}

      </div>
    </PageLayout>
  );
};

export default RecipesPage;
