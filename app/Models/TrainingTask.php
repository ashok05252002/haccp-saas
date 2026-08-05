<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToBranch;

class TrainingTask extends Model
{
    use BelongsToBranch;

    protected $table = 'training_tasks';

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'title',
        'description',
        'frequency',
        'applies_to',
        'status',
        'role_ids',
        'user_ids',
    ];

    protected $casts = [
        'role_ids' => 'array',
        'user_ids' => 'array',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
