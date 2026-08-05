<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $defaultQuestions = [
            'Are premises protected against pests and free from signs of pest activity?',
            'Are external doors and windows protected where required?',
            'Are insect-control units or pest-control devices maintained properly?',
            'Is food protected from possible pest contamination?',
            'Are pest sightings or pest-control contractor visits recorded?',
            'Are doors kept closed or protected to reduce pest entry?',
            'Are waste areas kept clean and covered?',
            'Are drains, gaps, and wall/floor junctions in good condition?',
            'Are dry goods stored off the floor and in sealed containers?',
        ];

        DB::table('pest_control_questions')
            ->whereIn('question_text', $defaultQuestions)
            ->delete();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op
    }
};
