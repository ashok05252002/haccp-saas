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

        // Whitelist mapping for supported log types
        $allowedLogTypes = [
            'cooking-temperature' => [
                'model' => CookingLog::class,
                'moduleName' => 'Cooking Temperature',
                'auditLogTypes' => ['cooking_temperature', 'cooking-temperature'],
                'primaryAuditType' => 'cooking_temperature',
                'with' => [],
            ],
            'temperature' => [
                'model' => TemperatureLog::class,
                'moduleName' => 'Temperature Monitoring',
                'auditLogTypes' => ['temperature_log', 'temperature'],
                'primaryAuditType' => 'temperature_log',
                'with' => ['storageZone', 'thermometer'],
            ],
            'delivery-intake' => [
                'model' => DeliveryIntakeLog::class,
                'moduleName' => 'Delivery & Intake',
                'auditLogTypes' => ['delivery_intake', 'delivery-intake'],
                'primaryAuditType' => 'delivery_intake',
                'with' => ['supplier', 'products.foodItem.storageType', 'products.foodItem.uom'],
            ],
            'cleaning' => [
                'model' => CleaningLog::class,
                'moduleName' => 'Cleaning & Sanitation',
                'auditLogTypes' => ['cleaning_sanitation', 'cleaning'],
                'primaryAuditType' => 'cleaning_sanitation',
                'with' => ['area', 'results.question.section'],
            ],
            'hot-holding' => [
                'model' => HotHoldingLog::class,
                'moduleName' => 'Hot Holding / Bain Marie',
                'auditLogTypes' => ['hot_holding', 'hot-holding'],
                'primaryAuditType' => 'hot_holding',
                'with' => [],
            ],
            'blast-chilling' => [
                'model' => BlastChillingLog::class,
                'moduleName' => 'Blast Chilling',
                'auditLogTypes' => ['blast_chilling', 'blast-chilling'],
                'primaryAuditType' => 'blast_chilling',
                'with' => [],
            ],
            'cooling-process' => [
                'model' => CoolingProcessLog::class,
                'moduleName' => 'Cooling Process',
                'auditLogTypes' => ['cooling_process', 'cooling-process'],
                'primaryAuditType' => 'cooling_process',
                'with' => [],
            ],
            'thawing' => [
                'model' => ThawingLog::class,
                'moduleName' => 'Thawing / Defrosting',
                'auditLogTypes' => ['thawing'],
                'primaryAuditType' => 'thawing',
                'with' => [],
            ],
            'probe-calibration' => [
                'model' => ProbeCalibrationLog::class,
                'moduleName' => 'Probe Calibration',
                'auditLogTypes' => ['probe_calibration', 'probe-calibration'],
                'primaryAuditType' => 'probe_calibration',
                'with' => [],
            ],
            'food-dispatch' => [
                'model' => FoodDispatchLog::class,
                'moduleName' => 'Food Dispatch',
                'auditLogTypes' => ['food_dispatch', 'food-dispatch'],
                'primaryAuditType' => 'food_dispatch',
                'with' => [],
            ],
            'fryer-oil' => [
                'model' => FryerOilLog::class,
                'moduleName' => 'Fryer Oil',
                'auditLogTypes' => ['fryer_oil', 'fryer-oil'],
                'primaryAuditType' => 'fryer_oil',
                'with' => [],
            ],
            'pest-control' => [
                'model' => PestControlLog::class,
                'moduleName' => 'Pest Control',
                'auditLogTypes' => ['pest_control', 'pest-control'],
                'primaryAuditType' => 'pest_control',
                'with' => [],
            ],
            'staff-training' => [
                'model' => StaffTrainingLog::class,
                'moduleName' => 'Staff Training & Hygiene',
                'auditLogTypes' => ['staff_training', 'staff-training'],
                'primaryAuditType' => 'staff_training',
                'with' => [],
            ],
            'health-declaration' => [
                'model' => HealthDeclarationLog::class,
                'moduleName' => 'Health Declaration / Fitness to Work',
                'auditLogTypes' => ['health_declaration', 'health-declaration'],
                'primaryAuditType' => 'health_declaration',
                'with' => ['results.question.section'],
            ],
            'staff-training' => [
                'model' => StaffTrainingLog::class,
                'moduleName' => 'Staff Training & Hygiene',
                'auditLogTypes' => ['staff_training', 'staff-training'],
                'primaryAuditType' => 'staff_training',
                'with' => [],
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
        if (!empty($config['with'])) {
            $query->with($config['with']);
        }
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
            ->whereIn('log_type', $config['auditLogTypes'])
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

        // Build structured sections based on the module
        $sections = [];

        if ($logType === 'cooking-temperature') {
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
        } elseif ($logType === 'temperature') {
            $storageZone = $log->storageZone;
            $thermometer = $log->thermometer;
            $zoneName = $storageZone ? $storageZone->name : 'Unknown Equipment';
            $zoneType = $storageZone ? ($storageZone->type ?? $storageZone->storage_type ?? '-') : '-';

            $minTemp = $storageZone ? ($storageZone->min_temp ?? $storageZone->target_temp_min ?? null) : null;
            $maxTemp = $storageZone ? ($storageZone->max_temp ?? $storageZone->target_temp_max ?? null) : null;
            $targetRange = ($minTemp !== null || $maxTemp !== null)
                ? (($minTemp !== null ? $minTemp . ' °C' : '-∞') . ' to ' . ($maxTemp !== null ? $maxTemp . ' °C' : '+∞'))
                : 'Standard Range';

            $thermoName = $thermometer
                ? ($thermometer->name . ($thermometer->serial_number ? " ({$thermometer->serial_number})" : ''))
                : 'Standard Thermometer';

            $statusResult = ($log->is_valid === false || $log->is_valid === 0 || $log->is_valid === '0') ? 'NEEDS REVIEW' : 'PASSED';

            $sections = [
                [
                    'title' => 'Overview & Equipment Details',
                    'fields' => [
                        ['label' => 'Log Record ID', 'value' => '#' . $log->id],
                        ['label' => 'Date & Time', 'value' => trim(($log->log_date ? (is_object($log->log_date) ? $log->log_date->format('Y-m-d') : strval($log->log_date)) : '') . ' ' . ($log->log_time ?? ''))],
                        ['label' => 'Equipment / Storage Unit', 'value' => $zoneName],
                        ['label' => 'Equipment Type', 'value' => $zoneType],
                        ['label' => 'Staff Member', 'value' => $log->staff_name ?? '-'],
                        ['label' => 'Status', 'value' => $statusResult],
                    ]
                ],
                [
                    'title' => 'Temperature Verification Check',
                    'fields' => [
                        ['label' => 'Target Temperature Limits', 'value' => $targetRange],
                        ['label' => 'Recorded Temperature', 'value' => $log->temperature !== null ? $log->temperature . ' °C' : 'N/A'],
                        ['label' => 'Thermometer / Device', 'value' => $thermoName],
                        ['label' => 'Result', 'value' => $statusResult],
                    ]
                ],
                [
                    'title' => 'Observations & Corrective Actions',
                    'fields' => [
                        ['label' => 'Staff Comments / Notes', 'value' => $log->comment ?? 'No comment provided.'],
                    ]
                ],
                [
                    'title' => 'Verification & Signatures',
                    'fields' => [
                        ['label' => 'Staff Member', 'value' => $log->staff_name ?? '-'],
                        ['label' => 'Signature Recorded', 'value' => !empty($log->signature)],
                        ['label' => 'Signature Image', 'value' => $log->signature ?? null],
                        ['label' => 'Recorded At', 'value' => $log->created_at ? $log->created_at->toIso8601String() : null],
                    ]
                ]
            ];
        } elseif ($logType === 'delivery-intake') {
            $supplierName = $log->supplier ? $log->supplier->name : 'N/A';
            $vehicleStatus = $log->vehicle_safe === null ? 'N/A' : ($log->vehicle_safe ? 'PASSED (Clean & Safe)' : 'FAILED (Unsafe/Unclean)');
            $packagingStatus = $log->packaging_intact === null ? 'N/A' : ($log->packaging_intact ? 'PASSED (Intact & Sealed)' : 'FAILED (Damaged/Unsealed)');

            $productFields = [];
            if ($log->products && $log->products->count() > 0) {
                foreach ($log->products as $pIdx => $prod) {
                    $num = $pIdx + 1;
                    $itemName = $prod->foodItem ? $prod->foodItem->name : 'Unknown Product';
                    $uomName = ($prod->foodItem && $prod->foodItem->uom) ? ($prod->foodItem->uom->name ?? $prod->foodItem->uom->unit_name ?? '') : '';
                    $storageTypeName = ($prod->foodItem && $prod->foodItem->storageType) ? $prod->foodItem->storageType->name : '';

                    $qtyText = $prod->quantity !== null ? ($prod->quantity . ($uomName ? ' ' . $uomName : '')) : 'N/A';
                    $tempText = $prod->temperature !== null ? ($prod->temperature . ' °C') : 'N/A';
                    $batchText = $prod->batch_number ?? 'N/A';
                    $expiryText = $prod->use_by_date ?? 'N/A';

                    $summaryText = "{$itemName} | Qty: {$qtyText} | Temp: {$tempText} | Batch: {$batchText} | Expiry: {$expiryText}" . ($storageTypeName ? " | Storage: {$storageTypeName}" : "");

                    $productFields[] = [
                        'label' => "Product #{$num}: {$itemName}",
                        'value' => $summaryText
                    ];
                }
            } else {
                $productFields[] = [
                    'label' => 'Delivered Items',
                    'value' => 'No individual product items recorded.'
                ];
            }

            $sections = [
                [
                    'title' => 'Overview & Delivery Details',
                    'fields' => [
                        ['label' => 'Log Record ID', 'value' => '#' . $log->id],
                        ['label' => 'Date & Time', 'value' => trim(($log->log_date ? (is_object($log->log_date) ? $log->log_date->format('Y-m-d') : strval($log->log_date)) : '') . ' ' . ($log->log_time ?? ''))],
                        ['label' => 'Supplier Name', 'value' => $supplierName],
                        ['label' => 'Staff Member', 'value' => $log->staff_name ?? '-'],
                        ['label' => 'Recorded At', 'value' => $log->created_at ? $log->created_at->toIso8601String() : null],
                    ]
                ],
                [
                    'title' => 'Vehicle & Packaging Hygiene Checks',
                    'fields' => [
                        ['label' => 'Vehicle Cleanliness & Condition', 'value' => $vehicleStatus],
                        ['label' => 'Packaging Condition & Seals', 'value' => $packagingStatus],
                    ]
                ],
                [
                    'title' => 'Delivered Products & Temperature Checks',
                    'fields' => $productFields
                ],
                [
                    'title' => 'Observations & Corrective Actions',
                    'fields' => [
                        ['label' => 'Staff Comments / Notes', 'value' => $log->comment ?? 'No comment provided.'],
                    ]
                ],
                [
                    'title' => 'Verification & Signatures',
                    'fields' => [
                        ['label' => 'Staff Member', 'value' => $log->staff_name ?? '-'],
                        ['label' => 'Signature Recorded', 'value' => !empty($log->signature)],
                        ['label' => 'Signature Image', 'value' => $log->signature ?? null],
                        ['label' => 'Recorded Timestamp', 'value' => $log->created_at ? $log->created_at->toIso8601String() : null],
                    ]
                ]
            ];
        } elseif ($logType === 'cleaning') {
            $areaName = $log->area ? $log->area->name : 'N/A';

            $checklistFields = [];
            if ($log->results && $log->results->count() > 0) {
                foreach ($log->results as $rIdx => $res) {
                    $num = $rIdx + 1;
                    $qText = $res->question ? $res->question->question : "Inspection Item #{$num}";
                    $secName = ($res->question && $res->question->section) ? $res->question->section->name : '';

                    $status = strtoupper(strval($res->result ?? 'N/A'));
                    $commentText = !empty($res->comment) ? " (Notes: {$res->comment})" : "";

                    $checklistFields[] = [
                        'label' => ($secName ? "[{$secName}] " : "") . $qText,
                        'value' => "Result: {$status}{$commentText}"
                    ];
                }
            } else {
                $checklistFields[] = [
                    'label' => 'Checklist Results',
                    'value' => 'No checklist item results recorded.'
                ];
            }

            $sections = [
                [
                    'title' => 'Overview & Cleaning Task Details',
                    'fields' => [
                        ['label' => 'Log Record ID', 'value' => '#' . $log->id],
                        ['label' => 'Date & Time', 'value' => trim(($log->log_date ? (is_object($log->log_date) ? $log->log_date->format('Y-m-d') : strval($log->log_date)) : '') . ' ' . ($log->log_time ?? ''))],
                        ['label' => 'Cleaning Area / Zone', 'value' => $areaName],
                        ['label' => 'Staff Member', 'value' => $log->staff_name ?? '-'],
                        ['label' => 'Recorded At', 'value' => $log->created_at ? $log->created_at->toIso8601String() : null],
                    ]
                ],
                [
                    'title' => 'Cleaning Checklist & Hygiene Inspection Results',
                    'fields' => $checklistFields
                ],
                [
                    'title' => 'Observations & Corrective Actions',
                    'fields' => [
                        ['label' => 'Staff Comments / Notes', 'value' => $log->comment ?? 'No comment provided.'],
                    ]
                ],
                [
                    'title' => 'Verification & Signatures',
                    'fields' => [
                        ['label' => 'Staff Member', 'value' => $log->staff_name ?? '-'],
                        ['label' => 'Signature Recorded', 'value' => !empty($log->signature)],
                        ['label' => 'Signature Image', 'value' => $log->signature ?? null],
                        ['label' => 'Recorded Timestamp', 'value' => $log->created_at ? $log->created_at->toIso8601String() : null],
                    ]
                ]
            ];
        } elseif ($logType === 'hot-holding') {
            $itemFields = [];
            $items = is_array($log->items) ? $log->items : (is_string($log->items) ? json_decode($log->items, true) : []);

            if (!empty($items) && is_array($items)) {
                foreach ($items as $iIdx => $it) {
                    $num = $iIdx + 1;
                    $foodName = $it['foodName'] ?? $it['food_name'] ?? "Food Item #{$num}";
                    $timeHold = $it['timeIntoHold'] ?? $it['time_into_hold'] ?? 'N/A';

                    $checks = [];
                    for ($c = 1; $c <= 4; $c++) {
                        $key = "check{$c}";
                        if (isset($it[$key]) && $it[$key] !== null && $it[$key] !== '') {
                            $val = floatval($it[$key]);
                            $passText = $val >= 63.0 ? 'PASSED' : 'FAILED (<63°C)';
                            $checks[] = "Check {$c}: {$val} °C [{$passText}]";
                        }
                    }

                    $checkSummary = !empty($checks) ? implode(' | ', $checks) : 'No temp checks recorded';
                    $itemComment = !empty($it['comments']) ? " | Notes: {$it['comments']}" : (!empty($it['notes']) ? " | Notes: {$it['notes']}" : "");

                    $itemFields[] = [
                        'label' => "Item #{$num}: {$foodName} (Into Hold: {$timeHold})",
                        'value' => "{$checkSummary}{$itemComment}"
                    ];
                }
            } else {
                $itemFields[] = [
                    'label' => 'Hot Holding Items',
                    'value' => 'No individual food items recorded.'
                ];
            }

            $sections = [
                [
                    'title' => 'Overview & Station Details',
                    'fields' => [
                        ['label' => 'Log Record ID', 'value' => '#' . $log->id],
                        ['label' => 'Date & Time', 'value' => trim(($log->log_date ? (is_object($log->log_date) ? $log->log_date->format('Y-m-d') : strval($log->log_date)) : '') . ' ' . ($log->log_time ?? ''))],
                        ['label' => 'Holding Unit / Station', 'value' => $log->holding_unit ?? 'N/A'],
                        ['label' => 'Staff Member', 'value' => $log->staff_name ?? $log->signed_by_staff_name ?? '-'],
                        ['label' => 'Target Temperature Threshold', 'value' => '≥ 63.0 °C (CCP-5)'],
                        ['label' => 'Compliance Status', 'value' => $log->status ?? 'Passed'],
                        ['label' => 'Recorded At', 'value' => $log->created_at ? $log->created_at->toIso8601String() : null],
                    ]
                ],
                [
                    'title' => 'Hot Holding Temperature Checks (CCP-5)',
                    'fields' => $itemFields
                ],
                [
                    'title' => 'Observations & Corrective Actions',
                    'fields' => [
                        ['label' => 'Staff Comments / Notes', 'value' => $log->general_comments ?? 'No comments recorded.'],
                    ]
                ],
                [
                    'title' => 'Verification & Signatures',
                    'fields' => [
                        ['label' => 'Staff Member / Signee', 'value' => $log->signed_by_staff_name ?? $log->staff_name ?? '-'],
                        ['label' => 'Signature Recorded', 'value' => !empty($log->signature)],
                        ['label' => 'Signature Image', 'value' => $log->signature ?? null],
                        ['label' => 'Recorded Timestamp', 'value' => $log->created_at ? $log->created_at->toIso8601String() : null],
                    ]
                ]
            ];
        } elseif ($logType === 'blast-chilling') {
            $statusResult = $log->end_temp !== null ? ($log->check_passed ? 'PASSED' : 'FAILED') : 'N/A';

            $sections = [
                [
                    'title' => 'Overview & Product Details',
                    'fields' => [
                        ['label' => 'Log Record ID', 'value' => '#' . $log->id],
                        ['label' => 'Date & Time', 'value' => trim(($log->log_date ? (is_object($log->log_date) ? $log->log_date->format('Y-m-d') : strval($log->log_date)) : '') . ' ' . ($log->log_time ?? ''))],
                        ['label' => 'Food Item / Product', 'value' => $log->food_item ?? '-'],
                        ['label' => 'Batch / Lot Code', 'value' => $log->batch_code ?? '-'],
                        ['label' => 'Staff Member', 'value' => $log->staff_name ?? '-'],
                        ['label' => 'Probe ID', 'value' => $log->probe_id ?? '-'],
                        ['label' => 'Compliance Status', 'value' => $statusResult],
                        ['label' => 'Recorded At', 'value' => $log->created_at ? $log->created_at->toIso8601String() : null],
                    ]
                ],
                [
                    'title' => 'Blast Chilling Temperature Check (CCP-4)',
                    'fields' => [
                        ['label' => 'Chiller Unit / Location', 'value' => $log->chiller_location ?? 'N/A'],
                        ['label' => 'Start Time', 'value' => $log->chilling_start_time ?? 'N/A'],
                        ['label' => 'End Time', 'value' => $log->chilling_end_time ?? 'N/A'],
                        ['label' => 'Start Temperature', 'value' => $log->start_temp !== null ? ($log->start_temp . ' °C') : 'N/A'],
                        ['label' => 'End Temperature', 'value' => $log->end_temp !== null ? ($log->end_temp . ' °C') : 'N/A'],
                        ['label' => 'Chilling Duration', 'value' => $log->duration_minutes ? ($log->duration_minutes . ' mins') : 'N/A'],
                        ['label' => 'Target Requirement', 'value' => 'Cool to ≤ 8°C (within 90 mins)'],
                        ['label' => 'Result', 'value' => $statusResult],
                    ]
                ],
                [
                    'title' => 'Observations & Corrective Actions',
                    'fields' => [
                        ['label' => 'Corrective Action Taken', 'value' => $log->corrective_action ?? 'None recorded.'],
                        ['label' => 'Notes / Observations', 'value' => $log->notes ?? 'None recorded.'],
                    ]
                ],
                [
                    'title' => 'Verification & Signatures',
                    'fields' => [
                        ['label' => 'Staff Member', 'value' => $log->staff_name ?? '-'],
                        ['label' => 'Signature Recorded', 'value' => !empty($log->signature)],
                        ['label' => 'Signature Image', 'value' => $log->signature ?? null],
                        ['label' => 'Recorded Timestamp', 'value' => $log->created_at ? $log->created_at->toIso8601String() : null],
                    ]
                ]
            ];
        } elseif ($logType === 'cooling-process') {
            $statusResult = $log->end_temp !== null ? ($log->check_passed ? 'PASSED' : 'FAILED') : 'N/A';
            $startDateTime = trim(($log->start_date ? (is_object($log->start_date) ? $log->start_date->format('Y-m-d') : strval($log->start_date)) : '') . ' ' . ($log->start_time ?? ''));
            $endDateTime = trim(($log->end_date ? (is_object($log->end_date) ? $log->end_date->format('Y-m-d') : strval($log->end_date)) : '') . ' ' . ($log->end_time ?? ''));

            $sections = [
                [
                    'title' => 'Overview & Product Details',
                    'fields' => [
                        ['label' => 'Log Record ID', 'value' => '#' . $log->id],
                        ['label' => 'Date & Time', 'value' => trim(($log->log_date ? (is_object($log->log_date) ? $log->log_date->format('Y-m-d') : strval($log->log_date)) : '') . ' ' . ($log->log_time ?? ''))],
                        ['label' => 'Food Item / Product', 'value' => $log->food_item ?? '-'],
                        ['label' => 'Cooling Method', 'value' => $log->cooling_method ?? 'N/A'],
                        ['label' => 'Staff Member', 'value' => $log->staff_name ?? '-'],
                        ['label' => 'Compliance Status', 'value' => $statusResult],
                        ['label' => 'Recorded At', 'value' => $log->created_at ? $log->created_at->toIso8601String() : null],
                    ]
                ],
                [
                    'title' => 'Cooling Process Temperature Check',
                    'fields' => [
                        ['label' => 'Storage / Chiller Location', 'value' => $log->storage_location ?? 'N/A'],
                        ['label' => 'Start Date & Time', 'value' => $startDateTime !== '' ? $startDateTime : 'N/A'],
                        ['label' => 'End Date & Time', 'value' => $endDateTime !== '' ? $endDateTime : 'N/A'],
                        ['label' => 'Start Temperature', 'value' => $log->start_temp !== null ? ($log->start_temp . ' °C') : 'N/A'],
                        ['label' => 'End Temperature', 'value' => $log->end_temp !== null ? ($log->end_temp . ' °C') : 'N/A'],
                        ['label' => 'Duration', 'value' => $log->duration_minutes ? ($log->duration_minutes . ' mins') : 'N/A'],
                        ['label' => 'Target Requirement', 'value' => 'Cool down safely within critical limit threshold'],
                        ['label' => 'Result', 'value' => $statusResult],
                    ]
                ],
                [
                    'title' => 'Observations & Corrective Actions',
                    'fields' => [
                        ['label' => 'Staff Comments / Notes', 'value' => $log->comments ?? 'None recorded.'],
                    ]
                ],
                [
                    'title' => 'Verification & Signatures',
                    'fields' => [
                        ['label' => 'Staff Member', 'value' => $log->staff_name ?? '-'],
                        ['label' => 'Signature Recorded', 'value' => !empty($log->signature)],
                        ['label' => 'Signature Image', 'value' => $log->signature ?? null],
                        ['label' => 'Recorded Timestamp', 'value' => $log->created_at ? $log->created_at->toIso8601String() : null],
                    ]
                ]
            ];
        } elseif ($logType === 'thawing') {
            $startDateTime = trim(($log->start_date ? (is_object($log->start_date) ? $log->start_date->format('Y-m-d') : strval($log->start_date)) : '') . ' ' . ($log->start_time ?? ''));
            $completedDateTime = trim(($log->completed_date ? (is_object($log->completed_date) ? $log->completed_date->format('Y-m-d') : strval($log->completed_date)) : '') . ' ' . ($log->completed_time ?? ''));

            $sections = [
                [
                    'title' => 'Overview & Food Details',
                    'fields' => [
                        ['label' => 'Log Record ID', 'value' => '#' . $log->id],
                        ['label' => 'Date & Time', 'value' => trim(($log->log_date ? (is_object($log->log_date) ? $log->log_date->format('Y-m-d') : strval($log->log_date)) : '') . ' ' . ($log->log_time ?? ''))],
                        ['label' => 'Food Item', 'value' => $log->food_item_name ?? '-'],
                        ['label' => 'Defrost / Thawing Method', 'value' => $log->defrost_method ?? 'N/A'],
                        ['label' => 'Staff Member', 'value' => $log->signed_by_staff_name ?? '-'],
                        ['label' => 'Compliance Status', 'value' => $log->status ?? 'Passed'],
                        ['label' => 'Recorded At', 'value' => $log->created_at ? $log->created_at->toIso8601String() : null],
                    ]
                ],
                [
                    'title' => 'Thawing Process Details',
                    'fields' => [
                        ['label' => 'Storage Location', 'value' => $log->storage_location ?? 'N/A'],
                        ['label' => 'Start Date & Time', 'value' => $startDateTime !== '' ? $startDateTime : 'N/A'],
                        ['label' => 'Completion Date & Time', 'value' => $completedDateTime !== '' ? $completedDateTime : 'N/A'],
                        ['label' => 'Defrost Temperature', 'value' => $log->defrost_temp !== null ? ($log->defrost_temp . ' °C') : 'N/A'],
                        ['label' => 'Target Requirement', 'value' => 'Thaw under refrigeration (≤ 8°C) or controlled defrost'],
                        ['label' => 'Compliance Result', 'value' => $log->status ?? 'Passed'],
                    ]
                ],
                [
                    'title' => 'Observations & Corrective Actions',
                    'fields' => [
                        ['label' => 'Staff Comments / Notes', 'value' => $log->comments ?? 'None recorded.'],
                    ]
                ],
                [
                    'title' => 'Verification & Signatures',
                    'fields' => [
                        ['label' => 'Staff Member', 'value' => $log->signed_by_staff_name ?? '-'],
                        ['label' => 'Signature Recorded', 'value' => !empty($log->signature)],
                        ['label' => 'Signature Image', 'value' => $log->signature ?? null],
                        ['label' => 'Recorded Timestamp', 'value' => $log->created_at ? $log->created_at->toIso8601String() : null],
                    ]
                ]
            ];
        } elseif ($logType === 'probe-calibration') {
            $probeName = $log->probe_name ?? ('Probe ID #' . ($log->probe_id ?? 'N/A'));
            $calibResult = $log->passed !== null ? ($log->passed ? 'PASSED (In Tolerance)' : 'FAILED (Out of Tolerance)') : ($log->status ?? 'Passed');

            $sections = [
                [
                    'title' => 'Overview & Device Details',
                    'fields' => [
                        ['label' => 'Log Record ID', 'value' => '#' . $log->id],
                        ['label' => 'Date & Time', 'value' => trim(($log->log_date ? (is_object($log->log_date) ? $log->log_date->format('Y-m-d') : strval($log->log_date)) : '') . ' ' . ($log->log_time ?? ''))],
                        ['label' => 'Thermometer / Probe Name', 'value' => $probeName],
                        ['label' => 'Serial Number', 'value' => $log->probe_serial_number ?? 'N/A'],
                        ['label' => 'Staff Member', 'value' => $log->staff_name ?? '-'],
                        ['label' => 'Calibration Status', 'value' => $calibResult],
                        ['label' => 'Recorded At', 'value' => $log->created_at ? $log->created_at->toIso8601String() : null],
                    ]
                ],
                [
                    'title' => 'Calibration Test Checks',
                    'fields' => [
                        ['label' => 'Ice Water Check (0°C ± 1°C)', 'value' => $log->ice_temp !== null ? ($log->ice_temp . ' °C [' . ($log->ice_valid ? 'PASSED' : 'FAILED') . ']') : 'N/A'],
                        ['label' => 'Boiling Water Check (100°C ± 1°C)', 'value' => $log->boiling_temp !== null ? ($log->boiling_temp . ' °C [' . ($log->boiling_valid ? 'PASSED' : 'FAILED') . ']') : 'N/A'],
                        ['label' => 'Overall Calibration Result', 'value' => $calibResult],
                    ]
                ],
                [
                    'title' => 'Observations & Corrective Actions',
                    'fields' => [
                        ['label' => 'Staff Comments / Notes', 'value' => $log->comments ?? 'None recorded.'],
                    ]
                ],
                [
                    'title' => 'Verification & Signatures',
                    'fields' => [
                        ['label' => 'Staff Member', 'value' => $log->staff_name ?? '-'],
                        ['label' => 'Signature Recorded', 'value' => !empty($log->signature)],
                        ['label' => 'Signature Image', 'value' => $log->signature ?? null],
                        ['label' => 'Recorded Timestamp', 'value' => $log->created_at ? $log->created_at->toIso8601String() : null],
                    ]
                ]
            ];
        } elseif ($logType === 'food-dispatch') {
            $sections = [
                [
                    'title' => 'Overview & Dispatch Details',
                    'fields' => [
                        ['label' => 'Log Record ID', 'value' => '#' . $log->id],
                        ['label' => 'Date & Time', 'value' => trim(($log->log_date ? (is_object($log->log_date) ? $log->log_date->format('Y-m-d') : strval($log->log_date)) : '') . ' ' . ($log->log_time ?? ''))],
                        ['label' => 'Food Item / Product', 'value' => $log->food_item ?? '-'],
                        ['label' => 'Batch Code', 'value' => $log->batch_code ?? 'N/A'],
                        ['label' => 'Destination / Dispatch Unit', 'value' => $log->destination ?? 'N/A'],
                        ['label' => 'Staff Member', 'value' => $log->staff_name ?? '-'],
                        ['label' => 'Status', 'value' => $log->status ?? 'Passed'],
                        ['label' => 'Recorded At', 'value' => $log->created_at ? $log->created_at->toIso8601String() : null],
                        ['label' => 'Last Updated', 'value' => $log->updated_at ? $log->updated_at->toIso8601String() : null],
                    ]
                ],
                [
                    'title' => 'Dispatch Temperature & Safety Checks',
                    'fields' => [
                        ['label' => 'Dispatch Temperature', 'value' => $log->temperature !== null ? $log->temperature . ' °C' : 'N/A'],
                        ['label' => 'Required Limit / Passed', 'value' => $log->temp_in_range !== null ? ($log->temp_in_range ? 'Yes (In Range)' : 'No (Out of Range)') : 'N/A'],
                        ['label' => 'Separation Maintained', 'value' => $log->separation !== null ? ($log->separation ? 'Yes' : 'No') : 'N/A'],
                        ['label' => 'Overall Check Result', 'value' => $log->passed !== null ? ($log->passed ? 'PASSED' : 'FAILED') : 'N/A'],
                    ]
                ],
                [
                    'title' => 'Corrective Actions & Notes',
                    'fields' => [
                        ['label' => 'Staff Comments / Notes', 'value' => $log->comments ?? 'None recorded.'],
                    ]
                ],
                [
                    'title' => 'Verification & Signature',
                    'fields' => [
                        ['label' => 'Staff Member', 'value' => $log->staff_name ?? '-'],
                        ['label' => 'Signature Recorded', 'value' => !empty($log->signature)],
                        ['label' => 'Signature Image', 'value' => $log->signature ?? null],
                        ['label' => 'Recorded Timestamp', 'value' => $log->created_at ? $log->created_at->toIso8601String() : null],
                    ]
                ]
            ];
        } elseif ($logType === 'fryer-oil') {
            $sections = [
                [
                    'title' => 'Overview & Fryer Details',
                    'fields' => [
                        ['label' => 'Log Record ID', 'value' => '#' . $log->id],
                        ['label' => 'Date & Time', 'value' => trim(($log->log_date ? (is_object($log->log_date) ? $log->log_date->format('Y-m-d') : strval($log->log_date)) : '') . ' ' . ($log->log_time ?? ''))],
                        ['label' => 'Fryer Station / Name', 'value' => $log->fryer_station ?? '-'],
                        ['label' => 'Staff Member', 'value' => $log->staff_name ?? '-'],
                        ['label' => 'Status', 'value' => $log->status ?? 'Passed'],
                        ['label' => 'Recorded At', 'value' => $log->created_at ? $log->created_at->toIso8601String() : null],
                        ['label' => 'Last Updated', 'value' => $log->updated_at ? $log->updated_at->toIso8601String() : null],
                    ]
                ],
                [
                    'title' => 'Oil Quality Checks',
                    'fields' => [
                        ['label' => 'Frying Temperature', 'value' => $log->frying_temp !== null ? $log->frying_temp . ' °C' : 'N/A'],
                        ['label' => 'Oil Condition / Colour', 'value' => $log->oil_condition ?? 'N/A'],
                        ['label' => 'Oil Quality Acceptable', 'value' => $log->oil_quality_acceptable !== null ? ($log->oil_quality_acceptable ? 'Yes' : 'No') : 'N/A'],
                    ]
                ],
                [
                    'title' => 'Action Taken & Disposal Details',
                    'fields' => [
                        ['label' => 'Action Taken', 'value' => $log->oil_action_taken ?? 'N/A'],
                        ['label' => 'Quantity Removed', 'value' => $log->quantity_removed !== null ? $log->quantity_removed . ' L' : 'N/A'],
                        ['label' => 'Disposal Type', 'value' => $log->disposal_type ?? 'N/A'],
                        ['label' => 'Grease Area / Bin', 'value' => $log->grease_area ?? 'N/A'],
                        ['label' => 'Disposal Quantity', 'value' => $log->disposal_quantity !== null ? $log->disposal_quantity . ' L' : 'N/A'],
                        ['label' => 'Disposal Method', 'value' => $log->disposal_method ?? 'N/A'],
                        ['label' => 'Waste Contractor', 'value' => $log->waste_contractor ?? 'N/A'],
                        ['label' => 'Collection Ref Number', 'value' => $log->collection_ref_number ?? 'N/A'],
                        ['label' => 'Next Cleaning Due Date', 'value' => $log->next_cleaning_due_date ? (is_object($log->next_cleaning_due_date) ? $log->next_cleaning_due_date->format('Y-m-d') : strval($log->next_cleaning_due_date)) : 'N/A'],
                    ]
                ],
                [
                    'title' => 'Observations & Notes',
                    'fields' => [
                        ['label' => 'Step 1 Comments (Quality Check)', 'value' => $log->step1_comments ?? 'None recorded.'],
                        ['label' => 'Step 2 Comments (Disposal)', 'value' => $log->step2_comments ?? 'None recorded.'],
                    ]
                ],
                [
                    'title' => 'Verification & Signature',
                    'fields' => [
                        ['label' => 'Signed By', 'value' => $log->signed_by_staff_name ?? '-'],
                        ['label' => 'Signature Recorded', 'value' => !empty($log->signature)],
                        ['label' => 'Signature Image', 'value' => $log->signature ?? null],
                        ['label' => 'Recorded Timestamp', 'value' => $log->created_at ? $log->created_at->toIso8601String() : null],
                    ]
                ]
            ];
        } elseif ($logType === 'pest-control') {
            $checklistFields = [];
            if (!empty($log->checklist_answers) && is_array($log->checklist_answers)) {
                foreach ($log->checklist_answers as $idx => $ans) {
                    $qText = $ans['question'] ?? "Checklist Item #" . ($idx + 1);
                    $resVal = isset($ans['answer']) ? ($ans['answer'] ? 'Yes' : 'No') : 'N/A';
                    $checklistFields[] = [
                        'label' => $qText,
                        'value' => 'Result: ' . $resVal
                    ];
                }
            } else {
                $checklistFields[] = [
                    'label' => 'Checklist Results',
                    'value' => 'No checklist item results recorded.'
                ];
            }

            $sections = [
                [
                    'title' => 'Overview & Inspection Details',
                    'fields' => [
                        ['label' => 'Log Record ID', 'value' => '#' . $log->id],
                        ['label' => 'Date & Time', 'value' => trim(($log->log_date ? (is_object($log->log_date) ? $log->log_date->format('Y-m-d') : strval($log->log_date)) : '') . ' ' . ($log->log_time ?? ''))],
                        ['label' => 'Inspection Area / Type', 'value' => $log->check_type ?? '-'],
                        ['label' => 'Staff Member', 'value' => $log->staff_name ?? '-'],
                        ['label' => 'Contractor Name', 'value' => $log->contractor_name ?? 'N/A'],
                        ['label' => 'Status', 'value' => $log->status ?? 'Passed'],
                        ['label' => 'Recorded At', 'value' => $log->created_at ? $log->created_at->toIso8601String() : null],
                        ['label' => 'Last Updated', 'value' => $log->updated_at ? $log->updated_at->toIso8601String() : null],
                    ]
                ],
                [
                    'title' => 'Routine Checks',
                    'fields' => $checklistFields
                ],
                [
                    'title' => 'Pest Activity Inspection',
                    'fields' => [
                        ['label' => 'Pest Activity Observed', 'value' => $log->pest_activity_observed !== null ? ($log->pest_activity_observed ? 'Yes' : 'No') : 'N/A'],
                        ['label' => 'Pest Type', 'value' => $log->pest_type ?? 'N/A'],
                        ['label' => 'Location Found', 'value' => $log->location_found ?? 'N/A'],
                        ['label' => 'Evidence Observed', 'value' => $log->evidence_observed ?? 'N/A'],
                        ['label' => 'Food Affected', 'value' => $log->food_affected !== null ? ($log->food_affected ? 'Yes' : 'No') : 'N/A'],
                    ]
                ],
                [
                    'title' => 'Corrective Actions & Follow-Up',
                    'fields' => [
                        ['label' => 'Action Notes', 'value' => $log->action_notes ?? 'None recorded.'],
                        ['label' => 'Contractor Contacted', 'value' => $log->contractor_contacted !== null ? ($log->contractor_contacted ? 'Yes' : 'No') : 'N/A'],
                        ['label' => 'Visit Date', 'value' => $log->visit_date ? (is_object($log->visit_date) ? $log->visit_date->format('Y-m-d') : strval($log->visit_date)) : 'N/A'],
                        ['label' => 'Report Ref Number', 'value' => $log->report_ref_number ?? 'N/A'],
                        ['label' => 'Next Visit Due Date', 'value' => $log->next_visit_due_date ? (is_object($log->next_visit_due_date) ? $log->next_visit_due_date->format('Y-m-d') : strval($log->next_visit_due_date)) : 'N/A'],
                        ['label' => 'Recommendations', 'value' => $log->recommendations ?? 'None.'],
                        ['label' => 'General Comments', 'value' => $log->general_comments ?? 'None.'],
                    ]
                ],
                [
                    'title' => 'Verification & Signature',
                    'fields' => [
                        ['label' => 'Signed By', 'value' => $log->signed_by_staff_name ?? '-'],
                        ['label' => 'Signature Recorded', 'value' => !empty($log->signature)],
                        ['label' => 'Signature Image', 'value' => $log->signature ?? null],
                        ['label' => 'Recorded Timestamp', 'value' => $log->created_at ? $log->created_at->toIso8601String() : null],
                    ]
                ]
            ];
        } elseif ($logType === 'health-declaration') {
            $questionFields = [];
            if ($log->results && $log->results->count() > 0) {
                foreach ($log->results as $rIdx => $res) {
                    $num = $rIdx + 1;
                    $qText = $res->question ? $res->question->question_text : "Question #{$num}";
                    $secName = ($res->question && $res->question->section) ? $res->question->section->name : '';
                    $answer = $res->answer ?? 'N/A';
                    $notes = !empty($res->notes) ? " (Notes: {$res->notes})" : "";

                    $questionFields[] = [
                        'label' => ($secName ? "[{$secName}] " : "") . $qText,
                        'value' => "Answer: {$answer}{$notes}"
                    ];
                }
            } else {
                $questionFields[] = [
                    'label' => 'Health Questions',
                    'value' => 'No individual question responses recorded.'
                ];
            }

            $sections = [
                [
                    'title' => 'Overview & Staff Details',
                    'fields' => [
                        ['label' => 'Log Record ID', 'value' => '#' . $log->id],
                        ['label' => 'Date & Time', 'value' => trim(($log->log_date ? (is_object($log->log_date) ? $log->log_date->format('Y-m-d') : strval($log->log_date)) : '') . ' ' . ($log->log_time ?? ''))],
                        ['label' => 'Staff Member', 'value' => $log->staff_name ?? '-'],
                        ['label' => 'Overall Fitness Status', 'value' => $log->overall_status ?? 'N/A'],
                        ['label' => 'Recorded At', 'value' => $log->created_at ? $log->created_at->toIso8601String() : null],
                        ['label' => 'Last Updated', 'value' => $log->updated_at ? $log->updated_at->toIso8601String() : null],
                    ]
                ],
                [
                    'title' => 'Health Declaration Responses',
                    'fields' => $questionFields
                ],
                [
                    'title' => 'Manager Action & Corrective Actions',
                    'fields' => [
                        ['label' => 'Symptoms Reported', 'value' => $log->symptoms_reported !== null ? ($log->symptoms_reported ? 'Yes' : 'No') : 'N/A'],
                        ['label' => 'Manager Comments', 'value' => $log->comment ?? 'None recorded.'],
                    ]
                ],
                [
                    'title' => 'Verification & Signature',
                    'fields' => [
                        ['label' => 'Staff Signature', 'value' => !empty($log->signature)],
                        ['label' => 'Staff Signature Image', 'value' => $log->signature ?? null],
                        ['label' => 'Manager Signature', 'value' => !empty($log->manager_signature)],
                        ['label' => 'Manager Signature Image', 'value' => $log->manager_signature ?? null],
                        ['label' => 'Recorded Timestamp', 'value' => $log->created_at ? $log->created_at->toIso8601String() : null],
                    ]
                ]
            ];
        } elseif ($logType === 'staff-training') {
            $sections = [
                [
                    'title' => 'Overview & Training Details',
                    'fields' => [
                        ['label' => 'Log Record ID', 'value' => '#' . $log->id],
                        ['label' => 'Date & Time', 'value' => trim(($log->log_date ? (is_object($log->log_date) ? $log->log_date->format('Y-m-d') : strval($log->log_date)) : '') . ' ' . ($log->log_time ?? ''))],
                        ['label' => 'Training Task / Title', 'value' => $log->task_title ?? '-'],
                        ['label' => 'Trainer Name', 'value' => $log->trainer_name ?? 'N/A'],
                        ['label' => 'Status', 'value' => $log->status ?? 'Passed'],
                        ['label' => 'Recorded At', 'value' => $log->created_at ? $log->created_at->toIso8601String() : null],
                        ['label' => 'Last Updated', 'value' => $log->updated_at ? $log->updated_at->toIso8601String() : null],
                    ]
                ],
                [
                    'title' => 'Staff / Role Coverage',
                    'fields' => [
                        ['label' => 'Staff Member', 'value' => $log->staff_name ?? '-'],
                        ['label' => 'Role / Position', 'value' => $log->staff_position ?? 'N/A'],
                    ]
                ],
                [
                    'title' => 'Training / Hygiene Confirmation',
                    'fields' => [
                        ['label' => 'Task Description', 'value' => $log->task_description ?? 'N/A'],
                        ['label' => 'Understanding Confirmed', 'value' => $log->understanding_confirmed !== null ? ($log->understanding_confirmed ? 'Yes' : 'No') : 'N/A'],
                    ]
                ],
                [
                    'title' => 'Observations & Corrective Actions',
                    'fields' => [
                        ['label' => 'Notes', 'value' => $log->notes ?? 'None recorded.'],
                    ]
                ],
                [
                    'title' => 'Verification & Signature',
                    'fields' => [
                        ['label' => 'Signed By', 'value' => $log->signed_by_staff_name ?? '-'],
                        ['label' => 'Signature Recorded', 'value' => !empty($log->signature)],
                        ['label' => 'Signature Image', 'value' => $log->signature ?? null],
                        ['label' => 'Recorded Timestamp', 'value' => $log->created_at ? $log->created_at->toIso8601String() : null],
                    ]
                ]
            ];
        }

        return response()->json([
            'moduleName' => $config['moduleName'],
            'logType' => $logType,
            'auditLogType' => $config['primaryAuditType'],
            'log' => $log,
            'sections' => $sections,
            'auditHistory' => $auditHistory,
        ]);
    }
}
