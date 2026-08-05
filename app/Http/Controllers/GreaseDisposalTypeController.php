<?php

namespace App\Http\Controllers;

use App\Models\GreaseDisposalType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GreaseDisposalTypeController extends Controller
{
    private array $defaultTypes = [
        'Used oil disposal',
        'Grease trap cleaning',
        'Fryer deep clean',
        'Contractor grease removal',
    ];

    /**
     * Display a listing of disposal / cleaning types for authenticated tenant & branch.
     * Seeds default types once per tenant & branch if empty.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        // BelongsToBranch handles branch_id scoping automatically
        $types = GreaseDisposalType::orderBy('id')->get();

        if ($types->isEmpty()) {
            foreach ($this->defaultTypes as $typeName) {
                GreaseDisposalType::create([
                    'tenant_id' => $tenantId,
                    'name'      => $typeName,
                    'status'    => 'Active',
                ]);
            }
            $types = GreaseDisposalType::orderBy('id')->get();
        }

        return response()->json($types);
    }

    /**
     * Store a newly created disposal / cleaning type in database.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'   => 'required|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Disposal / Cleaning Type Name is required.',
        ]);

        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Duplicate check for this tenant & branch
        $exists = GreaseDisposalType::where('name', $request->name)->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['A disposal / cleaning type with this name already exists.']]], 422);
        }

        $type = GreaseDisposalType::create([
            'tenant_id' => $tenantId,
            'name'      => $request->name,
            'status'    => $request->status,
        ]);

        return response()->json($type, 201);
    }

    /**
     * Update the specified disposal / cleaning type in database.
     */
    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $type = GreaseDisposalType::findOrFail($id);

        $request->validate([
            'name'   => 'required|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Disposal / Cleaning Type Name is required.',
        ]);

        // Duplicate check excluding current id
        $exists = GreaseDisposalType::where('name', $request->name)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['A disposal / cleaning type with this name already exists.']]], 422);
        }

        $type->update([
            'name'   => $request->name,
            'status' => $request->status,
        ]);

        return response()->json($type);
    }
}
