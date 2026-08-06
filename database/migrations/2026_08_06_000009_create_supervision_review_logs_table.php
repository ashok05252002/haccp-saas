<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supervision_review_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable();
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->date('review_date');
            $table->string('review_mode')->default('daily');
            $table->string('reviewer_name');
            $table->string('reviewer_role');
            $table->integer('haccp_completed_count')->default(0);
            $table->integer('haccp_total_count')->default(0);
            $table->integer('cleaning_completed_count')->default(0);
            $table->integer('cleaning_total_count')->default(0);
            $table->integer('flagged_items_count')->default(0);
            $table->timestamp('haccp_last_logged_at')->nullable();
            $table->timestamp('weekly_cleaning_completed_at')->nullable();
            $table->string('compliance_status')->default('passed');
            $table->text('supervisor_comments')->nullable();
            $table->text('corrective_actions_taken')->nullable();
            $table->longText('signature')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'branch_id']);
            $table->index('review_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supervision_review_logs');
    }
};
