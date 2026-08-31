<?php

namespace App\Http\Controllers;

use App\Models\PestControlLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PestControlLogController extends Controller
{
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $logs = PestControlLog::where('tenant_id', $tenantId)
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
            'check_type' => 'nullable|string',
            'checklist_answers' => 'nullable|array',
            'pest_activity_observed' => 'required|boolean',
            'pest_type' => 'nullable|string',
            'location_found' => 'nullable|string',
            'evidence_observed' => 'nullable|string',
            'food_affected' => 'nullable|boolean',
            'action_notes' => 'nullable|string',
            'contractor_contacted' => 'nullable|boolean',
            'contractor_name' => 'nullable|string',
            'visit_date' => 'nullable|date',
            'report_ref_number' => 'nullable|string',
            'next_visit_due_date' => 'nullable|date',
            'recommendations' => 'nullable|string',
            'general_comments' => 'nullable|string',
            'signed_by_staff_name' => 'required|string',
            'signature' => 'required|string',
        ]);

        // Evaluate Status
        $hasChecklistNo = false;
        if (!empty($validated['checklist_answers'])) {
            foreach ($validated['checklist_answers'] as $item) {
                if (isset($item['answer']) && $item['answer'] === false) {
                    $hasChecklistNo = true;
                    break;
                }
            }
        }

        $passed = !$hasChecklistNo && !$validated['pest_activity_observed'];
        $status = $passed ? 'Passed' : 'Attention Required';

        $log = PestControlLog::create([
            'tenant_id' => $tenantId,
            'branch_id' => $branchId,
            'log_date' => $validated['log_date'],
            'log_time' => $validated['log_time'],
            'staff_name' => $validated['staff_name'],
            'check_type' => $validated['check_type'] ?? 'General Check',
            'checklist_answers' => $validated['checklist_answers'] ?? [],
            'pest_activity_observed' => $validated['pest_activity_observed'],
            'pest_type' => $validated['pest_activity_observed'] ? ($validated['pest_type'] ?? null) : null,
            'location_found' => $validated['pest_activity_observed'] ? ($validated['location_found'] ?? null) : null,
            'evidence_observed' => $validated['pest_activity_observed'] ? ($validated['evidence_observed'] ?? null) : null,
            'food_affected' => $validated['pest_activity_observed'] ? ($validated['food_affected'] ?? false) : false,
            'action_notes' => $validated['pest_activity_observed'] ? ($validated['action_notes'] ?? null) : null,
            'contractor_contacted' => $validated['pest_activity_observed'] ? ($validated['contractor_contacted'] ?? false) : false,
            'contractor_name' => $validated['contractor_name'] ?? null,
            'visit_date' => $validated['visit_date'] ?? null,
            'report_ref_number' => $validated['report_ref_number'] ?? null,
            'next_visit_due_date' => $validated['next_visit_due_date'] ?? null,
            'recommendations' => $validated['recommendations'] ?? null,
            'general_comments' => $validated['general_comments'] ?? null,
            'signed_by_staff_name' => $validated['signed_by_staff_name'],
            'signature' => $validated['signature'],
            'status' => $status,
        ]);

        return response()->json(['message' => 'Pest control log created successfully', 'log' => $log], 201);
    }

    public function show($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = PestControlLog::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();
        return response()->json($log);
    }

    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = PestControlLog::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();

        $validated = $request->validate([
            'log_date' => 'required|date',
            'log_time' => 'required|string',
            'staff_name' => 'required|string|max:255',
            'check_type' => 'nullable|string',
            'checklist_answers' => 'nullable|array',
            'pest_activity_observed' => 'required|boolean',
            'pest_type' => 'nullable|string',
            'location_found' => 'nullable|string',
            'evidence_observed' => 'nullable|string',
            'food_affected' => 'nullable|boolean',
            'action_notes' => 'nullable|string',
            'contractor_contacted' => 'nullable|boolean',
            'contractor_name' => 'nullable|string',
            'visit_date' => 'nullable|date',
            'report_ref_number' => 'nullable|string',
            'next_visit_due_date' => 'nullable|date',
            'recommendations' => 'nullable|string',
            'general_comments' => 'nullable|string',
            'signed_by_staff_name' => 'required|string',
            'signature' => 'nullable|string',
            'amendment_reason' => 'required|string|min:3',
        ]);

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $originalData = $log->toArray();

            $hasChecklistNo = false;
            if (!empty($validated['checklist_answers'])) {
                foreach ($validated['checklist_answers'] as $item) {
                    if (isset($item['answer']) && $item['answer'] === false) {
                        $hasChecklistNo = true;
                        break;
                    }
                }
            }

            $passed = !$hasChecklistNo && !$validated['pest_activity_observed'];
            $status = $passed ? 'Passed' : 'Attention Required';

            $log->update([
                'log_date' => $validated['log_date'],
                'log_time' => $validated['log_time'],
                'staff_name' => $validated['staff_name'],
                'check_type' => $validated['check_type'] ?? 'General Check',
                'checklist_answers' => $validated['checklist_answers'] ?? [],
                'pest_activity_observed' => $validated['pest_activity_observed'],
                'pest_type' => $validated['pest_activity_observed'] ? ($validated['pest_type'] ?? null) : null,
                'location_found' => $validated['pest_activity_observed'] ? ($validated['location_found'] ?? null) : null,
                'evidence_observed' => $validated['pest_activity_observed'] ? ($validated['evidence_observed'] ?? null) : null,
                'food_affected' => $validated['pest_activity_observed'] ? ($validated['food_affected'] ?? false) : false,
                'action_notes' => $validated['pest_activity_observed'] ? ($validated['action_notes'] ?? null) : null,
                'contractor_contacted' => $validated['pest_activity_observed'] ? ($validated['contractor_contacted'] ?? false) : false,
                'contractor_name' => $validated['contractor_name'] ?? null,
                'visit_date' => $validated['visit_date'] ?? null,
                'report_ref_number' => $validated['report_ref_number'] ?? null,
                'next_visit_due_date' => $validated['next_visit_due_date'] ?? null,
                'recommendations' => $validated['recommendations'] ?? null,
                'general_comments' => $validated['general_comments'] ?? null,
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
                'pest_control',
                $originalData,
                $newData,
                $validated['amendment_reason'],
                $managerId,
                $managerName
            );

            \Illuminate\Support\Facades\DB::commit();

            return response()->json(['message' => 'Pest control log updated successfully', 'log' => $log]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['message' => 'Failed to update pest control log'], 500);
        }
    }

    public function destroy($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = PestControlLog::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();
        $log->delete();
        return response()->json(['message' => 'Pest control log deleted successfully']);
    }
}
