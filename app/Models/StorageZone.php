<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StorageZone extends Model
{
    protected $table = 'storage_zones';

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
