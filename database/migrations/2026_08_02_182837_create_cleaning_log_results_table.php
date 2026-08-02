<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cleaning_log_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cleaning_log_id')->constrained('cleaning_logs')->cascadeOnDelete();
            $table->foreignId('question_id')->constrained('cleaning_checklist_questions')->cascadeOnDelete();
            $table->enum('result', ['Yes', 'No', 'N/A']);
            $table->text('comment')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cleaning_log_results');
    }
};
