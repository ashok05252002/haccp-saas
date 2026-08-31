<?php

namespace App\Http\Controllers;

use App\Models\ThawingLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ThawingLogController extends Controller
{
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $logs = ThawingLog::where('tenant_id', $tenantId)
            ->orderBy('log_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($logs);
    }

    public function store(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;
        $branchId = Auth::user()->branch_id ?? session('active_branch_id');

        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'log_date' => 'required|date',
            'log_time' => 'required|string',
            'food_item_name' => 'required|string|max:255',
            'defrost_method' => 'required|string|max:255',
            'storage_location' => 'nullable|string|max:255',
            'start_date' => 'required|date',
            'start_time' => 'required|string',
            'completed_date' => 'required|date',
            'completed_time' => 'required|string',
            'defrost_temp' => 'required|numeric',
            'comments' => 'nullable|string',
            'signed_by_staff_name' => 'required|string|max:255',
            'signature' => 'required|string',
        ]);

        // Compliance check (CCP limit: <= 5.0°C for chilled defrosting methods)
        $defrostTemp = floatval($validated['defrost_temp']);
        $defrostMethod = $validated['defrost_method'];
        $isChilledMethod = str_contains(strtolower($defrostMethod), 'refrigerator') ||
                           str_contains(strtolower($defrostMethod), 'chiller') ||
                           str_contains(strtolower($defrostMethod), 'water');

        $passed = !($isChilledMethod && $defrostTemp > 5.0);
        $status = $passed ? 'Passed' : 'Needs Review';

        $log = ThawingLog::create([
            'tenant_id' => $tenantId,
            'branch_id' => $branchId,
            'log_date' => $validated['log_date'],
            'log_time' => $validated['log_time'],
            'food_item_name' => $validated['food_item_name'],
            'defrost_method' => $validated['defrost_method'],
            'storage_location' => $validated['storage_location'] ?? null,
            'start_date' => $validated['start_date'],
            'start_time' => $validated['start_time'],
            'completed_date' => $validated['completed_date'],
            'completed_time' => $validated['completed_time'],
            'defrost_temp' => $defrostTemp,
            'comments' => $validated['comments'] ?? null,
            'signed_by_staff_name' => $validated['signed_by_staff_name'],
            'signature' => $validated['signature'],
            'status' => $status,
        ]);

        return response()->json(['message' => 'Thawing log saved successfully', 'log' => $log], 201);
    }

    public function show($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = ThawingLog::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();
        return response()->json($log);
    }

    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = ThawingLog::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();

        $validated = $request->validate([
            'log_date' => 'required|date',
            'log_time' => 'required|string',
            'food_item_name' => 'required|string|max:255',
            'defrost_method' => 'required|string|max:255',
            'storage_location' => 'nullable|string|max:255',
            'start_date' => 'required|date',
            'start_time' => 'required|string',
            'completed_date' => 'required|date',
            'completed_time' => 'required|string',
            'defrost_temp' => 'required|numeric',
            'comments' => 'nullable|string',
            'signed_by_staff_name' => 'required|string|max:255',
            'signature' => 'nullable|string',
            'amendment_reason' => 'required|string|min:3',
        ]);

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $originalData = $log->toArray();

            $defrostTemp = floatval($validated['defrost_temp']);
            $defrostMethod = $validated['defrost_method'];
            $isChilledMethod = str_contains(strtolower($defrostMethod), 'refrigerator') ||
                               str_contains(strtolower($defrostMethod), 'chiller') ||
                               str_contains(strtolower($defrostMethod), 'water');

            $passed = !($isChilledMethod && $defrostTemp > 5.0);
            $status = $passed ? 'Passed' : 'Needs Review';

            $log->update([
                'log_date' => $validated['log_date'],
                'log_time' => $validated['log_time'],
                'food_item_name' => $validated['food_item_name'],
                'defrost_method' => $validated['defrost_method'],
                'storage_location' => $validated['storage_location'] ?? null,
                'start_date' => $validated['start_date'],
                'start_time' => $validated['start_time'],
                'completed_date' => $validated['completed_date'],
                'completed_time' => $validated['completed_time'],
                'defrost_temp' => $defrostTemp,
                'comments' => $validated['comments'] ?? null,
                'signed_by_staff_name' => $validated['signed_by_staff_name'],
                'signature' => $validated['signature'] ?: $log->signature,
                'status' => $status,
            ]);

            $newData = $log->fresh()->toArray();

            $managerId = session('manager_approved_by_id') ?? $request->input('manager_approved_by_id');
            $managerName = session('manager_approved_by_name') ?? $request->input('manager_approved_by_name');

            $auditService = app(\App\Services\HaccpAuditService::class);
            $auditService->logAmendment(
                $log,
                'thawing',
                $originalData,
                $newData,
                $validated['amendment_reason'],
                $managerId,
                $managerName
            );

            \Illuminate\Support\Facades\DB::commit();

            return response()->json(['message' => 'Thawing log updated successfully', 'log' => $log]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['message' => 'Failed to update thawing log'], 500);
        }
    }

    public function destroy($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = ThawingLog::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();
        $log->delete();
        return response()->json(['message' => 'Thawing log deleted successfully']);
    }
}
