<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TemperatureEquipment extends Model
{
    protected $table = 'temperature_equipments';

    protected $fillable = [
        'tenant_id',
        'name',
        'type',
        'min_temp',
        'max_temp',
        'rule_text',
        'status',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
