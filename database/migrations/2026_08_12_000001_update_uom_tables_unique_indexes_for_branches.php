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
        // 1. Update unit_types table
        Schema::table('unit_types', function (Blueprint $table) {
            $table->unique(['tenant_id', 'branch_id', 'name']);
            $table->dropUnique(['tenant_id', 'name']);
        });

        // 2. Update base_units table
        Schema::table('base_units', function (Blueprint $table) {
            $table->unique(['tenant_id', 'branch_id', 'code']);
            $table->unique(['tenant_id', 'branch_id', 'name']);
            $table->dropUnique(['tenant_id', 'code']);
            $table->dropUnique(['tenant_id', 'name']);
        });

        // 3. Update uoms table
        Schema::table('uoms', function (Blueprint $table) {
            $table->unique(['tenant_id', 'branch_id', 'unit_code']);
            $table->unique(['tenant_id', 'branch_id', 'unit_name']);
            $table->dropUnique(['tenant_id', 'unit_code']);
            $table->dropUnique(['tenant_id', 'unit_name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('uoms', function (Blueprint $table) {
            $table->unique(['tenant_id', 'unit_code']);
            $table->unique(['tenant_id', 'unit_name']);
            $table->dropUnique(['tenant_id', 'branch_id', 'unit_code']);
            $table->dropUnique(['tenant_id', 'branch_id', 'unit_name']);
        });

        Schema::table('base_units', function (Blueprint $table) {
            $table->unique(['tenant_id', 'code']);
            $table->unique(['tenant_id', 'name']);
            $table->dropUnique(['tenant_id', 'branch_id', 'code']);
            $table->dropUnique(['tenant_id', 'branch_id', 'name']);
        });

        Schema::table('unit_types', function (Blueprint $table) {
            $table->unique(['tenant_id', 'name']);
            $table->dropUnique(['tenant_id', 'branch_id', 'name']);
        });
    }
};
