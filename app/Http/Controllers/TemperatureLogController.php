<?php

namespace App\Http\Controllers;

use App\Models\TemperatureLog;
use App\Models\StorageZone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TemperatureLogController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $logs = TemperatureLog::with(['thermometer', 'storageZone'])
            ->where('tenant_id', $tenantId)
            ->orderBy('log_date', 'desc')
            ->orderBy('log_time', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json($logs);
    }

    public function show($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = TemperatureLog::with(['thermometer', 'storageZone'])
            ->where('tenant_id', $tenantId)
            ->findOrFail($id);

        return response()->json($log);
    }

    public function store(Request $request)
    {
        $request->validate([
            'log_date' => 'required|date',
            'log_time' => 'required|string',
            'staff_name' => 'nullable|string|max:255',
            'thermometer_id' => 'nullable|integer|exists:thermometers,id',
            'readings' => 'required|array',
            'readings.*.storage_zone_id' => 'required|integer|exists:storage_zones,id',
            'readings.*.temperature' => 'required|numeric',
            'readings.*.is_valid' => 'required|boolean',
            'readings.*.comment' => 'nullable|string',
            'signature' => 'nullable|string',
        ]);

        $tenantId = Auth::user()->tenant_id;
        $branchId = Auth::user()->branch_id ?? session('active_branch_id');
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        $logs = [];
        foreach ($request->readings as $reading) {
            $logs[] = TemperatureLog::create([
                'tenant_id' => $tenantId,
                'branch_id' => $branchId,
                'log_date' => $request->log_date,
                'log_time' => $request->log_time,
                'staff_name' => $request->staff_name,
                'thermometer_id' => $request->thermometer_id,
                'storage_zone_id' => $reading['storage_zone_id'],
                'temperature' => $reading['temperature'],
                'is_valid' => $reading['is_valid'],
                'comment' => $reading['comment'] ?? null,
                'signature' => $request->signature,
            ]);
        }

        return response()->json(['message' => 'Logs saved successfully', 'logs' => $logs], 201);
    }

    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = TemperatureLog::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'log_date' => 'nullable|date',
            'log_time' => 'nullable|string',
            'staff_name' => 'nullable|string|max:255',
            'thermometer_id' => 'nullable|integer|exists:thermometers,id',
            'storage_zone_id' => 'nullable|integer|exists:storage_zones,id',
            'temperature' => 'required|numeric',
            'is_valid' => 'nullable|boolean',
            'comment' => 'nullable|string',
            'signature' => 'nullable|string',
        ]);

        // If storage zone is present, evaluate is_valid
        $storageZoneId = $validated['storage_zone_id'] ?? $log->storage_zone_id;
        $isValid = $validated['is_valid'] ?? $log->is_valid;

        if (isset($validated['temperature'])) {
            $zone = StorageZone::where('tenant_id', $tenantId)->find($storageZoneId);
            if ($zone) {
                $temp = floatval($validated['temperature']);
                $min = $zone->target_temp_min !== null ? floatval($zone->target_temp_min) : -999;
                $max = $zone->target_temp_max !== null ? floatval($zone->target_temp_max) : 999;
                $isValid = ($temp >= $min && $temp <= $max);
            }
        }

        $log->update([
            'log_date' => $validated['log_date'] ?? $log->log_date,
            'log_time' => $validated['log_time'] ?? $log->log_time,
            'staff_name' => array_key_exists('staff_name', $validated) ? $validated['staff_name'] : $log->staff_name,
            'thermometer_id' => array_key_exists('thermometer_id', $validated) ? $validated['thermometer_id'] : $log->thermometer_id,
            'storage_zone_id' => $storageZoneId,
            'temperature' => $validated['temperature'],
            'is_valid' => $isValid,
            'comment' => array_key_exists('comment', $validated) ? $validated['comment'] : $log->comment,
            'signature' => array_key_exists('signature', $validated) && $validated['signature'] ? $validated['signature'] : $log->signature,
        ]);

        return response()->json(['message' => 'Temperature log updated successfully', 'log' => $log->load(['thermometer', 'storageZone'])]);
    }

    public function destroy($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = TemperatureLog::where('tenant_id', $tenantId)->findOrFail($id);
        $log->delete();

        return response()->json(['message' => 'Temperature log deleted successfully']);
    }
}
