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
use App\Http\Controllers\HoldingStationController;
use App\Http\Controllers\TrainingTaskController;
use App\Http\Controllers\DefrostingMethodController;
use App\Http\Controllers\FryerStationController;
use App\Http\Controllers\OilQualityOptionController;
use App\Http\Controllers\OilActionController;
use App\Http\Controllers\GreaseDisposalTypeController;
use App\Http\Controllers\GreaseTrapAreaController;
use App\Http\Controllers\GreaseDisposalMethodController;
use App\Http\Controllers\WasteContractorController;
use App\Http\Controllers\WasteTypeController;
use App\Http\Controllers\WasteSourceStageController;
use App\Http\Controllers\WasteReasonController;
use App\Http\Controllers\WasteDisposalMethodController;
use App\Http\Controllers\PestControlQuestionController;
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

Route::middleware(['auth', 'role:super_admin'])->group(function () {
    Route::get('/tenants', function () {
        return Inertia::render('SuperAdminTenantsPage');
    });

    Route::get('/tenants/{tenant}', function (\App\Models\Tenant $tenant) {
        return Inertia::render('SuperAdminTenantViewPage', [
            'tenant' => $tenant->load('users'),
        ]);
    });

    // Tenant API routes
    Route::get('/api/tenants', [TenantController::class, 'index']);
    Route::post('/api/tenants', [TenantController::class, 'store']);
    Route::put('/api/tenants/{tenant}', [TenantController::class, 'update']);
    Route::delete('/api/tenants/{tenant}', [TenantController::class, 'destroy']);
    Route::patch('/api/tenants/{tenant}/toggle-status', [TenantController::class, 'toggleStatus']);
});

