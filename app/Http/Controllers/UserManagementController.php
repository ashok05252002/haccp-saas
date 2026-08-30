<?php

namespace App\Http\Controllers;

use App\Models\RestaurantUser;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

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

        // Check web login account status in User model for each staff user
        $users->transform(function ($u) use ($tenantId) {
            $webUser = null;
            if ($u->email) {
                $webUser = User::where('tenant_id', $tenantId)->where('email', $u->email)->first();
            }
            $u->has_web_account = (bool) $webUser;
            return $u;
        });

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
            'password' => 'nullable|string|min:6',
            'role_id' => 'nullable|integer|exists:roles,id',
            'status' => 'required|in:Active,Inactive',
        ]);

        $userData = [
            'tenant_id' => $tenantId,
            'branch_id' => $branchId,
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'pin_code' => $request->pin_code,
            'role_id' => $request->role_id,
            'status' => $request->status,
        ];

        if ($request->filled('password')) {
            $userData['password'] = Hash::make($request->password);
        }

        $user = RestaurantUser::create($userData);

        // Sync to main User table if email and password are provided
        if ($request->filled('email') && $request->filled('password')) {
            User::updateOrCreate(
                ['email' => $request->email],
                [
                    'name' => $request->name,
                    'password' => Hash::make($request->password),
                    'tenant_id' => $tenantId,
                    'branch_id' => $branchId,
                    'role_id' => $request->role_id,
                    'role' => 'restaurant',
                    'status' => $request->status,
                ]
            );
        }

        return response()->json(['message' => 'Restaurant user created successfully', 'user' => $user->load('assignedRole')], 201);
    }

    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $branchId = Auth::user()->branch_id;
        $user = RestaurantUser::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:50',
            'pin_code' => 'nullable|string|max:10',
            'password' => 'nullable|string|min:6',
            'role_id' => 'nullable|integer|exists:roles,id',
            'status' => 'required|in:Active,Inactive',
        ]);

        $userData = [
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'pin_code' => $request->pin_code,
            'role_id' => $request->role_id,
            'status' => $request->status,
        ];

        if ($request->filled('password')) {
            $userData['password'] = Hash::make($request->password);
        }

        $user->update($userData);

        // Sync/update corresponding User model account if email exists
        if ($request->filled('email')) {
            $webUser = User::where('tenant_id', $tenantId)->where('email', $user->email)->first();
            if (!$webUser) {
                $webUser = User::where('tenant_id', $tenantId)->where('email', $request->email)->first();
            }

            if ($webUser || $request->filled('password')) {
                $syncData = [
                    'name' => $request->name,
                    'email' => $request->email,
                    'tenant_id' => $tenantId,
                    'branch_id' => $branchId,
                    'role_id' => $request->role_id,
                    'role' => 'restaurant',
                    'status' => $request->status,
                ];

                if ($request->filled('password')) {
                    $syncData['password'] = Hash::make($request->password);
                }

                User::updateOrCreate(
                    ['email' => $request->email],
                    $syncData
                );
            }
        }

        return response()->json(['message' => 'Restaurant user updated successfully', 'user' => $user->load('assignedRole')]);
    }

    public function enableLogin(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $branchId = Auth::user()->branch_id;

        $user = RestaurantUser::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();

        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        // Update RestaurantUser record
        $user->update([
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Create/Sync in main users table
        User::updateOrCreate(
            ['email' => $request->email],
            [
                'name' => $user->name,
                'password' => Hash::make($request->password),
                'tenant_id' => $tenantId,
                'branch_id' => $branchId,
                'role_id' => $user->role_id,
                'role' => 'restaurant',
                'status' => $user->status || 'Active',
            ]
        );

        return response()->json([
            'message' => 'Web login enabled successfully. User can now log in via /login route.',
            'user' => $user->load('assignedRole')
        ]);
    }

    public function destroy($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $user = RestaurantUser::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();

        // Also delete from main Users table if synced
        if ($user->email) {
            User::where('tenant_id', $tenantId)->where('email', $user->email)->delete();
        }

        $user->delete();

        return response()->json(['message' => 'Restaurant user deleted successfully']);
    }

    public function verifyManagerPin(Request $request)
    {
        $request->validate([
            'pin' => 'required|string',
        ]);

        $authUser = Auth::user();
        if (!$authUser || !$authUser->tenant_id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized context.'], 403);
        }

        $tenantId = $authUser->tenant_id;
        $activeBranchId = session('active_branch_id') ?? $authUser->branch_id;

        // Query active restaurant users for current tenant matching the pin
        $query = RestaurantUser::with('assignedRole')
            ->where('tenant_id', $tenantId)
            ->where('status', 'Active')
            ->where('pin_code', $request->pin);

        if ($activeBranchId) {
            $query->where(function ($q) use ($activeBranchId) {
                $q->where('branch_id', $activeBranchId)
                  ->orWhereNull('branch_id');
            });
        }

        $matchingUsers = $query->get();

        if ($matchingUsers->isEmpty()) {
            $matchingUsers = RestaurantUser::with('assignedRole')
                ->where('tenant_id', $tenantId)
                ->where('status', 'Active')
                ->where('pin_code', $request->pin)
                ->get();
        }

        $manager = $matchingUsers->first(function ($u) {
            $perms = $u->assignedRole->permissions ?? null;
            if (is_array($perms) && in_array('haccp.edit-submitted-logs', $perms)) {
                return true;
            }
            $roleName = strtolower($u->assignedRole->name ?? '');
            if ($roleName && (
                str_contains($roleName, 'manager') ||
                str_contains($roleName, 'admin') ||
                str_contains($roleName, 'head chef') ||
                str_contains($roleName, 'supervisor') ||
                str_contains($roleName, 'owner')
            )) {
                return true;
            }
            return $perms === null;
        });

        if ($manager) {
            return response()->json([
                'success' => true,
                'manager_name' => $manager->name,
                'manager_id' => $manager->id,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Invalid Manager PIN.',
        ], 422);
    }
}

