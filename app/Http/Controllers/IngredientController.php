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
            'uom_id'                 => 'nullable|integer|exists:uoms,id',
            'ingredient_category_id' => 'required|integer|exists:ingredient_categories,id',
            'status'                 => 'required|string|in:Active,Inactive',
        ], [
            'ingredient_category_id.required' => 'Ingredient Category is required.',
            'ingredient_category_id.exists'   => 'Selected Ingredient Category is invalid.',
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

        $ingredient = Ingredient::create([
            'tenant_id'              => $tenantId,
            'name'                   => $request->name,
            'uom_id'                 => $request->uom_id ?: null,
            'ingredient_category_id' => $request->ingredient_category_id,
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
            'uom_id'                 => 'nullable|integer|exists:uoms,id',
            'ingredient_category_id' => 'required|integer|exists:ingredient_categories,id',
            'status'                 => 'required|string|in:Active,Inactive',
        ], [
            'ingredient_category_id.required' => 'Ingredient Category is required.',
            'ingredient_category_id.exists'   => 'Selected Ingredient Category is invalid.',
        ]);

        // Check duplicate name on update (excluding current)
        $exists = Ingredient::where('tenant_id', $tenantId)
            ->where('name', $request->name)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['This ingredient already exists.']]], 422);
        }

        $ingredient->update([
            'name'                   => $request->name,
            'uom_id'                 => $request->uom_id ?: null,
            'ingredient_category_id' => $request->ingredient_category_id,
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
