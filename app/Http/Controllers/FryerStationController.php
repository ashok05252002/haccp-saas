<?php

namespace App\Http\Controllers;

use App\Models\FryerStation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FryerStationController extends Controller
{
    /**
     * Display a listing of fryer stations for authenticated tenant & branch.
     * Starts empty - no auto-seeding.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        // BelongsToBranch handles branch_id scoping automatically
        $stations = FryerStation::orderBy('name')->get();

        return response()->json($stations);
    }

    /**
     * Store a newly created fryer station in database.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'   => 'required|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Fryer / Cooking Station Name is required.',
        ]);

        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Duplicate check for this tenant & branch
        $exists = FryerStation::where('name', $request->name)->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['A fryer / cooking station with this name already exists.']]], 422);
        }

        $station = FryerStation::create([
            'tenant_id' => $tenantId,
            'name'      => $request->name,
            'status'    => $request->status,
        ]);

        return response()->json($station, 201);
    }

    /**
     * Update the specified fryer station in database.
     */
    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $station = FryerStation::findOrFail($id);

        $request->validate([
            'name'   => 'required|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Fryer / Cooking Station Name is required.',
        ]);

        // Duplicate check excluding current id
        $exists = FryerStation::where('name', $request->name)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['A fryer / cooking station with this name already exists.']]], 422);
        }

        $station->update([
            'name'   => $request->name,
            'status' => $request->status,
        ]);

        return response()->json($station);
    }
}
