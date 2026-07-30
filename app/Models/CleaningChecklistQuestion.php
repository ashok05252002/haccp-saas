<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CleaningChecklistQuestion extends Model
{
    protected $fillable = [
        'tenant_id',
        'section_id',
        'question',
        'status',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function section()
    {
        return $this->belongsTo(CleaningChecklistSection::class, 'section_id');
    }
}
