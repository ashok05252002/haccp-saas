<?php

namespace App\Http\Controllers;

use App\Models\CoolingProcessLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CoolingProcessLogController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $logs = CoolingProcessLog::where('tenant_id', $tenantId)
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

        $log = CoolingProcessLog::where('tenant_id', $tenantId)
            ->where('id', $id)
            ->firstOrFail();

        return response()->json($log);
    }

    public function store(Request $request)
    {
        $request->validate([
            'food_item'        => 'required|string|max:255',
            'cooling_method'   => 'required|string|max:255',
            'storage_location' => 'nullable|string|max:255',
            'start_date'       => 'required|date',
            'start_time'       => 'required|string',
            'start_temp'       => 'required|numeric',
            'end_date'         => 'required|date',
            'end_time'         => 'required|string',
            'end_temp'         => 'required|numeric',
            'duration_minutes' => 'nullable|integer',
            'comments'         => 'nullable|string',
            'staff_name'       => 'required|string|max:255',
            'signature'        => 'required|string',
        ], [
            'food_item.required'      => 'Food Item is required.',
            'cooling_method.required' => 'Cooling Method is required.',
            'start_date.required'     => 'Cooling Start Date is required.',
            'start_time.required'     => 'Cooling Start Time is required.',
            'start_temp.required'     => 'Start Temperature is required.',
            'end_date.required'       => 'Cooling End Date is required.',
            'end_time.required'       => 'Cooling End Time is required.',
            'end_temp.required'       => 'Final Temperature is required.',
            'staff_name.required'     => 'Staff Member selection is required.',
            'signature.required'      => 'Staff Verification Signature is required.',
        ]);

        $tenantId = Auth::user()->tenant_id;
        $branchId = Auth::user()->branch_id ?? session('active_branch_id');
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Evaluate Duration & Check Passed (End Temp <= 8.0°C and Duration <= 120 mins)
        $endTemp = (float) $request->end_temp;
        $duration = (int) ($request->duration_minutes ?? 0);
        $checkPassed = ($endTemp <= 8.0) && ($duration <= 120);

        if (!$checkPassed && empty($request->comments)) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors'  => [
                    'comments' => ['Comments / corrective action taken is mandatory when temperature or duration exceeds limits (≤8°C within 2 hours).']
                ]
            ], 422);
        }

        $log = CoolingProcessLog::create([
            'tenant_id'        => $tenantId,
            'branch_id'        => $branchId,
            'log_date'         => $request->end_date ?? date('Y-m-d'),
            'log_time'         => $request->end_time ?? date('H:i'),
            'food_item'        => $request->food_item,
            'cooling_method'   => $request->cooling_method,
            'storage_location' => $request->storage_location,
            'start_date'       => $request->start_date,
            'start_time'       => $request->start_time,
            'end_date'         => $request->end_date,
            'end_time'         => $request->end_time,
            'start_temp'       => (float) $request->start_temp,
            'end_temp'         => $endTemp,
            'duration_minutes' => $duration,
            'check_passed'     => $checkPassed,
            'comments'         => $request->comments,
            'staff_name'       => $request->staff_name,
            'signature'        => $request->signature,
        ]);

        return response()->json(['message' => 'Cooling process log saved successfully', 'log' => $log], 201);
    }

    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = CoolingProcessLog::where('tenant_id', $tenantId)->findOrFail($id);

        $request->validate([
            'food_item'        => 'required|string|max:255',
            'cooling_method'   => 'required|string|max:255',
            'storage_location' => 'nullable|string|max:255',
            'start_date'       => 'required|date',
            'start_time'       => 'required|string',
            'start_temp'       => 'required|numeric',
            'end_date'         => 'required|date',
            'end_time'         => 'required|string',
            'end_temp'         => 'required|numeric',
            'duration_minutes' => 'nullable|integer',
            'comments'         => 'nullable|string',
            'staff_name'       => 'required|string|max:255',
            'signature'        => 'nullable|string',
        ]);

        $endTemp = (float) $request->end_temp;
        $duration = (int) ($request->duration_minutes ?? 0);
        $checkPassed = ($endTemp <= 8.0) && ($duration <= 120);

        $log->update([
            'log_date'         => $request->end_date ?? $log->log_date,
            'log_time'         => $request->end_time ?? $log->log_time,
            'food_item'        => $request->food_item,
            'cooling_method'   => $request->cooling_method,
            'storage_location' => $request->storage_location,
            'start_date'       => $request->start_date,
            'start_time'       => $request->start_time,
            'end_date'         => $request->end_date,
            'end_time'         => $request->end_time,
            'start_temp'       => (float) $request->start_temp,
            'end_temp'         => $endTemp,
            'duration_minutes' => $duration,
            'check_passed'     => $checkPassed,
            'comments'         => $request->comments,
            'staff_name'       => $request->staff_name,
            'signature'        => $request->signature ?: $log->signature,
        ]);

        return response()->json(['message' => 'Cooling process log updated successfully', 'log' => $log]);
    }

    public function destroy($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = CoolingProcessLog::where('tenant_id', $tenantId)->findOrFail($id);
        $log->delete();

        return response()->json(['message' => 'Log deleted successfully']);
    }
}
