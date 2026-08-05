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
        Schema::table('cooking_logs', function (Blueprint $table) {
            $table->string('chilling_start_time')->nullable()->after('chilling_method');
            $table->string('chilling_end_time')->nullable()->after('chilling_start_time');
            $table->text('chilling_corrective_action')->nullable()->after('chilling_passed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cooking_logs', function (Blueprint $table) {
            $table->dropColumn(['chilling_start_time', 'chilling_end_time', 'chilling_corrective_action']);
        });
    }
};
