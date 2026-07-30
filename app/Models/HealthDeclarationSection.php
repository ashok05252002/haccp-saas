<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HealthDeclarationSection extends Model
{
    protected $fillable = [
        'tenant_id',
        'title',
        'status',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function questions()
    {
        return $this->hasMany(HealthDeclarationQuestion::class, 'section_id');
    }
}
