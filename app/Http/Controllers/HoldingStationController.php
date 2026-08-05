<?php

namespace App\Http\Controllers;

use App\Models\HoldingStation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class HoldingStationController extends Controller
{
    /**
     * Display a listing of holding stations for authenticated tenant & branch.
     * Auto-seeds single default 'Bain Marie' if empty.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        // BelongsToBranch trait handles branch_id scoping automatically
        $stations = HoldingStation::orderBy('name')->get();

        if ($stations->isEmpty()) {
            $defaultStation = HoldingStation::create([
                'tenant_id' => $tenantId,
                'name'      => 'Bain Marie',
                'status'    => 'Active',
            ]);
            return response()->json([$defaultStation]);
        }

        return response()->json($stations);
    }

    /**
     * Store a newly created holding station in database.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'   => 'required|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Holding Station Name is required.',
        ]);

        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Duplicate check for this tenant & branch (BranchScope applies automatically)
        $exists = HoldingStation::where('name', $request->name)->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['A holding station with this name already exists.']]], 422);
        }

        $station = HoldingStation::create([
            'tenant_id' => $tenantId,
            'name'      => $request->name,
            'status'    => $request->status,
        ]);

        return response()->json($station, 201);
    }

    /**
     * Update the specified holding station in database.
     */
    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $station = HoldingStation::findOrFail($id);

        $request->validate([
            'name'   => 'required|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Holding Station Name is required.',
        ]);

        // Duplicate check excluding current id
        $exists = HoldingStation::where('name', $request->name)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['A holding station with this name already exists.']]], 422);
        }

        $station->update([
            'name'   => $request->name,
            'status' => $request->status,
        ]);

        return response()->json($station);
    }
}
