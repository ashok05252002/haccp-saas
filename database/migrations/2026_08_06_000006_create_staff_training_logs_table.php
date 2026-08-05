<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_training_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('branch_id');
            $table->date('log_date');
            $table->string('log_time');
            $table->string('staff_name');
            $table->string('staff_position')->nullable();
            $table->unsignedBigInteger('task_id')->nullable();
            $table->string('task_title');
            $table->text('task_description')->nullable();
            $table->string('trainer_name');
            $table->boolean('understanding_confirmed')->default(true);
            $table->text('notes')->nullable();
            $table->string('signed_by_staff_name');
            $table->longText('signature')->nullable();
            $table->string('status')->default('Passed');
            $table->timestamps();

            $table->index(['tenant_id', 'branch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_training_logs');
    }
};
