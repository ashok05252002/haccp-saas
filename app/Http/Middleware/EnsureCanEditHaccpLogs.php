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

        // Allow resuming IN_PROGRESS cooking logs without submitted-log edit permission (scoped to tenant and branch)
        if ($this->isCookingLogInProgress($request, $user)) {
            return $next($request);
        }

        if (static::canUserEditHaccpLogs($user)) {
            return $next($request);
        }

        return $this->deny($request);
    }

    protected function isCookingLogInProgress(Request $request, $user): bool
    {
        $id = $request->route('id') ?? $request->route('cooking_log') ?? $request->id;
        if (!$id && preg_match('#(?:cooking-temperature/edit|api/cooking-logs)/(\d+)#', $request->path(), $matches)) {
            $id = $matches[1];
        }

        if (! $id) {
            return false;
        }

        if ($request->is('*cooking-temperature/edit/*') || $request->is('api/cooking-logs/*')) {
            $branchId = $user->branch_id ?? session('active_branch_id');

            $log = \App\Models\CookingLog::withoutGlobalScopes()
                ->where('id', $id)
                ->where(function ($q) use ($user, $branchId) {
                    if ($user->tenant_id) {
                        $q->where('tenant_id', $user->tenant_id);
                    }
                    if ($branchId) {
                        $q->where('branch_id', $branchId);
                    }
                })
                ->first();

            return $log && $log->status === 'IN_PROGRESS';
        }

        return false;
    }

    public static function resolvePermissionsForUser($user): ?array
    {
        if (! $user) {
            return [];
        }

        // 1. Super Admin & Client (Tenant Owner) have full access (null represents unrestricted)
        if ($user->role === 'super_admin' || $user->role === 'client') {
            return null;
        }

        $roleId = $user->role_id;

        // Check synced RestaurantUser record by email
        if (!$roleId && $user->email) {
            $roleId = \App\Models\RestaurantUser::where('tenant_id', $user->tenant_id)
                ->where('email', $user->email)
                ->value('role_id');
        }

        // 2. Main restaurant / branch manager login without assigned restrictive custom role -> Full Access
        if (!$roleId && $user->role === 'restaurant') {
            return null;
        }

        $role = null;
        if ($roleId) {
            $role = \App\Models\Role::withoutGlobalScopes()->find($roleId);
        }

        // Fallback: match by role name if user->role is a named role
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
            $trimmed = trim($perms);
            if ($trimmed === '' || $trimmed === 'null' || $trimmed === 'NULL') {
                return null;
            }
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
