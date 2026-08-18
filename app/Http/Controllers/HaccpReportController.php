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
}
