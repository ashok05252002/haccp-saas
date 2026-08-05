<?php

namespace App\Http\Controllers;

use App\Models\WasteType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WasteTypeController extends Controller
{
    private array $defaultTypes = [
        'Organic / Processing Scraps',
        'Rejected / Expired Product',
        'Clean Packaging Waste',
        'Brand-Printed / Labelled Waste',
        'Sanitation & PPE Waste',
        'Animal By-Products (ABP)',
        'Chemical & CIP Waste',
        'Broken Glass / Hard Plastic',
        'Wastewater / Grease Trap Sludge',
    ];

    /**
     * Display a listing of waste types for authenticated tenant & branch.
     * Seeds default types once per tenant & branch if empty.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        // BelongsToBranch handles branch_id scoping automatically
        $types = WasteType::orderBy('id')->get();

        if ($types->isEmpty()) {
            foreach ($this->defaultTypes as $typeName) {
                WasteType::create([
                    'tenant_id' => $tenantId,
                    'name'      => $typeName,
                    'status'    => 'Active',
                ]);
            }
            $types = WasteType::orderBy('id')->get();
        }

        return response()->json($types);
    }

    /**
     * Store a newly created waste type in database.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'   => 'required|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Waste Type Name is required.',
        ]);

        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Duplicate check for this tenant & branch
        $exists = WasteType::where('name', $request->name)->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['A waste type with this name already exists.']]], 422);
        }

        $type = WasteType::create([
            'tenant_id' => $tenantId,
            'name'      => $request->name,
            'status'    => $request->status,
        ]);

        return response()->json($type, 201);
    }

    /**
     * Update the specified waste type in database.
     */
    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $type = WasteType::findOrFail($id);

        $request->validate([
            'name'   => 'required|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Waste Type Name is required.',
        ]);

        // Duplicate check excluding current id
        $exists = WasteType::where('name', $request->name)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['A waste type with this name already exists.']]], 422);
        }

        $type->update([
            'name'   => $request->name,
            'status' => $request->status,
        ]);

        return response()->json($type);
    }
}
