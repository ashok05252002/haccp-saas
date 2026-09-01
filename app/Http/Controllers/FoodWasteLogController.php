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

    private function enrichLogWithCalculatedCosts($logs, $tenantId)
    {
        foreach ($logs as $log) {
            $items = $log->items ?? [];
            if (!is_array($items)) continue;

            $normalizedItems = $this->normalizeLogItems($items, $tenantId);

            $calcTotalCost = 0.00;
            $typeCounts = [];
            $stageCounts = [];
            $reasonCounts = [];
            $methodCounts = [];

            foreach ($normalizedItems as $item) {
                $calcTotalCost += floatval($item['estimatedCost'] ?? 0);
                if ($item['wasteType']) $typeCounts[$item['wasteType']] = ($typeCounts[$item['wasteType']] ?? 0) + 1;
                if ($item['source']) $stageCounts[$item['source']] = ($stageCounts[$item['source']] ?? 0) + 1;
                if ($item['reason']) $reasonCounts[$item['reason']] = ($reasonCounts[$item['reason']] ?? 0) + 1;
                if ($item['disposalMethod']) $methodCounts[$item['disposalMethod']] = ($methodCounts[$item['disposalMethod']] ?? 0) + 1;
            }

            $getTop = function($arr) {
                $max = 0; $top = 'N/A';
                foreach ($arr as $k => $cnt) {
                    if ($cnt > $max) { $max = $cnt; $top = $k; }
                }
                return $top;
            };

            $mainType = $getTop($typeCounts);
            $mainStage = $getTop($stageCounts);
            $mainReason = $getTop($reasonCounts);
            $mainMethod = $getTop($methodCounts);

            $log->items = $normalizedItems;
            $log->total_cost_impact = round($calcTotalCost, 2);
            $log->main_waste_type = $mainType;
            $log->main_source_stage = $mainStage;
            $log->main_reason = $mainReason;
            $log->main_disposal_method = $mainMethod;
            $log->save();
        }

        return $logs;
    }

    private function normalizeLogItems(array $rawItems, $tenantId)
    {
        $ingredients = \App\Models\Ingredient::where('tenant_id', $tenantId)->get();
        $recipes = \App\Models\Recipe::with(['ingredients.masterIngredient.uom'])->where('tenant_id', $tenantId)->get();

        $ingMap = [];
        $ingIdMap = [];
        foreach ($ingredients as $ing) {
            $key = strtolower(trim($ing->name));
            if ($ing->unit_cost > 0) {
                $ingMap[$key] = (float) $ing->unit_cost;
            }
            $ingIdMap[$key] = $ing->id;
        }

        $recMap = [];
        $recIdMap = [];
        foreach ($recipes as $rec) {
            $key = strtolower(trim($rec->name));
            if ($rec->cost_per_portion > 0) {
                $recMap[$key] = (float) $rec->cost_per_portion;
            }
            $recIdMap[$key] = $rec->id;
        }

        $typeMasterMap = \Illuminate\Support\Facades\DB::table('waste_types')->pluck('id', 'name')->mapWithKeys(fn($id, $name) => [strtolower(trim($name)) => $id])->toArray();
        $stageMasterMap = \Illuminate\Support\Facades\DB::table('waste_source_stages')->pluck('id', 'name')->mapWithKeys(fn($id, $name) => [strtolower(trim($name)) => $id])->toArray();
        $reasonMasterMap = \Illuminate\Support\Facades\DB::table('waste_reasons')->pluck('id', 'name')->mapWithKeys(fn($id, $name) => [strtolower(trim($name)) => $id])->toArray();
        $methodMasterMap = \Illuminate\Support\Facades\DB::table('waste_disposal_methods')->pluck('id', 'name')->mapWithKeys(fn($id, $name) => [strtolower(trim($name)) => $id])->toArray();

        $normalizedList = [];
        foreach ($rawItems as $item) {
            $itemName = trim($item['foodItem'] ?? $item['food_item'] ?? $item['name'] ?? '');
            $itemKey = strtolower($itemName);
            $type = $item['itemType'] ?? $item['item_type'] ?? null;

            if (empty($type) || ($type === 'ingredient' && isset($recMap[$itemKey]))) {
                if (isset($recMap[$itemKey])) {
                    $type = 'recipe';
                } else {
                    $type = 'ingredient';
                }
            }

            $wasteType = $item['wasteType'] ?? $item['waste_type'] ?? 'Organic / Processing Scraps';
            $source = $item['source'] ?? $item['source_stage'] ?? 'Preparation';
            $reason = $item['reason'] ?? $item['waste_reason'] ?? 'Spoilage';
            $disposalMethod = $item['disposalMethod'] ?? $item['disposal_method'] ?? 'Food waste bin';

            $wasteTypeId = !empty($item['wasteTypeId']) ? $item['wasteTypeId'] : (!empty($item['waste_type_id']) ? $item['waste_type_id'] : ($typeMasterMap[strtolower(trim($wasteType))] ?? null));
            $sourceId = !empty($item['sourceId']) ? $item['sourceId'] : (!empty($item['source_stage_id']) ? $item['source_stage_id'] : ($stageMasterMap[strtolower(trim($source))] ?? null));
            $reasonId = !empty($item['reasonId']) ? $item['reasonId'] : (!empty($item['reason_id']) ? $item['reason_id'] : ($reasonMasterMap[strtolower(trim($reason))] ?? null));
            $disposalMethodId = !empty($item['disposalMethodId']) ? $item['disposalMethodId'] : (!empty($item['disposal_method_id']) ? $item['disposal_method_id'] : ($methodMasterMap[strtolower(trim($disposalMethod))] ?? null));

            $ingredientId = !empty($item['ingredientId']) ? $item['ingredientId'] : (!empty($item['ingredient_id']) ? $item['ingredient_id'] : ($ingIdMap[$itemKey] ?? null));
            $recipeId = !empty($item['recipeId']) ? $item['recipeId'] : (!empty($item['recipe_id']) ? $item['recipe_id'] : ($recIdMap[$itemKey] ?? null));

            $q = floatval($item['quantity'] ?? 0);
            $unit = $item['unit'] ?? ($type === 'recipe' ? 'portions' : 'kg');
            $estCost = (isset($item['estimatedCost']) && $item['estimatedCost'] !== '' && $item['estimatedCost'] !== null) ? floatval($item['estimatedCost']) : ((isset($item['estimated_cost']) && $item['estimated_cost'] !== '') ? floatval($item['estimated_cost']) : null);
            $batchCode = $item['batchCode'] ?? $item['batch_code'] ?? null;
            $expiryDate = $item['expiryDate'] ?? $item['expiry_date'] ?? null;
            $notes = $item['notes'] ?? $item['comments'] ?? null;

            if ($estCost === null || $estCost == 0) {
                if ($type === 'recipe' || isset($recMap[$itemKey])) {
                    $portionRate = $recMap[$itemKey] ?? 0;
                    if ($portionRate > 0 && $q > 0) {
                        $estCost = round($q * $portionRate, 2);
                    }
                } else {
                    $unitRate = $ingMap[$itemKey] ?? 0;
                    if ($unitRate > 0 && $q > 0) {
                        $estCost = round($q * $unitRate, 2);
                    }
                }
            }

            $normalizedList[] = [
                'foodItem' => $itemName,
                'food_item' => $itemName,
                'itemType' => $type,
                'item_type' => $type,
                'ingredientId' => $ingredientId,
                'ingredient_id' => $ingredientId,
                'recipeId' => $recipeId,
                'recipe_id' => $recipeId,
                'wasteTypeId' => $wasteTypeId,
                'waste_type_id' => $wasteTypeId,
                'wasteType' => $wasteType,
                'waste_type' => $wasteType,
                'sourceId' => $sourceId,
                'source_stage_id' => $sourceId,
                'source' => $source,
                'source_stage' => $source,
                'reasonId' => $reasonId,
                'reason_id' => $reasonId,
                'reason' => $reason,
                'waste_reason' => $reason,
                'disposalMethodId' => $disposalMethodId,
                'disposal_method_id' => $disposalMethodId,
                'disposalMethod' => $disposalMethod,
                'disposal_method' => $disposalMethod,
                'quantity' => (string) $q,
                'unit' => $unit,
                'estimatedCost' => (string) ($estCost ?? 0),
                'estimated_cost' => (string) ($estCost ?? 0),
                'batchCode' => $batchCode,
                'batch_code' => $batchCode,
                'expiryDate' => $expiryDate,
                'expiry_date' => $expiryDate,
                'notes' => $notes,
            ];
        }

        return $normalizedList;
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
            'items' => 'required|array|min:1',
            'items.*.foodItem' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'general_comments' => 'nullable|string',
            'prevention_action' => 'nullable|string',
            'signed_by_staff_name' => 'required|string',
            'signature' => 'required|string',
        ]);

        $items = $this->normalizeLogItems($request->input('items', []), $tenantId);
        $totalEntries = count($items);

        $unitTotals = [];
        $totalCostSum = 0.00;
        $typeCounts = [];
        $stageCounts = [];
        $reasonCounts = [];
        $methodCounts = [];
        $hasSevereReason = false;

        $severeReasons = ['Temperature abuse', 'Expired raw materials', 'Contamination risk'];

        foreach ($items as $item) {
            $q = floatval($item['quantity'] ?? 0);
            $unit = $item['unit'] ?? 'kg';
            $unitTotals[$unit] = ($unitTotals[$unit] ?? 0) + $q;

            $cost = floatval($item['estimatedCost'] ?? $item['estimated_cost'] ?? 0);
            $totalCostSum += $cost;

            $type = $item['wasteType'] ?? $item['waste_type'] ?? null;
            if ($type) $typeCounts[$type] = ($typeCounts[$type] ?? 0) + 1;

            $stage = $item['source'] ?? $item['source_stage'] ?? null;
            if ($stage) $stageCounts[$stage] = ($stageCounts[$stage] ?? 0) + 1;

            $reason = $item['reason'] ?? $item['waste_reason'] ?? null;
            if ($reason) $reasonCounts[$reason] = ($reasonCounts[$reason] ?? 0) + 1;

            $method = $item['disposalMethod'] ?? $item['disposal_method'] ?? null;
            if ($method) $methodCounts[$method] = ($methodCounts[$method] ?? 0) + 1;

            if (in_array($reason, $severeReasons)) {
                $hasSevereReason = true;
            }
        }

        $qtyParts = [];
        foreach ($unitTotals as $u => $qty) {
            if ($qty > 0) {
                $qtyParts[] = "{$qty} {$u}";
            }
        }
        $quantitySummaryStr = !empty($qtyParts) ? implode(', ', $qtyParts) : '0 kg';

        $getTop = function($arr) {
            $max = 0; $top = 'N/A';
            foreach ($arr as $k => $cnt) {
                if ($cnt > $max) { $max = $cnt; $top = $k; }
            }
            return $top;
        };

        $mainType = $getTop($typeCounts);
        $mainStage = $getTop($stageCounts);
        $mainReason = $getTop($reasonCounts);
        $mainMethod = $getTop($methodCounts);

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
            'main_waste_type' => $mainType,
            'main_source_stage' => $mainStage,
            'main_reason' => $mainReason,
            'main_disposal_method' => $mainMethod,
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

    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = FoodWasteLog::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();

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
            'signature' => 'nullable|string',
        ]);

        $items = $this->normalizeLogItems($request->input('items', []), $tenantId);
        $totalEntries = count($items);

        $unitTotals = [];
        $totalCostSum = 0.00;
        $typeCounts = [];
        $stageCounts = [];
        $reasonCounts = [];
        $methodCounts = [];
        $hasSevereReason = false;

        $severeReasons = ['Temperature abuse', 'Expired raw materials', 'Contamination risk'];

        foreach ($items as $item) {
            $q = floatval($item['quantity'] ?? 0);
            $unit = $item['unit'] ?? 'kg';
            $unitTotals[$unit] = ($unitTotals[$unit] ?? 0) + $q;

            $cost = floatval($item['estimatedCost'] ?? $item['estimated_cost'] ?? 0);
            $totalCostSum += $cost;

            $type = $item['wasteType'] ?? $item['waste_type'] ?? null;
            if ($type) $typeCounts[$type] = ($typeCounts[$type] ?? 0) + 1;

            $stage = $item['source'] ?? $item['source_stage'] ?? null;
            if ($stage) $stageCounts[$stage] = ($stageCounts[$stage] ?? 0) + 1;

            $reason = $item['reason'] ?? $item['waste_reason'] ?? null;
            if ($reason) $reasonCounts[$reason] = ($reasonCounts[$reason] ?? 0) + 1;

            $method = $item['disposalMethod'] ?? $item['disposal_method'] ?? null;
            if ($method) $methodCounts[$method] = ($methodCounts[$method] ?? 0) + 1;

            if (in_array($reason, $severeReasons)) {
                $hasSevereReason = true;
            }
        }

        $qtyParts = [];
        foreach ($unitTotals as $u => $qty) {
            if ($qty > 0) {
                $qtyParts[] = "{$qty} {$u}";
            }
        }
        $quantitySummaryStr = !empty($qtyParts) ? implode(', ', $qtyParts) : '0 kg';

        $getTop = function($arr) {
            $max = 0; $top = 'N/A';
            foreach ($arr as $k => $cnt) {
                if ($cnt > $max) { $max = $cnt; $top = $k; }
            }
            return $top;
        };

        $mainType = $getTop($typeCounts);
        $mainStage = $getTop($stageCounts);
        $mainReason = $getTop($reasonCounts);
        $mainMethod = $getTop($methodCounts);

        $status = $hasSevereReason ? 'Attention Required' : 'Passed';

        $log->update([
            'log_date' => $validated['log_date'],
            'log_time' => $validated['log_time'],
            'staff_name' => $validated['staff_name'],
            'items' => $items,
            'total_entries' => $totalEntries,
            'quantity_summary' => $quantitySummaryStr,
            'main_waste_type' => $mainType,
            'main_source_stage' => $mainStage,
            'main_reason' => $mainReason,
            'main_disposal_method' => $mainMethod,
            'total_cost_impact' => $totalCostSum,
            'general_comments' => $validated['general_comments'] ?? null,
            'prevention_action' => $validated['prevention_action'] ?? null,
            'signed_by_staff_name' => $validated['signed_by_staff_name'],
            'signature' => $validated['signature'] ?? $log->signature,
            'status' => $status,
        ]);

        return response()->json(['message' => 'Food waste log updated successfully', 'log' => $log], 200);
    }

    public function destroy($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $log = FoodWasteLog::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();
        $log->delete();
        return response()->json(['message' => 'Food waste log deleted successfully']);
    }
}
