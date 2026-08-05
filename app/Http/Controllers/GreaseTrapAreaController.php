<?php

namespace App\Http\Controllers;

use App\Models\GreaseTrapArea;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GreaseTrapAreaController extends Controller
{
    private array $defaultAreas = [
        'Main kitchen grease trap',
        'Fryer area',
        'Wash-up area grease trap',
        'External grease collection point',
    ];

    /**
     * Display a listing of grease trap / area details for authenticated tenant & branch.
     * Seeds default areas once per tenant & branch if empty.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        // BelongsToBranch handles branch_id scoping automatically
        $areas = GreaseTrapArea::orderBy('id')->get();

        if ($areas->isEmpty()) {
            foreach ($this->defaultAreas as $areaName) {
                GreaseTrapArea::create([
                    'tenant_id' => $tenantId,
                    'name'      => $areaName,
                    'status'    => 'Active',
                ]);
            }
            $areas = GreaseTrapArea::orderBy('id')->get();
        }

        return response()->json($areas);
    }

    /**
     * Store a newly created grease trap / area detail in database.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'   => 'required|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Grease Trap / Area Name is required.',
        ]);

        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Duplicate check for this tenant & branch
        $exists = GreaseTrapArea::where('name', $request->name)->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['A grease trap / area with this name already exists.']]], 422);
        }

        $area = GreaseTrapArea::create([
            'tenant_id' => $tenantId,
            'name'      => $request->name,
            'status'    => $request->status,
        ]);

        return response()->json($area, 201);
    }

    /**
     * Update the specified grease trap / area detail in database.
     */
    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $area = GreaseTrapArea::findOrFail($id);

        $request->validate([
            'name'   => 'required|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Grease Trap / Area Name is required.',
        ]);

        // Duplicate check excluding current id
        $exists = GreaseTrapArea::where('name', $request->name)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['A grease trap / area with this name already exists.']]], 422);
        }

        $area->update([
            'name'   => $request->name,
            'status' => $request->status,
        ]);

        return response()->json($area);
    }
}
