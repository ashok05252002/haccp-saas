<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pest_control_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('branch_id');
            $table->date('log_date');
            $table->string('log_time');
            $table->string('staff_name');
            $table->string('check_type');
            $table->json('checklist_answers')->nullable();

            // Pest Activity Details
            $table->boolean('pest_activity_observed')->default(false);
            $table->string('pest_type')->nullable();
            $table->string('location_found')->nullable();
            $table->string('evidence_observed')->nullable();
            $table->boolean('food_affected')->default(false);
            $table->text('action_notes')->nullable();
            $table->boolean('contractor_contacted')->default(false);

            // Contractor Visit Details
            $table->string('contractor_name')->nullable();
            $table->date('visit_date')->nullable();
            $table->string('report_ref_number')->nullable();
            $table->date('next_visit_due_date')->nullable();
            $table->text('recommendations')->nullable();

            // Verification & Status
            $table->text('general_comments')->nullable();
            $table->string('signed_by_staff_name');
            $table->longText('signature')->nullable();
            $table->string('status')->default('Passed');
            $table->timestamps();

            $table->index(['tenant_id', 'branch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pest_control_logs');
    }
};
