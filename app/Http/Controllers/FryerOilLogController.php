<?php

namespace App\Http\Controllers;

use App\Models\FryerOilLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FryerOilLogController extends Controller
{
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $logs = FryerOilLog::where('tenant_id', $tenantId)
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
            'staff_name' => 'required|string|max:255',
            'fryer_station' => 'required|string|max:255',
            'frying_temp' => 'required|numeric',
            'oil_condition' => 'required|string',
            'oil_quality_acceptable' => 'required|boolean',
            'oil_action_taken' => 'required|string',
            'quantity_removed' => 'nullable|numeric',
            'step1_comments' => 'nullable|string',
            'disposal_type' => 'required|string',
            'grease_area' => 'required|string',
            'disposal_quantity' => 'nullable|numeric',
            'disposal_method' => 'required|string',
            'waste_contractor' => 'nullable|string',
            'collection_ref_number' => 'nullable|string',
            'next_cleaning_due_date' => 'nullable|date',
            'step2_comments' => 'nullable|string',
            'signed_by_staff_name' => 'required|string',
            'signature' => 'required|string',
        ]);

        // Evaluate Status
        $isTempHigh = $validated['frying_temp'] > 175;
        $passed = $validated['oil_quality_acceptable'] && !$isTempHigh;
        $status = $passed ? 'Passed' : 'Attention Required';

        $log = FryerOilLog::create([
            'tenant_id' => $tenantId,
            'branch_id' => $branchId,
            'log_date' => $validated['log_date'],
            'log_time' => $validated['log_time'],
            'staff_name' => $validated['staff_name'],
            'fryer_station' => $validated['fryer_station'],
            'frying_temp' => $validated['frying_temp'],
            'oil_condition' => $validated['oil_condition'],
            'oil_quality_acceptable' => $validated['oil_quality_acceptable'],
            'oil_action_taken' => $validated['oil_action_taken'],
            'quantity_removed' => $validated['quantity_removed'] ?? null,
            'step1_comments' => $validated['step1_comments'] ?? null,
            'disposal_type' => $validated['disposal_type'],
            'grease_area' => $validated['grease_area'],
            'disposal_quantity' => $validated['disposal_quantity'] ?? null,
            'disposal_method' => $validated['disposal_method'],
            'waste_contractor' => $validated['waste_contractor'] ?? null,
            'collection_ref_number' => $validated['collection_ref_number'] ?? null,
            'next_cleaning_due_date' => $validated['next_cleaning_due_date'] ?? null,
            'step2_comments' => $validated['step2_comments'] ?? null,
            'signed_by_staff_name' => $validated['signed_by_staff_name'],
            'signature' => $validated['signature'],
            'status' => $status,
        ]);

        return response()->json(['message' => 'Fryer oil log created successfully', 'log' => $log], 201);
    }

    public function show($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = FryerOilLog::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();
        return response()->json($log);
    }

    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = FryerOilLog::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();

        $validated = $request->validate([
            'log_date' => 'required|date',
            'log_time' => 'required|string',
            'staff_name' => 'required|string|max:255',
            'fryer_station' => 'required|string|max:255',
            'frying_temp' => 'required|numeric',
            'oil_condition' => 'required|string',
            'oil_quality_acceptable' => 'required|boolean',
            'oil_action_taken' => 'required|string',
            'quantity_removed' => 'nullable|numeric',
            'step1_comments' => 'nullable|string',
            'disposal_type' => 'required|string',
            'grease_area' => 'required|string',
            'disposal_quantity' => 'nullable|numeric',
            'disposal_method' => 'required|string',
            'waste_contractor' => 'nullable|string',
            'collection_ref_number' => 'nullable|string',
            'next_cleaning_due_date' => 'nullable|date',
            'step2_comments' => 'nullable|string',
            'signed_by_staff_name' => 'required|string',
            'signature' => 'nullable|string',
        ]);

        $isTempHigh = $validated['frying_temp'] > 175;
        $passed = $validated['oil_quality_acceptable'] && !$isTempHigh;
        $status = $passed ? 'Passed' : 'Attention Required';

        $log->update([
            'log_date' => $validated['log_date'],
            'log_time' => $validated['log_time'],
            'staff_name' => $validated['staff_name'],
            'fryer_station' => $validated['fryer_station'],
            'frying_temp' => $validated['frying_temp'],
            'oil_condition' => $validated['oil_condition'],
            'oil_quality_acceptable' => $validated['oil_quality_acceptable'],
            'oil_action_taken' => $validated['oil_action_taken'],
            'quantity_removed' => $validated['quantity_removed'] ?? null,
            'step1_comments' => $validated['step1_comments'] ?? null,
            'disposal_type' => $validated['disposal_type'],
            'grease_area' => $validated['grease_area'],
            'disposal_quantity' => $validated['disposal_quantity'] ?? null,
            'disposal_method' => $validated['disposal_method'],
            'waste_contractor' => $validated['waste_contractor'] ?? null,
            'collection_ref_number' => $validated['collection_ref_number'] ?? null,
            'next_cleaning_due_date' => $validated['next_cleaning_due_date'] ?? null,
            'step2_comments' => $validated['step2_comments'] ?? null,
            'signed_by_staff_name' => $validated['signed_by_staff_name'],
            'signature' => $validated['signature'] ?: $log->signature,
            'status' => $status,
        ]);

        return response()->json(['message' => 'Fryer oil log updated successfully', 'log' => $log]);
    }

    public function destroy($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = FryerOilLog::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();
        $log->delete();
        return response()->json(['message' => 'Fryer oil log deleted successfully']);
    }
}
