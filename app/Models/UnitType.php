<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UnitType extends Model
{
    protected $fillable = [
        'tenant_id',
        'name',
        'status',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function baseUnits()
    {
        return $this->hasMany(BaseUnit::class, 'unit_type_id');
    }

    public function uoms()
    {
        return $this->hasMany(Uom::class, 'unit_type_id');
    }
}
