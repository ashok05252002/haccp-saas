<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class PestControlLog extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'log_date',
        'log_time',
        'staff_name',
        'check_type',
        'checklist_answers',
        'pest_activity_observed',
        'pest_type',
        'location_found',
        'evidence_observed',
        'food_affected',
        'action_notes',
        'contractor_contacted',
        'contractor_name',
        'visit_date',
        'report_ref_number',
        'next_visit_due_date',
        'recommendations',
        'general_comments',
        'signed_by_staff_name',
        'signature',
        'status',
    ];

    protected $casts = [
        'log_date' => 'date',
        'visit_date' => 'date',
        'next_visit_due_date' => 'date',
        'checklist_answers' => 'array',
        'pest_activity_observed' => 'boolean',
        'food_affected' => 'boolean',
        'contractor_contacted' => 'boolean',
    ];
}
