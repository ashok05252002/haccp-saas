<?php

namespace App\Http\Controllers;

use App\Models\FoodItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FoodItemController extends Controller
{
    /**
     * Display a listing of food items for the authenticated tenant.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $foodItems = FoodItem::with(['uom', 'storageType'])
            ->where('tenant_id', $tenantId)
            ->orderBy('name')
            ->get();

        return response()->json($foodItems);
    }

    /**
     * Store a newly created food item in database.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'            => 'required|string|max:255',
            'uom_id'          => 'required|integer|exists:uoms,id',
            'storage_type_id' => 'required|integer|exists:storage_types,id',
            'cost_price'      => 'nullable|numeric|min:0',
            'cost_quantity'   => 'nullable|numeric|gt:0',
            'status'          => 'required|string|in:Active,Inactive',
        ], [
            'uom_id.required'          => 'Default UOM is required.',
            'uom_id.exists'            => 'Selected UOM is invalid.',
            'storage_type_id.required' => 'Storage Type is required.',
            'storage_type_id.exists'   => 'Selected Storage Type is invalid.',
            'cost_price.numeric'       => 'Purchase price must be a valid number.',
            'cost_price.min'           => 'Purchase price cannot be negative.',
            'cost_quantity.numeric'    => 'Package quantity must be a valid number.',
            'cost_quantity.gt'         => 'Package quantity must be greater than zero.',
        ]);

        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Duplicate check
        $exists = FoodItem::where('tenant_id', $tenantId)
            ->where('name', $request->name)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['This food item already exists.']]], 422);
        }

        $costPrice = ($request->filled('cost_price') && $request->cost_price !== null) ? (float) $request->cost_price : null;
        $costQty   = ($costPrice !== null) ? ($request->filled('cost_quantity') ? (float) $request->cost_quantity : 1.0) : null;
        $unitCost  = ($costPrice !== null && $costQty > 0) ? round($costPrice / $costQty, 4) : null;

        $foodItem = FoodItem::create([
            'tenant_id'       => $tenantId,
            'name'            => $request->name,
            'uom_id'          => $request->uom_id,
            'storage_type_id' => $request->storage_type_id,
            'cost_price'      => $costPrice,
            'cost_quantity'   => $costQty,
            'unit_cost'       => $unitCost,
            'status'          => $request->status,
        ]);

        return response()->json($foodItem->load(['uom', 'storageType']), 201);
    }

    /**
     * Update the specified food item in database.
     */
    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $foodItem = FoodItem::where('tenant_id', $tenantId)->findOrFail($id);

        $request->validate([
            'name'            => 'required|string|max:255',
            'uom_id'          => 'required|integer|exists:uoms,id',
            'storage_type_id' => 'required|integer|exists:storage_types,id',
            'cost_price'      => 'nullable|numeric|min:0',
            'cost_quantity'   => 'nullable|numeric|gt:0',
            'status'          => 'required|string|in:Active,Inactive',
        ], [
            'uom_id.required'          => 'Default UOM is required.',
            'uom_id.exists'            => 'Selected UOM is invalid.',
            'storage_type_id.required' => 'Storage Type is required.',
            'storage_type_id.exists'   => 'Selected Storage Type is invalid.',
            'cost_price.numeric'       => 'Purchase price must be a valid number.',
            'cost_price.min'           => 'Purchase price cannot be negative.',
            'cost_quantity.numeric'    => 'Package quantity must be a valid number.',
            'cost_quantity.gt'         => 'Package quantity must be greater than zero.',
        ]);

        // Duplicate check (excluding current id)
        $exists = FoodItem::where('tenant_id', $tenantId)
            ->where('name', $request->name)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['This food item already exists.']]], 422);
        }

        $costPrice = ($request->filled('cost_price') && $request->cost_price !== null) ? (float) $request->cost_price : null;
        $costQty   = ($costPrice !== null) ? ($request->filled('cost_quantity') ? (float) $request->cost_quantity : 1.0) : null;
        $unitCost  = ($costPrice !== null && $costQty > 0) ? round($costPrice / $costQty, 4) : null;

        $foodItem->update([
            'name'            => $request->name,
            'uom_id'          => $request->uom_id,
            'storage_type_id' => $request->storage_type_id,
            'cost_price'      => $costPrice,
            'cost_quantity'   => $costQty,
            'unit_cost'       => $unitCost,
            'status'          => $request->status,
        ]);

        return response()->json($foodItem->load(['uom', 'storageType']));
    }
}
