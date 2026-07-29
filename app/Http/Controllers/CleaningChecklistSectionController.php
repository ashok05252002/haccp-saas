<?php

namespace App\Http\Controllers;

use App\Models\CleaningChecklistSection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CleaningChecklistSectionController extends Controller
{
    /**
     * Display a listing of cleaning checklist sections for the authenticated tenant.
     * Starts empty - no auto-seeding.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $sections = CleaningChecklistSection::where('tenant_id', $tenantId)
            ->orderBy('title')
            ->get();

        return response()->json($sections);
    }

    /**
     * Store a newly created section.
     */
    public function store(Request $request)
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'frequency'   => 'required|string|in:Daily,Weekly,Monthly,Quarterly,As Needed',
            'description' => 'nullable|string',
            'status'      => 'required|string|in:Active,Inactive',
        ], [
            'frequency.in' => 'Frequency must be one of: Daily, Weekly, Monthly, Quarterly, or As Needed.',
        ]);

        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Duplicate title check
        $exists = CleaningChecklistSection::where('tenant_id', $tenantId)
            ->where('title', $request->title)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['title' => ['This section title already exists.']]], 422);
        }

        $section = CleaningChecklistSection::create([
            'tenant_id'   => $tenantId,
            'title'       => $request->title,
            'frequency'   => $request->frequency,
            'description' => $request->description ?: null,
            'status'      => $request->status,
        ]);

        return response()->json($section, 201);
    }

    /**
     * Update the specified section.
     */
    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $section = CleaningChecklistSection::where('tenant_id', $tenantId)->findOrFail($id);

        $request->validate([
            'title'       => 'required|string|max:255',
            'frequency'   => 'required|string|in:Daily,Weekly,Monthly,Quarterly,As Needed',
            'description' => 'nullable|string',
            'status'      => 'required|string|in:Active,Inactive',
        ], [
            'frequency.in' => 'Frequency must be one of: Daily, Weekly, Monthly, Quarterly, or As Needed.',
        ]);

        // Duplicate title check (excluding current id)
        $exists = CleaningChecklistSection::where('tenant_id', $tenantId)
            ->where('title', $request->title)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['title' => ['This section title already exists.']]], 422);
        }

        $section->update([
            'title'       => $request->title,
            'frequency'   => $request->frequency,
            'description' => $request->description ?: null,
            'status'      => $request->status,
        ]);

        return response()->json($section);
    }
}
