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
        // 1. Drop unused pivot tables safely if they exist
        Schema::dropIfExists('training_task_roles');
        Schema::dropIfExists('training_task_users');

        // 2. Add role_ids and user_ids JSON columns to training_tasks table
        Schema::table('training_tasks', function (Blueprint $table) {
            if (!Schema::hasColumn('training_tasks', 'role_ids')) {
                $table->json('role_ids')->nullable()->after('applies_to');
            }
            if (!Schema::hasColumn('training_tasks', 'user_ids')) {
                $table->json('user_ids')->nullable()->after('role_ids');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('training_tasks', function (Blueprint $table) {
            if (Schema::hasColumn('training_tasks', 'user_ids')) {
                $table->dropColumn('user_ids');
            }
            if (Schema::hasColumn('training_tasks', 'role_ids')) {
                $table->dropColumn('role_ids');
            }
        });
    }
};
