<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('probe_calibration_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('branch_id');

            // Log Metadata
            $table->date('log_date');
            $table->string('log_time');
            $table->string('staff_name');

            // Probe Information
            $table->string('probe_id')->nullable();
            $table->string('probe_name');
            $table->string('probe_serial_number')->nullable();

            // Calibration Test Readings & Validation
            $table->decimal('boiling_temp', 5, 2)->nullable();
            $table->boolean('boiling_valid')->default(true);
            $table->decimal('ice_temp', 5, 2)->nullable();
            $table->boolean('ice_valid')->default(true);

            // Overall Status
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
        Schema::dropIfExists('probe_calibration_logs');
    }
};
