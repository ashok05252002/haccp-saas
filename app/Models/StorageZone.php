<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class StorageZone extends Model
{
    use BelongsToBranch;

    protected $table = 'storage_zones';

    protected $fillable = [
        'branch_id',
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
