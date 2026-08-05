<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class PestControlQuestion extends Model
{
    use BelongsToBranch;

    protected $table = 'pest_control_questions';

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'question_text',
        'status',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
