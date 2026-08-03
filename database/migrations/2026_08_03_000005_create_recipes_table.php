<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recipes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('branch_id');
            $table->string('name');
            $table->string('category')->default('Lunch');
            $table->string('prep_time')->nullable();
            $table->integer('servings')->default(1);
            $table->text('description')->nullable();
            $table->text('haccp_notes')->nullable();
            $table->json('allergens')->nullable();
            $table->string('status')->default('Active');
            $table->timestamps();

            $table->index(['tenant_id', 'branch_id']);
        });

        Schema::create('recipe_ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained('recipes')->onDelete('cascade');
            $table->unsignedBigInteger('ingredient_id')->nullable();
            $table->string('ingredient_name');
            $table->decimal('quantity', 10, 2)->default(0);
            $table->string('unit')->default('grams');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recipe_ingredients');
        Schema::dropIfExists('recipes');
    }
};
