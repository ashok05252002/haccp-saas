<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RoleController extends Controller
{
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $roles = Role::withCount('users')
            ->where('tenant_id', $tenantId)
            ->orderBy('name')
            ->get();

        return response()->json($roles);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:255',
            'status' => 'required|in:Active,Inactive',
        ]);

        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $role = Role::create([
            'tenant_id' => $tenantId,
            'name' => $request->name,
            'description' => $request->description,
            'status' => $request->status,
        ]);

        return response()->json(['message' => 'Role created successfully', 'role' => $role], 201);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:255',
            'status' => 'required|in:Active,Inactive',
        ]);

        $tenantId = Auth::user()->tenant_id;
        $role = Role::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();

        $role->update([
            'name' => $request->name,
            'description' => $request->description,
            'status' => $request->status,
        ]);

        return response()->json(['message' => 'Role updated successfully', 'role' => $role]);
    }

    public function destroy($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $role = Role::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();

        if ($role->users()->count() > 0) {
            return response()->json(['message' => 'Cannot delete role assigned to active users.'], 422);
        }

        $role->delete();

        return response()->json(['message' => 'Role deleted successfully']);
    }
}
