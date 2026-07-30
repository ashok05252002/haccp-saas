<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SupplierController extends Controller
{
    /**
     * Display a listing of suppliers for the tenant.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $suppliers = Supplier::with(['categories', 'ingredients'])
            ->where('tenant_id', $tenantId)
            ->orderBy('name')
            ->get();

        return response()->json($suppliers);
    }

    /**
     * Store a newly created supplier.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'           => 'required|string|max:255',
            'phone'          => 'nullable|string|max:255',
            'email'          => 'nullable|email|max:255',
            'address'        => 'nullable|string',
            'status'         => 'required|string|in:Active,Inactive',
            'category_ids'   => 'nullable|array',
            'category_ids.*' => 'integer|exists:ingredient_categories,id',
            'ingredient_ids' => 'nullable|array',
            'ingredient_ids.*' => 'integer|exists:ingredients,id',
        ]);

        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Check duplicate name for tenant
        $exists = Supplier::where('tenant_id', $tenantId)
            ->where('name', $request->name)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['A supplier with this name already exists.']]], 422);
        }

        $supplier = Supplier::create([
            'tenant_id'      => $tenantId,
            'name'           => $request->name,
            'phone'          => $request->phone,
            'email'          => $request->email,
            'address'        => $request->address,
            'status'         => $request->status,
        ]);

        if ($request->has('category_ids')) {
            $supplier->categories()->sync($request->category_ids);
        }

        if ($request->has('ingredient_ids')) {
            $supplier->ingredients()->sync($request->ingredient_ids);
        }

        return response()->json($supplier->load(['categories', 'ingredients']), 201);
    }

    /**
     * Display the specified supplier details.
     */
    public function show($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $supplier = Supplier::with(['categories', 'ingredients'])
            ->where('tenant_id', $tenantId)
            ->findOrFail($id);

        return response()->json($supplier);
    }

    /**
     * Update the specified supplier.
     */
    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $supplier = Supplier::where('tenant_id', $tenantId)->findOrFail($id);

        $request->validate([
            'name'           => 'required|string|max:255',
            'phone'          => 'nullable|string|max:255',
            'email'          => 'nullable|email|max:255',
            'address'        => 'nullable|string',
            'status'         => 'required|string|in:Active,Inactive',
            'category_ids'   => 'nullable|array',
            'category_ids.*' => 'integer|exists:ingredient_categories,id',
            'ingredient_ids' => 'nullable|array',
            'ingredient_ids.*' => 'integer|exists:ingredients,id',
        ]);

        // Duplicate name check
        $exists = Supplier::where('tenant_id', $tenantId)
            ->where('name', $request->name)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['A supplier with this name already exists.']]], 422);
        }

        $supplier->update([
            'name'           => $request->name,
            'phone'          => $request->phone,
            'email'          => $request->email,
            'address'        => $request->address,
            'status'         => $request->status,
        ]);

        if ($request->has('category_ids')) {
            $supplier->categories()->sync($request->category_ids);
        } else {
            $supplier->categories()->detach();
        }

        if ($request->has('ingredient_ids')) {
            $supplier->ingredients()->sync($request->ingredient_ids);
        } else {
            $supplier->ingredients()->detach();
        }

        return response()->json($supplier->load(['categories', 'ingredients']));
    }

    /**
     * Toggle status of supplier.
     */
    public function toggleStatus($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $supplier = Supplier::where('tenant_id', $tenantId)->findOrFail($id);

        $nextStatus = $supplier->status === 'Active' ? 'Inactive' : 'Active';
        $supplier->update(['status' => $nextStatus]);

        return response()->json($supplier->load(['categories', 'ingredients']));
    }
}
