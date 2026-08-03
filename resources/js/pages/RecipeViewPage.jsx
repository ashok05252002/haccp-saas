import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
  ChefHat, ArrowLeft, Edit2, Clock, CheckCircle2, ShieldAlert, AlertCircle, Utensils
} from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import axios from 'axios';

const RecipeViewPage = ({ recipeId }) => {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecipeDetails = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/recipes/${recipeId}`);
        setRecipe(res.data);
      } catch (err) {
        console.error('Failed to fetch recipe details', err);
        setError('Recipe not found or failed to load details.');
      } finally {
        setLoading(false);
      }
    };

    if (recipeId) {
      fetchRecipeDetails();
    }
  }, [recipeId]);

  return (
    <PageLayout>
      <Head title={recipe ? recipe.name : 'Recipe Details'} />

      <div>
        {/* Navigation & Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
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

            {recipe && (
              <div>
                <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                  <ChefHat size={30} color="var(--color-primary)" />
                  <span>{recipe.name}</span>
                </h1>
                <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px', margin: 0 }}>
                  Full commercial kitchen recipe breakdown, ingredient portions, and HACCP prep guidelines.
                </p>
              </div>
            )}
          </div>

          {recipe && (
            <Button
              variant="primary"
              icon={Edit2}
              onClick={() => router.visit(`/recipes/${recipe.id}/edit`)}
            >
              Edit Recipe
            </Button>
          )}
        </div>

        {loading ? (
          <Card>
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              Loading recipe details...
            </div>
          </Card>
        ) : error || !recipe ? (
          <Card>
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <AlertCircle size={48} color="#EF4444" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Recipe Not Found
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '20px' }}>
                The requested recipe could not be loaded.
              </p>
              <Button variant="primary" onClick={() => router.visit('/recipes')}>
                Return to Recipe List
              </Button>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Meta Specifications Bar */}
            <Card padding="20px">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '6px 14px', borderRadius: '14px', fontWeight: 700, fontSize: '13px' }}>
                    Category: {recipe.category}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    <Clock size={16} color="var(--color-primary)" />
                    Prep Time: {recipe.prep_time || '20m'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    <Utensils size={16} color="var(--color-primary)" />
                    Base Servings: {recipe.servings || 1}
                  </span>
                </div>

                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-pale)', padding: '6px 14px', borderRadius: '16px' }}>
                  {recipe.ingredients ? recipe.ingredients.length : 0} Ingredients Required
                </div>
              </div>

              {recipe.description && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border-light)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px 0' }}>
                    Description & Serving Notes
                  </h4>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.5 }}>
                    {recipe.description}
                  </p>
                </div>
              )}
            </Card>

            {/* Complete Ingredients List Table */}
            <Card padding="0">
              <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                    Complete Ingredients Breakdown
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
                    Exact ingredient measurements and UOM required per serving.
                  </p>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  Total Items: {recipe.ingredients ? recipe.ingredients.length : 0}
                </span>
              </div>

              {(!recipe.ingredients || recipe.ingredients.length === 0) ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No ingredients listed for this recipe.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Ingredient Name</th>
                        <th>Quantity per Serving</th>
                        <th>Unit of Measure (UOM)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipe.ingredients.map((ing, idx) => (
                        <tr key={idx}>
                          <td style={{ color: 'var(--color-text-muted)', fontWeight: 600, width: '40px' }}>
                            {idx + 1}
                          </td>
                          <td>
                            <strong style={{ color: 'var(--color-text-primary)', fontSize: '14px' }}>
                              {ing.ingredient_name}
                            </strong>
                          </td>
                          <td style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary-darker)' }}>
                            {ing.quantity}
                          </td>
                          <td>
                            <span style={{ backgroundColor: '#F3F4F6', color: '#4B5563', padding: '4px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 600 }}>
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

            {/* Allergen Declarations */}
            {Array.isArray(recipe.allergens) && recipe.allergens.length > 0 && (
              <Card>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={20} color="#D97706" />
                  <span>Allergen Declarations</span>
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {recipe.allergens.map((allergen, idx) => (
                    <span key={idx} style={{ backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', padding: '6px 12px', borderRadius: '14px', fontWeight: 700, fontSize: '13px' }}>
                      ⚠️ {allergen}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* HACCP Notes */}
            {recipe.haccp_notes && (
              <Card style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#047857', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={20} color="#047857" />
                  <span>HACCP CCP Preparation & Critical Limits</span>
                </h3>
                <p style={{ fontSize: '14px', color: '#065F46', margin: 0, lineHeight: 1.5 }}>
                  {recipe.haccp_notes}
                </p>
              </Card>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default RecipeViewPage;
