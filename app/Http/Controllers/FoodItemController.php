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
            'status'          => 'required|string|in:Active,Inactive',
        ], [
            'uom_id.required'          => 'Default UOM is required.',
            'uom_id.exists'            => 'Selected UOM is invalid.',
            'storage_type_id.required' => 'Storage Type is required.',
            'storage_type_id.exists'   => 'Selected Storage Type is invalid.',
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

        $foodItem = FoodItem::create([
            'tenant_id'       => $tenantId,
            'name'            => $request->name,
            'uom_id'          => $request->uom_id,
            'storage_type_id' => $request->storage_type_id,
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
            'status'          => 'required|string|in:Active,Inactive',
        ], [
            'uom_id.required'          => 'Default UOM is required.',
            'uom_id.exists'            => 'Selected UOM is invalid.',
            'storage_type_id.required' => 'Storage Type is required.',
            'storage_type_id.exists'   => 'Selected Storage Type is invalid.',
        ]);

        // Duplicate check (excluding current id)
        $exists = FoodItem::where('tenant_id', $tenantId)
            ->where('name', $request->name)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['This food item already exists.']]], 422);
        }

        $foodItem->update([
            'name'            => $request->name,
            'uom_id'          => $request->uom_id,
            'storage_type_id' => $request->storage_type_id,
            'status'          => $request->status,
        ]);

        return response()->json($foodItem->load(['uom', 'storageType']));
    }
}
