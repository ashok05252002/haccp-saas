<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('food_waste_logs', function (Blueprint $table) {
            $table->string('main_waste_type')->nullable()->after('quantity_summary');
            $table->string('main_source_stage')->nullable()->after('main_waste_type');
            $table->string('main_disposal_method')->nullable()->after('main_reason');
        });
    }

    public function down(): void
    {
        Schema::table('food_waste_logs', function (Blueprint $table) {
            $table->dropColumn(['main_waste_type', 'main_source_stage', 'main_disposal_method']);
        });
    }
};
