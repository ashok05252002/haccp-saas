<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    protected $tables = [
        'unit_types',
        'base_units',
        'uoms',
        'ingredients',
        'ingredient_categories',
        'suppliers',
        'food_items',
        'storage_types',
        'storage_zones',
        'cleaning_areas',
        'cleaning_checklist_sections',
        'cleaning_checklist_questions',
        'thermometers',
        'health_declaration_sections',
        'health_declaration_questions'
    ];

    public function up(): void
    {
        foreach ($this->tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                if (!Schema::hasColumn($table->getTable(), 'branch_id')) {
                    $table->foreignId('branch_id')->nullable()->after('tenant_id')->constrained('branches')->onDelete('cascade');
                }
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                if (Schema::hasColumn($table->getTable(), 'branch_id')) {
                    $table->dropForeign(['branch_id']);
                    $table->dropColumn('branch_id');
                }
            });
        }
    }
};
