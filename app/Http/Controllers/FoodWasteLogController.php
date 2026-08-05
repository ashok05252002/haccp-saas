<?php

namespace App\Http\Controllers;

use App\Models\FoodWasteLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FoodWasteLogController extends Controller
{
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $logs = FoodWasteLog::where('tenant_id', $tenantId)
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
            'items' => 'required|array|min:1',
            'items.*.foodItem' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'general_comments' => 'nullable|string',
            'prevention_action' => 'nullable|string',
            'signed_by_staff_name' => 'required|string',
            'signature' => 'required|string',
        ]);

        $items = $validated['items'];
        $totalEntries = count($items);

        // Summarize quantities by unit and calculate total cost impact sum
        $unitTotals = [];
        $totalCostSum = 0.00;
        $reasonCounts = [];
        $hasSevereReason = false;

        $severeReasons = ['Temperature abuse', 'Expired raw materials', 'Contamination risk'];

        foreach ($items as $item) {
            $q = floatval($item['quantity'] ?? 0);
            $unit = $item['unit'] ?? 'kg';
            $unitTotals[$unit] = ($unitTotals[$unit] ?? 0) + $q;

            $cost = floatval($item['estimatedCost'] ?? 0);
            $totalCostSum += $cost;

            $reason = $item['reason'] ?? 'Other';
            if ($reason) {
                $reasonCounts[$reason] = ($reasonCounts[$reason] ?? 0) + 1;
            }

            if (in_array($reason, $severeReasons)) {
                $hasSevereReason = true;
            }
        }

        // Format Quantity Summary String
        $qtyParts = [];
        foreach ($unitTotals as $u => $qty) {
            if ($qty > 0) {
                $qtyParts[] = "{$qty} {$u}";
            }
        }
        $quantitySummaryStr = !empty($qtyParts) ? implode(', ', $qtyParts) : '0 kg';

        // Main Waste Reason
        $mainReason = 'N/A';
        $maxCount = 0;
        foreach ($reasonCounts as $r => $count) {
            if ($count > $maxCount) {
                $maxCount = $count;
                $mainReason = $r;
            }
        }

        // Status Evaluation
        $status = $hasSevereReason ? 'Attention Required' : 'Passed';

        $log = FoodWasteLog::create([
            'tenant_id' => $tenantId,
            'branch_id' => $branchId,
            'log_date' => $validated['log_date'],
            'log_time' => $validated['log_time'],
            'staff_name' => $validated['staff_name'],
            'items' => $items,
            'total_entries' => $totalEntries,
            'quantity_summary' => $quantitySummaryStr,
            'main_reason' => $mainReason,
            'total_cost_impact' => $totalCostSum,
            'general_comments' => $validated['general_comments'] ?? null,
            'prevention_action' => $validated['prevention_action'] ?? null,
            'signed_by_staff_name' => $validated['signed_by_staff_name'],
            'signature' => $validated['signature'],
            'status' => $status,
        ]);

        return response()->json(['message' => 'Food waste log created successfully', 'log' => $log], 201);
    }

    public function show($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = FoodWasteLog::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();
        return response()->json($log);
    }

    public function destroy($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = FoodWasteLog::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();
        $log->delete();
        return response()->json(['message' => 'Food waste log deleted successfully']);
    }
}
