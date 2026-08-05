<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class BlastChillingLog extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'log_date',
        'log_time',
        'staff_name',
        'food_item',
        'batch_code',
        'probe_id',
        'chiller_location',
        'chilling_start_time',
        'chilling_end_time',
        'start_temp',
        'end_temp',
        'duration_minutes',
        'check_passed',
        'corrective_action',
        'notes',
        'signature',
    ];

    protected $casts = [
        'check_passed' => 'boolean',
        'start_temp' => 'float',
        'end_temp' => 'float',
        'duration_minutes' => 'integer',
    ];
}
