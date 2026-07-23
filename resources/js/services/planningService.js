/**
 * Planning Service
 * Currently returns mock data. Replace with api calls for Laravel.
 */
import { savedPlansMockData } from '../data/bulkPlanningMockData';

let localPlans = [...savedPlansMockData];

export const getSavedPlans = async () => {
  // Future: return api.get('/plans');
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...localPlans]);
    }, 400);
  });
};

export const savePlan = async (planData) => {
  // Future: return api.post('/plans', planData);
  return new Promise((resolve) => {
    setTimeout(() => {
      const newPlan = {
        id: Date.now(),
        ...planData,
        status: 'draft',
      };
      localPlans.unshift(newPlan);
      resolve(newPlan);
    }, 300);
  });
};

export const generateOrderList = async (recipes) => {
  // Future: return api.post('/plans/generate-order', { recipes });
  return new Promise((resolve) => {
    setTimeout(() => {
      // Aggregate ingredients across all recipes
      const ingredientMap = {};
      recipes.forEach(({ recipe, servings, buffer }) => {
        const multiplier = buffer ? servings * 1.2 : servings;
        recipe.ingredients.forEach((ing) => {
          const key = `${ing.name}-${ing.unit}`;
          if (ingredientMap[key]) {
            ingredientMap[key].quantity += ing.quantity * multiplier;
          } else {
            ingredientMap[key] = {
              name: ing.name,
              quantity: ing.quantity * multiplier,
              unit: ing.unit,
            };
          }
        });
      });
      resolve(Object.values(ingredientMap));
    }, 500);
  });
};
