<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Thermometer extends Model
{
    protected $fillable = [
        'tenant_id',
        'name',
        'serial_number',
        'status',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
