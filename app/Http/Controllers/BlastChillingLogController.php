<?php

namespace App\Http\Controllers;

use App\Models\BlastChillingLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BlastChillingLogController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $logs = BlastChillingLog::where('tenant_id', $tenantId)
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

        $log = BlastChillingLog::where('tenant_id', $tenantId)
            ->where('id', $id)
            ->firstOrFail();

        return response()->json($log);
    }

    public function store(Request $request)
    {
        $request->validate([
            'log_date'          => 'required|date',
            'log_time'          => 'required|string',
            'food_item'         => 'required|string|max:255',
            'staff_name'        => 'nullable|string|max:255',
            'batch_code'        => 'nullable|string|max:255',
            'probe_id'          => 'nullable|string|max:255',
            'chiller_location'  => 'nullable|string|max:255',
            'chilling_start_time' => 'nullable|string',
            'chilling_end_time' => 'nullable|string',
            'start_temp'        => 'nullable|numeric',
            'end_temp'          => 'required|numeric',
            'duration_minutes'  => 'nullable|integer',
            'corrective_action' => 'nullable|string',
            'notes'             => 'nullable|string',
            'signature'         => 'required|string',
        ], [
            'food_item.required' => 'Food Item / Product is required.',
            'end_temp.required'  => 'Blast Chilling End Temperature is required.',
            'signature.required' => 'Staff Verification Signature is required.',
        ]);

        $tenantId = Auth::user()->tenant_id;
        $branchId = Auth::user()->branch_id ?? session('active_branch_id');
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Auto-evaluate CCP-4 Limit: End Temp <= 3.0°C and Duration <= 90 mins
        $endTemp = (float) $request->end_temp;
        $duration = $request->duration_minutes ? (int) $request->duration_minutes : 0;
        $checkPassed = ($endTemp <= 3.0) && ($duration === 0 || $duration <= 90);

        if (!$checkPassed && empty($request->corrective_action)) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors'  => [
                    'corrective_action' => ['Corrective action is mandatory when CCP-4 limit is not met.']
                ]
            ], 422);
        }

        $log = BlastChillingLog::create([
            'tenant_id'           => $tenantId,
            'branch_id'           => $branchId,
            'log_date'            => $request->log_date,
            'log_time'            => $request->log_time,
            'staff_name'          => $request->staff_name,
            'food_item'           => $request->food_item,
            'batch_code'          => $request->batch_code,
            'probe_id'            => $request->probe_id,
            'chiller_location'    => $request->chiller_location,
            'chilling_start_time' => $request->chilling_start_time,
            'chilling_end_time'   => $request->chilling_end_time,
            'start_temp'          => $request->start_temp !== null ? (float)$request->start_temp : null,
            'end_temp'            => $endTemp,
            'duration_minutes'    => $request->duration_minutes !== null ? (int)$request->duration_minutes : null,
            'check_passed'        => $checkPassed,
            'corrective_action'   => $request->corrective_action,
            'notes'               => $request->notes,
            'signature'           => $request->signature,
        ]);

        return response()->json(['message' => 'Blast chilling log saved successfully', 'log' => $log], 201);
    }

    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = BlastChillingLog::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'log_date'          => 'required|date',
            'log_time'          => 'required|string',
            'food_item'         => 'required|string|max:255',
            'staff_name'        => 'nullable|string|max:255',
            'batch_code'        => 'nullable|string|max:255',
            'probe_id'          => 'nullable|string|max:255',
            'chiller_location'  => 'nullable|string|max:255',
            'chilling_start_time' => 'nullable|string',
            'chilling_end_time' => 'nullable|string',
            'start_temp'        => 'nullable|numeric',
            'end_temp'          => 'required|numeric',
            'duration_minutes'  => 'nullable|integer',
            'corrective_action' => 'nullable|string',
            'notes'             => 'nullable|string',
            'signature'         => 'nullable|string',
            'amendment_reason'  => 'required|string|min:3',
        ]);

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $originalData = $log->toArray();

            $endTemp = (float) $request->end_temp;
            $duration = $request->duration_minutes ? (int) $request->duration_minutes : 0;
            $checkPassed = ($endTemp <= 3.0) && ($duration === 0 || $duration <= 90);

            $log->update([
                'log_date'            => $request->log_date,
                'log_time'            => $request->log_time,
                'staff_name'          => $request->staff_name,
                'food_item'           => $request->food_item,
                'batch_code'          => $request->batch_code,
                'probe_id'            => $request->probe_id,
                'chiller_location'    => $request->chiller_location,
                'chilling_start_time' => $request->chilling_start_time,
                'chilling_end_time'   => $request->chilling_end_time,
                'start_temp'          => $request->start_temp !== null ? (float)$request->start_temp : null,
                'end_temp'            => $endTemp,
                'duration_minutes'    => $request->duration_minutes !== null ? (int)$request->duration_minutes : null,
                'check_passed'        => $checkPassed,
                'corrective_action'   => $request->corrective_action,
                'notes'               => $request->notes,
                'signature'           => $request->signature ?: $log->signature,
            ]);

            $newData = $log->fresh()->toArray();

            $managerId = session('manager_approved_by_id') ?? $request->input('manager_approved_by_id');
            $managerName = session('manager_approved_by_name') ?? $request->input('manager_approved_by_name');

            $auditService = app(\App\Services\HaccpAuditService::class);
            $auditService->logAmendment(
                $log,
                'blast_chilling',
                $originalData,
                $newData,
                $validated['amendment_reason'],
                $managerId,
                $managerName
            );

            \Illuminate\Support\Facades\DB::commit();

            return response()->json(['message' => 'Blast chilling log updated successfully', 'log' => $log]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['message' => 'Failed to update blast chilling log'], 500);
        }
    }

    public function destroy($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = BlastChillingLog::where('tenant_id', $tenantId)->findOrFail($id);
        $log->delete();

        return response()->json(['message' => 'Log deleted successfully']);
    }
}
