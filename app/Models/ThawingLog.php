<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class ThawingLog extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'log_date',
        'log_time',
        'food_item_name',
        'defrost_method',
        'storage_location',
        'start_date',
        'start_time',
        'completed_date',
        'completed_time',
        'defrost_temp',
        'comments',
        'signed_by_staff_name',
        'signature',
        'status',
    ];

    protected $casts = [
        'log_date' => 'date',
        'start_date' => 'date',
        'completed_date' => 'date',
        'defrost_temp' => 'float',
    ];
}
