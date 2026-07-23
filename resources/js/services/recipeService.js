/**
 * Recipe Service
 * Currently returns mock data. Replace with api calls for Laravel.
 */
import { recipesMockData } from '../data/recipesMockData';

let localRecipes = [...recipesMockData];

export const getRecipes = async (search = '') => {
  // Future: return api.get('/recipes', { params: { search } });
  return new Promise((resolve) => {
    setTimeout(() => {
      let results = [...localRecipes];
      if (search) {
        const q = search.toLowerCase();
        results = results.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.category.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q)
        );
      }
      resolve(results);
    }, 400);
  });
};

export const getRecipeById = async (id) => {
  // Future: return api.get(`/recipes/${id}`);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const recipe = localRecipes.find((r) => r.id === id);
      if (recipe) resolve(recipe);
      else reject(new Error('Recipe not found'));
    }, 200);
  });
};

export const createRecipe = async (recipeData) => {
  // Future: return api.post('/recipes', recipeData);
  return new Promise((resolve) => {
    setTimeout(() => {
      const newRecipe = {
        id: Date.now(),
        ...recipeData,
      };
      localRecipes.push(newRecipe);
      resolve(newRecipe);
    }, 300);
  });
};

export const getAllRecipesList = async () => {
  // Helper for dropdowns — returns id and name only
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(localRecipes.map((r) => ({ id: r.id, name: r.name, ingredients: r.ingredients })));
    }, 200);
  });
};
