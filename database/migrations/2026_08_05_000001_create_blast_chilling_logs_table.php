<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blast_chilling_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('branch_id');

            // Log Header & Metadata
            $table->date('log_date');
            $table->string('log_time');
            $table->string('staff_name')->nullable();
            $table->string('food_item');
            $table->string('batch_code')->nullable();
            $table->string('probe_id')->nullable();

            // Chilling Execution Parameters (CCP-4)
            $table->string('chiller_location')->nullable();
            $table->string('chilling_start_time')->nullable();
            $table->string('chilling_end_time')->nullable();
            $table->decimal('start_temp', 5, 2)->nullable();
            $table->decimal('end_temp', 5, 2)->nullable();
            $table->integer('duration_minutes')->nullable();
            $table->boolean('check_passed')->default(true);

            // Verification & Action
            $table->text('corrective_action')->nullable();
            $table->text('notes')->nullable();
            $table->longText('signature')->nullable();

            $table->timestamps();

            $table->index(['tenant_id', 'branch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blast_chilling_logs');
    }
};
