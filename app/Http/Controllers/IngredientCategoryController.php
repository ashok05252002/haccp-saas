<?php

namespace App\Http\Controllers;

use App\Models\IngredientCategory;
use App\Models\Ingredient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class IngredientCategoryController extends Controller
{
    /**
     * Display a listing of ingredient categories for the tenant with ingredients count.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $categories = IngredientCategory::withCount(['ingredients' => function ($q) {
            $q->where('status', 'Active');
        }])
        ->where('tenant_id', $tenantId)
        ->orderBy('name')
        ->get();

        return response()->json($categories);
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
        ]);

        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Unique name check per tenant
        $exists = IngredientCategory::where('tenant_id', $tenantId)
            ->where('name', $request->name)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['This ingredient category already exists.']]], 422);
        }

        $category = IngredientCategory::create([
            'tenant_id' => $tenantId,
            'name' => $request->name,
            'status' => $request->status,
        ]);

        $category->ingredients_count = 0;

        return response()->json($category, 201);
    }

    /**
     * Update the specified category.
     */
    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $category = IngredientCategory::where('tenant_id', $tenantId)->findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
        ]);

        // Duplicate name check
        $exists = IngredientCategory::where('tenant_id', $tenantId)
            ->where('name', $request->name)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['This ingredient category already exists.']]], 422);
        }

        // In-use status guard: prevent deactivating if active ingredients are attached
        if ($request->status === 'Inactive' && $category->status === 'Active') {
            $activeIngsCount = Ingredient::where('ingredient_category_id', $id)
                ->where('status', 'Active')
                ->count();
            if ($activeIngsCount > 0) {
                return response()->json([
                    'errors' => ['status' => ["Cannot set to Inactive. This category is currently assigned to {$activeIngsCount} active ingredient(s)."]]
                ], 422);
            }
        }

        $category->update([
            'name' => $request->name,
            'status' => $request->status,
        ]);

        $category->loadCount(['ingredients' => function ($q) {
            $q->where('status', 'Active');
        }]);

        return response()->json($category);
    }
}
