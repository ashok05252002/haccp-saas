<?php

namespace App\Http\Controllers;

use App\Models\WasteReason;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WasteReasonController extends Controller
{
    private array $defaultReasons = [
        'Spoilage',
        'Preparation waste',
        'Returned plate',
        'Over production',
        'Expired raw materials',
        'Damaged packaging',
        'Temperature abuse',
        'Contamination risk',
        'Quality rejected',
    ];

    /**
     * Display a listing of waste reasons for authenticated tenant & branch.
     * Seeds default reasons once per tenant & branch if empty.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        // BelongsToBranch handles branch_id scoping automatically
        $reasons = WasteReason::orderBy('id')->get();

        if ($reasons->isEmpty()) {
            foreach ($this->defaultReasons as $reasonName) {
                WasteReason::create([
                    'tenant_id' => $tenantId,
                    'name'      => $reasonName,
                    'status'    => 'Active',
                ]);
            }
            $reasons = WasteReason::orderBy('id')->get();
        }

        return response()->json($reasons);
    }

    /**
     * Store a newly created waste reason in database.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'   => 'required|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Waste Reason Name is required.',
        ]);

        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Duplicate check for this tenant & branch
        $exists = WasteReason::where('name', $request->name)->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['A waste reason with this name already exists.']]], 422);
        }

        $reason = WasteReason::create([
            'tenant_id' => $tenantId,
            'name'      => $request->name,
            'status'    => $request->status,
        ]);

        return response()->json($reason, 201);
    }

    /**
     * Update the specified waste reason in database.
     */
    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $reason = WasteReason::findOrFail($id);

        $request->validate([
            'name'   => 'required|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Waste Reason Name is required.',
        ]);

        // Duplicate check excluding current id
        $exists = WasteReason::where('name', $request->name)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['A waste reason with this name already exists.']]], 422);
        }

        $reason->update([
            'name'   => $request->name,
            'status' => $request->status,
        ]);

        return response()->json($reason);
    }
}
