<?php

namespace App\Http\Controllers;

use App\Models\DeliveryIntakeLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DeliveryIntakeController extends Controller
{
    public function index()
    {
        $logs = DeliveryIntakeLog::with(['supplier', 'products.foodItem'])
            ->orderBy('log_date', 'desc')
            ->orderBy('log_time', 'desc')
            ->get();
            
        return response()->json($logs);
    }

    public function show($id)
    {
        $tenantId = auth()->user()->tenant_id;
        $log = DeliveryIntakeLog::with(['supplier', 'products.foodItem'])
            ->where('tenant_id', $tenantId)
            ->findOrFail($id);

        return response()->json($log);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'log_date' => 'required|date',
            'log_time' => 'required',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'staff_name' => 'nullable|string|max:255',
            'packaging_intact' => 'required|boolean',
            'vehicle_safe' => 'required|boolean',
            'comment' => 'nullable|string',
            'signature' => 'nullable|string',
            'products' => 'required|array|min:1',
            'products.*.food_item_id' => 'required|exists:food_items,id',
            'products.*.batch_number' => 'nullable|string|max:255',
            'products.*.use_by_date' => 'nullable|date',
            'products.*.quantity' => 'required|string|max:255',
            'products.*.temperature' => 'nullable|numeric',
        ]);

        DB::beginTransaction();

        try {
            $branchId = auth()->user()->branch_id ?? session('active_branch_id');
            $log = DeliveryIntakeLog::create([
                'tenant_id' => auth()->user()->tenant_id,
                'branch_id' => $branchId,
                'log_date' => $validated['log_date'],
                'log_time' => $validated['log_time'],
                'supplier_id' => $validated['supplier_id'],
                'staff_name' => $validated['staff_name'],
                'packaging_intact' => $validated['packaging_intact'],
                'vehicle_safe' => $validated['vehicle_safe'],
                'comment' => $validated['comment'],
                'signature' => $validated['signature'],
            ]);

            foreach ($validated['products'] as $productData) {
                $log->products()->create([
                    'food_item_id' => $productData['food_item_id'],
                    'batch_number' => $productData['batch_number'] ?? null,
                    'use_by_date' => $productData['use_by_date'] ?? null,
                    'quantity' => $productData['quantity'],
                    'temperature' => $productData['temperature'] ?? null,
                ]);
            }

            DB::commit();

            return response()->json($log->load(['supplier', 'products.foodItem']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to save delivery intake log.'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $tenantId = auth()->user()->tenant_id;
        $log = DeliveryIntakeLog::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'log_date' => 'required|date',
            'log_time' => 'required',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'staff_name' => 'nullable|string|max:255',
            'packaging_intact' => 'required|boolean',
            'vehicle_safe' => 'required|boolean',
            'comment' => 'nullable|string',
            'signature' => 'nullable|string',
            'products' => 'required|array|min:1',
            'products.*.food_item_id' => 'required|exists:food_items,id',
            'products.*.batch_number' => 'nullable|string|max:255',
            'products.*.use_by_date' => 'nullable|date',
            'products.*.quantity' => 'required|string|max:255',
            'products.*.temperature' => 'nullable|numeric',
        ]);

        DB::beginTransaction();

        try {
            $log->update([
                'log_date' => $validated['log_date'],
                'log_time' => $validated['log_time'],
                'supplier_id' => $validated['supplier_id'],
                'staff_name' => $validated['staff_name'],
                'packaging_intact' => $validated['packaging_intact'],
                'vehicle_safe' => $validated['vehicle_safe'],
                'comment' => $validated['comment'],
                'signature' => $validated['signature'] ?: $log->signature,
            ]);

            // Sync products
            $log->products()->delete();
            foreach ($validated['products'] as $productData) {
                $log->products()->create([
                    'food_item_id' => $productData['food_item_id'],
                    'batch_number' => $productData['batch_number'] ?? null,
                    'use_by_date' => $productData['use_by_date'] ?? null,
                    'quantity' => $productData['quantity'],
                    'temperature' => $productData['temperature'] ?? null,
                ]);
            }

            DB::commit();

            return response()->json($log->load(['supplier', 'products.foodItem']));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to update delivery intake log.'], 500);
        }
    }

    public function destroy($id)
    {
        $tenantId = auth()->user()->tenant_id;
        $log = DeliveryIntakeLog::where('tenant_id', $tenantId)->findOrFail($id);
        $log->products()->delete();
        $log->delete();

        return response()->json(['message' => 'Delivery intake log deleted successfully']);
    }
}
