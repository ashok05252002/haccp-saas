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
            if (!Schema::hasColumn('cooking_logs', 'status')) {
                $table->string('status')->default('COMPLETED')->after('signature');
            }
            if (!Schema::hasColumn('cooking_logs', 'final_signed_at')) {
                $table->timestamp('final_signed_at')->nullable()->after('status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cooking_logs', function (Blueprint $table) {
            if (Schema::hasColumn('cooking_logs', 'final_signed_at')) {
                $table->dropColumn('final_signed_at');
            }
            if (Schema::hasColumn('cooking_logs', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};
