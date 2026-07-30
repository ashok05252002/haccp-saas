<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('temperature_equipments') && !Schema::hasTable('storage_zones')) {
            Schema::rename('temperature_equipments', 'storage_zones');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('storage_zones') && !Schema::hasTable('temperature_equipments')) {
            Schema::rename('storage_zones', 'temperature_equipments');
        }
    }
};
