<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class HealthDeclarationLog extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'log_date',
        'log_time',
        'staff_name',
        'overall_status',
        'symptoms_reported',
        'comment',
        'signature',
        'manager_signature',
    ];

    protected $casts = [
        'log_date'          => 'date:Y-m-d',
        'log_time'          => 'string',
        'symptoms_reported' => 'boolean',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function results()
    {
        return $this->hasMany(HealthDeclarationLogResult::class);
    }
}
