<?php

namespace App\Http\Controllers;

use App\Models\FoodDispatchLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FoodDispatchLogController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $logs = FoodDispatchLog::where('tenant_id', $tenantId)
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

        $log = FoodDispatchLog::where('tenant_id', $tenantId)
            ->where('id', $id)
            ->firstOrFail();

        return response()->json($log);
    }

    public function store(Request $request)
    {
        $request->validate([
            'log_date'      => 'required|date',
            'log_time'      => 'required|string',
            'staff_name'    => 'required|string|max:255',
            'food_item'     => 'required|string|max:255',
            'destination'   => 'required|string|max:255',
            'use_by_date'   => 'required|date',
            'temperature'   => 'required|numeric',
            'separation'    => 'required|boolean',
            'comments'      => 'nullable|string',
            'signature'     => 'required|string',
        ], [
            'staff_name.required'   => 'Staff Member selection is required.',
            'food_item.required'    => 'Food / Product selection is required.',
            'destination.required'  => 'Destination / Transfer Location is required.',
            'use_by_date.required'  => 'Use By Date is required.',
            'temperature.required'  => 'Dispatch Temperature is required.',
            'signature.required'    => 'Staff Verification Signature is required.',
        ]);

        $tenantId = Auth::user()->tenant_id;
        $branchId = Auth::user()->branch_id ?? session('active_branch_id');
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Temperature Range Evaluation by Storage Type
        $temp = (float) $request->temperature;
        $storageType = strtolower($request->storage_type ?? '');
        
        $tempInRange = true;
        if (str_contains($storageType, 'chilled') || str_contains($storageType, 'fridge')) {
            $tempInRange = ($temp >= 0.0 && $temp <= 5.0);
        } elseif (str_contains($storageType, 'frozen') || str_contains($storageType, 'freezer')) {
            $tempInRange = ($temp <= -18.0);
        } elseif (str_contains($storageType, 'hot')) {
            $tempInRange = ($temp >= 63.0);
        }

        $separation = filter_var($request->separation, FILTER_VALIDATE_BOOLEAN);
        $passed = $tempInRange && $separation;
        $status = $passed ? 'Passed' : 'Needs Review';

        $log = FoodDispatchLog::create([
            'tenant_id'     => $tenantId,
            'branch_id'     => $branchId,
            'log_date'      => $request->log_date,
            'log_time'      => $request->log_time,
            'staff_name'    => $request->staff_name,
            'food_item'     => $request->food_item,
            'food_category' => $request->food_category,
            'storage_type'  => $request->storage_type,
            'batch_code'    => $request->batch_code,
            'destination'   => $request->destination,
            'use_by_date'   => $request->use_by_date,
            'temperature'   => $temp,
            'temp_in_range' => $tempInRange,
            'separation'    => $separation,
            'passed'        => $passed,
            'status'        => $status,
            'comments'      => $request->comments,
            'signature'     => $request->signature,
        ]);

        return response()->json(['message' => 'Food dispatch log saved successfully', 'log' => $log], 201);
    }

    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = FoodDispatchLog::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'log_date'         => 'required|date',
            'log_time'         => 'required|string',
            'staff_name'       => 'required|string|max:255',
            'food_item'        => 'required|string|max:255',
            'destination'      => 'required|string|max:255',
            'use_by_date'      => 'required|date',
            'temperature'      => 'required|numeric',
            'separation'       => 'required|boolean',
            'comments'         => 'nullable|string',
            'signature'        => 'nullable|string',
            'amendment_reason' => 'required|string|min:3',
        ]);

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $originalData = $log->toArray();

            $temp = (float) $request->temperature;
            $storageType = strtolower($request->storage_type ?? $log->storage_type ?? '');
            
            $tempInRange = true;
            if (str_contains($storageType, 'chilled') || str_contains($storageType, 'fridge')) {
                $tempInRange = ($temp >= 0.0 && $temp <= 5.0);
            } elseif (str_contains($storageType, 'frozen') || str_contains($storageType, 'freezer')) {
                $tempInRange = ($temp <= -18.0);
            } elseif (str_contains($storageType, 'hot')) {
                $tempInRange = ($temp >= 63.0);
            }

            $separation = filter_var($request->separation, FILTER_VALIDATE_BOOLEAN);
            $passed = $tempInRange && $separation;
            $status = $passed ? 'Passed' : 'Needs Review';

            $log->update([
                'log_date'      => $request->log_date,
                'log_time'      => $request->log_time,
                'staff_name'    => $request->staff_name,
                'food_item'     => $request->food_item,
                'food_category' => $request->food_category,
                'storage_type'  => $request->storage_type,
                'batch_code'    => $request->batch_code,
                'destination'   => $request->destination,
                'use_by_date'   => $request->use_by_date,
                'temperature'   => $temp,
                'temp_in_range' => $tempInRange,
                'separation'    => $separation,
                'passed'        => $passed,
                'status'        => $status,
                'comments'      => $request->comments,
                'signature'     => $request->signature ?: $log->signature,
            ]);

            $newData = $log->fresh()->toArray();

            $managerId = session('manager_approved_by_id') ?? $request->input('manager_approved_by_id');
            $managerName = session('manager_approved_by_name') ?? $request->input('manager_approved_by_name');

            $auditService = app(\App\Services\HaccpAuditService::class);
            $auditService->logAmendment(
                $log,
                'food_dispatch',
                $originalData,
                $newData,
                $validated['amendment_reason'],
                $managerId,
                $managerName
            );

            \Illuminate\Support\Facades\DB::commit();

            return response()->json(['message' => 'Food dispatch log updated successfully', 'log' => $log]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['message' => 'Failed to update food dispatch log'], 500);
        }
    }

    public function destroy($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = FoodDispatchLog::where('tenant_id', $tenantId)->findOrFail($id);
        $log->delete();

        return response()->json(['message' => 'Log deleted successfully']);
    }
}
