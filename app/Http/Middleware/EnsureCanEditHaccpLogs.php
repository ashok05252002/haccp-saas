<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCanEditHaccpLogs
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user) {
            return $this->deny($request);
        }

        if (static::canUserEditHaccpLogs($user)) {
            return $next($request);
        }

        return $this->deny($request);
    }

    public static function resolvePermissionsForUser($user): ?array
    {
        if (! $user) {
            return [];
        }

        // Super Admin & Client (Tenant Owner) have full access (null represents unrestricted)
        if ($user->role === 'super_admin' || $user->role === 'client') {
            return null;
        }

        $roleId = $user->role_id;

        // 1. Check synced RestaurantUser record by email
        if (!$roleId && $user->email) {
            $roleId = \App\Models\RestaurantUser::where('tenant_id', $user->tenant_id)
                ->where('email', $user->email)
                ->value('role_id');
        }

        $role = null;
        if ($roleId) {
            $role = \App\Models\Role::withoutGlobalScopes()->find($roleId);
        }

        // 2. Fallback: match by role name if user->role is a named role
        if (!$role && $user->tenant_id && $user->role && !in_array($user->role, ['restaurant', 'user', 'staff'])) {
            $role = \App\Models\Role::withoutGlobalScopes()
                ->where('tenant_id', $user->tenant_id)
                ->where('name', $user->role)
                ->first();
        }

        if (!$role) {
            return null;
        }

        $perms = $role->permissions;
        if (is_string($perms)) {
            $perms = json_decode($perms, true);
        }

        // If role permissions is null in database (legacy role / unconfigured role), it means Full Access
        if ($perms === null) {
            return null;
        }

        return is_array($perms) ? $perms : [];
    }

    public static function canUserEditHaccpLogs($user): bool
    {
        if (! $user) {
            return false;
        }

        $perms = static::resolvePermissionsForUser($user);

        // Null means unrestricted full access (super admin, client owner, or legacy full-access role)
        if ($perms === null) {
            return true;
        }

        return in_array('haccp.edit-submitted-logs', $perms);
    }

    protected function deny(Request $request): Response
    {
        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'message' => 'You do not have permission to edit submitted HACCP logs.'
            ], 403);
        }

        abort(403, 'You do not have permission to edit submitted HACCP logs.');
    }
}
