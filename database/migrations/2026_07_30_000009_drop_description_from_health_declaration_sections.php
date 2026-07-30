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
        if (Schema::hasColumn('health_declaration_sections', 'description')) {
            Schema::table('health_declaration_sections', function (Blueprint $table) {
                $table->dropColumn('description');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasColumn('health_declaration_sections', 'description')) {
            Schema::table('health_declaration_sections', function (Blueprint $table) {
                $table->text('description')->nullable();
            });
        }
    }
};
