<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\TenantController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// 1. Super Admin Subdomain (admin.localhost)
Route::domain('admin.' . parse_url(config('app.url'), PHP_URL_HOST))->group(function () {
    Route::middleware('guest')->group(function () {
        Route::get('/', function () {
            return redirect()->route('super-admin.login');
        });
        Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('super-admin.login');
        Route::post('/login', [AuthenticatedSessionController::class, 'store']);
    });

    Route::middleware(['auth', 'role:super_admin'])->group(function () {
        Route::get('/dashboard', function () {
            return Inertia::render('SuperAdminDashboardPage');
        })->name('super-admin.dashboard');

        Route::get('/tenants', function () {
            return Inertia::render('SuperAdminTenantsPage');
        })->name('super-admin.tenants');

        Route::get('/tenants/{tenant}', function (\App\Models\Tenant $tenant) {
            return Inertia::render('SuperAdminTenantViewPage', [
                'tenant' => $tenant->load('users'),
            ]);
        })->name('super-admin.tenants.view');

        // Tenant API routes
        Route::get('/api/tenants', [TenantController::class, 'index']);
        Route::post('/api/tenants', [TenantController::class, 'store']);
        Route::put('/api/tenants/{tenant}', [TenantController::class, 'update']);
        Route::delete('/api/tenants/{tenant}', [TenantController::class, 'destroy']);
        Route::patch('/api/tenants/{tenant}/toggle-status', [TenantController::class, 'toggleStatus']);
    });
});

// 2. Default Domain (localhost)
Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'role:client'])->group(function () {
    Route::get('/client/restaurants', function () {
        return Inertia::render('ClientRestaurantsPage');
    })->name('client.restaurants');

    Route::get('/client/restaurants/create', function () {
        return Inertia::render('ClientCreateRestaurantPage');
    })->name('client.restaurants.create');

    Route::get('/dashboard', function () {
        return Inertia::render('DashboardPage');
    })->name('dashboard');

    Route::get('/haccp-logs', function () {
        return Inertia::render('HaccpLogsPage');
    })->name('haccp.logs');

    Route::get('/haccp-reports', function () {
        return Inertia::render('HaccpReportsPage');
    })->name('haccp.reports');

    Route::get('/supervisor-review', function () {
        return Inertia::render('SupervisorReviewPage');
    })->name('supervisor.review');

    Route::get('/recipes', function () {
        return Inertia::render('RecipesPage');
    })->name('recipes');

    Route::get('/calculator', function () {
        return Inertia::render('CalculatorPage');
    })->name('calculator');

    Route::get('/bulk-planning', function () {
        return Inertia::render('BulkPlanningPage');
    })->name('bulk-planning');

    Route::get('/manager-hub', function () {
        return Inertia::render('ManagerHubPage');
    })->name('manager.hub');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

