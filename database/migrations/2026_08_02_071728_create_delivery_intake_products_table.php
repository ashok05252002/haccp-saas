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
        Schema::create('delivery_intake_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('delivery_intake_log_id')->constrained('delivery_intake_logs')->cascadeOnDelete();
            $table->foreignId('food_item_id')->constrained('food_items')->cascadeOnDelete();
            $table->string('batch_number')->nullable();
            $table->date('use_by_date')->nullable();
            $table->string('quantity')->nullable();
            $table->decimal('temperature', 5, 2)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('delivery_intake_products');
    }
};
