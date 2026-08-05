<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('thawing_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('branch_id');
            $table->date('log_date');
            $table->string('log_time');
            $table->string('food_item_name');
            $table->string('defrost_method');
            $table->string('storage_location')->nullable();
            $table->date('start_date');
            $table->string('start_time');
            $table->date('completed_date');
            $table->string('completed_time');
            $table->decimal('defrost_temp', 4, 1);
            $table->text('comments')->nullable();
            $table->string('signed_by_staff_name');
            $table->longText('signature')->nullable();
            $table->string('status')->default('Passed');
            $table->timestamps();

            $table->index(['tenant_id', 'branch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('thawing_logs');
    }
};
