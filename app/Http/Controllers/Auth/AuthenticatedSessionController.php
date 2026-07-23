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

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $user = Auth::user();
        $host = $request->getHost();
        $isAdminSubdomain = str_starts_with($host, 'admin.');

        if ($isAdminSubdomain && $user->role !== 'super_admin') {
            Auth::guard('web')->logout();
            return back()->withErrors(['email' => 'This account does not have Super Admin privileges.']);
        }

        if (!$isAdminSubdomain && $user->role === 'super_admin') {
            Auth::guard('web')->logout();
            return back()->withErrors(['email' => 'Super Admins must log in through the admin portal.']);
        }

        $request->session()->regenerate();

        if ($user->role === 'super_admin') {
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
