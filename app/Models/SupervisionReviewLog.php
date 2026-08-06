<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class SupervisionReviewLog extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'review_date',
        'review_mode',
        'reviewer_name',
        'reviewer_role',
        'haccp_completed_count',
        'haccp_total_count',
        'cleaning_completed_count',
        'cleaning_total_count',
        'flagged_items_count',
        'haccp_last_logged_at',
        'weekly_cleaning_completed_at',
        'compliance_status',
        'supervisor_comments',
        'corrective_actions_taken',
        'signature',
        'verified_at',
    ];

    protected $casts = [
        'review_date' => 'date',
        'haccp_last_logged_at' => 'datetime',
        'weekly_cleaning_completed_at' => 'datetime',
        'verified_at' => 'datetime',
    ];
}
