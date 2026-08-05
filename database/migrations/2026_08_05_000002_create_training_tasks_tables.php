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
        Schema::create('training_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('frequency'); // One Time, Daily, Weekly, Monthly, Yearly
            $table->string('applies_to'); // All Staff, By Position, By Staff
            $table->string('status')->default('Active');
            $table->timestamps();
        });

        Schema::create('training_task_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('training_task_id')->constrained('training_tasks')->onDelete('cascade');
            $table->foreignId('role_id')->constrained('roles')->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('training_task_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('training_task_id')->constrained('training_tasks')->onDelete('cascade');
            $table->foreignId('restaurant_user_id')->constrained('restaurant_users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('training_task_users');
        Schema::dropIfExists('training_task_roles');
        Schema::dropIfExists('training_tasks');
    }
};
