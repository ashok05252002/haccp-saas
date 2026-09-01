<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use App\Models\HotHoldingLog;
use App\Models\FoodWasteLog;
use App\Models\StaffTrainingLog;
use App\Models\PestControlLog;
use App\Models\HealthDeclarationLog;
use App\Models\DeliveryIntakeLog;
use App\Models\CookingLog;
use App\Models\CleaningLog;
use App\Models\BlastChillingLog;
use App\Models\CoolingProcessLog;
use App\Models\ProbeCalibrationLog;
use App\Models\FoodDispatchLog;
use App\Models\FryerOilLog;
use App\Models\TemperatureLog;
use App\Models\ThawingLog;
use App\Models\HaccpLogAmendment;

class HaccpReportController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = Auth::user() ? Auth::user()->tenant_id : null;
        if (!$tenantId) {
            return response()->json([
                'totalEntries' => 0,
                'modulesUsed' => 0,
                'totalModules' => 15,
                'passed' => 0,
                'failed' => 0,
                'logs' => [],
            ]);
        }

        $preset = $request->input('preset', '');
        $todayStr = date('Y-m-d');
        
        $fromDate = $request->input('from_date');
        $toDate = $request->input('to_date');

        // Apply preset date ranges if preset selected
        if ($preset === 'today') {
            $fromDate = $todayStr;
            $toDate = $todayStr;
        } elseif ($preset === 'this_week') {
            $fromDate = Carbon::now()->startOfWeek()->format('Y-m-d');
            $toDate = $todayStr;
        } elseif ($preset === 'this_month') {
            $fromDate = Carbon::now()->startOfMonth()->format('Y-m-d');
            $toDate = $todayStr;
        } elseif ($preset === 'last_30_days') {
            $fromDate = Carbon::now()->subDays(30)->format('Y-m-d');
            $toDate = $todayStr;
        }

        // Default to today if no date params provided
        if (!$fromDate && !$toDate) {
            $singleDate = $request->input('date', $todayStr);
            $fromDate = $singleDate;
            $toDate = $singleDate;
        } elseif ($fromDate && !$toDate) {
            $toDate = $fromDate;
        } elseif (!$fromDate && $toDate) {
            $fromDate = $toDate;
        }

        $moduleFilter = $request->input('module', 'all');
        $selectedModuleIds = [];
        if (is_array($moduleFilter)) {
            $selectedModuleIds = $moduleFilter;
        } elseif (is_string($moduleFilter) && $moduleFilter !== '' && $moduleFilter !== 'all') {
            $selectedModuleIds = explode(',', $moduleFilter);
        }

        $allLogs = [];
        $activeModules = [];

        // Helper to process module logs
        $processLogs = function ($modelClass, $moduleId, $moduleName) use ($tenantId, $fromDate, $toDate, $selectedModuleIds, &$allLogs, &$activeModules) {
            if (!empty($selectedModuleIds) && !in_array($moduleId, $selectedModuleIds)) {
                return;
            }

            if (!class_exists($modelClass)) {
                return;
            }

            try {
                $query = $modelClass::where('tenant_id', $tenantId);
                
                if ($modelClass === CleaningLog::class) {
                    $query->with(['results']);
                } elseif ($modelClass === TemperatureLog::class) {
                    $query->with(['storageZone', 'thermometer']);
                } elseif ($modelClass === DeliveryIntakeLog::class) {
                    $query->with(['supplier', 'products.foodItem.storageType']);
                }

                if ($fromDate && $toDate) {
                    if ($fromDate === $toDate) {
                        $query->whereDate('log_date', $fromDate);
                    } else {
                        $query->whereBetween('log_date', [$fromDate, $toDate]);
                    }
                }

                $logs = $query->orderBy('log_date', 'desc')->orderBy('created_at', 'desc')->get();

                if ($logs->count() > 0) {
                    $activeModules[$moduleId] = true;
                }

                foreach ($logs as $log) {
                    $statusStr = 'Passed';
                    $passed = true;

                    if ($modelClass === CleaningLog::class) {
                        $hasFailedCheck = false;
                        $resultsList = [];
                        if ($log->relationLoaded('results') && $log->results) {
                            $resultsList = $log->results;
                        } elseif (isset($log->results) && is_array($log->results)) {
                            $resultsList = $log->results;
                        }

                        foreach ($resultsList as $res) {
                            $resObj = is_array($res) ? (object)$res : $res;
                            $val = strtolower(trim(strval($resObj->result ?? $resObj->value ?? $resObj->status ?? '')));
                            $isPassedBool = isset($resObj->passed) ? boolval($resObj->passed) : null;

                            if (in_array($val, ['no', 'fail', 'failed', 'false', 'not_passed', 'needs_review', 'need_review']) || $isPassedBool === false) {
                                $hasFailedCheck = true;
                                break;
                            }
                        }

                        if ($hasFailedCheck) {
                            $statusStr = 'Needs Review';
                            $passed = false;
                        } else {
                            $statusStr = 'Passed';
                            $passed = true;
                        }
                    } elseif ($modelClass === TemperatureLog::class) {
                        $hasFailedTemp = false;

                        // Check 1: is_valid boolean flag
                        if (isset($log->is_valid) && ($log->is_valid === false || $log->is_valid === 0 || $log->is_valid === '0' || $log->is_valid === 'false')) {
                            $hasFailedTemp = true;
                        }

                        // Check 2: status or result field
                        $statusVal = strtolower(trim(strval($log->status ?? $log->result ?? $log->verification_status ?? '')));
                        if (in_array($statusVal, ['failed', 'fail', 'needs_review', 'need_review', 'out_of_bounds', 'out_of_range'])) {
                            $hasFailedTemp = true;
                        }

                        // Check 3: boolean properties
                        if (isset($log->isPassed) && $log->isPassed === false) $hasFailedTemp = true;
                        if (isset($log->passed) && $log->passed === false) $hasFailedTemp = true;
                        if (isset($log->isWithinRange) && $log->isWithinRange === false) $hasFailedTemp = true;
                        if (isset($log->outOfBounds) && ($log->outOfBounds === true || $log->outOfBounds === 'true' || $log->outOfBounds === 1)) $hasFailedTemp = true;

                        // Check 4: Temperature value against storage zone rules
                        if (!$hasFailedTemp && isset($log->temperature) && $log->temperature !== null && $log->temperature !== '') {
                            $temp = floatval($log->temperature);
                            $zone = $log->storageZone ?? null;

                            if ($zone) {
                                $zType = strtolower(trim(strval($zone->type ?? $zone->storage_type ?? $zone->name ?? '')));
                                if (strpos($zType, 'fridge') !== false || strpos($zType, 'chilled') !== false) {
                                    if ($temp < 0 || $temp > 5) {
                                        $hasFailedTemp = true;
                                    }
                                } elseif (strpos($zType, 'freezer') !== false || strpos($zType, 'frozen') !== false) {
                                    if ($temp > -18) {
                                        $hasFailedTemp = true;
                                    }
                                } elseif (strpos($zType, 'hot') !== false || strpos($zType, 'cabinet') !== false || strpos($zType, 'bain') !== false) {
                                    if ($temp < 63) {
                                        $hasFailedTemp = true;
                                    }
                                }

                                if (!$hasFailedTemp) {
                                    $minTemp = $zone->min_temp ?? $zone->target_temp_min ?? null;
                                    $maxTemp = $zone->max_temp ?? $zone->target_temp_max ?? null;

                                    if ($minTemp !== null && $minTemp !== '' && $temp < floatval($minTemp)) {
                                        $hasFailedTemp = true;
                                    }
                                    if ($maxTemp !== null && $maxTemp !== '' && $temp > floatval($maxTemp)) {
                                        $hasFailedTemp = true;
                                    }
                                }
                            }
                        }

                        if ($hasFailedTemp) {
                            $statusStr = 'Needs Review';
                            $passed = false;
                        } else {
                            $statusStr = 'Passed';
                            $passed = true;
                        }
                    } elseif ($modelClass === DeliveryIntakeLog::class) {
                        $hasFailedCheck = false;

                        // Check 1: Packaging Intact
                        $pkgVal = $log->packaging_intact ?? $log->packagingIntact ?? null;
                        if ($pkgVal === false || $pkgVal === 0 || $pkgVal === 'false' || $pkgVal === '0' || $pkgVal === 'no' || $pkgVal === 'No') {
                            $hasFailedCheck = true;
                        }

                        // Check 2: Vehicle Safe
                        $vehVal = $log->vehicle_safe ?? $log->isVehicleSafe ?? $log->vehicleSafe ?? null;
                        if ($vehVal === false || $vehVal === 0 || $vehVal === 'false' || $vehVal === '0' || $vehVal === 'no' || $vehVal === 'No') {
                            $hasFailedCheck = true;
                        }

                        // Check 3: Log level status/result strings
                        $statusVal = strtolower(trim(strval($log->status ?? $log->result ?? '')));
                        if (in_array($statusVal, ['failed', 'failed_check', 'needs_review', 'need_review', 'fail', 'out_of_bounds'])) {
                            $hasFailedCheck = true;
                        }
                        if (isset($log->isPassed) && $log->isPassed === false) $hasFailedCheck = true;
                        if (isset($log->passed) && $log->passed === false) $hasFailedCheck = true;

                        // Check 4: Products temperature bounds
                        $products = $log->products ?? [];
                        if (!$hasFailedCheck && !empty($products)) {
                            foreach ($products as $p) {
                                $pObj = is_array($p) ? (object)$p : $p;
                                if (!isset($pObj->temperature) || $pObj->temperature === null || $pObj->temperature === '') {
                                    continue;
                                }

                                $temp = floatval($pObj->temperature);
                                $foodItem = $pObj->foodItem ?? $pObj->food_item ?? null;
                                $foodItemObj = is_array($foodItem) ? (object)$foodItem : $foodItem;

                                $storageType = $foodItemObj->storageType ?? $foodItemObj->storage_type ?? null;
                                $storageTypeObj = is_array($storageType) ? (object)$storageType : $storageType;

                                $isTempFailed = false;

                                if ($storageTypeObj) {
                                    $nameLower = strtolower(trim(strval($storageTypeObj->name ?? '')));
                                    if (strpos($nameLower, 'chilled') !== false) {
                                        $min = isset($storageTypeObj->min_temp) && $storageTypeObj->min_temp !== null ? floatval($storageTypeObj->min_temp) : 0;
                                        $max = isset($storageTypeObj->max_temp) && $storageTypeObj->max_temp !== null ? floatval($storageTypeObj->max_temp) : 5;
                                        if ($temp < $min || $temp > $max) $isTempFailed = true;
                                    } elseif (strpos($nameLower, 'frozen') !== false) {
                                        $max = isset($storageTypeObj->max_temp) && $storageTypeObj->max_temp !== null ? floatval($storageTypeObj->max_temp) : -18;
                                        if ($temp > $max) $isTempFailed = true;
                                    } elseif (strpos($nameLower, 'hot') !== false) {
                                        $min = isset($storageTypeObj->min_temp) && $storageTypeObj->min_temp !== null ? floatval($storageTypeObj->min_temp) : 63;
                                        if ($temp < $min) $isTempFailed = true;
                                    } elseif (strpos($nameLower, 'ambient') !== false) {
                                        $isTempFailed = false;
                                    } else {
                                        if (isset($storageTypeObj->min_temp) && $storageTypeObj->min_temp !== null && $temp < floatval($storageTypeObj->min_temp)) $isTempFailed = true;
                                        if (isset($storageTypeObj->max_temp) && $storageTypeObj->max_temp !== null && $temp > floatval($storageTypeObj->max_temp)) $isTempFailed = true;
                                    }
                                } else {
                                    $itemName = strtolower(trim(strval($foodItemObj->name ?? $pObj->name ?? '')));
                                    if (strpos($itemName, 'chilled') !== false || strpos($itemName, 'milk') !== false || strpos($itemName, 'dairy') !== false || strpos($itemName, 'cheese') !== false || strpos($itemName, 'meat') !== false || strpos($itemName, 'fish') !== false || strpos($itemName, 'chicken') !== false) {
                                        if ($temp < 0 || $temp > 5) $isTempFailed = true;
                                    } elseif (strpos($itemName, 'frozen') !== false || strpos($itemName, 'ice cream') !== false) {
                                        if ($temp > -18) $isTempFailed = true;
                                    } elseif (strpos($itemName, 'hot') !== false) {
                                        if ($temp < 63) $isTempFailed = true;
                                    }
                                }

                                if ($isTempFailed) {
                                    $hasFailedCheck = true;
                                    break;
                                }
                            }
                        }

                        if ($hasFailedCheck) {
                            $statusStr = 'Needs Review';
                            $passed = false;
                        } else {
                            $statusStr = 'Passed';
                            $passed = true;
                        }
                    } else {
                        $statusStr = $log->status ?? 'Passed';
                        $passed = (strtolower($statusStr) === 'passed');
                    }

                    $allLogs[] = [
                        'id' => $log->id,
                        'moduleId' => $moduleId,
                        'moduleName' => $moduleName,
                        'date' => is_object($log->log_date) ? $log->log_date->format('Y-m-d') : strval($log->log_date),
                        'time' => $log->log_time ?? ($log->created_at ? $log->created_at->format('H:i') : '12:00'),
                        'staffName' => $log->staff_name ?? $log->signed_by_staff_name ?? 'Staff',
                        'passed' => $passed,
                        'status' => $statusStr,
                        'signature' => $log->signature ?? null,
                        'formData' => [
                            'holdingUnit' => $log->holding_unit ?? null,
                            'items' => $log->items ?? null,
                            'generalComments' => $log->general_comments ?? $log->notes ?? $log->comment ?? null,
                            'signedBy' => $log->signed_by_staff_name ?? null,
                            'quantitySummary' => $log->quantity_summary ?? null,
                            'mainReason' => $log->main_reason ?? null,
                            'totalCostImpact' => $log->total_cost_impact ?? null,
                            'taskTitle' => $log->task_title ?? null,
                            'trainerName' => $log->trainer_name ?? null,
                            'understandingConfirmed' => $log->understanding_confirmed ?? null,
                            'pestActivityObserved' => $log->pest_activity_observed ?? false,
                            'locationFound' => $log->location_found ?? null,
                            'evidenceObserved' => $log->evidence_observed ?? null,
                            'contractorName' => $log->contractor_name ?? null,
                            'assessmentReason' => $log->assessment_reason ?? null,
                            'riskyAnswersCount' => $log->risky_answers_count ?? 0,
                            'rawLog' => $log->toArray(),
                        ],
                    ];
                }
            } catch (\Exception $e) {
                // Silently skip if table or model not ready
            }
        };

        // Process active HACCP log modules
        $processLogs(HotHoldingLog::class, 'hot-holding', 'Hot Holding / Bain Marie');
        $processLogs(FoodWasteLog::class, 'food-waste', 'Food Waste & Disposal Log');
        $processLogs(StaffTrainingLog::class, 'staff-training', 'Staff Training & Hygiene Log');
        $processLogs(PestControlLog::class, 'pest-control', 'Pest Prevention & Activity Log');
        $processLogs(HealthDeclarationLog::class, 'health-declaration', 'Staff Health Declaration');
        $processLogs(DeliveryIntakeLog::class, 'delivery-intake', 'Delivery Intake');
        $processLogs(CookingLog::class, 'cooking-temperature', 'Cooking Temperature');
        $processLogs(CleaningLog::class, 'cleaning', 'Cleaning & Sanitation');
        $processLogs(BlastChillingLog::class, 'blast-chilling', 'Blast Chilling');
        $processLogs(CoolingProcessLog::class, 'cooling-process', 'Cooling Process');
        $processLogs(ProbeCalibrationLog::class, 'probe-calibration', 'Probe Accuracy Check');
        $processLogs(FoodDispatchLog::class, 'food-dispatch', 'Food Dispatch & Transfer');
        $processLogs(FryerOilLog::class, 'fryer-oil', 'Fryer Oil & Grease Management');
        $processLogs(TemperatureLog::class, 'temperature', 'Temperature Monitoring');
        $processLogs(ThawingLog::class, 'thawing', 'Thawing / Defrosting Record');

        // Sort all logs descending by date and time
        usort($allLogs, function ($a, $b) {
            $cmpDate = strcmp($b['date'], $a['date']);
            if ($cmpDate !== 0) return $cmpDate;
            return strcmp($b['time'], $a['time']);
        });

        $totalEntries = count($allLogs);
        $passedCount = count(array_filter($allLogs, fn($l) => $l['passed']));
        $failedCount = $totalEntries - $passedCount;

        return response()->json([
            'fromDate' => $fromDate,
            'toDate' => $toDate,
            'totalEntries' => $totalEntries,
            'modulesUsed' => count($activeModules),
            'totalModules' => 15,
            'passed' => $passedCount,
            'failed' => $failedCount,
            'logs' => $allLogs,
        ]);
    }

    public function exportCsv(Request $request)
    {
        $response = $this->index($request);
        $data = json_decode($response->getContent(), true);

        $fromDate = $data['fromDate'] ?? date('Y-m-d');
        $toDate = $data['toDate'] ?? date('Y-m-d');
        $filename = "haccp_audit_report_{$fromDate}_to_{$toDate}.csv";

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($data) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['ID', 'Module', 'Date', 'Time', 'Staff Member', 'Status', 'Comments / Details']);

            foreach ($data['logs'] as $log) {
                $details = $log['formData']['generalComments'] ?? $log['formData']['mainReason'] ?? '-';
                fputcsv($file, [
                    $log['id'],
                    $log['moduleName'],
                    $log['date'],
                    $log['time'],
                    $log['staffName'],
                    $log['status'],
                    $details,
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function getLogDetail(Request $request, $logType, $logId)
    {
        $user = Auth::user();
        $tenantId = $user ? $user->tenant_id : null;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        $branchId = $user->branch_id ?? session('active_branch_id');

        // Whitelist mapping for supported log types in this phase
        $allowedLogTypes = [
            'cooking-temperature' => [
                'model' => CookingLog::class,
                'moduleName' => 'Cooking Temperature',
                'auditLogType' => 'cooking_temperature',
            ],
        ];

        if (!array_key_exists($logType, $allowedLogTypes)) {
            return response()->json([
                'message' => "Unsupported or unrecognized log type '{$logType}'.",
                'supportedTypes' => array_keys($allowedLogTypes),
            ], 404);
        }

        $config = $allowedLogTypes[$logType];
        $modelClass = $config['model'];

        $query = $modelClass::where('tenant_id', $tenantId)->where('id', $logId);
        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $log = $query->first();
        if (!$log) {
            return response()->json([
                'message' => "{$config['moduleName']} record not found or not accessible within your current branch context.",
            ], 404);
        }

        // Fetch audit history from haccp_log_amendments
        $auditQuery = HaccpLogAmendment::where('tenant_id', $tenantId)
            ->where('log_type', $config['auditLogType'])
            ->where('log_id', $log->id);

        if ($branchId) {
            $auditQuery->where('branch_id', $branchId);
        }

        $auditHistory = $auditQuery->orderBy('created_at', 'desc')->get()->map(function ($a) {
            return [
                'id' => $a->id,
                'reason' => $a->reason,
                'amended_by_name' => $a->amended_by_name,
                'manager_approved_by_name' => $a->manager_approved_by_name,
                'changed_fields' => $a->changed_fields,
                'original_data' => $a->original_data,
                'new_data' => $a->new_data,
                'ip_address' => $a->ip_address,
                'created_at' => $a->created_at ? $a->created_at->toIso8601String() : null,
            ];
        });

        // Build structured sections for the pilot Cooking Temperature module
        $sections = [
            [
                'title' => 'Overview & Batch Details',
                'fields' => [
                    ['label' => 'Log Record ID', 'value' => '#' . $log->id],
                    ['label' => 'Date & Time', 'value' => trim(($log->log_date ? (is_object($log->log_date) ? $log->log_date->format('Y-m-d') : strval($log->log_date)) : '') . ' ' . ($log->log_time ?? ''))],
                    ['label' => 'Food Item / Product', 'value' => $log->food_item ?? '-'],
                    ['label' => 'Batch / Lot Code', 'value' => $log->batch_code ?? '-'],
                    ['label' => 'Staff Member', 'value' => $log->staff_name ?? '-'],
                    ['label' => 'Probe ID', 'value' => $log->probe_id ?? '-'],
                    ['label' => 'Status', 'value' => $log->status ?? 'COMPLETED'],
                    ['label' => 'Final Signed Off At', 'value' => $log->final_signed_at ? Carbon::parse($log->final_signed_at)->toIso8601String() : null],
                ]
            ],
            [
                'title' => 'Stage 1: Cooking (CCP-3)',
                'fields' => [
                    ['label' => 'Core Temp', 'value' => $log->cooking_temp !== null ? $log->cooking_temp . ' °C' : 'N/A'],
                    ['label' => 'Target Temp', 'value' => $log->cooking_target ?? '≥ 75°C'],
                    ['label' => 'Cooking Method', 'value' => $log->cooking_method ?? 'N/A'],
                    ['label' => 'Time Finished Cooking', 'value' => $log->time_finished_cooking ?? 'N/A'],
                    ['label' => 'Result', 'value' => $log->cooking_temp !== null ? ($log->cooking_passed ? 'PASSED' : 'FAILED') : 'N/A'],
                ]
            ],
            [
                'title' => 'Stage 2: Blast Chilling (CCP-4)',
                'fields' => [
                    ['label' => 'Chilling Method', 'value' => $log->chilling_method ?? 'N/A'],
                    ['label' => 'Start Time', 'value' => $log->chilling_start_time ?? 'N/A'],
                    ['label' => 'End Time', 'value' => $log->chilling_end_time ?? 'N/A'],
                    ['label' => 'Start Temp', 'value' => $log->chilling_start_temp !== null ? $log->chilling_start_temp . ' °C' : 'N/A'],
                    ['label' => 'End Temp', 'value' => $log->chilling_end_temp !== null ? $log->chilling_end_temp . ' °C' : 'N/A'],
                    ['label' => 'Duration', 'value' => $log->chilling_duration_minutes ? $log->chilling_duration_minutes . ' mins' : 'N/A'],
                    ['label' => 'Result', 'value' => $log->chilling_end_temp !== null ? ($log->chilling_passed ? 'PASSED' : 'FAILED') : 'N/A'],
                    ['label' => 'Blast Chilling Corrective Action', 'value' => $log->chilling_corrective_action ?? null],
                ]
            ],
            [
                'title' => 'Stage 3: Cold Storage / Chiller Hold',
                'fields' => [
                    ['label' => 'Location / Unit', 'value' => $log->chiller_location ?? 'N/A'],
                    ['label' => 'Storage Temp', 'value' => $log->chiller_temp !== null ? $log->chiller_temp . ' °C' : 'N/A'],
                    ['label' => 'Result', 'value' => $log->chiller_temp !== null ? ($log->chiller_passed ? 'PASSED' : 'FAILED') : 'N/A'],
                ]
            ],
            [
                'title' => 'Stage 4: Reheating Process',
                'fields' => [
                    ['label' => 'Reheating Method', 'value' => $log->reheating_method ?? 'N/A'],
                    ['label' => 'Reheated Core Temp', 'value' => $log->reheating_temp !== null ? $log->reheating_temp . ' °C' : 'N/A'],
                    ['label' => 'Result', 'value' => $log->reheating_temp !== null ? ($log->reheating_passed ? 'PASSED' : 'FAILED') : 'N/A'],
                ]
            ],
            [
                'title' => 'Stage 5: Hot Holding & Service (CCP-5)',
                'fields' => [
                    ['label' => 'Hot Holding Location', 'value' => $log->hot_holding_location ?? 'N/A'],
                    ['label' => 'Holding Temp', 'value' => $log->hot_holding_temp !== null ? $log->hot_holding_temp . ' °C' : 'N/A'],
                    ['label' => 'Result', 'value' => $log->hot_holding_temp !== null ? ($log->hot_holding_passed ? 'PASSED' : 'FAILED') : 'N/A'],
                ]
            ],
            [
                'title' => 'Corrective Actions & Observations',
                'fields' => [
                    ['label' => 'General Corrective Action Taken', 'value' => $log->corrective_action ?? 'None recorded.'],
                    ['label' => 'Notes / Observations', 'value' => $log->notes ?? 'None recorded.'],
                ]
            ],
            [
                'title' => 'Verification & Signatures',
                'fields' => [
                    ['label' => 'Staff Member', 'value' => $log->staff_name ?? '-'],
                    ['label' => 'Signature Recorded', 'value' => !empty($log->signature)],
                    ['label' => 'Signature Image', 'value' => $log->signature ?? null],
                    ['label' => 'Final Signed Timestamp', 'value' => $log->final_signed_at ? Carbon::parse($log->final_signed_at)->toIso8601String() : null],
                ]
            ]
        ];

        return response()->json([
            'moduleName' => $config['moduleName'],
            'logType' => $logType,
            'auditLogType' => $config['auditLogType'],
            'log' => $log,
            'sections' => $sections,
            'auditHistory' => $auditHistory,
        ]);
    }
}
