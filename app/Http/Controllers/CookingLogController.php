<?php

namespace App\Http\Controllers;

use App\Models\CookingLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CookingLogController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $logs = CookingLog::where('tenant_id', $tenantId)
            ->orderBy('log_date', 'desc')
            ->orderBy('log_time', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json($logs);
    }

    public function show($id)
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $log = CookingLog::where('tenant_id', $tenantId)
            ->where('id', $id)
            ->firstOrFail();

        return response()->json($log);
    }

    public function store(Request $request)
    {
        $status = in_array($request->status, ['IN_PROGRESS', 'COMPLETED']) ? $request->status : 'COMPLETED';

        $rules = [
            'log_date' => 'required|date',
            'log_time' => 'required|string',
            'food_item' => 'required|string|max:255',
            'staff_name' => 'required|string|max:255',
            'batch_code' => 'nullable|string|max:255',
            'probe_id' => 'nullable|string|max:255',
            'cooking_temp' => 'nullable|numeric',
            'cooking_target' => 'nullable|string',
            'cooking_method' => 'nullable|string',
            'time_finished_cooking' => 'nullable|string',
            'cooking_passed' => 'nullable|boolean',
            'chilling_method' => 'nullable|string',
            'chilling_start_time' => 'nullable|string',
            'chilling_end_time' => 'nullable|string',
            'chilling_start_temp' => 'nullable|numeric',
            'chilling_end_temp' => 'nullable|numeric',
            'chilling_duration_minutes' => 'nullable|integer',
            'chilling_passed' => 'nullable|boolean',
            'chilling_corrective_action' => 'nullable|string',
            'chiller_location' => 'nullable|string',
            'chiller_temp' => 'nullable|numeric',
            'chiller_passed' => 'nullable|boolean',
            'reheating_temp' => 'nullable|numeric',
            'reheating_method' => 'nullable|string',
            'reheating_passed' => 'nullable|boolean',
            'hot_holding_location' => 'nullable|string',
            'hot_holding_temp' => 'nullable|numeric',
            'hot_holding_passed' => 'nullable|boolean',
            'corrective_action' => 'nullable|string',
            'notes' => 'nullable|string',
            'signature' => ($status === 'COMPLETED') ? 'required|string' : 'nullable|string',
            'status' => 'nullable|string|in:IN_PROGRESS,COMPLETED',
            'final_signed_at' => 'nullable|date',
        ];

        $request->validate($rules);

        $tenantId = Auth::user()->tenant_id;
        $branchId = Auth::user()->branch_id ?? session('active_branch_id');
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        $finalSignedAt = ($status === 'COMPLETED') ? ($request->final_signed_at ?? now()) : null;

        $log = CookingLog::create([
            'tenant_id' => $tenantId,
            'branch_id' => $branchId,
            'log_date' => $request->log_date,
            'log_time' => $request->log_time,
            'staff_name' => $request->staff_name,
            'food_item' => $request->food_item,
            'batch_code' => $request->batch_code,
            'probe_id' => $request->probe_id,
            'cooking_temp' => $request->cooking_temp,
            'cooking_target' => $request->cooking_target ?? '≥ 75°C',
            'cooking_method' => $request->cooking_method,
            'time_finished_cooking' => $request->time_finished_cooking,
            'cooking_passed' => $request->cooking_passed ?? true,
            'chilling_method' => $request->chilling_method,
            'chilling_start_time' => $request->chilling_start_time,
            'chilling_end_time' => $request->chilling_end_time,
            'chilling_start_temp' => $request->chilling_start_temp,
            'chilling_end_temp' => $request->chilling_end_temp,
            'chilling_duration_minutes' => $request->chilling_duration_minutes,
            'chilling_passed' => $request->chilling_passed ?? true,
            'chilling_corrective_action' => $request->chilling_corrective_action,
            'chiller_location' => $request->chiller_location,
            'chiller_temp' => $request->chiller_temp,
            'chiller_passed' => $request->chiller_passed ?? true,
            'reheating_temp' => $request->reheating_temp,
            'reheating_method' => $request->reheating_method,
            'reheating_passed' => $request->reheating_passed ?? true,
            'hot_holding_location' => $request->hot_holding_location,
            'hot_holding_temp' => $request->hot_holding_temp,
            'hot_holding_passed' => $request->hot_holding_passed ?? true,
            'corrective_action' => $request->corrective_action,
            'notes' => $request->notes,
            'signature' => $request->signature,
            'status' => $status,
            'final_signed_at' => $finalSignedAt,
        ]);

        return response()->json(['message' => 'Cooking log saved successfully', 'log' => $log], 201);
    }

    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $log = CookingLog::where('tenant_id', $tenantId)->findOrFail($id);
        $isExistingInProgress = ($log->status === 'IN_PROGRESS');
        $targetStatus = in_array($request->status, ['IN_PROGRESS', 'COMPLETED'])
            ? $request->status
            : ($isExistingInProgress ? 'IN_PROGRESS' : 'COMPLETED');

        $rules = [
            'log_date' => 'required|date',
            'log_time' => 'required|string',
            'food_item' => 'required|string|max:255',
            'staff_name' => 'required|string|max:255',
            'batch_code' => 'nullable|string|max:255',
            'probe_id' => 'nullable|string|max:255',
            'cooking_temp' => 'nullable|numeric',
            'cooking_target' => 'nullable|string',
            'cooking_method' => 'nullable|string',
            'time_finished_cooking' => 'nullable|string',
            'cooking_passed' => 'nullable|boolean',
            'chilling_method' => 'nullable|string',
            'chilling_start_time' => 'nullable|string',
            'chilling_end_time' => 'nullable|string',
            'chilling_start_temp' => 'nullable|numeric',
            'chilling_end_temp' => 'nullable|numeric',
            'chilling_duration_minutes' => 'nullable|integer',
            'chilling_passed' => 'nullable|boolean',
            'chilling_corrective_action' => 'nullable|string',
            'chiller_location' => 'nullable|string',
            'chiller_temp' => 'nullable|numeric',
            'chiller_passed' => 'nullable|boolean',
            'reheating_temp' => 'nullable|numeric',
            'reheating_method' => 'nullable|string',
            'reheating_passed' => 'nullable|boolean',
            'hot_holding_location' => 'nullable|string',
            'hot_holding_temp' => 'nullable|numeric',
            'hot_holding_passed' => 'nullable|boolean',
            'corrective_action' => 'nullable|string',
            'notes' => 'nullable|string',
            'status' => 'nullable|string|in:IN_PROGRESS,COMPLETED',
            'final_signed_at' => 'nullable|date',
        ];

        if ($isExistingInProgress) {
            // During IN_PROGRESS: amendment_reason is NEVER required
            $rules['amendment_reason'] = 'nullable|string';

            if ($targetStatus === 'COMPLETED') {
                // Final Sign-Off: staff signature is mandatory
                $rules['signature'] = 'required|string';
            } else {
                $rules['signature'] = 'nullable|string';
            }
        } else {
            // Already COMPLETED: Requirement 1 amendment flow
            $rules['signature'] = 'nullable|string';
            $rules['amendment_reason'] = 'required|string|min:3';
        }

        $validated = $request->validate($rules);

        $updateData = $validated;
        unset($updateData['amendment_reason']);
        $updateData['status'] = $targetStatus;

        // Final Sign-Off timestamp
        if ($isExistingInProgress && $targetStatus === 'COMPLETED') {
            $updateData['final_signed_at'] = now();
        }

        // If updating an IN_PROGRESS draft (whether continuing or final sign-off):
        // update directly without generating audit amendment history
        if ($isExistingInProgress) {
            $log->update($updateData);
            $message = ($targetStatus === 'COMPLETED')
                ? 'Cooking batch completed and signed off'
                : 'Cooking log updated successfully';

            return response()->json(['message' => $message, 'log' => $log]);
        }

        // If updating an already COMPLETED log: apply Requirement 1 amendment audit logging within transaction
        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $originalData = $log->toArray();

            $log->update($updateData);

            $newData = $log->fresh()->toArray();

            $managerId = session('manager_approved_by_id') ?? $request->input('manager_approved_by_id');
            $managerName = session('manager_approved_by_name') ?? $request->input('manager_approved_by_name');

            $auditService = app(\App\Services\HaccpAuditService::class);
            $auditService->logAmendment(
                $log,
                'cooking_temperature',
                $originalData,
                $newData,
                $validated['amendment_reason'],
                $managerId,
                $managerName
            );

            \Illuminate\Support\Facades\DB::commit();

            return response()->json(['message' => 'Cooking log updated successfully', 'log' => $log]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['message' => 'Failed to update cooking log: ' . $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = CookingLog::where('tenant_id', $tenantId)->findOrFail($id);
        $log->delete();

        return response()->json(['message' => 'Cooking log deleted successfully']);
    }
}
