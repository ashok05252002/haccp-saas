<?php

namespace App\Http\Controllers;

use App\Models\HealthDeclarationLog;
use App\Models\HealthDeclarationLogResult;
use App\Models\HealthDeclarationSection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class HealthDeclarationLogController extends Controller
{
    /**
     * Get active sections and questions for rendering the health declaration questionnaire form.
     */
    public function formDependencies(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['sections' => []], 200);
        }

        $sections = HealthDeclarationSection::with(['questions' => function ($query) {
            $query->where('status', 'Active');
        }])
        ->where('tenant_id', $tenantId)
        ->where('status', 'Active')
        ->get();

        return response()->json([
            'sections' => $sections,
        ]);
    }

    /**
     * Display a listing of submitted health declaration logs.
     */
    public function index(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $logs = HealthDeclarationLog::with(['results.question.section'])
            ->where('tenant_id', $tenantId)
            ->orderBy('log_date', 'desc')
            ->orderBy('log_time', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json($logs);
    }

    /**
     * Show details of a single health declaration log.
     */
    public function show($id)
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $log = HealthDeclarationLog::with(['results.question.section'])
            ->where('tenant_id', $tenantId)
            ->where('id', $id)
            ->firstOrFail();

        return response()->json($log);
    }

    /**
     * Store a newly created health declaration log.
     */
    public function store(Request $request)
    {
        $request->validate([
            'log_date'            => 'required|date',
            'log_time'            => 'required|date_format:H:i',
            'staff_name'          => 'required|string|max:255',
            'comment'             => 'nullable|string',
            'signature'           => 'nullable|string',
            'manager_signature'   => 'nullable|string',
            'results'             => 'required|array',
            'results.*.question_id' => 'required|integer|exists:health_declaration_questions,id',
            'results.*.answer'    => 'required|in:Yes,No',
            'results.*.notes'     => 'nullable|string',
        ]);

        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Determine if any symptom / high risk question was answered with 'Yes'
        $hasYesAnswers = false;
        foreach ($request->results as $resItem) {
            if ($resItem['answer'] === 'Yes') {
                $hasYesAnswers = true;
                break;
            }
        }

        $overallStatus = $hasYesAnswers ? 'Action Required / Unfit' : 'Fit for Work';

        try {
            DB::beginTransaction();

            $log = HealthDeclarationLog::create([
                'tenant_id'          => $tenantId,
                'log_date'           => $request->log_date,
                'log_time'           => $request->log_time,
                'staff_name'         => $request->staff_name,
                'overall_status'     => $overallStatus,
                'symptoms_reported'  => $hasYesAnswers,
                'comment'            => $request->comment,
                'signature'          => $request->signature,
                'manager_signature'  => $request->manager_signature,
            ]);

            foreach ($request->results as $resultData) {
                HealthDeclarationLogResult::create([
                    'health_declaration_log_id' => $log->id,
                    'question_id'               => $resultData['question_id'],
                    'answer'                    => $resultData['answer'],
                    'notes'                     => $resultData['notes'] ?? null,
                ]);
            }

            DB::commit();

            return response()->json($log->load(['results.question.section']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to save health declaration: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete a health declaration log.
     */
    public function destroy($id)
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $log = HealthDeclarationLog::where('tenant_id', $tenantId)->findOrFail($id);
        $log->delete();

        return response()->json(['message' => 'Health declaration log deleted successfully.']);
    }
}
