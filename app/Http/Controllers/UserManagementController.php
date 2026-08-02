<?php

namespace App\Http\Controllers;

use App\Models\RestaurantUser;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserManagementController extends Controller
{
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $users = RestaurantUser::with('assignedRole')
            ->where('tenant_id', $tenantId)
            ->orderBy('name')
            ->get();

        return response()->json($users);
    }

    public function store(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;
        $branchId = Auth::user()->branch_id;

        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:50',
            'pin_code' => 'nullable|string|max:10',
            'role_id' => 'nullable|integer|exists:roles,id',
            'status' => 'required|in:Active,Inactive',
        ]);

        $user = RestaurantUser::create([
            'tenant_id' => $tenantId,
            'branch_id' => $branchId,
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'pin_code' => $request->pin_code,
            'role_id' => $request->role_id,
            'status' => $request->status,
        ]);

        return response()->json(['message' => 'Restaurant user created successfully', 'user' => $user->load('assignedRole')], 201);
    }

    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $user = RestaurantUser::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:50',
            'pin_code' => 'nullable|string|max:10',
            'role_id' => 'nullable|integer|exists:roles,id',
            'status' => 'required|in:Active,Inactive',
        ]);

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'pin_code' => $request->pin_code,
            'role_id' => $request->role_id,
            'status' => $request->status,
        ]);

        return response()->json(['message' => 'Restaurant user updated successfully', 'user' => $user->load('assignedRole')]);
    }

    public function destroy($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $user = RestaurantUser::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();

        $user->delete();

        return response()->json(['message' => 'Restaurant user deleted successfully']);
    }
}
