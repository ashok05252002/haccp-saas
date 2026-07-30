<?php

namespace App\Http\Controllers;

use App\Models\HealthDeclarationSection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class HealthDeclarationSectionController extends Controller
{
    /**
     * Display a listing of health declaration sections for the authenticated tenant.
     * Starts empty - no auto-seeding.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([], 200);
        }

        $sections = HealthDeclarationSection::where('tenant_id', $tenantId)
            ->orderBy('title')
            ->get();

        return response()->json($sections);
    }

    /**
     * Store a newly created section in database.
     */
    public function store(Request $request)
    {
        $request->validate([
            'title'  => 'required|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'title.required' => 'Section Title is required.',
        ]);

        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        // Duplicate check for this tenant
        $exists = HealthDeclarationSection::where('tenant_id', $tenantId)
            ->where('title', $request->title)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['title' => ['This section title already exists.']]], 422);
        }

        $section = HealthDeclarationSection::create([
            'tenant_id' => $tenantId,
            'title'     => $request->title,
            'status'    => $request->status,
        ]);

        return response()->json($section, 201);
    }

    /**
     * Update the specified section in database.
     */
    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $section = HealthDeclarationSection::where('tenant_id', $tenantId)->findOrFail($id);

        $request->validate([
            'title'  => 'required|string|max:255',
            'status' => 'required|string|in:Active,Inactive',
        ], [
            'title.required' => 'Section Title is required.',
        ]);

        // Duplicate check excluding current id
        $exists = HealthDeclarationSection::where('tenant_id', $tenantId)
            ->where('title', $request->title)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['title' => ['This section title already exists.']]], 422);
        }

        $section->update([
            'title'  => $request->title,
            'status' => $request->status,
        ]);

        return response()->json($section);
    }
}
