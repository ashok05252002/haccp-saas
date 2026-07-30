<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HealthDeclarationQuestion extends Model
{
    protected $fillable = [
        'tenant_id',
        'section_id',
        'question_text',
        'status',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function section()
    {
        return $this->belongsTo(HealthDeclarationSection::class, 'section_id');
    }
}
