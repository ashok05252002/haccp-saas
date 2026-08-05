<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\HotHoldingLog;
use App\Models\FoodWasteLog;
use App\Models\StaffTrainingLog;
use App\Models\PestControlLog;
use App\Models\HealthDeclarationLog;
use App\Models\DeliveryIntakeLog;
use App\Models\CookingTemperatureLog;
use App\Models\CleaningLog;
use App\Models\BlastChillingLog;
use App\Models\CoolingLog;
use App\Models\ProbeCalibrationLog;
use App\Models\FoodDispatchLog;
use App\Models\FryerOilLog;

class HaccpReportController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([
                'totalEntries' => 0,
                'modulesUsed' => 0,
                'totalModules' => 13,
                'passed' => 0,
                'failed' => 0,
                'logs' => [],
            ]);
        }

        $dateFilter = $request->input('date', date('Y-m-d'));
        $moduleFilter = $request->input('module', 'all');

        $allLogs = [];
        $activeModules = [];

        // Helper to process module logs
        $processLogs = function ($modelClass, $moduleId, $moduleName) use ($tenantId, $dateFilter, $moduleFilter, &$allLogs, &$activeModules) {
            if ($moduleFilter !== 'all' && $moduleFilter !== $moduleId) {
                return;
            }

            if (!class_exists($modelClass)) {
                return;
            }

            try {
                $query = $modelClass::where('tenant_id', $tenantId);
                if ($dateFilter) {
                    $query->whereDate('log_date', $dateFilter);
                }

                $logs = $query->orderBy('created_at', 'desc')->get();

                if ($logs->count() > 0) {
                    $activeModules[$moduleId] = true;
                }

                foreach ($logs as $log) {
                    $passed = ($log->status === 'Passed');

                    $allLogs[] = [
                        'id' => $log->id,
                        'moduleId' => $moduleId,
                        'moduleName' => $moduleName,
                        'date' => is_object($log->log_date) ? $log->log_date->format('Y-m-d') : strval($log->log_date),
                        'time' => $log->log_time ?? $log->created_at->format('H:i'),
                        'staffName' => $log->staff_name ?? $log->signed_by_staff_name ?? 'N/A',
                        'passed' => $passed,
                        'status' => $log->status ?? 'Passed',
                        'signature' => $log->signature ?? null,
                        'formData' => [
                            'holdingUnit' => $log->holding_unit ?? null,
                            'items' => $log->items ?? null,
                            'generalComments' => $log->general_comments ?? $log->notes ?? null,
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
                // Silently skip if model/table doesn't exist yet
            }
        };

        // Process active HACCP log modules
        $processLogs(HotHoldingLog::class, 'hot-holding', 'Hot Holding / Bain Marie');
        $processLogs(FoodWasteLog::class, 'food-waste', 'Food Waste & Disposal Log');
        $processLogs(StaffTrainingLog::class, 'staff-training', 'Staff Training & Hygiene Log');
        $processLogs(PestControlLog::class, 'pest-control', 'Pest Prevention & Activity Log');
        $processLogs(HealthDeclarationLog::class, 'health-declaration', 'Staff Health Declaration');
        $processLogs(DeliveryIntakeLog::class, 'delivery-intake', 'Delivery Intake');
        $processLogs(CookingTemperatureLog::class, 'cooking-temperature', 'Cooking Temperature');
        $processLogs(CleaningLog::class, 'cleaning', 'Cleaning & Sanitation');
        $processLogs(BlastChillingLog::class, 'blast-chilling', 'Blast Chilling');
        $processLogs(CoolingLog::class, 'cooling-process', 'Cooling Process');
        $processLogs(ProbeCalibrationLog::class, 'probe-calibration', 'Probe Accuracy Check');
        $processLogs(FoodDispatchLog::class, 'food-dispatch', 'Food Dispatch & Transfer');
        $processLogs(FryerOilLog::class, 'fryer-oil', 'Fryer Oil & Grease Management');

        // Sort all logs descending by time
        usort($allLogs, function ($a, $b) {
            return strcmp($b['time'], $a['time']);
        });

        $totalEntries = count($allLogs);
        $passedCount = count(array_filter($allLogs, fn($l) => $l['passed']));
        $failedCount = $totalEntries - $passedCount;

        return response()->json([
            'totalEntries' => $totalEntries,
            'modulesUsed' => count($activeModules),
            'totalModules' => 13,
            'passed' => $passedCount,
            'failed' => $failedCount,
            'logs' => $allLogs,
        ]);
    }

    public function exportCsv(Request $request)
    {
        $response = $this->index($request);
        $data = json_decode($response->getContent(), true);

        $dateFilter = $request->input('date', date('Y-m-d'));
        $filename = "haccp_audit_report_{$dateFilter}.csv";

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
