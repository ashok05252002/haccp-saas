<?php

namespace App\Http\Controllers;

use App\Models\DefrostingMethod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DefrostingMethodController extends Controller
{
    /**
     * Display a listing of defrosting methods for authenticated tenant & branch.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        // BelongsToBranch trait handles branch_id scoping automatically
        $methods = DefrostingMethod::orderBy('name')->get();

        return response()->json($methods);
    }

    /**
     * Store a newly created defrosting method in database.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'   => 'required|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Defrosting Method Name is required.',
        ]);

        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Duplicate check for this tenant & branch (BranchScope applies automatically)
        $exists = DefrostingMethod::where('name', $request->name)->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['A defrosting method with this name already exists.']]], 422);
        }

        $method = DefrostingMethod::create([
            'tenant_id' => $tenantId,
            'name'      => $request->name,
            'status'    => $request->status,
        ]);

        return response()->json($method, 201);
    }

    /**
     * Update the specified defrosting method in database.
     */
    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $method = DefrostingMethod::findOrFail($id);

        $request->validate([
            'name'   => 'required|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Defrosting Method Name is required.',
        ]);

        // Duplicate check excluding current id
        $exists = DefrostingMethod::where('name', $request->name)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['A defrosting method with this name already exists.']]], 422);
        }

        $method->update([
            'name'   => $request->name,
            'status' => $request->status,
        ]);

        return response()->json($method);
    }
}
