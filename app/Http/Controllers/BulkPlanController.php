<?php

namespace App\Http\Controllers;

use App\Models\BulkPlan;
use App\Models\BulkPlanRecipe;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class BulkPlanController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $plans = BulkPlan::with('recipes')
            ->where('tenant_id', $tenantId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($plans);
    }

    public function show($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $plan = BulkPlan::with('recipes')
            ->where('tenant_id', $tenantId)
            ->where('id', $id)
            ->firstOrFail();

        return response()->json($plan);
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
            'planned_date' => 'nullable|date',
            'status' => 'nullable|string|max:50',
            'supplier_overrides' => 'nullable|array',
            'recipes' => 'nullable|array',
            'recipes.*.recipe_id' => 'nullable',
            'recipes.*.recipe_name' => 'required|string|max:255',
            'recipes.*.base_servings' => 'required|integer|min:1',
            'recipes.*.target_servings' => 'required|integer|min:1',
            'recipes.*.extra_buffer' => 'nullable|boolean',
        ]);

        return DB::transaction(function () use ($request, $tenantId, $branchId) {
            $plan = BulkPlan::create([
                'tenant_id' => $tenantId,
                'branch_id' => $branchId,
                'name' => $request->name,
                'planned_date' => $request->planned_date,
                'status' => $request->status ?? 'draft',
                'supplier_overrides' => $request->supplier_overrides ?? [],
            ]);

            if (!empty($request->recipes)) {
                foreach ($request->recipes as $item) {
                    BulkPlanRecipe::create([
                        'bulk_plan_id' => $plan->id,
                        'recipe_id' => !empty($item['recipe_id']) ? $item['recipe_id'] : null,
                        'recipe_name' => $item['recipe_name'],
                        'base_servings' => $item['base_servings'] ?? 1,
                        'target_servings' => $item['target_servings'] ?? 10,
                        'extra_buffer' => !empty($item['extra_buffer']),
                    ]);
                }
            }

            return response()->json([
                'message' => 'Bulk production plan created successfully',
                'plan' => $plan->load('recipes')
            ], 201);
        });
    }

    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $plan = BulkPlan::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();

        $request->validate([
            'name' => 'required|string|max:255',
            'planned_date' => 'nullable|date',
            'status' => 'nullable|string|max:50',
            'supplier_overrides' => 'nullable|array',
            'recipes' => 'nullable|array',
        ]);

        return DB::transaction(function () use ($request, $plan) {
            $plan->update([
                'name' => $request->name,
                'planned_date' => $request->planned_date,
                'status' => $request->status ?? $plan->status,
                'supplier_overrides' => $request->supplier_overrides ?? [],
            ]);

            // Sync recipes
            BulkPlanRecipe::where('bulk_plan_id', $plan->id)->delete();

            if (!empty($request->recipes)) {
                foreach ($request->recipes as $item) {
                    BulkPlanRecipe::create([
                        'bulk_plan_id' => $plan->id,
                        'recipe_id' => !empty($item['recipe_id']) ? $item['recipe_id'] : null,
                        'recipe_name' => $item['recipe_name'] ?? 'Unnamed Recipe',
                        'base_servings' => $item['base_servings'] ?? 1,
                        'target_servings' => $item['target_servings'] ?? 10,
                        'extra_buffer' => !empty($item['extra_buffer']),
                    ]);
                }
            }

            return response()->json([
                'message' => 'Bulk production plan updated successfully',
                'plan' => $plan->load('recipes')
            ]);
        });
    }

    public function destroy($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $plan = BulkPlan::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();
        $plan->delete();

        return response()->json(['message' => 'Bulk production plan deleted successfully']);
    }
}
