/**
 * Calculation utility functions for Chef2Comply
 */

/**
 * Calculate scaled ingredients for a recipe
 * @param {Array} ingredients - Array of { name, quantity, unit }
 * @param {number} servings - Number of servings to calculate for
 * @param {boolean} buffer - Whether to apply 20% buffer
 * @returns {Array} Scaled ingredients with base and required quantities
 */
export const calculateIngredients = (ingredients, servings, buffer = false) => {
  const multiplier = buffer ? servings * 1.2 : servings;
  return ingredients.map((ing) => ({
    name: ing.name,
    baseQuantity: ing.quantity,
    requiredQuantity: Math.round(ing.quantity * multiplier * 100) / 100,
    unit: ing.unit,
  }));
};

/**
 * Aggregate ingredients from multiple recipes
 * @param {Array} recipeItems - Array of { recipe, servings }
 * @param {boolean} buffer - Whether to apply 20% buffer
 * @returns {Array} Aggregated ingredients
 */
export const aggregateIngredients = (recipeItems, buffer = false) => {
  const ingredientMap = {};

  recipeItems.forEach(({ recipe, servings }) => {
    const multiplier = buffer ? servings * 1.2 : servings;
    recipe.ingredients.forEach((ing) => {
      const key = `${ing.name}__${ing.unit}`;
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

  return Object.values(ingredientMap).map((ing) => ({
    ...ing,
    quantity: Math.round(ing.quantity * 100) / 100,
  }));
};
