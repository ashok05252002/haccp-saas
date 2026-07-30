<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Auth;
use App\Models\Branch;

class BranchContextController extends Controller
{
    public function switchBranch(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|exists:branches,id'
        ]);

        $user = Auth::user();
        $branchId = $request->input('branch_id');

        // Ensure the branch belongs to the same tenant (unless super_admin)
        if ($user->role !== 'super_admin') {
            $branch = Branch::where('tenant_id', $user->tenant_id)->where('id', $branchId)->first();
            if (!$branch) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
        }

        Session::put('active_branch_id', $branchId);

        return response()->json(['success' => true]);
    }
}
