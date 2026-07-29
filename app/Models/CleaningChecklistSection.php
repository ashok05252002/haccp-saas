<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CleaningChecklistSection extends Model
{
    protected $fillable = [
        'tenant_id',
        'title',
        'description',
        'frequency',
        'status',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function questions()
    {
        return $this->hasMany(CleaningChecklistQuestion::class, 'section_id');
    }
}
