<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use App\Models\SupervisionReviewLog;
use App\Models\TemperatureLog;
use App\Models\DeliveryIntakeLog;
use App\Models\CookingLog;
use App\Models\BlastChillingLog;
use App\Models\CoolingProcessLog;
use App\Models\HotHoldingLog;
use App\Models\ProbeCalibrationLog;
use App\Models\FoodDispatchLog;
use App\Models\FryerOilLog;
use App\Models\PestControlLog;
use App\Models\FoodWasteLog;
use App\Models\StaffTrainingLog;
use App\Models\ThawingLog;
use App\Models\HealthDeclarationLog;
use App\Models\CleaningLog;
use App\Models\CleaningArea;

class SupervisionReviewController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('SupervisionReviewPage');
    }

    public function historyPage(Request $request)
    {
        $reviews = SupervisionReviewLog::orderBy('review_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('SupervisionReviewHistoryPage', [
            'reviews' => $reviews,
        ]);
    }

    public function getSummary(Request $request)
    {
        $reviewDate = $request->input('date', date('Y-m-d'));
        $carbonDate = Carbon::parse($reviewDate);

        // 1. Defined HACCP Operational Modules
        $haccpModulesConfig = [
            ['id' => 'temperature', 'name' => 'Temperature Monitoring', 'model' => TemperatureLog::class, 'date_col' => 'log_date'],
            ['id' => 'delivery-intake', 'name' => 'Delivery Intake', 'model' => DeliveryIntakeLog::class, 'date_col' => 'log_date'],
            ['id' => 'cooking-temperature', 'name' => 'Cooking Temperature', 'model' => CookingLog::class, 'date_col' => 'log_date'],
            ['id' => 'blast-chilling', 'name' => 'Blast Chilling', 'model' => BlastChillingLog::class, 'date_col' => 'log_date'],
            ['id' => 'cooling-process', 'name' => 'Cooling Process', 'model' => CoolingProcessLog::class, 'date_col' => 'log_date'],
            ['id' => 'hot-holding', 'name' => 'Hot Holding / Bain Marie', 'model' => HotHoldingLog::class, 'date_col' => 'log_date'],
            ['id' => 'probe-calibration', 'name' => 'Probe Accuracy Check', 'model' => ProbeCalibrationLog::class, 'date_col' => 'log_date'],
            ['id' => 'food-dispatch', 'name' => 'Food Dispatch & Transfer', 'model' => FoodDispatchLog::class, 'date_col' => 'log_date'],
            ['id' => 'fryer-oil', 'name' => 'Fryer Oil & Grease Management', 'model' => FryerOilLog::class, 'date_col' => 'log_date'],
            ['id' => 'pest-control', 'name' => 'Pest Prevention & Activity', 'model' => PestControlLog::class, 'date_col' => 'log_date'],
            ['id' => 'food-waste', 'name' => 'Food Waste & Disposal', 'model' => FoodWasteLog::class, 'date_col' => 'log_date'],
            ['id' => 'staff-training', 'name' => 'Staff Training & Hygiene', 'model' => StaffTrainingLog::class, 'date_col' => 'log_date'],
            ['id' => 'thawing', 'name' => 'Thawing / Defrosting Record', 'model' => ThawingLog::class, 'date_col' => 'log_date'],
            ['id' => 'health-declaration', 'name' => 'Staff Health Declaration', 'model' => HealthDeclarationLog::class, 'date_col' => 'log_date'],
        ];

        $haccpCompletedCount = 0;
        $haccpTotalCount = count($haccpModulesConfig);
        $flaggedLogs = [];
        $moduleBreakdown = [];
        $latestHaccpLogTime = null;

        foreach ($haccpModulesConfig as $mod) {
            $class = $mod['model'];
            $entryCount = 0;
            $modStatus = 'Pending';
            $latestTime = null;

            if (class_exists($class)) {
                try {
                    $logs = $class::whereDate($mod['date_col'], $reviewDate)->get();
                    $entryCount = $logs->count();

                    if ($entryCount > 0) {
                        $haccpCompletedCount++;
                        $modStatus = 'Completed';

                        foreach ($logs as $log) {
                            $createdTime = $log->created_at ? $log->created_at->format('H:i') : ($log->log_time ?? '12:00');
                            if (!$latestHaccpLogTime || $createdTime > $latestHaccpLogTime) {
                                $latestHaccpLogTime = $createdTime;
                            }
                            if (!$latestTime || $createdTime > $latestTime) {
                                $latestTime = $createdTime;
                            }

                            $isFailed = (isset($log->status) && in_array(strtolower($log->status), ['failed', 'flagged', 'action required', 'out of spec']));
                            if (isset($log->pest_activity_observed) && $log->pest_activity_observed) {
                                $isFailed = true;
                            }

                            if ($isFailed) {
                                $modStatus = 'Flagged';
                                $flaggedLogs[] = [
                                    'id' => $log->id,
                                    'module_id' => $mod['id'],
                                    'module_name' => $mod['name'],
                                    'staff_name' => $log->staff_name ?? $log->signed_by_staff_name ?? 'Staff',
                                    'time' => $createdTime,
                                    'reason' => $log->general_comments ?? $log->main_reason ?? 'Out-of-spec reading or non-compliance detected',
                                    'status' => $log->status ?? 'Flagged',
                                ];
                            }
                        }
                    }
                } catch (\Exception $e) {
                    // Table not populated yet
                }
            }

            $moduleBreakdown[] = [
                'id' => $mod['id'],
                'name' => $mod['name'],
                'entries_count' => $entryCount,
                'status' => $modStatus,
                'latest_time' => $latestTime,
            ];
        }

        // 2. Dynamic Cleaning Areas & Frequency-based Progress
        $allActiveAreas = CleaningArea::where(function($q) {
            $q->where('status', 'Active')->orWhereNull('status');
        })->orderBy('name')->get();

        $dailyAreas = $allActiveAreas->filter(fn($a) => empty($a->frequency) || strtolower($a->frequency) === 'daily');
        $weeklyAreas = $allActiveAreas->filter(fn($a) => strtolower($a->frequency ?? '') === 'weekly');
        $monthlyAreas = $allActiveAreas->filter(fn($a) => strtolower($a->frequency ?? '') === 'monthly');

        $totalDailyAreasCount = $dailyAreas->count();
        $totalWeeklyAreasCount = $weeklyAreas->count();

        // Today's Cleaning Logs
        $todayCleaningLogs = CleaningLog::whereDate('log_date', $reviewDate)->get();
        $completedDailyCount = 0;
        $dailyAreaDetails = [];

        foreach ($dailyAreas as $area) {
            $log = $todayCleaningLogs->firstWhere('cleaning_area_id', $area->id);
            $isDone = !is_null($log);
            if ($isDone) {
                $completedDailyCount++;
            }

            $dailyAreaDetails[] = [
                'id' => $area->id,
                'name' => $area->name,
                'frequency' => 'Daily',
                'completed' => $isDone,
                'staff_name' => $log->staff_name ?? null,
                'logged_at' => $log ? ($log->log_time ?? $log->created_at->format('H:i')) : null,
            ];
        }

        // Current Week Cleaning Logs (Monday -> Sunday)
        $startOfWeek = $carbonDate->copy()->startOfWeek();
        $endOfWeek = $carbonDate->copy()->endOfWeek();

        $weeklyCleaningLogs = CleaningLog::whereBetween('log_date', [$startOfWeek->format('Y-m-d'), $endOfWeek->format('Y-m-d')])
            ->orderBy('created_at', 'desc')
            ->get();

        $completedWeeklyCount = 0;
        $weeklyAreaDetails = [];
        $latestWeeklyCompletedTime = null;

        foreach ($weeklyAreas as $area) {
            $log = $weeklyCleaningLogs->firstWhere('cleaning_area_id', $area->id);
            $isDone = !is_null($log);
            if ($isDone) {
                $completedWeeklyCount++;
                $logFormattedTime = $log->created_at ? $log->created_at->format('d/m/Y \a\t H:i') : $log->log_date;
                if (!$latestWeeklyCompletedTime || $logFormattedTime > $latestWeeklyCompletedTime) {
                    $latestWeeklyCompletedTime = $logFormattedTime;
                }
            }

            $weeklyAreaDetails[] = [
                'id' => $area->id,
                'name' => $area->name,
                'frequency' => 'Weekly',
                'completed' => $isDone,
                'staff_name' => $log->staff_name ?? null,
                'logged_at' => $log ? ($log->created_at ? $log->created_at->format('d/m/Y H:i') : $log->log_date) : null,
            ];
        }

        // Overall Cleaning Totals (Exact total active areas count)
        $overallCompletedCount = $completedDailyCount + $completedWeeklyCount;
        $overallTotalCount = $allActiveAreas->count();
        $isWeeklyFullyCompleted = ($totalWeeklyAreasCount > 0 && $completedWeeklyCount >= $totalWeeklyAreasCount);
        $isWeeklyFullyCompleted = ($totalWeeklyAreasCount > 0 && $completedWeeklyCount >= $totalWeeklyAreasCount);

        // 3. Restaurant Staff / Members List for Supervisor Select Dropdown
        $staffMembers = \App\Models\RestaurantUser::where(function($q) {
            $q->where('status', 'Active')->orWhereNull('status');
        })->orderBy('name')->get(['id', 'name']);

        if ($staffMembers->isEmpty()) {
            $staffMembers = \App\Models\User::orderBy('name')->get(['id', 'name']);
        }

        // 4. Check existing Supervision Review Log for this date
        $existingReview = SupervisionReviewLog::whereDate('review_date', $reviewDate)->first();

        return response()->json([
            'reviewDate' => $reviewDate,
            'haccpStats' => [
                'completedCount' => $haccpCompletedCount,
                'totalCount' => $haccpTotalCount,
                'ratioString' => "{$haccpCompletedCount} / {$haccpTotalCount}",
                'lastLoggedAt' => $latestHaccpLogTime ? "Today at {$latestHaccpLogTime}" : null,
                'status' => $haccpCompletedCount === $haccpTotalCount ? 'Completed' : ($haccpCompletedCount > 0 ? 'In Progress' : 'Pending'),
            ],
            'cleaningStats' => [
                'completedCount' => $overallCompletedCount,
                'totalCount' => $overallTotalCount,
                'ratioString' => "{$overallCompletedCount} / {$overallTotalCount}",
                'dailyRatioString' => "{$completedDailyCount} / {$totalDailyAreasCount}",
                'weeklyRatioString' => "{$completedWeeklyCount} / {$totalWeeklyAreasCount}",
                'completedDailyCount' => $completedDailyCount,
                'totalDailyAreasCount' => $totalDailyAreasCount,
                'completedWeeklyCount' => $completedWeeklyCount,
                'totalWeeklyAreasCount' => $totalWeeklyAreasCount,
                'isWeeklyCompleted' => $isWeeklyFullyCompleted,
                'weeklyCompletedAt' => $latestWeeklyCompletedTime,
                'dailyAreaDetails' => $dailyAreaDetails,
                'weeklyAreaDetails' => $weeklyAreaDetails,
            ],
            'flaggedLogs' => $flaggedLogs,
            'moduleBreakdown' => $moduleBreakdown,
            'existingReview' => $existingReview,
            'staffMembers' => $staffMembers,
        ]);
    }

    public function toggleCleaningLog(Request $request)
    {
        $request->validate([
            'cleaning_area_id' => 'required|integer',
            'review_date' => 'required|date',
            'staff_name' => 'nullable|string',
        ]);

        $areaId = $request->input('cleaning_area_id');
        $reviewDate = $request->input('review_date');
        $staffName = $request->input('staff_name') ?: (Auth::user() ? Auth::user()->name : 'Supervisor');

        $tenantId = Auth::user() ? Auth::user()->tenant_id : null;

        // Check if log already exists for this date and area
        $existingLog = CleaningLog::whereDate('log_date', $reviewDate)
            ->where('cleaning_area_id', $areaId)
            ->first();

        if ($existingLog) {
            $existingLog->delete();
            $message = 'Cleaning area unchecked.';
        } else {
            CleaningLog::create([
                'tenant_id' => $tenantId,
                'log_date' => $reviewDate,
                'log_time' => now()->format('H:i'),
                'staff_name' => $staffName,
                'cleaning_area_id' => $areaId,
                'comment' => 'Verified and checked by supervisor during audit review.',
            ]);
            $message = 'Cleaning area verified & checked!';
        }

        return response()->json(['success' => true, 'message' => $message]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'review_date' => 'required|date',
            'review_mode' => 'required|string',
            'reviewer_name' => 'required|string|max:255',
            'reviewer_role' => 'nullable|string|max:255',
            'haccp_completed_count' => 'required|integer',
            'haccp_total_count' => 'required|integer',
            'cleaning_completed_count' => 'required|integer',
            'cleaning_total_count' => 'required|integer',
            'flagged_items_count' => 'required|integer',
            'compliance_status' => 'required|string|in:passed,passed_with_action,failed',
            'supervisor_comments' => 'nullable|string',
            'corrective_actions_taken' => 'nullable|string',
            'signature' => 'required|string',
        ], [
            'reviewer_name.required' => 'Please select a Supervisor / Manager from restaurant members.',
            'signature.required' => 'Digital Supervisor Signature is required for verification.',
        ]);

        $reviewDate = $validated['review_date'];

        // Update or Create Supervision Review Log (BelongsToBranch handles tenant_id and branch_id)
        $log = SupervisionReviewLog::updateOrCreate(
            ['review_date' => $reviewDate],
            [
                'review_mode' => $validated['review_mode'],
                'reviewer_name' => $validated['reviewer_name'],
                'reviewer_role' => $validated['reviewer_role'] ?? 'Supervisor / Manager',
                'haccp_completed_count' => $validated['haccp_completed_count'],
                'haccp_total_count' => $validated['haccp_total_count'],
                'cleaning_completed_count' => $validated['cleaning_completed_count'],
                'cleaning_total_count' => $validated['cleaning_total_count'],
                'flagged_items_count' => $validated['flagged_items_count'],
                'compliance_status' => $validated['compliance_status'],
                'supervisor_comments' => $validated['supervisor_comments'] ?? null,
                'corrective_actions_taken' => $validated['corrective_actions_taken'] ?? null,
                'signature' => $validated['signature'],
                'verified_at' => now(),
            ]
        );

        return redirect()->back()->with('success', 'Supervisory Review and Sign-Off completed successfully!');
    }

    public function exportCsv(Request $request)
    {
        $reviews = SupervisionReviewLog::orderBy('review_date', 'desc')->get();
        $filename = "supervision_review_audit_log_" . date('Y-m-d') . ".csv";

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($reviews) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['ID', 'Review Date', 'Mode', 'Supervisor Name', 'Role', 'HACCP Logs Ratio', 'Cleaning Ratio', 'Flagged Items', 'Compliance Status', 'Comments', 'Verified At']);

            foreach ($reviews as $rev) {
                fputcsv($file, [
                    $rev->id,
                    is_object($rev->review_date) ? $rev->review_date->format('Y-m-d') : $rev->review_date,
                    $rev->review_mode,
                    $rev->reviewer_name,
                    $rev->reviewer_role,
                    "{$rev->haccp_completed_count}/{$rev->haccp_total_count}",
                    "{$rev->cleaning_completed_count}/{$rev->cleaning_total_count}",
                    $rev->flagged_items_count,
                    strtoupper($rev->compliance_status),
                    $rev->supervisor_comments ?? '-',
                    $rev->verified_at ? $rev->verified_at->format('Y-m-d H:i') : '-',
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
