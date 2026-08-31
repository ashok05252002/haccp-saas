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
        Schema::create('haccp_log_amendments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('branch_id');
            $table->string('log_type');
            $table->unsignedBigInteger('log_id');
            $table->unsignedBigInteger('amended_by_user_id')->nullable();
            $table->string('amended_by_name')->nullable();
            $table->unsignedBigInteger('manager_approved_by_id')->nullable();
            $table->string('manager_approved_by_name')->nullable();
            $table->text('reason');
            $table->json('original_data');
            $table->json('new_data');
            $table->json('changed_fields')->nullable();
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'branch_id', 'log_type', 'log_id'], 'hla_composite_idx');
            $table->index(['log_type', 'log_id'], 'hla_type_id_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('haccp_log_amendments');
    }
};
