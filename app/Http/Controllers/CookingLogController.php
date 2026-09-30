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
            'probe_id' => 'required|string|max:255',
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

        $request->validate($rules, [
            'probe_id.required' => 'Please select Probe / Thermometer Used.',
        ]);

        $tenantId = Auth::user()->tenant_id;
        $branchId = Auth::user()->branch_id ?? session('active_branch_id');
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        $finalSignedAt = ($status === 'COMPLETED') ? ($request->final_signed_at ?? now()) : null;

        // Auto-evaluate blast chilling result if both end temp and duration are provided
        $hasChillingData = ($request->chilling_end_temp !== null && $request->chilling_end_temp !== '' && $request->chilling_duration_minutes !== null && $request->chilling_duration_minutes !== '' && ($request->chilling_method ?? '') !== 'N/A');
        $chillingPassed = $request->chilling_passed ?? true;
        if ($hasChillingData) {
            $endTemp = floatval($request->chilling_end_temp);
            $duration = intval($request->chilling_duration_minutes);
            $chillingPassed = ($endTemp <= 5.0 && $duration <= 150);

            if (!$chillingPassed && $status === 'COMPLETED') {
                $ca = trim(strval($request->chilling_corrective_action ?? ''));
                $caLower = strtolower($ca);
                if ($ca === '' || $caLower === 'n/a' || $caLower === 'na') {
                    return response()->json([
                        'message' => 'The given data was invalid.',
                        'errors' => [
                            'chilling_corrective_action' => ['Mandatory Corrective Action is required for failed blast chilling step. It cannot be empty or N/A.']
                        ]
                    ], 422);
                }
            }
        }

        if ($status === 'COMPLETED') {
            $otherStepFailed = false;
            $failedStepNames = [];

            if ($request->cooking_temp !== null && $request->cooking_temp !== '') {
                $cTemp = floatval($request->cooking_temp);
                if ($cTemp < 75.0 || $request->cooking_passed === false || $request->cooking_passed === 0 || $request->cooking_passed === '0') {
                    $otherStepFailed = true;
                    $failedStepNames[] = 'Cooking Step';
                }
            }
            if ($request->chiller_temp !== null && $request->chiller_temp !== '') {
                $chTemp = floatval($request->chiller_temp);
                if ($chTemp < 0.0 || $chTemp > 5.0 || $request->chiller_passed === false || $request->chiller_passed === 0 || $request->chiller_passed === '0') {
                    $otherStepFailed = true;
                    $failedStepNames[] = 'Chiller Storage Step';
                }
            }
            if ($request->reheating_temp !== null && $request->reheating_temp !== '') {
                $rTemp = floatval($request->reheating_temp);
                if ($rTemp < 75.0 || $request->reheating_passed === false || $request->reheating_passed === 0 || $request->reheating_passed === '0') {
                    $otherStepFailed = true;
                    $failedStepNames[] = 'Reheating Step';
                }
            }
            if ($request->hot_holding_temp !== null && $request->hot_holding_temp !== '') {
                $hTemp = floatval($request->hot_holding_temp);
                if ($hTemp < 63.0 || $request->hot_holding_passed === false || $request->hot_holding_passed === 0 || $request->hot_holding_passed === '0') {
                    $otherStepFailed = true;
                    $failedStepNames[] = 'Hot Holding Step';
                }
            }

            if ($otherStepFailed && Controller::isInvalidCorrectiveAction($request->corrective_action ?? null)) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => [
                        'corrective_action' => ['Mandatory Corrective Action is required for failed step(s): ' . implode(', ', $failedStepNames) . '. It cannot be empty or N/A.']
                    ]
                ], 422);
            }
        }

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
            'chilling_passed' => $hasChillingData ? $chillingPassed : ($request->chilling_passed ?? true),
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
            'probe_id' => 'required|string|max:255',
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

        $validated = $request->validate($rules, [
            'probe_id.required' => 'Please select Probe / Thermometer Used.',
        ]);

        $updateData = $validated;
        unset($updateData['amendment_reason']);
        $updateData['status'] = $targetStatus;

        // Auto-evaluate blast chilling result if both end temp and duration are provided
        $checkEndTemp = array_key_exists('chilling_end_temp', $updateData) ? $updateData['chilling_end_temp'] : $log->chilling_end_temp;
        $checkDuration = array_key_exists('chilling_duration_minutes', $updateData) ? $updateData['chilling_duration_minutes'] : $log->chilling_duration_minutes;
        $checkMethod = array_key_exists('chilling_method', $updateData) ? $updateData['chilling_method'] : $log->chilling_method;
        $checkCA = array_key_exists('chilling_corrective_action', $updateData) ? $updateData['chilling_corrective_action'] : $log->chilling_corrective_action;

        $hasChillingData = ($checkEndTemp !== null && $checkEndTemp !== '' && $checkDuration !== null && $checkDuration !== '' && $checkMethod !== 'N/A');
        if ($hasChillingData) {
            $endTemp = floatval($checkEndTemp);
            $duration = intval($checkDuration);
            $chillingPassed = ($endTemp <= 5.0 && $duration <= 150);
            $updateData['chilling_passed'] = $chillingPassed;

            if (!$chillingPassed && $targetStatus === 'COMPLETED') {
                $ca = trim(strval($checkCA ?? ''));
                $caLower = strtolower($ca);
                if ($ca === '' || $caLower === 'n/a' || $caLower === 'na') {
                    return response()->json([
                        'message' => 'The given data was invalid.',
                        'errors' => [
                            'chilling_corrective_action' => ['Mandatory Corrective Action is required for failed blast chilling step. It cannot be empty or N/A.']
                        ]
                    ], 422);
                }
            }
        }

        if ($targetStatus === 'COMPLETED') {
            $otherStepFailed = false;
            $failedStepNames = [];

            $cTemp = array_key_exists('cooking_temp', $updateData) ? $updateData['cooking_temp'] : $log->cooking_temp;
            $cPassed = array_key_exists('cooking_passed', $updateData) ? $updateData['cooking_passed'] : $log->cooking_passed;
            if ($cTemp !== null && $cTemp !== '') {
                $val = floatval($cTemp);
                if ($val < 75.0 || $cPassed === false || $cPassed === 0 || $cPassed === '0') {
                    $otherStepFailed = true;
                    $failedStepNames[] = 'Cooking Step';
                }
            }

            $chillerTemp = array_key_exists('chiller_temp', $updateData) ? $updateData['chiller_temp'] : $log->chiller_temp;
            $chillerPassed = array_key_exists('chiller_passed', $updateData) ? $updateData['chiller_passed'] : $log->chiller_passed;
            if ($chillerTemp !== null && $chillerTemp !== '') {
                $val = floatval($chillerTemp);
                if ($val < 0.0 || $val > 5.0 || $chillerPassed === false || $chillerPassed === 0 || $chillerPassed === '0') {
                    $otherStepFailed = true;
                    $failedStepNames[] = 'Chiller Storage Step';
                }
            }

            $rhTemp = array_key_exists('reheating_temp', $updateData) ? $updateData['reheating_temp'] : $log->reheating_temp;
            $rhPassed = array_key_exists('reheating_passed', $updateData) ? $updateData['reheating_passed'] : $log->reheating_passed;
            if ($rhTemp !== null && $rhTemp !== '') {
                $val = floatval($rhTemp);
                if ($val < 75.0 || $rhPassed === false || $rhPassed === 0 || $rhPassed === '0') {
                    $otherStepFailed = true;
                    $failedStepNames[] = 'Reheating Step';
                }
            }

            $hhTemp = array_key_exists('hot_holding_temp', $updateData) ? $updateData['hot_holding_temp'] : $log->hot_holding_temp;
            $hhPassed = array_key_exists('hot_holding_passed', $updateData) ? $updateData['hot_holding_passed'] : $log->hot_holding_passed;
            if ($hhTemp !== null && $hhTemp !== '') {
                $val = floatval($hhTemp);
                if ($val < 63.0 || $hhPassed === false || $hhPassed === 0 || $hhPassed === '0') {
                    $otherStepFailed = true;
                    $failedStepNames[] = 'Hot Holding Step';
                }
            }

            $caVal = array_key_exists('corrective_action', $updateData) ? $updateData['corrective_action'] : $log->corrective_action;
            if ($otherStepFailed && Controller::isInvalidCorrectiveAction($caVal)) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => [
                        'corrective_action' => ['Mandatory Corrective Action is required for failed step(s): ' . implode(', ', $failedStepNames) . '. It cannot be empty or N/A.']
                    ]
                ], 422);
            }
        }

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
