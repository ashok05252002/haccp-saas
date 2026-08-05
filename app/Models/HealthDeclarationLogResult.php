<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HealthDeclarationLogResult extends Model
{
    protected $fillable = [
        'health_declaration_log_id',
        'question_id',
        'answer',
        'notes',
    ];

    public function log()
    {
        return $this->belongsTo(HealthDeclarationLog::class, 'health_declaration_log_id');
    }

    public function question()
    {
        return $this->belongsTo(HealthDeclarationQuestion::class, 'question_id');
    }
}
