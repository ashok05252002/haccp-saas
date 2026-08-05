<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class FryerOilLog extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'log_date',
        'log_time',
        'staff_name',
        'fryer_station',
        'frying_temp',
        'oil_condition',
        'oil_quality_acceptable',
        'oil_action_taken',
        'quantity_removed',
        'step1_comments',
        'disposal_type',
        'grease_area',
        'disposal_quantity',
        'disposal_method',
        'waste_contractor',
        'collection_ref_number',
        'next_cleaning_due_date',
        'step2_comments',
        'signed_by_staff_name',
        'signature',
        'status',
    ];

    protected $casts = [
        'log_date' => 'date',
        'next_cleaning_due_date' => 'date',
        'frying_temp' => 'float',
        'quantity_removed' => 'float',
        'disposal_quantity' => 'float',
        'oil_quality_acceptable' => 'boolean',
    ];
}
