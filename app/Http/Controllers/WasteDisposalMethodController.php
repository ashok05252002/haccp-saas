<?php

namespace App\Http\Controllers;

use App\Models\WasteDisposalMethod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WasteDisposalMethodController extends Controller
{
    private array $defaultMethods = [
        'Food waste bin',
        'General waste',
        'Returned to supplier',
        'Approved waste contractor',
        'Compost / organic waste',
    ];

    /**
     * Display a listing of waste disposal methods for authenticated tenant & branch.
     * Seeds default methods once per tenant & branch if empty.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        // BelongsToBranch handles branch_id scoping automatically
        $methods = WasteDisposalMethod::orderBy('id')->get();

        if ($methods->isEmpty()) {
            foreach ($this->defaultMethods as $methodName) {
                WasteDisposalMethod::create([
                    'tenant_id' => $tenantId,
                    'name'      => $methodName,
                    'status'    => 'Active',
                ]);
            }
            $methods = WasteDisposalMethod::orderBy('id')->get();
        }

        return response()->json($methods);
    }

    /**
     * Store a newly created waste disposal method in database.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'   => 'required|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Disposal Method Name is required.',
        ]);

        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Duplicate check for this tenant & branch
        $exists = WasteDisposalMethod::where('name', $request->name)->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['A disposal method with this name already exists.']]], 422);
        }

        $method = WasteDisposalMethod::create([
            'tenant_id' => $tenantId,
            'name'      => $request->name,
            'status'    => $request->status,
        ]);

        return response()->json($method, 201);
    }

    /**
     * Update the specified waste disposal method in database.
     */
    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $method = WasteDisposalMethod::findOrFail($id);

        $request->validate([
            'name'   => 'required|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Disposal Method Name is required.',
        ]);

        // Duplicate check excluding current id
        $exists = WasteDisposalMethod::where('name', $request->name)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['A disposal method with this name already exists.']]], 422);
        }

        $method->update([
            'name'   => $request->name,
            'status' => $request->status,
        ]);

        return response()->json($method);
    }
}
