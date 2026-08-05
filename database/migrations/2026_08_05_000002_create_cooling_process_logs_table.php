<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cooling_process_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('branch_id');

            // Log Header & Product Details
            $table->string('food_item');
            $table->string('cooling_method')->nullable();
            $table->string('storage_location')->nullable();

            // Timing & Temperatures
            $table->date('log_date'); // Default / End Date for indexing
            $table->string('log_time');
            $table->date('start_date')->nullable();
            $table->string('start_time')->nullable();
            $table->date('end_date')->nullable();
            $table->string('end_time')->nullable();
            $table->decimal('start_temp', 5, 2)->nullable();
            $table->decimal('end_temp', 5, 2)->nullable();
            $table->integer('duration_minutes')->nullable();
            $table->boolean('check_passed')->default(true);

            // Verification & Action
            $table->text('comments')->nullable();
            $table->string('staff_name')->nullable();
            $table->longText('signature')->nullable();

            $table->timestamps();

            $table->index(['tenant_id', 'branch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cooling_process_logs');
    }
};
