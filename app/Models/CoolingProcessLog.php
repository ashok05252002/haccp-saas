<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class CoolingProcessLog extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'log_date',
        'log_time',
        'food_item',
        'cooling_method',
        'storage_location',
        'start_date',
        'start_time',
        'end_date',
        'end_time',
        'start_temp',
        'end_temp',
        'duration_minutes',
        'check_passed',
        'comments',
        'staff_name',
        'signature',
    ];

    protected $casts = [
        'check_passed' => 'boolean',
        'start_temp' => 'float',
        'end_temp' => 'float',
        'duration_minutes' => 'integer',
    ];
}
