<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FoodItem extends Model
{
    protected $fillable = [
        'tenant_id',
        'name',
        'uom_id',
        'storage_type_id',
        'status',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function uom()
    {
        return $this->belongsTo(Uom::class, 'uom_id');
    }

    public function storageType()
    {
        return $this->belongsTo(StorageType::class, 'storage_type_id');
    }
}
