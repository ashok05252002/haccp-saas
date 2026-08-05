<?php

namespace App\Http\Controllers;

use App\Models\StaffTrainingLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StaffTrainingLogController extends Controller
{
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $logs = StaffTrainingLog::where('tenant_id', $tenantId)
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
            'staff_name' => 'required|string|max:255',
            'staff_position' => 'nullable|string',
            'task_id' => 'nullable|integer',
            'task_title' => 'required|string|max:255',
            'task_description' => 'nullable|string',
            'trainer_name' => 'required|string|max:255',
            'understanding_confirmed' => 'required|boolean',
            'notes' => 'nullable|string',
            'signed_by_staff_name' => 'required|string',
            'signature' => 'required|string',
        ]);

        $passed = $validated['understanding_confirmed'] && !empty($validated['signature']);
        $status = $passed ? 'Passed' : 'Requires Attention';

        $log = StaffTrainingLog::create([
            'tenant_id' => $tenantId,
            'branch_id' => $branchId,
            'log_date' => $validated['log_date'],
            'log_time' => $validated['log_time'],
            'staff_name' => $validated['staff_name'],
            'staff_position' => $validated['staff_position'] ?? null,
            'task_id' => $validated['task_id'] ?? null,
            'task_title' => $validated['task_title'],
            'task_description' => $validated['task_description'] ?? null,
            'trainer_name' => $validated['trainer_name'],
            'understanding_confirmed' => $validated['understanding_confirmed'],
            'notes' => $validated['notes'] ?? null,
            'signed_by_staff_name' => $validated['signed_by_staff_name'],
            'signature' => $validated['signature'],
            'status' => $status,
        ]);

        return response()->json(['message' => 'Staff training log saved successfully', 'log' => $log], 201);
    }

    public function show($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = StaffTrainingLog::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();
        return response()->json($log);
    }

    public function destroy($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = StaffTrainingLog::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();
        $log->delete();
        return response()->json(['message' => 'Staff training log deleted successfully']);
    }
}
