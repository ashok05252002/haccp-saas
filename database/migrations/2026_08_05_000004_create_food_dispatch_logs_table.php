<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('food_dispatch_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('branch_id');

            // Log Metadata
            $table->date('log_date');
            $table->string('log_time');
            $table->string('staff_name');

            // Food & Dispatch Info
            $table->string('food_item');
            $table->string('food_category')->nullable();
            $table->string('storage_type')->nullable();
            $table->string('batch_code')->nullable();
            $table->string('destination');
            $table->date('use_by_date');

            // Temperature & Safety Checks
            $table->decimal('temperature', 5, 2);
            $table->boolean('temp_in_range')->default(true);
            $table->boolean('separation')->default(true);

            // Overall Status Evaluation
            $table->boolean('passed')->default(true);
            $table->string('status')->default('Passed');

            // Notes & Verification Signature
            $table->text('comments')->nullable();
            $table->longText('signature');

            $table->timestamps();

            $table->index(['tenant_id', 'branch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('food_dispatch_logs');
    }
};
