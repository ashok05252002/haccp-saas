<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class CleaningLog extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'log_date',
        'log_time',
        'staff_name',
        'cleaning_area_id',
        'comment',
        'signature',
    ];

    protected $casts = [
        'log_date' => 'date:Y-m-d',
        'log_time' => 'string',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function area()
    {
        return $this->belongsTo(CleaningArea::class, 'cleaning_area_id');
    }

    public function results()
    {
        return $this->hasMany(CleaningLogResult::class);
    }
}
