<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class CleaningArea extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'branch_id',
        'tenant_id',
        'name',
        'frequency',
        'description',
        'status',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
