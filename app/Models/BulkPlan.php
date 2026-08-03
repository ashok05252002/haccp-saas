<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class BulkPlan extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'name',
        'planned_date',
        'status',
        'supplier_overrides',
    ];

    protected $casts = [
        'supplier_overrides' => 'array',
    ];

    public function recipes()
    {
        return $this->hasMany(BulkPlanRecipe::class, 'bulk_plan_id');
    }
}
