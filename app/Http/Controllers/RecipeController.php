<?php

namespace App\Http\Controllers;

use App\Models\Recipe;
use App\Models\RecipeIngredient;
use App\Models\Ingredient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RecipeController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $query = Recipe::with('ingredients')->where('tenant_id', $tenantId);

        if ($request->filled('search')) {
            $s = strtolower($request->search);
            $query->where(function ($q) use ($s) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$s}%"])
                  ->orWhereRaw('LOWER(category) LIKE ?', ["%{$s}%"])
                  ->orWhereRaw('LOWER(description) LIKE ?', ["%{$s}%"]);
            });
        }

        if ($request->filled('category') && $request->category !== 'All') {
            $query->where('category', $request->category);
        }

        $recipes = $query->orderBy('name')->get();

        return response()->json($recipes);
    }

    public function show($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $recipe = Recipe::with('ingredients')->where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();

        return response()->json($recipe);
    }

    public function store(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;
        $branchId = Auth::user()->branch_id;

        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'prep_time' => 'nullable|string|max:50',
            'servings' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'haccp_notes' => 'nullable|string',
            'allergens' => 'nullable|array',
            'ingredients' => 'nullable|array',
            'ingredients.*.ingredient_name' => 'required|string|max:255',
            'ingredients.*.ingredient_id' => 'nullable|integer',
            'ingredients.*.quantity' => 'required|numeric|min:0',
            'ingredients.*.unit' => 'required|string|max:50',
        ]);

        $recipe = Recipe::create([
            'tenant_id' => $tenantId,
            'branch_id' => $branchId,
            'name' => $request->name,
            'category' => $request->category,
            'prep_time' => $request->prep_time,
            'servings' => $request->servings,
            'description' => $request->description,
            'haccp_notes' => $request->haccp_notes,
            'allergens' => $request->allergens ?? [],
            'status' => 'Active',
        ]);

        if (!empty($request->ingredients)) {
            foreach ($request->ingredients as $ing) {
                RecipeIngredient::create([
                    'recipe_id' => $recipe->id,
                    'ingredient_id' => $ing['ingredient_id'] ?? null,
                    'ingredient_name' => $ing['ingredient_name'],
                    'quantity' => $ing['quantity'],
                    'unit' => $ing['unit'],
                ]);
            }
        }

        return response()->json(['message' => 'Recipe created successfully', 'recipe' => $recipe->load('ingredients')], 201);
    }

    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $recipe = Recipe::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();

        $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'prep_time' => 'nullable|string|max:50',
            'servings' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'haccp_notes' => 'nullable|string',
            'allergens' => 'nullable|array',
            'ingredients' => 'nullable|array',
        ]);

        $recipe->update([
            'name' => $request->name,
            'category' => $request->category,
            'prep_time' => $request->prep_time,
            'servings' => $request->servings,
            'description' => $request->description,
            'haccp_notes' => $request->haccp_notes,
            'allergens' => $request->allergens ?? [],
        ]);

        // Sync ingredients
        RecipeIngredient::where('recipe_id', $recipe->id)->delete();
        if (!empty($request->ingredients)) {
            foreach ($request->ingredients as $ing) {
                RecipeIngredient::create([
                    'recipe_id' => $recipe->id,
                    'ingredient_id' => $ing['ingredient_id'] ?? null,
                    'ingredient_name' => $ing['ingredient_name'],
                    'quantity' => $ing['quantity'],
                    'unit' => $ing['unit'],
                ]);
            }
        }

        return response()->json(['message' => 'Recipe updated successfully', 'recipe' => $recipe->load('ingredients')]);
    }

    public function destroy($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $recipe = Recipe::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();
        $recipe->delete();

        return response()->json(['message' => 'Recipe deleted successfully']);
    }
}
