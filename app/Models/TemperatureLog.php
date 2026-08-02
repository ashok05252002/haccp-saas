<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Models\Traits\BelongsToBranch;

class TemperatureLog extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'log_date',
        'log_time',
        'staff_name',
        'thermometer_id',
        'storage_zone_id',
        'temperature',
        'is_valid',
        'comment',
        'signature',
    ];

    protected $casts = [
        'log_date' => 'date:Y-m-d',
        'is_valid' => 'boolean',
        'temperature' => 'decimal:2',
    ];

    public function thermometer()
    {
        return $this->belongsTo(Thermometer::class);
    }

    public function storageZone()
    {
        return $this->belongsTo(StorageZone::class);
    }
}
