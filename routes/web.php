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
use App\Http\Controllers\HealthDeclarationSectionController;
use App\Http\Controllers\HealthDeclarationQuestionController;
use App\Http\Controllers\TemperatureEquipmentController;
use App\Http\Controllers\StorageZoneController;
use App\Http\Controllers\BranchContextController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

// 1. Super Admin Subdomain (admin.localhost)
Route::domain(config('app.admin_domain'))->group(function () {
    Route::middleware('guest')->group(function () {
        Route::get('/', function () {
            return Inertia::render('AdminWelcomePage');
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
    Route::post('/api/switch-branch', [BranchContextController::class, 'switchBranch']);

    Route::get('/dashboard', function () {
        return Inertia::render('DashboardPage');
    })->name('dashboard');

    Route::get('/haccp-logs', function () {
        return Inertia::render('HaccpLogsSidebarPage');
    })->name('haccp-logs');

    Route::get('/haccp-logs/temperature', function () {
        return Inertia::render('TemperatureMonitoringPage');
    })->name('haccp-logs.temperature');

    Route::get('/haccp-logs/temperature/add', function () {
        return Inertia::render('TemperatureFormPage');
    })->name('haccp-logs.temperature.add');

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

    // Health Declaration Setup Page Route
    Route::get('/manager-hub/health-declaration', function () {
        return Inertia::render('HealthDeclarationPage');
    })->name('manager.hub.health-declaration');

    // Storage Zones Master Page Route
    Route::get('/manager-hub/storage-zones', function () {
        return Inertia::render('StorageZonesPage');
    })->name('manager.hub.storage-zones');

    // Legacy redirect for temperature-equipment
    Route::get('/manager-hub/temperature-equipment', function () {
        return redirect()->route('manager.hub.storage-zones');
    });

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

    // Health Declaration Sections API Routes
    Route::get('/api/health-declaration-sections', [HealthDeclarationSectionController::class, 'index']);
    Route::post('/api/health-declaration-sections', [HealthDeclarationSectionController::class, 'store']);
    Route::put('/api/health-declaration-sections/{id}', [HealthDeclarationSectionController::class, 'update']);

    // Health Declaration Questions API Routes
    Route::get('/api/health-declaration-questions', [HealthDeclarationQuestionController::class, 'index']);
    Route::post('/api/health-declaration-questions', [HealthDeclarationQuestionController::class, 'store']);
    Route::put('/api/health-declaration-questions/{id}', [HealthDeclarationQuestionController::class, 'update']);

    // Storage Zones API Routes
    Route::get('/api/storage-zones', [StorageZoneController::class, 'index']);
    Route::post('/api/storage-zones', [StorageZoneController::class, 'store']);
    Route::put('/api/storage-zones/{id}', [StorageZoneController::class, 'update']);

    // Legacy temperature-equipments alias for backwards compatibility
    Route::get('/api/temperature-equipments', [StorageZoneController::class, 'index']);
    Route::post('/api/temperature-equipments', [StorageZoneController::class, 'store']);
    Route::put('/api/temperature-equipments/{id}', [StorageZoneController::class, 'update']);

    // Temperature Logs API Routes
    Route::get('/api/temperature-logs', [\App\Http\Controllers\TemperatureLogController::class, 'index']);
    Route::post('/api/temperature-logs', [\App\Http\Controllers\TemperatureLogController::class, 'store']);

    // Delivery Intake Routes (Frontend)
    Route::get('/haccp-logs/delivery-intake', function () {
        return Inertia::render('DeliveryIntakeMonitoringPage');
    })->name('haccp-logs.delivery-intake');

    Route::get('/haccp-logs/delivery-intake/add', function () {
        return Inertia::render('DeliveryIntakeFormPage');
    })->name('haccp-logs.delivery-intake.add');

    // Delivery Intake API Routes
    Route::get('/api/delivery-intake', [\App\Http\Controllers\DeliveryIntakeController::class, 'index']);
    Route::post('/api/delivery-intake', [\App\Http\Controllers\DeliveryIntakeController::class, 'store']);

    // Cleaning & Sanitation Logs (Frontend)
    Route::get('/haccp-logs/cleaning', function () {
        return Inertia::render('CleaningMonitoringPage');
    })->name('haccp-logs.cleaning');

    Route::get('/haccp-logs/cleaning/add', function () {
        return Inertia::render('CleaningFormPage');
    })->name('haccp-logs.cleaning.add');

    Route::get('/haccp-logs/cleaning/view/{id}', function ($id) {
        return Inertia::render('CleaningViewPage', ['logId' => $id]);
    })->name('haccp-logs.cleaning.view');

    // Cleaning & Sanitation Logs (API)
    Route::get('/api/cleaning-logs/dependencies', [\App\Http\Controllers\CleaningLogController::class, 'formDependencies']);
    Route::get('/api/cleaning-logs', [\App\Http\Controllers\CleaningLogController::class, 'index']);
    Route::get('/api/cleaning-logs/{id}', [\App\Http\Controllers\CleaningLogController::class, 'show']);
    Route::post('/api/cleaning-logs', [\App\Http\Controllers\CleaningLogController::class, 'store']);

    // Cooking Temperature Logs (Frontend)
    Route::get('/haccp-logs/cooking-temperature', function () {
        return Inertia::render('CookingTemperatureMonitoringPage');
    })->name('haccp-logs.cooking-temperature');

    Route::get('/haccp-logs/cooking-temperature/add', function () {
        return Inertia::render('CookingTemperatureFormPage');
    })->name('haccp-logs.cooking-temperature.add');

    Route::get('/haccp-logs/cooking-temperature/view/{id}', function ($id) {
        return Inertia::render('CookingTemperatureViewPage', ['logId' => $id]);
    })->name('haccp-logs.cooking-temperature.view');

    // Cooking Temperature Logs (API)
    Route::get('/api/cooking-logs', [\App\Http\Controllers\CookingLogController::class, 'index']);
    Route::get('/api/cooking-logs/{id}', [\App\Http\Controllers\CookingLogController::class, 'show']);
    Route::post('/api/cooking-logs', [\App\Http\Controllers\CookingLogController::class, 'store']);

    // Blast Chilling Logs (Frontend)
    Route::get('/haccp-logs/blast-chilling', function () {
        return Inertia::render('BlastChillingMonitoringPage');
    })->name('haccp-logs.blast-chilling');

    Route::get('/haccp-logs/blast-chilling/add', function () {
        return Inertia::render('BlastChillingFormPage');
    })->name('haccp-logs.blast-chilling.add');

    Route::get('/haccp-logs/blast-chilling/view/{id}', function ($id) {
        return Inertia::render('BlastChillingViewPage', ['logId' => $id]);
    })->name('haccp-logs.blast-chilling.view');

    // Blast Chilling Logs (API)
    Route::get('/api/blast-chilling-logs', [\App\Http\Controllers\BlastChillingLogController::class, 'index']);
    Route::get('/api/blast-chilling-logs/{id}', [\App\Http\Controllers\BlastChillingLogController::class, 'show']);
    Route::post('/api/blast-chilling-logs', [\App\Http\Controllers\BlastChillingLogController::class, 'store']);
    Route::delete('/api/blast-chilling-logs/{id}', [\App\Http\Controllers\BlastChillingLogController::class, 'destroy']);

    // Cooling Process Logs (Frontend)
    Route::get('/haccp-logs/cooling-process', function () {
        return Inertia::render('CoolingProcessMonitoringPage');
    })->name('haccp-logs.cooling-process');

    Route::get('/haccp-logs/cooling-process/add', function () {
        return Inertia::render('CoolingProcessFormPage');
    })->name('haccp-logs.cooling-process.add');

    Route::get('/haccp-logs/cooling-process/view/{id}', function ($id) {
        return Inertia::render('CoolingProcessViewPage', ['logId' => $id]);
    })->name('haccp-logs.cooling-process.view');

    // Cooling Process Logs (API)
    Route::get('/api/cooling-process-logs', [\App\Http\Controllers\CoolingProcessLogController::class, 'index']);
    Route::get('/api/cooling-process-logs/{id}', [\App\Http\Controllers\CoolingProcessLogController::class, 'show']);
    Route::post('/api/cooling-process-logs', [\App\Http\Controllers\CoolingProcessLogController::class, 'store']);
    Route::delete('/api/cooling-process-logs/{id}', [\App\Http\Controllers\CoolingProcessLogController::class, 'destroy']);

    // Staff Health Declaration Logs (Frontend)
    Route::get('/haccp-logs/health-declaration', function () {
        return Inertia::render('HealthDeclarationLogsPage');
    })->name('haccp-logs.health-declaration');

    Route::get('/haccp-logs/health-declaration/add', function () {
        return Inertia::render('HealthDeclarationFormPage');
    })->name('haccp-logs.health-declaration.add');

    Route::get('/haccp-logs/health-declaration/view/{id}', function ($id) {
        return Inertia::render('HealthDeclarationViewPage', ['logId' => $id]);
    })->name('haccp-logs.health-declaration.view');

    // Staff Health Declaration Logs (API)
    Route::get('/api/health-declaration-logs/dependencies', [\App\Http\Controllers\HealthDeclarationLogController::class, 'formDependencies']);
    Route::get('/api/health-declaration-logs', [\App\Http\Controllers\HealthDeclarationLogController::class, 'index']);
    Route::get('/api/health-declaration-logs/{id}', [\App\Http\Controllers\HealthDeclarationLogController::class, 'show']);
    Route::post('/api/health-declaration-logs', [\App\Http\Controllers\HealthDeclarationLogController::class, 'store']);
    Route::delete('/api/health-declaration-logs/{id}', [\App\Http\Controllers\HealthDeclarationLogController::class, 'destroy']);

    // User & Role Management (Frontend)
    Route::get('/manager-hub/users-roles', function () {
        return Inertia::render('UserRoleManagementPage');
    })->name('manager-hub.users-roles');

    // Roles API
    Route::get('/api/roles', [\App\Http\Controllers\RoleController::class, 'index']);
    Route::post('/api/roles', [\App\Http\Controllers\RoleController::class, 'store']);
    Route::put('/api/roles/{id}', [\App\Http\Controllers\RoleController::class, 'update']);
    Route::delete('/api/roles/{id}', [\App\Http\Controllers\RoleController::class, 'destroy']);

    // Users API
    Route::get('/api/tenant-users', [\App\Http\Controllers\UserManagementController::class, 'index']);
    Route::post('/api/tenant-users', [\App\Http\Controllers\UserManagementController::class, 'store']);
    Route::put('/api/tenant-users/{id}', [\App\Http\Controllers\UserManagementController::class, 'update']);
    Route::delete('/api/tenant-users/{id}', [\App\Http\Controllers\UserManagementController::class, 'destroy']);

    // Recipes Frontend & API
    Route::get('/recipes', function () {
        return Inertia::render('RecipesPage');
    })->name('recipes.index');

    Route::get('/recipes/create', function () {
        return Inertia::render('RecipeFormPage', [
            'recipeId' => null,
        ]);
    })->name('recipes.create');

    Route::get('/recipes/{id}/edit', function ($id) {
        return Inertia::render('RecipeFormPage', [
            'recipeId' => (int) $id,
        ]);
    })->name('recipes.edit');

    Route::get('/recipes/{id}', function ($id) {
        return Inertia::render('RecipeViewPage', [
            'recipeId' => (int) $id,
        ]);
    })->name('recipes.show');

    Route::get('/calculator', function () {
        return Inertia::render('RecipeCalculatorPage');
    })->name('calculator');

    // Bulk Production Planning Frontend Routes
    Route::get('/bulk-planning', function () {
        return Inertia::render('BulkPlanningPage');
    })->name('bulk-planning.index');

    Route::get('/bulk-planning/create', function () {
        return Inertia::render('BulkPlanningFormPage', [
            'planId' => null,
        ]);
    })->name('bulk-planning.create');

    Route::get('/bulk-planning/{id}/edit', function ($id) {
        return Inertia::render('BulkPlanningFormPage', [
            'planId' => (int) $id,
        ]);
    })->name('bulk-planning.edit');

    Route::get('/bulk-planning/{id}', function ($id) {
        return Inertia::render('BulkPlanningViewPage', [
            'planId' => (int) $id,
        ]);
    })->name('bulk-planning.show');

    Route::get('/api/recipes', [\App\Http\Controllers\RecipeController::class, 'index']);
    Route::get('/api/recipes/{id}', [\App\Http\Controllers\RecipeController::class, 'show']);
    Route::post('/api/recipes', [\App\Http\Controllers\RecipeController::class, 'store']);
    Route::put('/api/recipes/{id}', [\App\Http\Controllers\RecipeController::class, 'update']);
    Route::delete('/api/recipes/{id}', [\App\Http\Controllers\RecipeController::class, 'destroy']);

    Route::get('/api/bulk-plans', [\App\Http\Controllers\BulkPlanController::class, 'index']);
    Route::get('/api/bulk-plans/{id}', [\App\Http\Controllers\BulkPlanController::class, 'show']);
    Route::post('/api/bulk-plans', [\App\Http\Controllers\BulkPlanController::class, 'store']);
    Route::put('/api/bulk-plans/{id}', [\App\Http\Controllers\BulkPlanController::class, 'update']);
    Route::delete('/api/bulk-plans/{id}', [\App\Http\Controllers\BulkPlanController::class, 'destroy']);
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
