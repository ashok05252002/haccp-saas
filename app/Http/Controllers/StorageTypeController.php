<?php

namespace App\Http\Controllers;

use App\Models\StorageType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StorageTypeController extends Controller
{
    /**
     * Display a listing of storage types for the authenticated tenant.
     * Seed defaults if none exist for the tenant.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        // Seed defaults if tenant has no storage types
        $count = StorageType::where('tenant_id', $tenantId)->count();
        if ($count === 0) {
            $defaults = [
                [
                    'tenant_id' => $tenantId,
                    'name' => 'Chilled food',
                    'temperature_required' => true,
                    'min_temp' => 0.00,
                    'max_temp' => 5.00,
                    'rule_text' => '0°C to 5°C',
                    'status' => 'Active',
                ],
                [
                    'tenant_id' => $tenantId,
                    'name' => 'Frozen food',
                    'temperature_required' => true,
                    'min_temp' => null,
                    'max_temp' => -18.00,
                    'rule_text' => '≤ -18°C',
                    'status' => 'Active',
                ],
                [
                    'tenant_id' => $tenantId,
                    'name' => 'Ambient food',
                    'temperature_required' => false,
                    'min_temp' => null,
                    'max_temp' => null,
                    'rule_text' => 'Food can be safely stored at room temperature',
                    'status' => 'Active',
                ],
                [
                    'tenant_id' => $tenantId,
                    'name' => 'Hot food',
                    'temperature_required' => true,
                    'min_temp' => 63.00,
                    'max_temp' => null,
                    'rule_text' => '≥ 63°C',
                    'status' => 'Active',
                ],
            ];

            foreach ($defaults as $default) {
                StorageType::create($default);
            }
        }

        $storageTypes = StorageType::where('tenant_id', $tenantId)
            ->orderBy('id')
            ->get();

        return response()->json($storageTypes);
    }

    /**
     * Store a newly created storage type.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'                 => 'required|string|max:255',
            'temperature_required' => 'boolean',
            'min_temp'             => 'nullable|numeric',
            'max_temp'             => 'nullable|numeric',
            'rule_text'            => 'nullable|string|max:255',
            'status'               => 'required|string|in:Active,Inactive',
        ]);

        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Duplicate check
        $exists = StorageType::where('tenant_id', $tenantId)
            ->where('name', $request->name)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['This storage type already exists.']]], 422);
        }

        $storageType = StorageType::create([
            'tenant_id'            => $tenantId,
            'name'                 => $request->name,
            'temperature_required' => $request->boolean('temperature_required'),
            'min_temp'             => $request->filled('min_temp') ? $request->min_temp : null,
            'max_temp'             => $request->filled('max_temp') ? $request->max_temp : null,
            'rule_text'            => $request->rule_text ?: null,
            'status'               => $request->status,
        ]);

        return response()->json($storageType, 201);
    }

    /**
     * Update the specified storage type.
     */
    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $storageType = StorageType::where('tenant_id', $tenantId)->findOrFail($id);

        $request->validate([
            'name'                 => 'required|string|max:255',
            'temperature_required' => 'boolean',
            'min_temp'             => 'nullable|numeric',
            'max_temp'             => 'nullable|numeric',
            'rule_text'            => 'nullable|string|max:255',
            'status'               => 'required|string|in:Active,Inactive',
        ]);

        // Duplicate check (excluding current id)
        $exists = StorageType::where('tenant_id', $tenantId)
            ->where('name', $request->name)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['This storage type already exists.']]], 422);
        }

        $storageType->update([
            'name'                 => $request->name,
            'temperature_required' => $request->boolean('temperature_required'),
            'min_temp'             => $request->filled('min_temp') ? $request->min_temp : null,
            'max_temp'             => $request->filled('max_temp') ? $request->max_temp : null,
            'rule_text'            => $request->rule_text ?: null,
            'status'               => $request->status,
        ]);

        return response()->json($storageType);
    }
}
