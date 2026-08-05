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
        Schema::create('health_declaration_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->date('log_date');
            $table->time('log_time');
            $table->string('staff_name')->nullable();
            $table->string('overall_status')->default('Fit for Work');
            $table->boolean('symptoms_reported')->default(false);
            $table->text('comment')->nullable();
            $table->longText('signature')->nullable();
            $table->timestamps();
        });

        Schema::create('health_declaration_log_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('health_declaration_log_id')->constrained('health_declaration_logs')->cascadeOnDelete();
            $table->foreignId('question_id')->constrained('health_declaration_questions')->cascadeOnDelete();
            $table->string('answer')->default('No');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('health_declaration_log_results');
        Schema::dropIfExists('health_declaration_logs');
    }
};
