<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cooking_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('branch_id');
            
            // Step 1: Base & Food Details
            $table->date('log_date');
            $table->string('log_time');
            $table->string('staff_name')->nullable();
            $table->string('food_item');
            $table->string('batch_code')->nullable();
            $table->string('probe_id')->nullable();

            // Step 2: Cooking (CCP-3)
            $table->decimal('cooking_temp', 5, 2)->nullable();
            $table->string('cooking_target')->default('≥ 75°C');
            $table->string('cooking_method')->nullable();
            $table->boolean('cooking_passed')->default(true);

            // Step 3: Blast Chilling (CCP-4)
            $table->string('chilling_method')->nullable();
            $table->decimal('chilling_start_temp', 5, 2)->nullable();
            $table->decimal('chilling_end_temp', 5, 2)->nullable();
            $table->integer('chilling_duration_minutes')->nullable();
            $table->boolean('chilling_passed')->default(true);

            // Step 4: Chiller Hold
            $table->string('chiller_location')->nullable();
            $table->decimal('chiller_temp', 5, 2)->nullable();
            $table->boolean('chiller_passed')->default(true);

            // Step 5: Reheating
            $table->decimal('reheating_temp', 5, 2)->nullable();
            $table->string('reheating_method')->nullable();
            $table->boolean('reheating_passed')->default(true);

            // Step 6: Hot Holding (CCP-5)
            $table->string('hot_holding_location')->nullable();
            $table->decimal('hot_holding_temp', 5, 2)->nullable();
            $table->boolean('hot_holding_passed')->default(true);

            // General Notes & Verification
            $table->text('corrective_action')->nullable();
            $table->text('notes')->nullable();
            $table->longText('signature')->nullable();

            $table->timestamps();

            $table->index(['tenant_id', 'branch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cooking_logs');
    }
};
