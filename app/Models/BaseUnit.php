<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BaseUnit extends Model
{
    protected $fillable = [
        'tenant_id',
        'name',
        'code',
        'unit_type_id',
        'status',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function unitType()
    {
        return $this->belongsTo(UnitType::class, 'unit_type_id');
    }

    public function uoms()
    {
        return $this->hasMany(Uom::class, 'base_unit_id');
    }
}
