<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class FoodWasteLog extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'log_date',
        'log_time',
        'staff_name',
        'items',
        'total_entries',
        'quantity_summary',
        'main_reason',
        'total_cost_impact',
        'general_comments',
        'prevention_action',
        'signed_by_staff_name',
        'signature',
        'status',
    ];

    protected $casts = [
        'log_date' => 'date',
        'items' => 'array',
        'total_cost_impact' => 'decimal:2',
    ];
}
