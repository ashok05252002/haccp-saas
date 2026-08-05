<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class FoodDispatchLog extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'log_date',
        'log_time',
        'staff_name',
        'food_item',
        'food_category',
        'storage_type',
        'batch_code',
        'destination',
        'use_by_date',
        'temperature',
        'temp_in_range',
        'separation',
        'passed',
        'status',
        'comments',
        'signature',
    ];

    protected $casts = [
        'passed' => 'boolean',
        'temp_in_range' => 'boolean',
        'separation' => 'boolean',
        'temperature' => 'float',
    ];
}
