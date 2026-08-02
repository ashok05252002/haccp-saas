<?php

namespace App\Http\Controllers;

use App\Models\TemperatureLog;
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

    public function store(Request $request)
    {
        $request->validate([
            'log_date' => 'required|date',
            'log_time' => 'required|date_format:H:i',
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
        $branchId = Auth::user()->branch_id; // Implicit from BelongsToBranch, but good to be explicit or let trait handle it.
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        $logs = [];
        foreach ($request->readings as $reading) {
            $logs[] = TemperatureLog::create([
                'tenant_id' => $tenantId,
                // branch_id is automatically set by the BelongsToBranch trait via model events, but we can set it if needed.
                'log_date' => $request->log_date,
                'log_time' => $request->log_time,
                'staff_name' => $request->staff_name,
                'thermometer_id' => $request->thermometer_id,
                'storage_zone_id' => $reading['storage_zone_id'],
                'temperature' => $reading['temperature'],
                'is_valid' => $reading['is_valid'],
                'comment' => $reading['comment'],
                'signature' => $request->signature,
            ]);
        }

        return response()->json(['message' => 'Logs saved successfully', 'logs' => $logs], 201);
    }
}
