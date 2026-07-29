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
        // Pivot table for multi-select ingredient categories per supplier
        Schema::create('supplier_ingredient_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained('suppliers')->onDelete('cascade');
            $table->foreignId('ingredient_category_id')->constrained('ingredient_categories')->onDelete('cascade');
            $table->timestamps();
        });

        // Pivot table for assigned ingredients per supplier
        Schema::create('supplier_ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained('suppliers')->onDelete('cascade');
            $table->foreignId('ingredient_id')->constrained('ingredients')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supplier_ingredients');
        Schema::dropIfExists('supplier_ingredient_categories');
    }
};
