<?php

namespace App\Http\Controllers;

use App\Models\PestControlQuestion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PestControlQuestionController extends Controller
{
    /**
     * Display a listing of pest control questions for authenticated tenant & branch.
     * Starts empty - no auto-seeding.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        // BelongsToBranch handles branch_id scoping automatically
        $questions = PestControlQuestion::orderBy('id')->get();

        return response()->json($questions);
    }

    /**
     * Store a newly created pest control question in database.
     */
    public function store(Request $request)
    {
        $request->validate([
            'question_text' => 'required|string',
            'status'        => 'required|string|in:Active,Inactive',
        ], [
            'question_text.required' => 'Question Text is required.',
        ]);

        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Duplicate check for this tenant & branch
        $exists = PestControlQuestion::where('question_text', $request->question_text)->exists();
        if ($exists) {
            return response()->json(['errors' => ['question_text' => ['A pest control question with this text already exists.']]], 422);
        }

        $question = PestControlQuestion::create([
            'tenant_id'     => $tenantId,
            'question_text' => $request->question_text,
            'status'        => $request->status,
        ]);

        return response()->json($question, 201);
    }

    /**
     * Update the specified pest control question in database.
     */
    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $question = PestControlQuestion::findOrFail($id);

        $request->validate([
            'question_text' => 'required|string',
            'status'        => 'required|string|in:Active,Inactive',
        ], [
            'question_text.required' => 'Question Text is required.',
        ]);

        // Duplicate check excluding current id
        $exists = PestControlQuestion::where('question_text', $request->question_text)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['question_text' => ['A pest control question with this text already exists.']]], 422);
        }

        $question->update([
            'question_text' => $request->question_text,
            'status'        => $request->status,
        ]);

        return response()->json($question);
    }
}
