<?php

namespace App\Http\Controllers;

use App\Models\WasteContractor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WasteContractorController extends Controller
{
    /**
     * Display a listing of waste contractors for authenticated tenant & branch.
     * Starts empty - no auto-seeding.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        // BelongsToBranch handles branch_id scoping automatically
        $contractors = WasteContractor::orderBy('name')->get();

        return response()->json($contractors);
    }

    /**
     * Store a newly created waste contractor in database.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'   => 'required|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Waste Contractor Name is required.',
        ]);

        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Duplicate check for this tenant & branch
        $exists = WasteContractor::where('name', $request->name)->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['A waste contractor with this name already exists.']]], 422);
        }

        $contractor = WasteContractor::create([
            'tenant_id' => $tenantId,
            'name'      => $request->name,
            'status'    => $request->status,
        ]);

        return response()->json($contractor, 201);
    }

    /**
     * Update the specified waste contractor in database.
     */
    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $contractor = WasteContractor::findOrFail($id);

        $request->validate([
            'name'   => 'required|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Waste Contractor Name is required.',
        ]);

        // Duplicate check excluding current id
        $exists = WasteContractor::where('name', $request->name)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['A waste contractor with this name already exists.']]], 422);
        }

        $contractor->update([
            'name'   => $request->name,
            'status' => $request->status,
        ]);

        return response()->json($contractor);
    }
}
