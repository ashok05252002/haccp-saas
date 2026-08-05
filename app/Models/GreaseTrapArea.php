<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class GreaseTrapArea extends Model
{
    use BelongsToBranch;

    protected $table = 'grease_trap_areas';

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'name',
        'status',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
