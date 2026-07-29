<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CleaningArea extends Model
{
    protected $fillable = [
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
