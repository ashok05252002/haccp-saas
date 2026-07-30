<?php

namespace App\Http\Controllers;

use App\Models\TemperatureEquipment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TemperatureEquipmentController extends Controller
{
    /**
     * Helper to get rules based on equipment type.
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
     * Display a listing of temperature equipment for the authenticated tenant.
     * Starts empty - no auto-seeding.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $equipment = TemperatureEquipment::where('tenant_id', $tenantId)
            ->orderBy('name')
            ->get();

        return response()->json($equipment);
    }

    /**
     * Store a newly created equipment in database.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'   => 'required|string|max:255',
            'type'   => 'required|string|in:Fridge,Freezer,Hot Cabinet',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Equipment Name is required.',
            'type.required' => 'Equipment Type is required.',
            'type.in'       => 'Equipment Type must be Fridge, Freezer, or Hot Cabinet.',
        ]);

        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Duplicate check for this tenant
        $exists = TemperatureEquipment::where('tenant_id', $tenantId)
            ->where('name', $request->name)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['Equipment with this name already exists.']]], 422);
        }

        $tempRules = $this->getTemperatureRules($request->type);

        $equipment = TemperatureEquipment::create([
            'tenant_id' => $tenantId,
            'name'      => $request->name,
            'type'      => $request->type,
            'min_temp'  => $tempRules['min_temp'],
            'max_temp'  => $tempRules['max_temp'],
            'rule_text' => $tempRules['rule_text'],
            'status'    => $request->status,
        ]);

        return response()->json($equipment, 201);
    }

    /**
     * Update the specified equipment in database.
     */
    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $equipment = TemperatureEquipment::where('tenant_id', $tenantId)->findOrFail($id);

        $request->validate([
            'name'   => 'required|string|max:255',
            'type'   => 'required|string|in:Fridge,Freezer,Hot Cabinet',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Equipment Name is required.',
            'type.required' => 'Equipment Type is required.',
            'type.in'       => 'Equipment Type must be Fridge, Freezer, or Hot Cabinet.',
        ]);

        // Duplicate check excluding current id
        $exists = TemperatureEquipment::where('tenant_id', $tenantId)
            ->where('name', $request->name)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['Equipment with this name already exists.']]], 422);
        }

        $tempRules = $this->getTemperatureRules($request->type);

        $equipment->update([
            'name'      => $request->name,
            'type'      => $request->type,
            'min_temp'  => $tempRules['min_temp'],
            'max_temp'  => $tempRules['max_temp'],
            'rule_text' => $tempRules['rule_text'],
            'status'    => $request->status,
        ]);

        return response()->json($equipment);
    }
}
