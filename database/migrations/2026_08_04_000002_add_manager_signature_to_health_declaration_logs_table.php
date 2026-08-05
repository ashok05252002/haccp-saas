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
        Schema::table('health_declaration_logs', function (Blueprint $table) {
            $table->longText('manager_signature')->nullable()->after('signature');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('health_declaration_logs', function (Blueprint $table) {
            $table->dropColumn('manager_signature');
        });
    }
};
