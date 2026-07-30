<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class CleaningChecklistQuestion extends Model
{
    use BelongsToBranch;

    protected $fillable = [
        'branch_id',
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
