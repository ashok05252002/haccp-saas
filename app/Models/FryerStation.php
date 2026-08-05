<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class FryerStation extends Model
{
    use BelongsToBranch;

    protected $table = 'fryer_stations';

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
