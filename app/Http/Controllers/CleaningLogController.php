<?php

namespace App\Http\Controllers;

use App\Models\CleaningLog;
use App\Models\CleaningArea;
use App\Models\CleaningChecklistSection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CleaningLogController extends Controller
{
    public function formDependencies(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $areas = CleaningArea::where('tenant_id', $tenantId)
            ->where('status', 'Active')
            ->get();

        $sections = CleaningChecklistSection::with(['questions' => function ($query) {
            $query->where('status', 'Active');
        }])
        ->where('tenant_id', $tenantId)
        ->where('status', 'Active')
        ->get();

        return response()->json([
            'areas' => $areas,
            'sections' => $sections,
        ]);
    }

    public function index(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $logs = CleaningLog::with(['area', 'results.question.section'])
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
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $log = CleaningLog::with(['area', 'results.question.section'])
            ->where('tenant_id', $tenantId)
            ->where('id', $id)
            ->firstOrFail();

        return response()->json($log);
    }

    public function store(Request $request)
    {
        $request->validate([
            'log_date' => 'required|date',
            'log_time' => 'required|date_format:H:i',
            'staff_name' => 'nullable|string|max:255',
            'cleaning_area_id' => 'nullable|integer|exists:cleaning_areas,id',
            'comment' => 'nullable|string',
            'signature' => 'nullable|string',
            'results' => 'required|array',
            'results.*.question_id' => 'required|integer|exists:cleaning_checklist_questions,id',
            'results.*.result' => 'required|in:Yes,No,N/A',
            'results.*.comment' => 'nullable|string',
        ]);

        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        try {
            DB::beginTransaction();

            $log = CleaningLog::create([
                'tenant_id' => $tenantId,
                'log_date' => $request->log_date,
                'log_time' => $request->log_time,
                'staff_name' => $request->staff_name,
                'cleaning_area_id' => $request->cleaning_area_id,
                'comment' => $request->comment,
                'signature' => $request->signature,
            ]);

            foreach ($request->results as $result) {
                $log->results()->create([
                    'question_id' => $result['question_id'],
                    'result' => $result['result'],
                    'comment' => $result['comment'],
                ]);
            }

            DB::commit();

            return response()->json(['message' => 'Cleaning log saved successfully', 'log' => $log], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to save cleaning log: ' . $e->getMessage()], 500);
        }
    }
}