Route::middleware(['auth', 'role:super_admin,client,restaurant'])->group(function () {
    Route::post('/api/switch-branch', [BranchContextController::class, 'switchBranch']);

    Route::get('/dashboard', function () {
        if (Auth::user() && Auth::user()->role === 'super_admin') {
            return Inertia::render('SuperAdminDashboardPage');
        }
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

    Route::get('/haccp-logs/temperature/edit/{id}', function ($id) {
        return Inertia::render('TemperatureFormPage', ['logId' => $id]);
    })->name('haccp-logs.temperature.edit');

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

    // Holding Stations Master Page Route
    Route::get('/manager-hub/holding-stations', function () {
        return Inertia::render('HoldingStationsPage');
    })->name('manager.hub.holding-stations');

    // Training Tasks Master Page Route
    Route::get('/manager-hub/training-tasks', function () {
        return Inertia::render('TrainingTasksPage');
    })->name('manager.hub.training-tasks');

    // Defrosting Methods Master Page Route
    Route::get('/manager-hub/defrosting-methods', function () {
        return Inertia::render('DefrostingMethodsPage');
    })->name('manager.hub.defrosting-methods');

    // Fryer Oil Setup Master Page Route
    Route::get('/manager-hub/fryer-oil-setup', function () {
        return Inertia::render('FryerOilSetupPage');
    })->name('manager.hub.fryer-oil-setup');

    // Grease & Used Oil Setup Master Page Route
    Route::get('/manager-hub/grease-used-oil-setup', function () {
        return Inertia::render('GreaseUsedOilSetupPage');
    })->name('manager.hub.grease-used-oil-setup');

    // Waste Setup Master Page Route
    Route::get('/manager-hub/waste-setup', function () {
        return Inertia::render('WasteSetupPage');
    })->name('manager.hub.waste-setup');

    // Pest Control Setup Master Page Route
    Route::get('/manager-hub/pest-control-setup', function () {
        return Inertia::render('PestControlSetupPage');
    })->name('manager.hub.pest-control-setup');

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

    // Holding Stations API Routes
    Route::get('/api/holding-stations', [HoldingStationController::class, 'index']);
    Route::post('/api/holding-stations', [HoldingStationController::class, 'store']);
    Route::put('/api/holding-stations/{id}', [HoldingStationController::class, 'update']);

    // Training Tasks API Routes
    Route::get('/api/training-tasks', [TrainingTaskController::class, 'index']);
    Route::post('/api/training-tasks', [TrainingTaskController::class, 'store']);
    Route::put('/api/training-tasks/{id}', [TrainingTaskController::class, 'update']);

    // Defrosting Methods API Routes
    Route::get('/api/defrosting-methods', [DefrostingMethodController::class, 'index']);
    Route::post('/api/defrosting-methods', [DefrostingMethodController::class, 'store']);
    Route::put('/api/defrosting-methods/{id}', [DefrostingMethodController::class, 'update']);

    // Fryer Stations API Routes
    Route::get('/api/fryer-stations', [FryerStationController::class, 'index']);
    Route::post('/api/fryer-stations', [FryerStationController::class, 'store']);
    Route::put('/api/fryer-stations/{id}', [FryerStationController::class, 'update']);

    // Oil Quality Options API Routes
    Route::get('/api/oil-quality-options', [OilQualityOptionController::class, 'index']);
    Route::post('/api/oil-quality-options', [OilQualityOptionController::class, 'store']);
    Route::put('/api/oil-quality-options/{id}', [OilQualityOptionController::class, 'update']);

    // Oil Actions API Routes
    Route::get('/api/oil-actions', [OilActionController::class, 'index']);
    Route::post('/api/oil-actions', [OilActionController::class, 'store']);
    Route::put('/api/oil-actions/{id}', [OilActionController::class, 'update']);

    // Grease Disposal Types API Routes
    Route::get('/api/grease-disposal-types', [GreaseDisposalTypeController::class, 'index']);
    Route::post('/api/grease-disposal-types', [GreaseDisposalTypeController::class, 'store']);
    Route::put('/api/grease-disposal-types/{id}', [GreaseDisposalTypeController::class, 'update']);

    // Grease Trap Areas API Routes
    Route::get('/api/grease-trap-areas', [GreaseTrapAreaController::class, 'index']);
    Route::post('/api/grease-trap-areas', [GreaseTrapAreaController::class, 'store']);
    Route::put('/api/grease-trap-areas/{id}', [GreaseTrapAreaController::class, 'update']);

    // Grease Disposal Methods API Routes
    Route::get('/api/grease-disposal-methods', [GreaseDisposalMethodController::class, 'index']);
    Route::post('/api/grease-disposal-methods', [GreaseDisposalMethodController::class, 'store']);
    Route::put('/api/grease-disposal-methods/{id}', [GreaseDisposalMethodController::class, 'update']);

    // Waste Contractors API Routes
    Route::get('/api/waste-contractors', [WasteContractorController::class, 'index']);
    Route::post('/api/waste-contractors', [WasteContractorController::class, 'store']);
    Route::put('/api/waste-contractors/{id}', [WasteContractorController::class, 'update']);

    // Waste Types API Routes
    Route::get('/api/waste-types', [WasteTypeController::class, 'index']);
    Route::post('/api/waste-types', [WasteTypeController::class, 'store']);
    Route::put('/api/waste-types/{id}', [WasteTypeController::class, 'update']);

    // Waste Source Stages API Routes
    Route::get('/api/waste-source-stages', [WasteSourceStageController::class, 'index']);
    Route::post('/api/waste-source-stages', [WasteSourceStageController::class, 'store']);
    Route::put('/api/waste-source-stages/{id}', [WasteSourceStageController::class, 'update']);

    // Waste Reasons API Routes
    Route::get('/api/waste-reasons', [WasteReasonController::class, 'index']);
    Route::post('/api/waste-reasons', [WasteReasonController::class, 'store']);
    Route::put('/api/waste-reasons/{id}', [WasteReasonController::class, 'update']);

    // Waste Disposal Methods API Routes
    Route::get('/api/waste-disposal-methods', [WasteDisposalMethodController::class, 'index']);
    Route::post('/api/waste-disposal-methods', [WasteDisposalMethodController::class, 'store']);
    Route::put('/api/waste-disposal-methods/{id}', [WasteDisposalMethodController::class, 'update']);

    // Pest Control Questions API Routes
    Route::get('/api/pest-control-questions', [PestControlQuestionController::class, 'index']);
    Route::post('/api/pest-control-questions', [PestControlQuestionController::class, 'store']);
    Route::put('/api/pest-control-questions/{id}', [PestControlQuestionController::class, 'update']);

    // Temperature Logs API Routes
    Route::get('/api/temperature-logs', [\App\Http\Controllers\TemperatureLogController::class, 'index']);
    Route::get('/api/temperature-logs/{id}', [\App\Http\Controllers\TemperatureLogController::class, 'show']);
    Route::post('/api/temperature-logs', [\App\Http\Controllers\TemperatureLogController::class, 'store']);
    Route::put('/api/temperature-logs/{id}', [\App\Http\Controllers\TemperatureLogController::class, 'update']);
    Route::delete('/api/temperature-logs/{id}', [\App\Http\Controllers\TemperatureLogController::class, 'destroy']);

    // Delivery Intake Routes (Frontend)
    Route::get('/haccp-logs/delivery-intake', function () {
        return Inertia::render('DeliveryIntakeMonitoringPage');
    })->name('haccp-logs.delivery-intake');

    Route::get('/haccp-logs/delivery-intake/add', function () {
        return Inertia::render('DeliveryIntakeFormPage');
    })->name('haccp-logs.delivery-intake.add');

    Route::get('/haccp-logs/delivery-intake/edit/{id}', function ($id) {
        return Inertia::render('DeliveryIntakeFormPage', ['logId' => $id]);
    })->name('haccp-logs.delivery-intake.edit');

    // Delivery Intake API Routes
    Route::get('/api/delivery-intake', [\App\Http\Controllers\DeliveryIntakeController::class, 'index']);
    Route::get('/api/delivery-intake/{id}', [\App\Http\Controllers\DeliveryIntakeController::class, 'show']);
    Route::post('/api/delivery-intake', [\App\Http\Controllers\DeliveryIntakeController::class, 'store']);
    Route::put('/api/delivery-intake/{id}', [\App\Http\Controllers\DeliveryIntakeController::class, 'update']);
    Route::delete('/api/delivery-intake/{id}', [\App\Http\Controllers\DeliveryIntakeController::class, 'destroy']);

    // Cleaning & Sanitation Logs (Frontend)
    Route::get('/haccp-logs/cleaning', function () {
        return Inertia::render('CleaningMonitoringPage');
    })->name('haccp-logs.cleaning');

    Route::get('/haccp-logs/cleaning/add', function () {
        return Inertia::render('CleaningFormPage');
    })->name('haccp-logs.cleaning.add');

    Route::get('/haccp-logs/cleaning/edit/{id}', function ($id) {
        return Inertia::render('CleaningFormPage', ['logId' => $id]);
    })->name('haccp-logs.cleaning.edit');

    Route::get('/haccp-logs/cleaning/view/{id}', function ($id) {
        return Inertia::render('CleaningViewPage', ['logId' => $id]);
    })->name('haccp-logs.cleaning.view');

    // Cleaning & Sanitation Logs (API)
    Route::get('/api/cleaning-logs/dependencies', [\App\Http\Controllers\CleaningLogController::class, 'formDependencies']);
    Route::get('/api/cleaning-logs', [\App\Http\Controllers\CleaningLogController::class, 'index']);
    Route::get('/api/cleaning-logs/{id}', [\App\Http\Controllers\CleaningLogController::class, 'show']);
    Route::post('/api/cleaning-logs', [\App\Http\Controllers\CleaningLogController::class, 'store']);
    Route::put('/api/cleaning-logs/{id}', [\App\Http\Controllers\CleaningLogController::class, 'update']);
    Route::delete('/api/cleaning-logs/{id}', [\App\Http\Controllers\CleaningLogController::class, 'destroy']);

    // Cooking Temperature Logs (Frontend)
    Route::get('/haccp-logs/cooking-temperature', function () {
        return Inertia::render('CookingTemperatureMonitoringPage');
    })->name('haccp-logs.cooking-temperature');

    Route::get('/haccp-logs/cooking-temperature/add', function () {
        return Inertia::render('CookingTemperatureFormPage');
    })->name('haccp-logs.cooking-temperature.add');

    Route::get('/haccp-logs/cooking-temperature/edit/{id}', function ($id) {
        return Inertia::render('CookingTemperatureFormPage', ['logId' => $id]);
    })->name('haccp-logs.cooking-temperature.edit');

    Route::get('/haccp-logs/cooking-temperature/view/{id}', function ($id) {
        return Inertia::render('CookingTemperatureViewPage', ['logId' => $id]);
    })->name('haccp-logs.cooking-temperature.view');

    // Cooking Temperature Logs (API)
    Route::get('/api/cooking-logs', [\App\Http\Controllers\CookingLogController::class, 'index']);
    Route::get('/api/cooking-logs/{id}', [\App\Http\Controllers\CookingLogController::class, 'show']);
    Route::post('/api/cooking-logs', [\App\Http\Controllers\CookingLogController::class, 'store']);
    Route::put('/api/cooking-logs/{id}', [\App\Http\Controllers\CookingLogController::class, 'update']);
    Route::delete('/api/cooking-logs/{id}', [\App\Http\Controllers\CookingLogController::class, 'destroy']);

    // Blast Chilling Logs (Frontend)
    Route::get('/haccp-logs/blast-chilling', function () {
        return Inertia::render('BlastChillingMonitoringPage');
    })->name('haccp-logs.blast-chilling');

    Route::get('/haccp-logs/blast-chilling/add', function () {
        return Inertia::render('BlastChillingFormPage');
    })->name('haccp-logs.blast-chilling.add');

    Route::get('/haccp-logs/blast-chilling/edit/{id}', function ($id) {
        return Inertia::render('BlastChillingFormPage', ['logId' => $id]);
    })->name('haccp-logs.blast-chilling.edit');

    Route::get('/haccp-logs/blast-chilling/view/{id}', function ($id) {
        return Inertia::render('BlastChillingViewPage', ['logId' => $id]);
    })->name('haccp-logs.blast-chilling.view');

    // Blast Chilling Logs (API)
    Route::get('/api/blast-chilling-logs', [\App\Http\Controllers\BlastChillingLogController::class, 'index']);
    Route::get('/api/blast-chilling-logs/{id}', [\App\Http\Controllers\BlastChillingLogController::class, 'show']);
    Route::post('/api/blast-chilling-logs', [\App\Http\Controllers\BlastChillingLogController::class, 'store']);
    Route::put('/api/blast-chilling-logs/{id}', [\App\Http\Controllers\BlastChillingLogController::class, 'update']);
    Route::delete('/api/blast-chilling-logs/{id}', [\App\Http\Controllers\BlastChillingLogController::class, 'destroy']);

    // Cooling Process Logs (Frontend)
    Route::get('/haccp-logs/cooling-process', function () {
        return Inertia::render('CoolingProcessMonitoringPage');
    })->name('haccp-logs.cooling-process');

    Route::get('/haccp-logs/cooling-process/add', function () {
        return Inertia::render('CoolingProcessFormPage');
    })->name('haccp-logs.cooling-process.add');

    Route::get('/haccp-logs/cooling-process/edit/{id}', function ($id) {
        return Inertia::render('CoolingProcessFormPage', ['logId' => $id]);
    })->name('haccp-logs.cooling-process.edit');

    Route::get('/haccp-logs/cooling-process/view/{id}', function ($id) {
        return Inertia::render('CoolingProcessViewPage', ['logId' => $id]);
    })->name('haccp-logs.cooling-process.view');

    // Cooling Process Logs (API)
    Route::get('/api/cooling-process-logs', [\App\Http\Controllers\CoolingProcessLogController::class, 'index']);
    Route::get('/api/cooling-process-logs/{id}', [\App\Http\Controllers\CoolingProcessLogController::class, 'show']);
    Route::post('/api/cooling-process-logs', [\App\Http\Controllers\CoolingProcessLogController::class, 'store']);
    Route::put('/api/cooling-process-logs/{id}', [\App\Http\Controllers\CoolingProcessLogController::class, 'update']);
    Route::delete('/api/cooling-process-logs/{id}', [\App\Http\Controllers\CoolingProcessLogController::class, 'destroy']);

    // Probe Calibration Logs (Frontend)
    Route::get('/haccp-logs/probe-calibration', function () {
        return Inertia::render('ProbeCalibrationMonitoringPage');
    })->name('haccp-logs.probe-calibration');

    Route::get('/haccp-logs/probe-calibration/add', function () {
        return Inertia::render('ProbeCalibrationFormPage');
    })->name('haccp-logs.probe-calibration.add');

    Route::get('/haccp-logs/probe-calibration/edit/{id}', function ($id) {
        return Inertia::render('ProbeCalibrationFormPage', ['logId' => $id]);
    })->name('haccp-logs.probe-calibration.edit');

    Route::get('/haccp-logs/probe-calibration/view/{id}', function ($id) {
        return Inertia::render('ProbeCalibrationViewPage', ['logId' => $id]);
    })->name('haccp-logs.probe-calibration.view');

    // Probe Calibration Logs (API)
    Route::get('/api/probe-calibration-logs', [\App\Http\Controllers\ProbeCalibrationLogController::class, 'index']);
    Route::get('/api/probe-calibration-logs/{id}', [\App\Http\Controllers\ProbeCalibrationLogController::class, 'show']);
    Route::post('/api/probe-calibration-logs', [\App\Http\Controllers\ProbeCalibrationLogController::class, 'store']);
    Route::put('/api/probe-calibration-logs/{id}', [\App\Http\Controllers\ProbeCalibrationLogController::class, 'update']);
    Route::delete('/api/probe-calibration-logs/{id}', [\App\Http\Controllers\ProbeCalibrationLogController::class, 'destroy']);

    // Food Dispatch Logs (Frontend)
    Route::get('/haccp-logs/food-dispatch', function () {
        return Inertia::render('FoodDispatchMonitoringPage');
    })->name('haccp-logs.food-dispatch');

    Route::get('/haccp-logs/food-dispatch/add', function () {
        return Inertia::render('FoodDispatchFormPage');
    })->name('haccp-logs.food-dispatch.add');

    Route::get('/haccp-logs/food-dispatch/edit/{id}', function ($id) {
        return Inertia::render('FoodDispatchFormPage', ['logId' => $id]);
    })->name('haccp-logs.food-dispatch.edit');

    Route::get('/haccp-logs/food-dispatch/view/{id}', function ($id) {
        return Inertia::render('FoodDispatchViewPage', ['logId' => $id]);
    })->name('haccp-logs.food-dispatch.view');

    // Food Dispatch Logs (API)
    Route::get('/api/food-dispatch-logs', [\App\Http\Controllers\FoodDispatchLogController::class, 'index']);
    Route::get('/api/food-dispatch-logs/{id}', [\App\Http\Controllers\FoodDispatchLogController::class, 'show']);
    Route::post('/api/food-dispatch-logs', [\App\Http\Controllers\FoodDispatchLogController::class, 'store']);
    Route::put('/api/food-dispatch-logs/{id}', [\App\Http\Controllers\FoodDispatchLogController::class, 'update']);
    Route::delete('/api/food-dispatch-logs/{id}', [\App\Http\Controllers\FoodDispatchLogController::class, 'destroy']);

    // Fryer Oil Logs (Frontend)
    Route::get('/haccp-logs/fryer-oil', function () {
        return Inertia::render('FryerOilMonitoringPage');
    })->name('haccp-logs.fryer-oil');

    Route::get('/haccp-logs/fryer-oil/add', function () {
        return Inertia::render('FryerOilFormPage');
    })->name('haccp-logs.fryer-oil.add');

    Route::get('/haccp-logs/fryer-oil/edit/{id}', function ($id) {
        return Inertia::render('FryerOilFormPage', ['logId' => $id]);
    })->name('haccp-logs.fryer-oil.edit');

    Route::get('/haccp-logs/fryer-oil/view/{id}', function ($id) {
        return Inertia::render('FryerOilViewPage', ['logId' => $id]);
    })->name('haccp-logs.fryer-oil.view');

    // Fryer Oil Logs (API)
    Route::get('/api/fryer-oil-logs', [\App\Http\Controllers\FryerOilLogController::class, 'index']);
    Route::get('/api/fryer-oil-logs/{id}', [\App\Http\Controllers\FryerOilLogController::class, 'show']);
    Route::post('/api/fryer-oil-logs', [\App\Http\Controllers\FryerOilLogController::class, 'store']);
    Route::put('/api/fryer-oil-logs/{id}', [\App\Http\Controllers\FryerOilLogController::class, 'update']);
    Route::delete('/api/fryer-oil-logs/{id}', [\App\Http\Controllers\FryerOilLogController::class, 'destroy']);

    // Pest Control Logs (Frontend)
    Route::get('/haccp-logs/pest-control', function () {
        return Inertia::render('PestControlMonitoringPage');
    })->name('haccp-logs.pest-control');

    Route::get('/haccp-logs/pest-control/add', function () {
        return Inertia::render('PestControlFormPage');
    })->name('haccp-logs.pest-control.add');

    Route::get('/haccp-logs/pest-control/edit/{id}', function ($id) {
        return Inertia::render('PestControlFormPage', ['logId' => $id]);
    })->name('haccp-logs.pest-control.edit');

    Route::get('/haccp-logs/pest-control/view/{id}', function ($id) {
        return Inertia::render('PestControlViewPage', ['logId' => $id]);
    })->name('haccp-logs.pest-control.view');

    // Pest Control Logs (API)
    Route::get('/api/pest-control-logs', [\App\Http\Controllers\PestControlLogController::class, 'index']);
    Route::get('/api/pest-control-logs/{id}', [\App\Http\Controllers\PestControlLogController::class, 'show']);
    Route::post('/api/pest-control-logs', [\App\Http\Controllers\PestControlLogController::class, 'store']);
    Route::put('/api/pest-control-logs/{id}', [\App\Http\Controllers\PestControlLogController::class, 'update']);
    Route::delete('/api/pest-control-logs/{id}', [\App\Http\Controllers\PestControlLogController::class, 'destroy']);

    // Food Waste Logs (Frontend)
    Route::get('/haccp-logs/food-waste', function () {
        return Inertia::render('FoodWasteMonitoringPage');
    })->name('haccp-logs.food-waste');

    Route::get('/haccp-logs/food-waste/add', function () {
        return Inertia::render('FoodWasteFormPage');
    })->name('haccp-logs.food-waste.add');

    Route::get('/haccp-logs/food-waste/edit/{id}', function ($id) {
        return Inertia::render('FoodWasteFormPage', ['logId' => $id]);
    })->name('haccp-logs.food-waste.edit');

    Route::get('/haccp-logs/food-waste/view/{id}', function ($id) {
        return Inertia::render('FoodWasteViewPage', ['logId' => $id]);
    })->name('haccp-logs.food-waste.view');

    // Food Waste Logs (API)
    Route::get('/api/food-waste-logs', [\App\Http\Controllers\FoodWasteLogController::class, 'index']);
    Route::get('/api/food-waste-logs/{id}', [\App\Http\Controllers\FoodWasteLogController::class, 'show']);
    Route::post('/api/food-waste-logs', [\App\Http\Controllers\FoodWasteLogController::class, 'store']);
    Route::put('/api/food-waste-logs/{id}', [\App\Http\Controllers\FoodWasteLogController::class, 'update']);
    Route::delete('/api/food-waste-logs/{id}', [\App\Http\Controllers\FoodWasteLogController::class, 'destroy']);

    // Staff Training & Hygiene Logs (Frontend)
    Route::get('/haccp-logs/staff-training', function () {
        return Inertia::render('StaffTrainingMonitoringPage');
    })->name('haccp-logs.staff-training');

    Route::get('/haccp-logs/staff-training/task/{staffId}', function ($staffId) {
        return Inertia::render('StaffTrainingTaskPage', ['staffId' => $staffId]);
    })->name('haccp-logs.staff-training.task');

    Route::get('/haccp-logs/staff-training/edit/{id}', function ($id) {
        return Inertia::render('StaffTrainingTaskPage', ['logId' => $id]);
    })->name('haccp-logs.staff-training.edit');

    Route::get('/haccp-logs/staff-training/view/{id}', function ($id) {
        return Inertia::render('StaffTrainingViewPage', ['logId' => $id]);
    })->name('haccp-logs.staff-training.view');

    // Staff Training & Hygiene Logs (API)
    Route::get('/api/staff-training-logs', [\App\Http\Controllers\StaffTrainingLogController::class, 'index']);
    Route::get('/api/staff-training-logs/{id}', [\App\Http\Controllers\StaffTrainingLogController::class, 'show']);
    Route::post('/api/staff-training-logs', [\App\Http\Controllers\StaffTrainingLogController::class, 'store']);
    Route::put('/api/staff-training-logs/{id}', [\App\Http\Controllers\StaffTrainingLogController::class, 'update']);
    Route::delete('/api/staff-training-logs/{id}', [\App\Http\Controllers\StaffTrainingLogController::class, 'destroy']);

    // Hot Holding / Bain Marie Logs (Frontend)
    Route::get('/haccp-logs/hot-holding', function () {
        return Inertia::render('HotHoldingMonitoringPage');
    })->name('haccp-logs.hot-holding');

    Route::get('/haccp-logs/hot-holding/add', function () {
        return Inertia::render('HotHoldingFormPage');
    })->name('haccp-logs.hot-holding.add');

    Route::get('/haccp-logs/hot-holding/edit/{id}', function ($id) {
        return Inertia::render('HotHoldingFormPage', ['logId' => $id]);
    })->name('haccp-logs.hot-holding.edit');

    Route::get('/haccp-logs/hot-holding/view/{id}', function ($id) {
        return Inertia::render('HotHoldingViewPage', ['logId' => $id]);
    })->name('haccp-logs.hot-holding.view');

    // Hot Holding / Bain Marie Logs (API)
    Route::get('/api/hot-holding-logs', [\App\Http\Controllers\HotHoldingLogController::class, 'index']);
    Route::get('/api/hot-holding-logs/{id}', [\App\Http\Controllers\HotHoldingLogController::class, 'show']);
    Route::post('/api/hot-holding-logs', [\App\Http\Controllers\HotHoldingLogController::class, 'store']);
    Route::put('/api/hot-holding-logs/{id}', [\App\Http\Controllers\HotHoldingLogController::class, 'update']);
    Route::delete('/api/hot-holding-logs/{id}', [\App\Http\Controllers\HotHoldingLogController::class, 'destroy']);

    // Staff Health Declaration Logs (Frontend)
    Route::get('/haccp-logs/health-declaration', function () {
        return Inertia::render('HealthDeclarationLogsPage');
    })->name('haccp-logs.health-declaration');

    Route::get('/haccp-logs/health-declaration/add', function () {
        return Inertia::render('HealthDeclarationFormPage');
    })->name('haccp-logs.health-declaration.add');

    Route::get('/haccp-logs/health-declaration/edit/{id}', function ($id) {
        return Inertia::render('HealthDeclarationFormPage', ['logId' => $id]);
    })->name('haccp-logs.health-declaration.edit');

    Route::get('/haccp-logs/health-declaration/view/{id}', function ($id) {
        return Inertia::render('HealthDeclarationViewPage', ['logId' => $id]);
    })->name('haccp-logs.health-declaration.view');

    // Staff Health Declaration Logs (API)
    Route::get('/api/health-declaration-logs/dependencies', [\App\Http\Controllers\HealthDeclarationLogController::class, 'formDependencies']);
    Route::get('/api/health-declaration-logs', [\App\Http\Controllers\HealthDeclarationLogController::class, 'index']);
    Route::get('/api/health-declaration-logs/{id}', [\App\Http\Controllers\HealthDeclarationLogController::class, 'show']);
    Route::post('/api/health-declaration-logs', [\App\Http\Controllers\HealthDeclarationLogController::class, 'store']);
    Route::put('/api/health-declaration-logs/{id}', [\App\Http\Controllers\HealthDeclarationLogController::class, 'update']);
    Route::delete('/api/health-declaration-logs/{id}', [\App\Http\Controllers\HealthDeclarationLogController::class, 'destroy']);

    // HACCP Reports & Historical Audits (Frontend & API)
    Route::get('/haccp-reports', function () {
        return Inertia::render('HaccpReportsPage');
    })->name('haccp-reports');

    Route::get('/api/haccp-reports', [\App\Http\Controllers\HaccpReportController::class, 'index']);
    Route::get('/api/haccp-reports/export-csv', [\App\Http\Controllers\HaccpReportController::class, 'exportCsv']);

    // Thawing / Defrosting Record (Frontend)
    Route::get('/haccp-logs/thawing', function () {
        return Inertia::render('ThawingMonitoringPage');
    })->name('haccp-logs.thawing');

    Route::get('/haccp-logs/thawing/add', function () {
        return Inertia::render('ThawingFormPage');
    })->name('haccp-logs.thawing.add');

    Route::get('/haccp-logs/thawing/edit/{id}', function ($id) {
        return Inertia::render('ThawingFormPage', ['logId' => $id]);
    })->name('haccp-logs.thawing.edit');

    Route::get('/haccp-logs/thawing/view/{id}', function ($id) {
        return Inertia::render('ThawingViewPage', ['logId' => $id]);
    })->name('haccp-logs.thawing.view');

    // Thawing / Defrosting Record (API)
    Route::get('/api/thawing-logs', [\App\Http\Controllers\ThawingLogController::class, 'index']);
    Route::get('/api/thawing-logs/{id}', [\App\Http\Controllers\ThawingLogController::class, 'show']);
    Route::post('/api/thawing-logs', [\App\Http\Controllers\ThawingLogController::class, 'store']);
    Route::put('/api/thawing-logs/{id}', [\App\Http\Controllers\ThawingLogController::class, 'update']);
    Route::delete('/api/thawing-logs/{id}', [\App\Http\Controllers\ThawingLogController::class, 'destroy']);

    // Supervision Review Module (Frontend & API)
    Route::get('/supervision-review', [\App\Http\Controllers\SupervisionReviewController::class, 'index'])->name('supervision-review');
    Route::get('/supervision-review/history', [\App\Http\Controllers\SupervisionReviewController::class, 'historyPage'])->name('supervision-review.history');
    Route::get('/api/supervision-reviews/summary', [\App\Http\Controllers\SupervisionReviewController::class, 'getSummary']);
    Route::post('/api/supervision-reviews', [\App\Http\Controllers\SupervisionReviewController::class, 'store']);
    Route::post('/api/supervision-reviews/toggle-cleaning-log', [\App\Http\Controllers\SupervisionReviewController::class, 'toggleCleaningLog']);
    Route::get('/api/supervision-reviews/export-csv', [\App\Http\Controllers\SupervisionReviewController::class, 'exportCsv']);

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
    Route::post('/api/tenant-users/{id}/enable-login', [\App\Http\Controllers\UserManagementController::class, 'enableLogin']);
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
