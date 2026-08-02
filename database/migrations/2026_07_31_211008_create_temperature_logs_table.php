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
        Schema::create('temperature_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->date('log_date');
            $table->time('log_time');
            $table->string('staff_name')->nullable();
            $table->foreignId('thermometer_id')->nullable()->constrained('thermometers')->nullOnDelete();
            $table->foreignId('storage_zone_id')->constrained('storage_zones')->cascadeOnDelete();
            $table->decimal('temperature', 5, 2);
            $table->boolean('is_valid')->default(true);
            $table->string('comment')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('temperature_logs');
    }
};
