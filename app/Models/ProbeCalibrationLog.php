<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class ProbeCalibrationLog extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'log_date',
        'log_time',
        'staff_name',
        'probe_id',
        'probe_name',
        'probe_serial_number',
        'boiling_temp',
        'boiling_valid',
        'ice_temp',
        'ice_valid',
        'passed',
        'status',
        'comments',
        'signature',
    ];

    protected $casts = [
        'passed' => 'boolean',
        'boiling_valid' => 'boolean',
        'ice_valid' => 'boolean',
        'boiling_temp' => 'float',
        'ice_temp' => 'float',
    ];
}
