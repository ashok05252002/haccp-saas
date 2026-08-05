<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fryer_oil_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('branch_id');
            $table->date('log_date');
            $table->string('log_time');
            $table->string('staff_name');

            // Step 1: Fryer Oil Check
            $table->string('fryer_station');
            $table->decimal('frying_temp', 5, 2);
            $table->string('oil_condition');
            $table->boolean('oil_quality_acceptable')->default(true);
            $table->string('oil_action_taken');
            $table->decimal('quantity_removed', 8, 2)->nullable();
            $table->text('step1_comments')->nullable();

            // Step 2: Grease / Used Oil Disposal Record
            $table->string('disposal_type');
            $table->string('grease_area');
            $table->decimal('disposal_quantity', 8, 2)->nullable();
            $table->string('disposal_method');
            $table->string('waste_contractor')->nullable();
            $table->string('collection_ref_number')->nullable();
            $table->date('next_cleaning_due_date')->nullable();
            $table->text('step2_comments')->nullable();

            // Verification & Status
            $table->string('signed_by_staff_name');
            $table->longText('signature')->nullable();
            $table->string('status')->default('Passed');
            $table->timestamps();

            $table->index(['tenant_id', 'branch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fryer_oil_logs');
    }
};
