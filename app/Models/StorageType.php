<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StorageType extends Model
{
    protected $fillable = [
        'tenant_id',
        'name',
        'temperature_required',
        'min_temp',
        'max_temp',
        'rule_text',
        'status',
    ];

    protected $casts = [
        'temperature_required' => 'boolean',
        'min_temp' => 'float',
        'max_temp' => 'float',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function foodItems()
    {
        return $this->hasMany(FoodItem::class);
    }
}
