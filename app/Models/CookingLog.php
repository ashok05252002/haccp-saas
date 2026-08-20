<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class CookingLog extends Model
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
        'cooking_temp',
        'cooking_target',
        'cooking_method',
        'time_finished_cooking',
        'cooking_passed',
        'chilling_method',
        'chilling_start_time',
        'chilling_end_time',
        'chilling_start_temp',
        'chilling_end_temp',
        'chilling_duration_minutes',
        'chilling_passed',
        'chilling_corrective_action',
        'chiller_location',
        'chiller_temp',
        'chiller_passed',
        'reheating_temp',
        'reheating_method',
        'reheating_passed',
        'hot_holding_location',
        'hot_holding_temp',
        'hot_holding_passed',
        'corrective_action',
        'notes',
        'signature',
    ];

    protected $casts = [
        'cooking_passed' => 'boolean',
        'chilling_passed' => 'boolean',
        'chiller_passed' => 'boolean',
        'reheating_passed' => 'boolean',
        'hot_holding_passed' => 'boolean',
        'cooking_temp' => 'float',
        'chilling_start_temp' => 'float',
        'chilling_end_temp' => 'float',
        'chiller_temp' => 'float',
        'reheating_temp' => 'float',
        'hot_holding_temp' => 'float',
    ];
}
