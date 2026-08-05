<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class StaffTrainingLog extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'log_date',
        'log_time',
        'staff_name',
        'staff_position',
        'task_id',
        'task_title',
        'task_description',
        'trainer_name',
        'understanding_confirmed',
        'notes',
        'signed_by_staff_name',
        'signature',
        'status',
    ];

    protected $casts = [
        'log_date' => 'date',
        'understanding_confirmed' => 'boolean',
    ];
}
