<?php

namespace App\Http\Controllers;

use App\Models\TrainingTask;
use App\Models\Role;
use App\Models\RestaurantUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TrainingTaskController extends Controller
{
    /**
     * Display a listing of training tasks along with active roles & staff for assignment.
     */
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json([
                'tasks' => [],
                'roles' => [],
                'staff' => [],
            ], 200);
        }

        // BelongsToBranch handles branch_id scoping automatically for training tasks
        $tasks = TrainingTask::orderBy('title')->get();

        // Fetch active positions/roles for tenant
        $roles = Role::where('tenant_id', $tenantId)
            ->where('status', 'Active')
            ->orderBy('name')
            ->get(['id', 'name']);

        // Fetch active staff/users for tenant
        $staff = RestaurantUser::where('tenant_id', $tenantId)
            ->where('status', 'Active')
            ->orderBy('name')
            ->get(['id', 'name']);

        // Create key-value maps for quick name resolution
        $rolesMap = $roles->pluck('name', 'id')->toArray();
        $staffMap = $staff->pluck('name', 'id')->toArray();

        // Attach display names safely
        $tasks->transform(function ($task) use ($rolesMap, $staffMap) {
            $assignedRoleNames = [];
            if (is_array($task->role_ids)) {
                foreach ($task->role_ids as $rId) {
                    if (isset($rolesMap[$rId])) {
                        $assignedRoleNames[] = $rolesMap[$rId];
                    }
                }
            }

            $assignedStaffNames = [];
            if (is_array($task->user_ids)) {
                foreach ($task->user_ids as $uId) {
                    if (isset($staffMap[$uId])) {
                        $assignedStaffNames[] = $staffMap[$uId];
                    }
                }
            }

            $task->assigned_role_names = $assignedRoleNames;
            $task->assigned_staff_names = $assignedStaffNames;
            return $task;
        });

        return response()->json([
            'tasks' => $tasks,
            'roles' => $roles,
            'staff' => $staff,
        ]);
    }

    /**
     * Store a newly created training task in database.
     */
    public function store(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;
        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized tenant context.'], 403);
        }

        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'frequency'   => 'required|string|in:One Time,Daily,Weekly,Monthly,Yearly',
            'applies_to'  => 'required|string|in:All Staff,By Position,By Staff',
            'status'      => 'required|string|in:Active,Inactive',
            'role_ids'    => 'nullable|array',
            'user_ids'    => 'nullable|array',
        ], [
            'title.required'     => 'Task Title is required.',
            'frequency.required' => 'Frequency is required.',
            'frequency.in'       => 'Frequency must be One Time, Daily, Weekly, Monthly, or Yearly.',
            'applies_to.required'=> 'Applies To selection is required.',
        ]);

        if ($request->applies_to === 'By Position' && empty($request->role_ids)) {
            return response()->json(['errors' => ['role_ids' => ['Please select at least one position.']]], 422);
        }

        if ($request->applies_to === 'By Staff' && empty($request->user_ids)) {
            return response()->json(['errors' => ['user_ids' => ['Please select at least one staff member.']]], 422);
        }

        // Duplicate check for this tenant & branch
        $exists = TrainingTask::where('title', $request->title)->exists();
        if ($exists) {
            return response()->json(['errors' => ['title' => ['A training task with this title already exists.']]], 422);
        }

        $roleIds = $request->applies_to === 'By Position' ? array_values(array_map('intval', $request->role_ids ?? [])) : null;
        $userIds = $request->applies_to === 'By Staff' ? array_values(array_map('intval', $request->user_ids ?? [])) : null;

        $task = TrainingTask::create([
            'tenant_id'   => $tenantId,
            'title'       => $request->title,
            'description' => $request->description,
            'frequency'   => $request->frequency,
            'applies_to'  => $request->applies_to,
            'status'      => $request->status,
            'role_ids'    => $roleIds,
            'user_ids'    => $userIds,
        ]);

        return response()->json($task, 201);
    }

    /**
     * Update the specified training task in database.
     */
    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $task = TrainingTask::findOrFail($id);

        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'frequency'   => 'required|string|in:One Time,Daily,Weekly,Monthly,Yearly',
            'applies_to'  => 'required|string|in:All Staff,By Position,By Staff',
            'status'      => 'required|string|in:Active,Inactive',
            'role_ids'    => 'nullable|array',
            'user_ids'    => 'nullable|array',
        ], [
            'title.required'     => 'Task Title is required.',
            'frequency.required' => 'Frequency is required.',
            'frequency.in'       => 'Frequency must be One Time, Daily, Weekly, Monthly, or Yearly.',
            'applies_to.required'=> 'Applies To selection is required.',
        ]);

        if ($request->applies_to === 'By Position' && empty($request->role_ids)) {
            return response()->json(['errors' => ['role_ids' => ['Please select at least one position.']]], 422);
        }

        if ($request->applies_to === 'By Staff' && empty($request->user_ids)) {
            return response()->json(['errors' => ['user_ids' => ['Please select at least one staff member.']]], 422);
        }

        // Duplicate check excluding current id
        $exists = TrainingTask::where('title', $request->title)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json(['errors' => ['title' => ['A training task with this title already exists.']]], 422);
        }

        $roleIds = $request->applies_to === 'By Position' ? array_values(array_map('intval', $request->role_ids ?? [])) : null;
        $userIds = $request->applies_to === 'By Staff' ? array_values(array_map('intval', $request->user_ids ?? [])) : null;

        $task->update([
            'title'       => $request->title,
            'description' => $request->description,
            'frequency'   => $request->frequency,
            'applies_to'  => $request->applies_to,
            'status'      => $request->status,
            'role_ids'    => $roleIds,
            'user_ids'    => $userIds,
        ]);

        return response()->json($task);
    }
}
