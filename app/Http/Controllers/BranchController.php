<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BranchController extends Controller
{
    /**
     * Display a listing of branches for the authenticated tenant.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $branches = Branch::where('tenant_id', $tenantId)->get();

        return response()->json(
            $branches->map(fn($b) => $this->formatBranch($b))->toArray()
        );
    }

    /**
     * Store a newly created branch in database.
     */
    public function store(Request $request)
    {
        $request->validate([
            'restaurantName' => 'required|string',
            'addressLine1' => 'required|string',
            'city' => 'required|string',
            'country' => 'required|string',
            'contactPerson' => 'required|string',
            'phone' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'confirmPassword' => 'required|string|same:password',
        ]);

        $tenant = Auth::user()->tenant;
        if (!$tenant) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Limit Check
        $currentCount = Branch::where('tenant_id', $tenant->id)->count();
        if ($currentCount >= $tenant->restaurant_limit) {
            return response()->json([
                'message' => 'Your location limit has been reached. Please contact Super Admin to increase your limit.'
            ], 403);
        }

        $branch = Branch::create([
            'tenant_id' => $tenant->id,
            'name' => $request->restaurantName,
            'branch_name' => $request->branchName,
            'registration_number' => $request->registrationNumber,
            'address_line1' => $request->addressLine1,
            'address_line2' => $request->addressLine2,
            'city' => $request->city,
            'county' => $request->county,
            'postal_code' => $request->postalCode,
            'country' => $request->country,
            'contact_person' => $request->contactPerson,
            'phone' => $request->phone,
            'email' => $request->email,
            'branch_manager' => $request->branchManager,
            'notes' => $request->notes,
        ]);

        // Create direct login user for the branch
        \App\Models\User::create([
            'name' => $request->restaurantName . ' Manager',
            'email' => $request->email,
            'password' => bcrypt($request->password),
            'role' => 'restaurant',
            'tenant_id' => $tenant->id,
            'branch_id' => $branch->id,
        ]);

        return response()->json($this->formatBranch($branch), 201);
    }

    /**
     * Update the specified branch.
     */
    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $branch = Branch::where('tenant_id', $tenantId)->findOrFail($id);
        $branchUser = \App\Models\User::where('branch_id', $branch->id)->first();

        $request->validate([
            'restaurantName' => 'required|string',
            'addressLine1' => 'required|string',
            'city' => 'required|string',
            'country' => 'required|string',
            'contactPerson' => 'required|string',
            'phone' => 'required|string',
            'email' => 'required|email|unique:users,email,' . ($branchUser ? $branchUser->id : 'NULL'),
        ]);

        $branch->update([
            'name' => $request->restaurantName,
            'branch_name' => $request->branchName,
            'registration_number' => $request->registrationNumber,
            'address_line1' => $request->addressLine1,
            'address_line2' => $request->addressLine2,
            'city' => $request->city,
            'county' => $request->county,
            'postal_code' => $request->postalCode,
            'country' => $request->country,
            'contact_person' => $request->contactPerson,
            'phone' => $request->phone,
            'email' => $request->email,
            'branch_manager' => $request->branchManager,
            'notes' => $request->notes,
        ]);

        if ($branchUser) {
            $branchUser->update([
                'name' => $request->restaurantName . ' Manager',
                'email' => $request->email,
            ]);

            if ($request->filled('password')) {
                $branchUser->update([
                    'password' => bcrypt($request->password),
                ]);
            }
        }

        return response()->json($this->formatBranch($branch));
    }

    /**
     * Remove the specified branch.
     */
    public function destroy($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $branch = Branch::where('tenant_id', $tenantId)->findOrFail($id);
        
        $branch->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Toggle the active/inactive status of the branch.
     */
    public function toggleStatus($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $branch = Branch::where('tenant_id', $tenantId)->findOrFail($id);
        $newStatus = $branch->status === 'Active' ? 'Inactive' : 'Active';
        $branch->update(['status' => $newStatus]);

        return response()->json($this->formatBranch($branch));
    }

    /**
     * Format database Branch object into frontend keys structure.
     */
    private function formatBranch(Branch $branch): array
    {
        return [
            'id' => $branch->id,
            'restaurantName' => $branch->name,
            'branchName' => $branch->branch_name,
            'registrationNumber' => $branch->registration_number,
            'addressLine1' => $branch->address_line1,
            'addressLine2' => $branch->address_line2,
            'city' => $branch->city,
            'county' => $branch->county,
            'postalCode' => $branch->postal_code,
            'country' => $branch->country,
            'contactPerson' => $branch->contact_person,
            'phone' => $branch->phone,
            'email' => $branch->email,
            'branchManager' => $branch->branch_manager,
            'notes' => $branch->notes,
            'haccpStatus' => $branch->status ?? 'Active',
            'createdAt' => $branch->created_at ? $branch->created_at->toDateString() : date('Y-m-d'),
        ];
    }
}
