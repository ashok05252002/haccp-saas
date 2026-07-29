<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        $host = $request->getHost();
        if (str_starts_with($host, 'admin.')) {
            return Inertia::render('SuperAdminLoginPage', [
                'status' => $request->session()->get('status'),
            ]);
        }

        return Inertia::render('LoginPage', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    public function store(LoginRequest $request)
    {
        $request->authenticate();

        $user = Auth::user();
        
        if ($user->tenant_id) {
            $tenant = \App\Models\Tenant::find($user->tenant_id);
            if ($tenant && $tenant->status !== 'Active') {
                Auth::guard('web')->logout();
                $error = 'Your account has been deactivated by the admin. Please contact support for more information.';
                if ($request->wantsJson()) {
                    return response()->json(['errors' => ['email' => [$error]]], 422);
                }
                return back()->withErrors(['email' => $error]);
            }
        }

        if ($user->role === 'restaurant' && $user->branch_id) {
            $branch = \App\Models\Branch::find($user->branch_id);
            if ($branch && $branch->status !== 'Active') {
                Auth::guard('web')->logout();
                $error = 'This restaurant branch is currently inactive. Please contact your administrator.';
                if ($request->wantsJson()) {
                    return response()->json(['errors' => ['email' => [$error]]], 422);
                }
                return back()->withErrors(['email' => $error]);
            }
        }

        $host = $request->getHost();
        $isAdminSubdomain = str_starts_with($host, 'admin.');

        if ($isAdminSubdomain && $user->role !== 'super_admin') {
            Auth::guard('web')->logout();
            $error = 'This account does not have Super Admin privileges.';
            if ($request->wantsJson()) {
                return response()->json(['errors' => ['email' => [$error]]], 422);
            }
            return back()->withErrors(['email' => $error]);
        }

        if (!$isAdminSubdomain && $user->role === 'super_admin') {
            Auth::guard('web')->logout();
            $error = 'Super Admins must log in through the admin portal.';
            if ($request->wantsJson()) {
                return response()->json(['errors' => ['email' => [$error]]], 422);
            }
            return back()->withErrors(['email' => $error]);
        }

        $request->session()->regenerate();

        if ($request->wantsJson()) {
            $redirectUrl = '/client/restaurants';
            if ($user->role === 'super_admin' || $user->role === 'restaurant') {
                $redirectUrl = '/dashboard';
            }
            return response()->json([
                'redirectUrl' => $redirectUrl
            ]);
        }

        if ($user->role === 'super_admin' || $user->role === 'restaurant') {
            return redirect()->intended('/dashboard');
        }

        return redirect()->intended('/client/restaurants');
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}
