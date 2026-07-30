<?php

namespace App\Models\Traits;

use App\Models\Scopes\BranchScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use App\Models\Branch;

trait BelongsToBranch
{
    protected static function bootBelongsToBranch()
    {
        static::addGlobalScope(new BranchScope);

        static::creating(function ($model) {
            if (Auth::check()) {
                $user = Auth::user();
                $branchId = $user->branch_id ?? Session::get('active_branch_id');
                
                if ($branchId && empty($model->branch_id)) {
                    $model->branch_id = $branchId;
                }
            }
        });
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
