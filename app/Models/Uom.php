<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Uom extends Model
{
    protected $fillable = [
        'tenant_id',
        'unit_name',
        'unit_code',
        'unit_type_id',
        'base_unit_id',
        'conversion_factor',
        'decimal_allowed',
        'display_order',
        'status',
        'description',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'conversion_factor' => 'double',
        'decimal_allowed' => 'boolean',
        'display_order' => 'integer',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function unitType()
    {
        return $this->belongsTo(UnitType::class, 'unit_type_id');
    }

    public function baseUnit()
    {
        return $this->belongsTo(BaseUnit::class, 'base_unit_id');
    }
}
