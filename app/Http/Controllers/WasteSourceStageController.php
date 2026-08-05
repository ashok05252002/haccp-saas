<?php

namespace App\Http\Controllers;

use App\Models\WasteSourceStage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WasteSourceStageController extends Controller
{
    private array $defaultStages = [
        'Receiving',
        'Storage',
        'Preparation',
        'Cooking',
        'Cooling / Holding',
        'Service',
        'Returned plate',
        'Buffet / Display',
        'Stock check',
    ];

    /**
     * Display a listing of waste sources/stages for authenticated tenant & branch.
     * Seeds default stages once per tenant & branch if empty.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        // BelongsToBranch handles branch_id scoping automatically
        $stages = WasteSourceStage::orderBy('id')->get();

        if ($stages->isEmpty()) {
            foreach ($this->defaultStages as $stageName) {
                WasteSourceStage::create([
                    'tenant_id' => $tenantId,
                    'name'      => $stageName,
                    'status'    => 'Active',
                ]);
            }
            $stages = WasteSourceStage::orderBy('id')->get();
        }

        return response()->json($stages);
    }

    /**
     * Store a newly created waste source/stage in database.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'   => 'required|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Waste Source / Stage Name is required.',
        ]);

        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Duplicate check for this tenant & branch
        $exists = WasteSourceStage::where('name', $request->name)->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['A waste source / stage with this name already exists.']]], 422);
        }

        $stage = WasteSourceStage::create([
            'tenant_id' => $tenantId,
            'name'      => $request->name,
            'status'    => $request->status,
        ]);

        return response()->json($stage, 201);
    }

    /**
     * Update the specified waste source/stage in database.
     */
    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $stage = WasteSourceStage::findOrFail($id);

        $request->validate([
            'name'   => 'required|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Waste Source / Stage Name is required.',
        ]);

        // Duplicate check excluding current id
        $exists = WasteSourceStage::where('name', $request->name)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['A waste source / stage with this name already exists.']]], 422);
        }

        $stage->update([
            'name'   => $request->name,
            'status' => $request->status,
        ]);

        return response()->json($stage);
    }
}
