<?php

namespace App\Http\Controllers;

use App\Models\CleaningArea;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CleaningAreaController extends Controller
{
    /**
     * Display a listing of cleaning areas for the authenticated tenant.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $cleaningAreas = CleaningArea::where('tenant_id', $tenantId)
            ->orderBy('name')
            ->get();

        return response()->json($cleaningAreas);
    }

    /**
     * Store a newly created cleaning area in database.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'        => 'required|string|max:255',
            'frequency'   => 'required|string|in:Daily,Weekly,Monthly',
            'description' => 'nullable|string',
            'status'      => 'required|string|in:Active,Inactive',
        ], [
            'frequency.in' => 'Selected cleaning frequency must be one of: Daily, Weekly, or Monthly.',
        ]);

        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Duplicate check for this tenant
        $exists = CleaningArea::where('tenant_id', $tenantId)
            ->where('name', $request->name)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['This cleaning area already exists.']]], 422);
        }

        $cleaningArea = CleaningArea::create([
            'tenant_id'   => $tenantId,
            'name'        => $request->name,
            'frequency'   => $request->frequency,
            'description' => $request->description ?: null,
            'status'      => $request->status,
        ]);

        return response()->json($cleaningArea, 201);
    }

    /**
     * Update the specified cleaning area in database.
     */
    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $cleaningArea = CleaningArea::where('tenant_id', $tenantId)->findOrFail($id);

        $request->validate([
            'name'        => 'required|string|max:255',
            'frequency'   => 'required|string|in:Daily,Weekly,Monthly',
            'description' => 'nullable|string',
            'status'      => 'required|string|in:Active,Inactive',
        ], [
            'frequency.in' => 'Selected cleaning frequency must be one of: Daily, Weekly, or Monthly.',
        ]);

        // Duplicate check excluding current id
        $exists = CleaningArea::where('tenant_id', $tenantId)
            ->where('name', $request->name)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['This cleaning area already exists.']]], 422);
        }

        $cleaningArea->update([
            'name'        => $request->name,
            'frequency'   => $request->frequency,
            'description' => $request->description ?: null,
            'status'      => $request->status,
        ]);

        return response()->json($cleaningArea);
    }
}
