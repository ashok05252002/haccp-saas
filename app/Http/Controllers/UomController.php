<?php

namespace App\Http\Controllers;

use App\Models\UnitType;
use App\Models\BaseUnit;
use App\Models\Uom;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UomController extends Controller
{
    // =========================================================================
    // UNIT TYPES MASTER ENDPOINTS
    // =========================================================================

    public function indexUnitTypes()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        // Trigger seed defaults if count is zero
        $count = UnitType::where('tenant_id', $tenantId)->count();
        if ($count === 0) {
            $this->seedDefaultUoms($tenantId);
        }

        $types = UnitType::where('tenant_id', $tenantId)->orderBy('name', 'asc')->get();
        return response()->json($types);
    }

    public function storeUnitType(Request $request)
    {
        $user = Auth::user();
        $tenantId = $user->tenant_id;
        $branchId = $user->branch_id ?? session('active_branch_id');

        $request->validate([
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('unit_types')->where(function ($query) use ($tenantId, $branchId) {
                    return $query->where('tenant_id', $tenantId)->where('branch_id', $branchId);
                })
            ],
            'status' => 'required|string|in:Active,Inactive',
        ]);

        $type = UnitType::create([
            'tenant_id' => $tenantId,
            'branch_id' => $branchId,
            'name' => $request->name,
            'status' => $request->status,
        ]);

        return response()->json($type, 201);
    }

    public function updateUnitType(Request $request, $id)
    {
        $user = Auth::user();
        $tenantId = $user->tenant_id;
        $branchId = $user->branch_id ?? session('active_branch_id');
        $type = UnitType::where('tenant_id', $tenantId)->findOrFail($id);

        $request->validate([
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('unit_types')->where(function ($query) use ($tenantId, $branchId) {
                    return $query->where('tenant_id', $tenantId)->where('branch_id', $branchId);
                })->ignore($id)
            ],
            'status' => 'required|string|in:Active,Inactive',
        ]);

        if ($request->status === 'Inactive') {
            $hasActiveBase = BaseUnit::where('unit_type_id', $id)->where('status', 'Active')->exists();
            if ($hasActiveBase) {
                return response()->json(['errors' => ['name' => ['Cannot deactivate this category type because it is currently used by active Base Units.']]], 422);
            }
        }

        $type->update([
            'name' => $request->name,
            'status' => $request->status,
        ]);

        return response()->json($type);
    }

    public function destroyUnitType($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $type = UnitType::where('tenant_id', $tenantId)->findOrFail($id);

        // Prevent deletion if unit type is referenced by base units
        $hasBase = BaseUnit::where('unit_type_id', $id)->exists();
        if ($hasBase) {
            return response()->json(['errors' => ['name' => ['Cannot delete this category because it has Base Units registered under it.']]], 422);
        }

        $type->delete();
        return response()->json(['success' => true]);
    }

    // =========================================================================
    // BASE UNITS MASTER ENDPOINTS
    // =========================================================================

    public function indexBaseUnits()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $baseUnits = BaseUnit::where('tenant_id', $tenantId)
            ->with('unitType')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json($baseUnits);
    }

    public function storeBaseUnit(Request $request)
    {
        $user = Auth::user();
        $tenantId = $user->tenant_id;
        $branchId = $user->branch_id ?? session('active_branch_id');

        $request->validate([
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('base_units')->where(function ($query) use ($tenantId, $branchId) {
                    return $query->where('tenant_id', $tenantId)->where('branch_id', $branchId);
                })
            ],
            'code' => [
                'required', 'string', 'max:20',
                Rule::unique('base_units')->where(function ($query) use ($tenantId, $branchId) {
                    return $query->where('tenant_id', $tenantId)->where('branch_id', $branchId);
                })
            ],
            'unit_type_id' => 'required|integer|exists:unit_types,id',
            'status' => 'required|string|in:Active,Inactive',
        ]);

        $baseUnit = BaseUnit::create([
            'tenant_id' => $tenantId,
            'branch_id' => $branchId,
            'name' => $request->name,
            'code' => $request->code,
            'unit_type_id' => $request->unit_type_id,
            'status' => $request->status,
        ]);

        // Auto-register Base Unit as selectable UOM
        Uom::create([
            'tenant_id' => $tenantId,
            'branch_id' => $branchId,
            'unit_name' => $request->name,
            'unit_code' => $request->code,
            'unit_type_id' => $request->unit_type_id,
            'base_unit_id' => $baseUnit->id,
            'conversion_factor' => 1.000000,
            'decimal_allowed' => true,
            'status' => $request->status,
            'description' => 'Primary base unit reference.',
        ]);

        return response()->json($baseUnit, 201);
    }

    public function updateBaseUnit(Request $request, $id)
    {
        $user = Auth::user();
        $tenantId = $user->tenant_id;
        $branchId = $user->branch_id ?? session('active_branch_id');
        $baseUnit = BaseUnit::where('tenant_id', $tenantId)->findOrFail($id);

        $request->validate([
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('base_units')->where(function ($query) use ($tenantId, $branchId) {
                    return $query->where('tenant_id', $tenantId)->where('branch_id', $branchId);
                })->ignore($id)
            ],
            'code' => [
                'required', 'string', 'max:20',
                Rule::unique('base_units')->where(function ($query) use ($tenantId, $branchId) {
                    return $query->where('tenant_id', $tenantId)->where('branch_id', $branchId);
                })->ignore($id)
            ],
            'unit_type_id' => 'required|integer|exists:unit_types,id',
            'status' => 'required|string|in:Active,Inactive',
        ]);

        if ($request->status === 'Inactive') {
            $hasActiveSecondary = Uom::where('tenant_id', $tenantId)
                ->where('base_unit_id', $id)
                ->where('conversion_factor', '!=', 1.000000)
                ->where('status', 'Active')
                ->exists();
            if ($hasActiveSecondary) {
                return response()->json(['errors' => ['name' => ['Cannot deactivate this base unit because it is currently used by active UOM units.']]], 422);
            }
        }

        $baseUnit->update([
            'name' => $request->name,
            'code' => $request->code,
            'unit_type_id' => $request->unit_type_id,
            'status' => $request->status,
        ]);

        // Synchronize changes to its corresponding base UOM record
        $matchingUom = Uom::where('tenant_id', $tenantId)
            ->where('base_unit_id', $baseUnit->id)
            ->where('conversion_factor', 1.000000)
            ->first();
        if ($matchingUom) {
            $matchingUom->update([
                'unit_name' => $request->name,
                'unit_code' => $request->code,
                'unit_type_id' => $request->unit_type_id,
                'status' => $request->status,
            ]);
        }

        return response()->json($baseUnit);
    }

    public function destroyBaseUnit($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $baseUnit = BaseUnit::where('tenant_id', $tenantId)->findOrFail($id);

        // Prevent deletion if secondary UOMs are registered pointing to this base unit
        $hasSecondary = Uom::where('tenant_id', $tenantId)
            ->where('base_unit_id', $id)
            ->where('conversion_factor', '!=', 1.000000)
            ->exists();
        if ($hasSecondary) {
            return response()->json(['errors' => ['name' => ['Cannot delete this base unit because other UOM units point to it.']]], 422);
        }

        // Clean up the synced Uom record
        Uom::where('tenant_id', $tenantId)->where('base_unit_id', $id)->delete();
        $baseUnit->delete();

        return response()->json(['success' => true]);
    }

    // =========================================================================
    // SELECTABLE UOM UNITS ENDPOINTS
    // =========================================================================

    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        // Trigger seed defaults if count is zero
        $count = UnitType::where('tenant_id', $tenantId)->count();
        if ($count === 0) {
            $this->seedDefaultUoms($tenantId);
        }

        $uoms = Uom::where('tenant_id', $tenantId)
            ->with(['unitType', 'baseUnit'])
            ->orderBy('display_order', 'asc')
            ->orderBy('unit_name', 'asc')
            ->get();

        return response()->json($uoms);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        $tenantId = $user->tenant_id;
        $branchId = $user->branch_id ?? session('active_branch_id');

        $request->validate([
            'unit_name' => [
                'required', 'string', 'max:255',
                Rule::unique('uoms')->where(function ($query) use ($tenantId, $branchId) {
                    return $query->where('tenant_id', $tenantId)->where('branch_id', $branchId);
                })
            ],
            'unit_code' => [
                'required', 'string', 'max:20',
                Rule::unique('uoms')->where(function ($query) use ($tenantId, $branchId) {
                    return $query->where('tenant_id', $tenantId)->where('branch_id', $branchId);
                })
            ],
            'unit_type_id' => 'required|integer|exists:unit_types,id',
            'base_unit_id' => 'required|integer|exists:base_units,id',
            'conversion_factor' => 'required|numeric|gt:0',
            'decimal_allowed' => 'required|boolean',
            'display_order' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
            'status' => 'required|string|in:Active,Inactive',
        ]);

        // Base Unit type validation
        $baseUnit = BaseUnit::where('tenant_id', $tenantId)->findOrFail($request->base_unit_id);
        if ($baseUnit->unit_type_id != $request->unit_type_id) {
            return response()->json(['errors' => ['base_unit_id' => ['Base Unit must belong to the same Unit Type.']]], 422);
        }

        $uom = Uom::create([
            'tenant_id' => $tenantId,
            'branch_id' => $branchId,
            'unit_name' => $request->unit_name,
            'unit_code' => $request->unit_code,
            'unit_type_id' => $request->unit_type_id,
            'base_unit_id' => $request->base_unit_id,
            'conversion_factor' => $request->conversion_factor,
            'decimal_allowed' => $request->decimal_allowed,
            'display_order' => $request->display_order ?? 0,
            'status' => $request->status,
            'description' => $request->description,
            'created_by' => Auth::id(),
        ]);

        return response()->json($uom, 201);
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $tenantId = $user->tenant_id;
        $branchId = $user->branch_id ?? session('active_branch_id');
        $uom = Uom::where('tenant_id', $tenantId)->findOrFail($id);

        $request->validate([
            'unit_name' => [
                'required', 'string', 'max:255',
                Rule::unique('uoms')->where(function ($query) use ($tenantId, $branchId) {
                    return $query->where('tenant_id', $tenantId)->where('branch_id', $branchId);
                })->ignore($id)
            ],
            'unit_code' => [
                'required', 'string', 'max:20',
                Rule::unique('uoms')->where(function ($query) use ($tenantId, $branchId) {
                    return $query->where('tenant_id', $tenantId)->where('branch_id', $branchId);
                })->ignore($id)
            ],
            'unit_type_id' => 'required|integer|exists:unit_types,id',
            'base_unit_id' => 'required|integer|exists:base_units,id',
            'conversion_factor' => 'required|numeric|gt:0',
            'decimal_allowed' => 'required|boolean',
            'display_order' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
            'status' => 'required|string|in:Active,Inactive',
        ]);

        // Base Unit type validation
        $baseUnit = BaseUnit::where('tenant_id', $tenantId)->findOrFail($request->base_unit_id);
        if ($baseUnit->unit_type_id != $request->unit_type_id) {
            return response()->json(['errors' => ['base_unit_id' => ['Base Unit must belong to the same Unit Type.']]], 422);
        }

        $uom->update([
            'unit_name' => $request->unit_name,
            'unit_code' => $request->unit_code,
            'unit_type_id' => $request->unit_type_id,
            'base_unit_id' => $request->base_unit_id,
            'conversion_factor' => $request->conversion_factor,
            'decimal_allowed' => $request->decimal_allowed,
            'display_order' => $request->display_order ?? 0,
            'status' => $request->status,
            'description' => $request->description,
            'updated_by' => Auth::id(),
        ]);

        return response()->json($uom);
    }

    public function destroy($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $uom = Uom::where('tenant_id', $tenantId)->findOrFail($id);

        // Prevent deletion if it is a base unit mapping (this is handled in destroyBaseUnit)
        if ($uom->conversion_factor == 1.000000) {
            $isBase = BaseUnit::where('tenant_id', $tenantId)
                ->where('name', $uom->unit_name)
                ->where('code', $uom->unit_code)
                ->exists();
            if ($isBase) {
                return response()->json(['errors' => ['uom' => ['This unit belongs to a Base Unit. Please delete it from the Base Unit tab.']]], 422);
            }
        }

        // Future check: check references in Inventory, Recipe, Purchase, Sales tables here

        $uom->delete();
        return response()->json(['success' => true]);
    }

    // =========================================================================
    // DYNAMIC SEEDER
    // =========================================================================

    private function seedDefaultUoms($tenantId)
    {
        $branchId = Auth::user()->branch_id ?? session('active_branch_id');

        // 1. Seed categories
        $weight = UnitType::create(['tenant_id' => $tenantId, 'branch_id' => $branchId, 'name' => 'Weight', 'status' => 'Active']);
        $volume = UnitType::create(['tenant_id' => $tenantId, 'branch_id' => $branchId, 'name' => 'Volume', 'status' => 'Active']);
        $count = UnitType::create(['tenant_id' => $tenantId, 'branch_id' => $branchId, 'name' => 'Count', 'status' => 'Active']);
        $length = UnitType::create(['tenant_id' => $tenantId, 'branch_id' => $branchId, 'name' => 'Length', 'status' => 'Active']);

        // 2. Seed Base Units
        $kgBase = BaseUnit::create([
            'tenant_id' => $tenantId, 'branch_id' => $branchId, 'name' => 'Kilogram', 'code' => 'KG', 'unit_type_id' => $weight->id, 'status' => 'Active'
        ]);
        $lBase = BaseUnit::create([
            'tenant_id' => $tenantId, 'branch_id' => $branchId, 'name' => 'Liter', 'code' => 'L', 'unit_type_id' => $volume->id, 'status' => 'Active'
        ]);
        $pcsBase = BaseUnit::create([
            'tenant_id' => $tenantId, 'branch_id' => $branchId, 'name' => 'Piece', 'code' => 'PCS', 'unit_type_id' => $count->id, 'status' => 'Active'
        ]);

        // 3. Seed Selectable UOM units
        // kg base
        Uom::create([
            'tenant_id' => $tenantId, 'branch_id' => $branchId, 'unit_name' => 'Kilogram', 'unit_code' => 'KG',
            'unit_type_id' => $weight->id, 'base_unit_id' => $kgBase->id, 'conversion_factor' => 1.0,
            'decimal_allowed' => true, 'display_order' => 1, 'status' => 'Active', 'description' => 'Primary metric weight.'
        ]);
        Uom::create([
            'tenant_id' => $tenantId, 'branch_id' => $branchId, 'unit_name' => 'Gram', 'unit_code' => 'G',
            'unit_type_id' => $weight->id, 'base_unit_id' => $kgBase->id, 'conversion_factor' => 0.001,
            'decimal_allowed' => true, 'display_order' => 2, 'status' => 'Active', 'description' => '1 G = 0.001 KG.'
        ]);
        Uom::create([
            'tenant_id' => $tenantId, 'branch_id' => $branchId, 'unit_name' => 'Milligram', 'unit_code' => 'MG',
            'unit_type_id' => $weight->id, 'base_unit_id' => $kgBase->id, 'conversion_factor' => 0.000001,
            'decimal_allowed' => true, 'display_order' => 3, 'status' => 'Active', 'description' => '1 MG = 0.000001 KG.'
        ]);

        // l base
        Uom::create([
            'tenant_id' => $tenantId, 'branch_id' => $branchId, 'unit_name' => 'Liter', 'unit_code' => 'L',
            'unit_type_id' => $volume->id, 'base_unit_id' => $lBase->id, 'conversion_factor' => 1.0,
            'decimal_allowed' => true, 'display_order' => 4, 'status' => 'Active', 'description' => 'Primary metric volume.'
        ]);
        Uom::create([
            'tenant_id' => $tenantId, 'branch_id' => $branchId, 'unit_name' => 'Milliliter', 'unit_code' => 'ML',
            'unit_type_id' => $volume->id, 'base_unit_id' => $lBase->id, 'conversion_factor' => 0.001,
            'decimal_allowed' => true, 'display_order' => 5, 'status' => 'Active', 'description' => '1 ML = 0.001 L.'
        ]);

        // pcs base
        Uom::create([
            'tenant_id' => $tenantId, 'branch_id' => $branchId, 'unit_name' => 'Piece', 'unit_code' => 'PCS',
            'unit_type_id' => $count->id, 'base_unit_id' => $pcsBase->id, 'conversion_factor' => 1.0,
            'decimal_allowed' => false, 'display_order' => 6, 'status' => 'Active', 'description' => 'Single item unit.'
        ]);
        Uom::create([
            'tenant_id' => $tenantId, 'branch_id' => $branchId, 'unit_name' => 'Dozen', 'unit_code' => 'DOZ',
            'unit_type_id' => $count->id, 'base_unit_id' => $pcsBase->id, 'conversion_factor' => 12.0,
            'decimal_allowed' => false, 'display_order' => 7, 'status' => 'Active', 'description' => '1 DOZ = 12 PCS.'
        ]);
        Uom::create([
            'tenant_id' => $tenantId, 'branch_id' => $branchId, 'unit_name' => 'Bottle', 'unit_code' => 'BTL',
            'unit_type_id' => $count->id, 'base_unit_id' => $pcsBase->id, 'conversion_factor' => 1.0,
            'decimal_allowed' => false, 'display_order' => 8, 'status' => 'Active', 'description' => '1 BTL = 1 PCS.'
        ]);
        Uom::create([
            'tenant_id' => $tenantId, 'branch_id' => $branchId, 'unit_name' => 'Packet', 'unit_code' => 'PKT',
            'unit_type_id' => $count->id, 'base_unit_id' => $pcsBase->id, 'conversion_factor' => 1.0,
            'decimal_allowed' => false, 'display_order' => 9, 'status' => 'Active', 'description' => '1 PKT = 1 PCS.'
        ]);
        Uom::create([
            'tenant_id' => $tenantId, 'branch_id' => $branchId, 'unit_name' => 'Box', 'unit_code' => 'BOX',
            'unit_type_id' => $count->id, 'base_unit_id' => $pcsBase->id, 'conversion_factor' => 1.0,
            'decimal_allowed' => false, 'display_order' => 10, 'status' => 'Active', 'description' => '1 BOX = 1 PCS.'
        ]);
    }
}
