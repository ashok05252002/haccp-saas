<?php

namespace App\Http\Controllers;

use App\Models\OilAction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OilActionController extends Controller
{
    private array $defaultActions = [
        'Continued use',
        'Filtered oil',
        'Topped up oil',
        'Changed oil',
        'Fryer cleaned',
        'Oil discarded',
    ];

    /**
     * Display a listing of oil actions for authenticated tenant & branch.
     * Seeds default actions once per tenant & branch if empty.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        // BelongsToBranch handles branch_id scoping automatically
        $actions = OilAction::orderBy('id')->get();

        if ($actions->isEmpty()) {
            foreach ($this->defaultActions as $actName) {
                OilAction::create([
                    'tenant_id' => $tenantId,
                    'name'      => $actName,
                    'status'    => 'Active',
                ]);
            }
            $actions = OilAction::orderBy('id')->get();
        }

        return response()->json($actions);
    }

    /**
     * Store a newly created oil action in database.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'   => 'required|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Oil Action Name is required.',
        ]);

        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Duplicate check for this tenant & branch
        $exists = OilAction::where('name', $request->name)->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['An oil action with this name already exists.']]], 422);
        }

        $action = OilAction::create([
            'tenant_id' => $tenantId,
            'name'      => $request->name,
            'status'    => $request->status,
        ]);

        return response()->json($action, 201);
    }

    /**
     * Update the specified oil action in database.
     */
    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $action = OilAction::findOrFail($id);

        $request->validate([
            'name'   => 'required|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Oil Action Name is required.',
        ]);

        // Duplicate check excluding current id
        $exists = OilAction::where('name', $request->name)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['An oil action with this name already exists.']]], 422);
        }

        $action->update([
            'name'   => $request->name,
            'status' => $request->status,
        ]);

        return response()->json($action);
    }
}
