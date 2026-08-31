<?php

namespace App\Http\Controllers;

use App\Models\HotHoldingLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class HotHoldingLogController extends Controller
{
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $logs = HotHoldingLog::where('tenant_id', $tenantId)
            ->orderBy('log_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($logs);
    }

    public function store(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;
        $branchId = Auth::user()->branch_id;

        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'log_date' => 'required|date',
            'log_time' => 'required|string',
            'holding_unit' => 'required|string|max:255',
            'staff_name' => 'required|string|max:255',
            'items' => 'required|array|min:1',
            'items.*.foodName' => 'required|string',
            'items.*.timeIntoHold' => 'nullable|string',
            'items.*.check1' => 'nullable',
            'items.*.check2' => 'nullable',
            'items.*.check3' => 'nullable',
            'items.*.check4' => 'nullable',
            'items.*.comments' => 'nullable|string',
            'general_comments' => 'nullable|string',
            'signed_by_staff_name' => 'required|string',
            'signature' => 'required|string',
        ]);

        $items = $request->input('items', []);

        // Evaluate temperature compliance (CCP threshold: >= 63.0°C)
        $hasBelowThreshold = false;
        $hasEnteredTemp = false;

        foreach ($items as $item) {
            foreach (['check1', 'check2', 'check3', 'check4'] as $chk) {
                if (isset($item[$chk]) && $item[$chk] !== '' && $item[$chk] !== null) {
                    $hasEnteredTemp = true;
                    $tempVal = floatval($item[$chk]);
                    if ($tempVal < 63.0) {
                        $hasBelowThreshold = true;
                    }
                }
            }
        }

        $status = ($hasEnteredTemp && !$hasBelowThreshold) ? 'Passed' : 'Needs Review';

        $log = HotHoldingLog::create([
            'tenant_id' => $tenantId,
            'branch_id' => $branchId,
            'log_date' => $validated['log_date'],
            'log_time' => $validated['log_time'],
            'holding_unit' => $validated['holding_unit'],
            'staff_name' => $validated['staff_name'],
            'items' => $items,
            'general_comments' => $validated['general_comments'] ?? null,
            'signed_by_staff_name' => $validated['signed_by_staff_name'],
            'signature' => $validated['signature'],
            'status' => $status,
        ]);

        return response()->json(['message' => 'Hot holding log saved successfully', 'log' => $log], 201);
    }

    public function show($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = HotHoldingLog::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();
        return response()->json($log);
    }

    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = HotHoldingLog::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.foodName' => 'required|string',
            'items.*.timeIntoHold' => 'nullable|string',
            'items.*.check1' => 'nullable',
            'items.*.check2' => 'nullable',
            'items.*.check3' => 'nullable',
            'items.*.check4' => 'nullable',
            'items.*.comments' => 'nullable|string',
            'general_comments' => 'nullable|string',
            'amendment_reason' => 'required|string|min:3',
        ]);

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $originalData = $log->toArray();

            $items = $request->input('items', []);

            // Re-evaluate status
            $hasBelowThreshold = false;
            $hasEnteredTemp = false;

            foreach ($items as $item) {
                foreach (['check1', 'check2', 'check3', 'check4'] as $chk) {
                    if (isset($item[$chk]) && $item[$chk] !== '' && $item[$chk] !== null) {
                        $hasEnteredTemp = true;
                        $tempVal = floatval($item[$chk]);
                        if ($tempVal < 63.0) {
                            $hasBelowThreshold = true;
                        }
                    }
                }
            }

            $status = ($hasEnteredTemp && !$hasBelowThreshold) ? 'Passed' : 'Needs Review';

            $log->update([
                'items' => $items,
                'general_comments' => $validated['general_comments'] ?? $log->general_comments,
                'status' => $status,
            ]);

            $newData = $log->fresh()->toArray();

            $managerId = session('manager_approved_by_id') ?? $request->input('manager_approved_by_id');
            $managerName = session('manager_approved_by_name') ?? $request->input('manager_approved_by_name');

            $auditService = app(\App\Services\HaccpAuditService::class);
            $auditService->logAmendment(
                $log,
                'hot_holding',
                $originalData,
                $newData,
                $validated['amendment_reason'],
                $managerId,
                $managerName
            );

            \Illuminate\Support\Facades\DB::commit();

            return response()->json(['message' => 'Hot holding log updated successfully', 'log' => $log]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['message' => 'Failed to update hot holding log'], 500);
        }
    }

    public function destroy($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = HotHoldingLog::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();
        $log->delete();
        return response()->json(['message' => 'Hot holding log deleted successfully']);
    }
}
