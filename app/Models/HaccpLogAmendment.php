<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class HaccpLogAmendment extends Model
{
    use HasFactory, BelongsToBranch;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'log_type',
        'log_id',
        'amended_by_user_id',
        'amended_by_name',
        'manager_approved_by_id',
        'manager_approved_by_name',
        'reason',
        'original_data',
        'new_data',
        'changed_fields',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'original_data' => 'array',
        'new_data' => 'array',
        'changed_fields' => 'array',
    ];

    public function amendedBy()
    {
        return $this->belongsTo(User::class, 'amended_by_user_id');
    }

    public function managerApprovedBy()
    {
        return $this->belongsTo(User::class, 'manager_approved_by_id');
    }
}
