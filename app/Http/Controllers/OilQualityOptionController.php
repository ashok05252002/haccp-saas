<?php

namespace App\Http\Controllers;

use App\Models\OilQualityOption;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OilQualityOptionController extends Controller
{
    private array $defaultOptions = [
        'Good – clear / normal',
        'Slightly dark but acceptable',
        'Dark / degraded',
        'Foaming',
        'Smoking',
        'Strong smell',
        'Food debris present',
    ];

    /**
     * Display a listing of oil quality options for authenticated tenant & branch.
     * Seeds default options once per tenant & branch if empty.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        // BelongsToBranch handles branch_id scoping automatically
        $options = OilQualityOption::orderBy('id')->get();

        if ($options->isEmpty()) {
            foreach ($this->defaultOptions as $optName) {
                OilQualityOption::create([
                    'tenant_id' => $tenantId,
                    'name'      => $optName,
                    'status'    => 'Active',
                ]);
            }
            $options = OilQualityOption::orderBy('id')->get();
        }

        return response()->json($options);
    }

    /**
     * Store a newly created oil quality option in database.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'   => 'required|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Oil Quality Option Name is required.',
        ]);

        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Duplicate check for this tenant & branch
        $exists = OilQualityOption::where('name', $request->name)->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['An oil quality option with this name already exists.']]], 422);
        }

        $option = OilQualityOption::create([
            'tenant_id' => $tenantId,
            'name'      => $request->name,
            'status'    => $request->status,
        ]);

        return response()->json($option, 201);
    }

    /**
     * Update the specified oil quality option in database.
     */
    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $option = OilQualityOption::findOrFail($id);

        $request->validate([
            'name'   => 'required|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'name.required' => 'Oil Quality Option Name is required.',
        ]);

        // Duplicate check excluding current id
        $exists = OilQualityOption::where('name', $request->name)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['name' => ['An oil quality option with this name already exists.']]], 422);
        }

        $option->update([
            'name'   => $request->name,
            'status' => $request->status,
        ]);

        return response()->json($option);
    }
}
