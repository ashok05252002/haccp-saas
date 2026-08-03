<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bulk_plans', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('branch_id');
            $table->string('name');
            $table->date('planned_date')->nullable();
            $table->string('status')->default('draft');
            $table->json('supplier_overrides')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'branch_id']);
        });

        Schema::create('bulk_plan_recipes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bulk_plan_id')->constrained('bulk_plans')->onDelete('cascade');
            $table->unsignedBigInteger('recipe_id')->nullable();
            $table->string('recipe_name');
            $table->integer('base_servings')->default(1);
            $table->integer('target_servings')->default(10);
            $table->boolean('extra_buffer')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bulk_plan_recipes');
        Schema::dropIfExists('bulk_plans');
    }
};
