<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CleaningLogResult extends Model
{
    protected $fillable = [
        'cleaning_log_id',
        'question_id',
        'result',
        'comment',
    ];

    public function log()
    {
        return $this->belongsTo(CleaningLog::class, 'cleaning_log_id');
    }

    public function question()
    {
        return $this->belongsTo(CleaningChecklistQuestion::class, 'question_id');
    }
}
