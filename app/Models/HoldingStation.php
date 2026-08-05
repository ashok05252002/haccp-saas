<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class HoldingStation extends Model
{
    use BelongsToBranch;

    protected $table = 'holding_stations';

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
