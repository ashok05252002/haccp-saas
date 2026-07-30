<?php

namespace App\Http\Controllers;

use App\Models\CleaningChecklistQuestion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CleaningChecklistQuestionController extends Controller
{
    /**
     * Display a listing of cleaning checklist questions for the authenticated tenant.
     * Starts empty - no auto-seeding.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $questions = CleaningChecklistQuestion::with('section')
            ->where('tenant_id', $tenantId)
            ->orderBy('id')
            ->get();

        return response()->json($questions);
    }

    /**
     * Store a newly created question.
     */
    public function store(Request $request)
    {
        $request->validate([
            'question'   => 'required|string',
            'section_id' => 'required|integer|exists:cleaning_checklist_sections,id',
            'status'     => 'required|string|in:Active,Inactive',
        ], [
            'section_id.required' => 'Checklist Section is required.',
            'section_id.exists'   => 'Selected Checklist Section is invalid.',
        ]);

        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Duplicate question check within the same section and tenant
        $exists = CleaningChecklistQuestion::where('tenant_id', $tenantId)
            ->where('section_id', $request->section_id)
            ->where('question', $request->question)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['question' => ['This question already exists in the selected section.']]], 422);
        }

        $question = CleaningChecklistQuestion::create([
            'tenant_id'  => $tenantId,
            'section_id' => $request->section_id,
            'question'   => $request->question,
            'status'     => $request->status,
        ]);

        return response()->json($question->load('section'), 201);
    }

    /**
     * Update the specified question.
     */
    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $question = CleaningChecklistQuestion::where('tenant_id', $tenantId)->findOrFail($id);

        $request->validate([
            'question'   => 'required|string',
            'section_id' => 'required|integer|exists:cleaning_checklist_sections,id',
            'status'     => 'required|string|in:Active,Inactive',
        ], [
            'section_id.required' => 'Checklist Section is required.',
            'section_id.exists'   => 'Selected Checklist Section is invalid.',
        ]);

        // Duplicate question check (excluding current id)
        $exists = CleaningChecklistQuestion::where('tenant_id', $tenantId)
            ->where('section_id', $request->section_id)
            ->where('question', $request->question)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['question' => ['This question already exists in the selected section.']]], 422);
        }

        $question->update([
            'section_id' => $request->section_id,
            'question'   => $request->question,
            'status'     => $request->status,
        ]);

        return response()->json($question->load('section'));
    }
}
