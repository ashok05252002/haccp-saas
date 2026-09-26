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
        Schema::table('food_items', function (Blueprint $table) {
            $table->decimal('cost_price', 10, 2)->nullable()->after('storage_type_id');
            $table->decimal('cost_quantity', 10, 2)->nullable()->after('cost_price');
            $table->decimal('unit_cost', 10, 4)->nullable()->after('cost_quantity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('food_items', function (Blueprint $table) {
            $table->dropColumn(['cost_price', 'cost_quantity', 'unit_cost']);
        });
    }
};
