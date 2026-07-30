<?php

namespace App\Http\Controllers;

use App\Models\HealthDeclarationQuestion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class HealthDeclarationQuestionController extends Controller
{
    /**
     * Display a listing of health declaration questions for the authenticated tenant.
     * Starts empty - no auto-seeding.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $questions = HealthDeclarationQuestion::with('section')
            ->where('tenant_id', $tenantId)
            ->orderBy('id')
            ->get();

        return response()->json($questions);
    }

    /**
     * Store a newly created question in database.
     */
    public function store(Request $request)
    {
        $request->validate([
            'question_text' => 'required|string',
            'section_id'    => 'required|integer|exists:health_declaration_sections,id',
            'status'        => 'required|string|in:Active,Inactive',
        ], [
            'question_text.required' => 'Question Text is required.',
            'section_id.required'    => 'Section is required.',
            'section_id.exists'      => 'Selected Section is invalid.',
        ]);

        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Duplicate question check within the same section and tenant
        $exists = HealthDeclarationQuestion::where('tenant_id', $tenantId)
            ->where('section_id', $request->section_id)
            ->where('question_text', $request->question_text)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['question_text' => ['This question already exists in the selected section.']]], 422);
        }

        $question = HealthDeclarationQuestion::create([
            'tenant_id'     => $tenantId,
            'section_id'    => $request->section_id,
            'question_text' => $request->question_text,
            'status'        => $request->status,
        ]);

        return response()->json($question->load('section'), 201);
    }

    /**
     * Update the specified question in database.
     */
    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $question = HealthDeclarationQuestion::where('tenant_id', $tenantId)->findOrFail($id);

        $request->validate([
            'question_text' => 'required|string',
            'section_id'    => 'required|integer|exists:health_declaration_sections,id',
            'status'        => 'required|string|in:Active,Inactive',
        ], [
            'question_text.required' => 'Question Text is required.',
            'section_id.required'    => 'Section is required.',
            'section_id.exists'      => 'Selected Section is invalid.',
        ]);

        // Duplicate question check excluding current id
        $exists = HealthDeclarationQuestion::where('tenant_id', $tenantId)
            ->where('section_id', $request->section_id)
            ->where('question_text', $request->question_text)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['question_text' => ['This question already exists in the selected section.']]], 422);
        }

        $question->update([
            'section_id'    => $request->section_id,
            'question_text' => $request->question_text,
            'status'        => $request->status,
        ]);

        return response()->json($question->load('section'));
    }
}
