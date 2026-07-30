<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;

class BranchContextMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = Auth::user();
            
            // Skip for super admin
            if ($user->role === 'super_admin') {
                return $next($request);
            }
            
            // If the user has a hardcoded branch_id (Staff), ensure it is the active one
            if ($user->branch_id) {
                Session::put('active_branch_id', $user->branch_id);
            } else {
                // For users without a fixed branch_id (Admin/Manager)
                // If they don't have an active branch set, default to their first branch
                if (!Session::has('active_branch_id')) {
                    $firstBranch = \App\Models\Branch::where('tenant_id', $user->tenant_id)->first();
                    if ($firstBranch) {
                        Session::put('active_branch_id', $firstBranch->id);
                    }
                }
            }
        }

        return $next($request);
    }
}
