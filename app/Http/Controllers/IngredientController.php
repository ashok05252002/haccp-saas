<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class IngredientController extends Controller
{
    /**
     * Display a listing of the ingredients for the authenticated tenant.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $ingredients = Ingredient::with(['uom', 'category'])
            ->where('tenant_id', $tenantId)
            ->orderBy('name')
            ->get();

        return response()->json($ingredients);
    }

    /**
     * Store a newly created ingredient in database.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'                   => 'required|string|max:255',
            'uom_id'                 => 'required|integer|exists:uoms,id',
            'ingredient_category_id' => 'required|integer|exists:ingredient_categories,id',
            'cost_price'             => 'nullable|numeric|min:0',
            'cost_quantity'          => 'nullable|numeric|gt:0',
            'status'                 => 'required|string|in:Active,Inactive',
        ], [
            'uom_id.required'                 => 'Please select Default UOM.',
            'uom_id.exists'                   => 'Selected Default UOM is invalid.',
            'ingredient_category_id.required' => 'Ingredient Category is required.',
            'ingredient_category_id.exists'   => 'Selected Ingredient Category is invalid.',
            'cost_price.numeric'              => 'Purchase price must be a valid number.',
            'cost_price.min'                  => 'Purchase price cannot be negative.',
            'cost_quantity.numeric'           => 'Package quantity must be a valid number.',
            'cost_quantity.gt'                => 'Package quantity must be greater than zero.',
        ]);

        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Check unique name for this tenant
        $exists = Ingredient::where('tenant_id', $tenantId)
            ->where('name', $request->name)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['This ingredient already exists.']]], 422);
        }

        $costPrice = ($request->filled('cost_price') && $request->cost_price !== null) ? (float) $request->cost_price : null;
        $costQty   = ($costPrice !== null) ? ($request->filled('cost_quantity') ? (float) $request->cost_quantity : 1.0) : null;
        $unitCost  = ($costPrice !== null && $costQty > 0) ? round($costPrice / $costQty, 4) : null;

        $ingredient = Ingredient::create([
            'tenant_id'              => $tenantId,
            'name'                   => $request->name,
            'uom_id'                 => $request->uom_id,
            'ingredient_category_id' => $request->ingredient_category_id,
            'cost_price'             => $costPrice,
            'cost_quantity'          => $costQty,
            'unit_cost'              => $unitCost,
            'status'                 => $request->status,
        ]);

        return response()->json($ingredient->load(['uom', 'category']), 201);
    }

    /**
     * Update the specified ingredient in database.
     */
    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $ingredient = Ingredient::where('tenant_id', $tenantId)->findOrFail($id);

        $request->validate([
            'name'                   => 'required|string|max:255',
            'uom_id'                 => 'required|integer|exists:uoms,id',
            'ingredient_category_id' => 'required|integer|exists:ingredient_categories,id',
            'cost_price'             => 'nullable|numeric|min:0',
            'cost_quantity'          => 'nullable|numeric|gt:0',
            'status'                 => 'required|string|in:Active,Inactive',
        ], [
            'uom_id.required'                 => 'Please select Default UOM.',
            'uom_id.exists'                   => 'Selected Default UOM is invalid.',
            'ingredient_category_id.required' => 'Ingredient Category is required.',
            'ingredient_category_id.exists'   => 'Selected Ingredient Category is invalid.',
            'cost_price.numeric'              => 'Purchase price must be a valid number.',
            'cost_price.min'                  => 'Purchase price cannot be negative.',
            'cost_quantity.numeric'           => 'Package quantity must be a valid number.',
            'cost_quantity.gt'                => 'Package quantity must be greater than zero.',
        ]);

        // Check duplicate name on update (excluding current)
        $exists = Ingredient::where('tenant_id', $tenantId)
            ->where('name', $request->name)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['This ingredient already exists.']]], 422);
        }

        $costPrice = ($request->filled('cost_price') && $request->cost_price !== null) ? (float) $request->cost_price : null;
        $costQty   = ($costPrice !== null) ? ($request->filled('cost_quantity') ? (float) $request->cost_quantity : 1.0) : null;
        $unitCost  = ($costPrice !== null && $costQty > 0) ? round($costPrice / $costQty, 4) : null;

        $ingredient->update([
            'name'                   => $request->name,
            'uom_id'                 => $request->uom_id,
            'ingredient_category_id' => $request->ingredient_category_id,
            'cost_price'             => $costPrice,
            'cost_quantity'          => $costQty,
            'unit_cost'              => $unitCost,
            'status'                 => $request->status,
        ]);

        return response()->json($ingredient->load(['uom', 'category']));
    }

    /**
     * Remove the specified ingredient from database.
     */
    public function destroy($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $ingredient = Ingredient::where('tenant_id', $tenantId)->findOrFail($id);

        $ingredient->delete();

        return response()->json(['success' => true]);
    }
}
