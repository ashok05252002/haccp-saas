<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\TenantController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\IngredientController;
use App\Http\Controllers\IngredientCategoryController;
use App\Http\Controllers\UomController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\StorageTypeController;
use App\Http\Controllers\FoodItemController;
use App\Http\Controllers\CleaningAreaController;
use App\Http\Controllers\CleaningChecklistSectionController;
use App\Http\Controllers\CleaningChecklistQuestionController;
use App\Http\Controllers\ThermometerController;
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

    // Branch / Restaurant API Routes
    Route::get('/api/branches', [BranchController::class, 'index']);
    Route::post('/api/branches', [BranchController::class, 'store']);
    Route::put('/api/branches/{id}', [BranchController::class, 'update']);
    Route::delete('/api/branches/{id}', [BranchController::class, 'destroy']);

    Route::get('/client/restaurants/{id}', function ($id) {
        $tenantId = Auth::user()->tenant_id;
        $branch = \App\Models\Branch::where('tenant_id', $tenantId)->findOrFail($id);
        
        return Inertia::render('ClientRestaurantViewPage', [
            'restaurant' => [
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
            ]
        ]);
    })->name('client.restaurants.view');

    Route::patch('/api/branches/{id}/toggle-status', [BranchController::class, 'toggleStatus']);
});

Route::middleware(['auth', 'role:client,restaurant'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('DashboardPage');
    })->name('dashboard');

    Route::get('/manager-hub', function () {
        return Inertia::render('ManagerHubPage');
    })->name('manager.hub');

    Route::get('/manager-hub/ingredients', function () {
        return Inertia::render('IngredientsPage');
    })->name('manager.hub.ingredients');

    Route::get('/manager-hub/uom', function () {
        return Inertia::render('UomMasterPage');
    })->name('manager.hub.uom');

    // Supplier Master Page Routes
    Route::get('/manager-hub/suppliers', function () {
        return Inertia::render('SuppliersPage');
    })->name('manager.hub.suppliers');

    Route::get('/manager-hub/suppliers/create', function () {
        return Inertia::render('SupplierFormPage', [
            'supplierId' => null,
        ]);
    })->name('manager.hub.suppliers.create');

    Route::get('/manager-hub/suppliers/{id}/edit', function ($id) {
        return Inertia::render('SupplierFormPage', [
            'supplierId' => (int) $id,
        ]);
    })->name('manager.hub.suppliers.edit');

    // Food Items Master Page Route
    Route::get('/manager-hub/food-items', function () {
        return Inertia::render('FoodItemsPage');
    })->name('manager.hub.food-items');

    // Cleaning Areas Master Page Route
    Route::get('/manager-hub/cleaning-areas', function () {
        return Inertia::render('CleaningAreasPage');
    })->name('manager.hub.cleaning-areas');

    // Cleaning Checklist Master Page Route
    Route::get('/manager-hub/cleaning-checklist', function () {
        return Inertia::render('CleaningChecklistPage');
    })->name('manager.hub.cleaning-checklist');

    // Thermometers / Probes Master Page Route
    Route::get('/manager-hub/thermometers', function () {
        return Inertia::render('ThermometersPage');
    })->name('manager.hub.thermometers');

    // Ingredients API Routes
    Route::get('/api/ingredients', [IngredientController::class, 'index']);
    Route::post('/api/ingredients', [IngredientController::class, 'store']);
    Route::put('/api/ingredients/{id}', [IngredientController::class, 'update']);
    Route::delete('/api/ingredients/{id}', [IngredientController::class, 'destroy']);

    // Ingredient Categories API Routes
    Route::get('/api/ingredient-categories', [IngredientCategoryController::class, 'index']);
    Route::post('/api/ingredient-categories', [IngredientCategoryController::class, 'store']);
    Route::put('/api/ingredient-categories/{id}', [IngredientCategoryController::class, 'update']);

    // UOM API Routes
    Route::get('/api/uoms', [UomController::class, 'index']);
    Route::post('/api/uoms', [UomController::class, 'store']);
    Route::put('/api/uoms/{id}', [UomController::class, 'update']);
    Route::delete('/api/uoms/{id}', [UomController::class, 'destroy']);

    // Unit Types API Routes
    Route::get('/api/unit-types', [UomController::class, 'indexUnitTypes']);
    Route::post('/api/unit-types', [UomController::class, 'storeUnitType']);
    Route::put('/api/unit-types/{id}', [UomController::class, 'updateUnitType']);
    Route::delete('/api/unit-types/{id}', [UomController::class, 'destroyUnitType']);

    // Base Units API Routes
    Route::get('/api/base-units', [UomController::class, 'indexBaseUnits']);
    Route::post('/api/base-units', [UomController::class, 'storeBaseUnit']);
    Route::put('/api/base-units/{id}', [UomController::class, 'updateBaseUnit']);
    Route::delete('/api/base-units/{id}', [UomController::class, 'destroyBaseUnit']);

    // Supplier API Routes
    Route::get('/api/suppliers', [SupplierController::class, 'index']);
    Route::post('/api/suppliers', [SupplierController::class, 'store']);
    Route::get('/api/suppliers/{id}', [SupplierController::class, 'show']);
    Route::put('/api/suppliers/{id}', [SupplierController::class, 'update']);
    Route::patch('/api/suppliers/{id}/toggle-status', [SupplierController::class, 'toggleStatus']);

    // Storage Types API Routes
    Route::get('/api/storage-types', [StorageTypeController::class, 'index']);
    Route::post('/api/storage-types', [StorageTypeController::class, 'store']);
    Route::put('/api/storage-types/{id}', [StorageTypeController::class, 'update']);

    // Food Items API Routes
    Route::get('/api/food-items', [FoodItemController::class, 'index']);
    Route::post('/api/food-items', [FoodItemController::class, 'store']);
    Route::put('/api/food-items/{id}', [FoodItemController::class, 'update']);

    // Cleaning Areas API Routes
    Route::get('/api/cleaning-areas', [CleaningAreaController::class, 'index']);
    Route::post('/api/cleaning-areas', [CleaningAreaController::class, 'store']);
    Route::put('/api/cleaning-areas/{id}', [CleaningAreaController::class, 'update']);

    // Cleaning Checklist Sections API Routes
    Route::get('/api/cleaning-checklist-sections', [CleaningChecklistSectionController::class, 'index']);
    Route::post('/api/cleaning-checklist-sections', [CleaningChecklistSectionController::class, 'store']);
    Route::put('/api/cleaning-checklist-sections/{id}', [CleaningChecklistSectionController::class, 'update']);

    // Cleaning Checklist Questions API Routes
    Route::get('/api/cleaning-checklist-questions', [CleaningChecklistQuestionController::class, 'index']);
    Route::post('/api/cleaning-checklist-questions', [CleaningChecklistQuestionController::class, 'store']);
    Route::put('/api/cleaning-checklist-questions/{id}', [CleaningChecklistQuestionController::class, 'update']);

    // Thermometers API Routes
    Route::get('/api/thermometers', [ThermometerController::class, 'index']);
    Route::post('/api/thermometers', [ThermometerController::class, 'store']);
    Route::put('/api/thermometers/{id}', [ThermometerController::class, 'update']);
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
