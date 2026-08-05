<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class HotHoldingLog extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'log_date',
        'log_time',
        'holding_unit',
        'staff_name',
        'items',
        'general_comments',
        'signed_by_staff_name',
        'signature',
        'status',
    ];

    protected $casts = [
        'log_date' => 'date',
        'items' => 'array',
    ];
}
