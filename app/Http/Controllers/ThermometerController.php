<?php

namespace App\Http\Controllers;

use App\Models\Thermometer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ThermometerController extends Controller
{
    /**
     * Display a listing of thermometers for the authenticated tenant.
     * Starts empty - no default auto-seeding.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $thermometers = Thermometer::where('tenant_id', $tenantId)
            ->orderBy('name')
            ->get();

        return response()->json($thermometers);
    }

    /**
     * Store a newly created thermometer/probe in database.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'          => 'required|string|max:255',
            'serial_number' => 'nullable|string|max:255',
            'status'        => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Thermometer Name / ID is required.',
        ]);

        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Check duplicate name for this tenant
        $nameExists = Thermometer::where('tenant_id', $tenantId)
            ->where('name', $request->name)
            ->exists();
        if ($nameExists) {
            return response()->json(['errors' => ['name' => ['This Thermometer Name / ID already exists.']]], 422);
        }

        // Check duplicate serial number for this tenant (if provided)
        if (!empty($request->serial_number)) {
            $snExists = Thermometer::where('tenant_id', $tenantId)
                ->where('serial_number', $request->serial_number)
                ->exists();
            if ($snExists) {
                return response()->json(['errors' => ['serial_number' => ['This Serial Number already exists.']]], 422);
            }
        }

        $thermometer = Thermometer::create([
            'tenant_id'     => $tenantId,
            'name'          => $request->name,
            'serial_number' => $request->serial_number ?: null,
            'status'        => $request->status,
        ]);

        return response()->json($thermometer, 201);
    }

    /**
     * Update the specified thermometer/probe in database.
     */
    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $thermometer = Thermometer::where('tenant_id', $tenantId)->findOrFail($id);

        $request->validate([
            'name'          => 'required|string|max:255',
            'serial_number' => 'nullable|string|max:255',
            'status'        => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Thermometer Name / ID is required.',
        ]);

        // Check duplicate name excluding current id
        $nameExists = Thermometer::where('tenant_id', $tenantId)
            ->where('name', $request->name)
            ->where('id', '!=', $id)
            ->exists();
        if ($nameExists) {
            return response()->json(['errors' => ['name' => ['This Thermometer Name / ID already exists.']]], 422);
        }

        // Check duplicate serial number excluding current id (if provided)
        if (!empty($request->serial_number)) {
            $snExists = Thermometer::where('tenant_id', $tenantId)
                ->where('serial_number', $request->serial_number)
                ->where('id', '!=', $id)
                ->exists();
            if ($snExists) {
                return response()->json(['errors' => ['serial_number' => ['This Serial Number already exists.']]], 422);
            }
        }

        $thermometer->update([
            'name'          => $request->name,
            'serial_number' => $request->serial_number ?: null,
            'status'        => $request->status,
        ]);

        return response()->json($thermometer);
    }
}
