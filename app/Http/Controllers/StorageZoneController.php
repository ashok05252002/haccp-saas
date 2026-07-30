<?php

namespace App\Http\Controllers;

use App\Models\StorageZone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StorageZoneController extends Controller
{
    /**
     * Helper to get rules based on storage zone type.
     */
    private function getTemperatureRules(string $type): array
    {
        switch ($type) {
            case 'Fridge':
                return [
                    'min_temp'  => 0.00,
                    'max_temp'  => 5.00,
                    'rule_text' => '0°C to 5°C',
                ];
            case 'Freezer':
                return [
                    'min_temp'  => null,
                    'max_temp'  => -18.00,
                    'rule_text' => '-18°C or below',
                ];
            case 'Hot Cabinet':
                return [
                    'min_temp'  => 63.00,
                    'max_temp'  => null,
                    'rule_text' => '63°C or above',
                ];
            default:
                return [
                    'min_temp'  => null,
                    'max_temp'  => null,
                    'rule_text' => null,
                ];
        }
    }

    /**
     * Display a listing of storage zones for the authenticated tenant.
     * Starts empty - no auto-seeding.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $zones = StorageZone::where('tenant_id', $tenantId)
            ->orderBy('name')
            ->get();

        return response()->json($zones);
    }

    /**
     * Store a newly created storage zone in database.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'   => 'required|string|max:255',
            'type'   => 'required|string|in:Fridge,Freezer,Hot Cabinet',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Storage Zone Name is required.',
            'type.required' => 'Storage Zone Type is required.',
            'type.in'       => 'Storage Zone Type must be Fridge, Freezer, or Hot Cabinet.',
        ]);

        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Duplicate check for this tenant
        $exists = StorageZone::where('tenant_id', $tenantId)
            ->where('name', $request->name)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['Storage zone with this name already exists.']]], 422);
        }

        $tempRules = $this->getTemperatureRules($request->type);

        $zone = StorageZone::create([
            'tenant_id' => $tenantId,
            'name'      => $request->name,
            'type'      => $request->type,
            'min_temp'  => $tempRules['min_temp'],
            'max_temp'  => $tempRules['max_temp'],
            'rule_text' => $tempRules['rule_text'],
            'status'    => $request->status,
        ]);

        return response()->json($zone, 201);
    }

    /**
     * Update the specified storage zone in database.
     */
    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $zone = StorageZone::where('tenant_id', $tenantId)->findOrFail($id);

        $request->validate([
            'name'   => 'required|string|max:255',
            'type'   => 'required|string|in:Fridge,Freezer,Hot Cabinet',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Storage Zone Name is required.',
            'type.required' => 'Storage Zone Type is required.',
            'type.in'       => 'Storage Zone Type must be Fridge, Freezer, or Hot Cabinet.',
        ]);

        // Duplicate check excluding current id
        $exists = StorageZone::where('tenant_id', $tenantId)
            ->where('name', $request->name)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['Storage zone with this name already exists.']]], 422);
        }

        $tempRules = $this->getTemperatureRules($request->type);

        $zone->update([
            'name'      => $request->name,
            'type'      => $request->type,
            'min_temp'  => $tempRules['min_temp'],
            'max_temp'  => $tempRules['max_temp'],
            'rule_text' => $tempRules['rule_text'],
            'status'    => $request->status,
        ]);

        return response()->json($zone);
    }
}
