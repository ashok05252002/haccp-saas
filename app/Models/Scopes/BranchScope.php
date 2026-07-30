<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;

class BranchScope implements Scope
{
    public function apply(Builder $builder, Model $model)
    {
        if (Auth::check()) {
            $user = Auth::user();
            
            // Super admins skip branch scoping unless specifically querying
            if ($user->role === 'super_admin') {
                return;
            }

            $activeBranchId = Session::get('active_branch_id');

            // If user has a hardcoded branch_id (e.g., Staff), force it.
            if ($user->branch_id) {
                $activeBranchId = $user->branch_id;
            }

            if ($activeBranchId) {
                $builder->where($model->getTable() . '.branch_id', $activeBranchId);
            }
        }
    }
}
