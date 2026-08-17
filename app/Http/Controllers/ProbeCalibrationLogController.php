<?php

namespace App\Http\Controllers;

use App\Models\ProbeCalibrationLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProbeCalibrationLogController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $logs = ProbeCalibrationLog::where('tenant_id', $tenantId)
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

        $log = ProbeCalibrationLog::where('tenant_id', $tenantId)
            ->where('id', $id)
            ->firstOrFail();

        return response()->json($log);
    }

    public function store(Request $request)
    {
        $request->validate([
            'log_date'            => 'required|date',
            'log_time'            => 'required|string',
            'staff_name'          => 'required|string|max:255',
            'probe_name'          => 'required|string|max:255',
            'probe_id'            => 'nullable|string|max:255',
            'probe_serial_number' => 'nullable|string|max:255',
            'boiling_temp'        => 'required|numeric',
            'ice_temp'            => 'required|numeric',
            'comments'            => 'nullable|string',
            'signature'           => 'required|string',
        ], [
            'staff_name.required'   => 'Staff Member selection is required.',
            'probe_name.required'   => 'Thermometer / Probe selection is required.',
            'boiling_temp.required' => 'Boiling water test reading is required.',
            'ice_temp.required'     => 'Ice water test reading is required.',
            'signature.required'    => 'Staff Verification Signature is required.',
        ]);

        $tenantId = Auth::user()->tenant_id;
        $branchId = Auth::user()->branch_id ?? session('active_branch_id');
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Evaluate Ranges
        // Boiling range: 99.0°C to 101.0°C
        $boilingTemp = (float) $request->boiling_temp;
        $boilingValid = ($boilingTemp >= 99.0 && $boilingTemp <= 101.0);

        // Ice range: -1.0°C to 1.0°C
        $iceTemp = (float) $request->ice_temp;
        $iceValid = ($iceTemp >= -1.0 && $iceTemp <= 1.0);

        $passed = $boilingValid && $iceValid;
        $status = $passed ? 'Passed' : 'Needs Review';

        $log = ProbeCalibrationLog::create([
            'tenant_id'           => $tenantId,
            'branch_id'           => $branchId,
            'log_date'            => $request->log_date,
            'log_time'            => $request->log_time,
            'staff_name'          => $request->staff_name,
            'probe_id'            => $request->probe_id,
            'probe_name'          => $request->probe_name,
            'probe_serial_number' => $request->probe_serial_number,
            'boiling_temp'        => $boilingTemp,
            'boiling_valid'       => $boilingValid,
            'ice_temp'            => $iceTemp,
            'ice_valid'           => $iceValid,
            'passed'              => $passed,
            'status'              => $status,
            'comments'            => $request->comments,
            'signature'           => $request->signature,
        ]);

        return response()->json(['message' => 'Probe calibration check saved successfully', 'log' => $log], 201);
    }

    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = ProbeCalibrationLog::where('tenant_id', $tenantId)->findOrFail($id);

        $request->validate([
            'log_date'            => 'required|date',
            'log_time'            => 'required|string',
            'staff_name'          => 'required|string|max:255',
            'probe_name'          => 'required|string|max:255',
            'probe_id'            => 'nullable|string|max:255',
            'probe_serial_number' => 'nullable|string|max:255',
            'boiling_temp'        => 'required|numeric',
            'ice_temp'            => 'required|numeric',
            'comments'            => 'nullable|string',
            'signature'           => 'nullable|string',
        ]);

        $boilingTemp = (float) $request->boiling_temp;
        $boilingValid = ($boilingTemp >= 99.0 && $boilingTemp <= 101.0);

        $iceTemp = (float) $request->ice_temp;
        $iceValid = ($iceTemp >= -1.0 && $iceTemp <= 1.0);

        $passed = $boilingValid && $iceValid;
        $status = $passed ? 'Passed' : 'Needs Review';

        $log->update([
            'log_date'            => $request->log_date,
            'log_time'            => $request->log_time,
            'staff_name'          => $request->staff_name,
            'probe_id'            => $request->probe_id,
            'probe_name'          => $request->probe_name,
            'probe_serial_number' => $request->probe_serial_number,
            'boiling_temp'        => $boilingTemp,
            'boiling_valid'       => $boilingValid,
            'ice_temp'            => $iceTemp,
            'ice_valid'           => $iceValid,
            'passed'              => $passed,
            'status'              => $status,
            'comments'            => $request->comments,
            'signature'           => $request->signature ?: $log->signature,
        ]);

        return response()->json(['message' => 'Probe calibration check updated successfully', 'log' => $log]);
    }

    public function destroy($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = ProbeCalibrationLog::where('tenant_id', $tenantId)->findOrFail($id);
        $log->delete();

        return response()->json(['message' => 'Log deleted successfully']);
    }
}
