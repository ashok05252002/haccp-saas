<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Safely update any section frequency records with old values to 'Monthly'
        DB::table('cleaning_checklist_sections')
            ->whereIn('frequency', ['Quarterly', 'As Needed', '4-Weekly', 'Custom'])
            ->update(['frequency' => 'Monthly']);

        // 2. Drop frequency column from cleaning_checklist_questions table if present
        if (Schema::hasColumn('cleaning_checklist_questions', 'frequency')) {
            Schema::table('cleaning_checklist_questions', function (Blueprint $table) {
                $table->dropColumn('frequency');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasColumn('cleaning_checklist_questions', 'frequency')) {
            Schema::table('cleaning_checklist_questions', function (Blueprint $table) {
                $table->string('frequency')->nullable();
            });
        }
    }
};
