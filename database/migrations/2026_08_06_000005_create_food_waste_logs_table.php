<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('food_waste_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('branch_id');
            $table->date('log_date');
            $table->string('log_time');
            $table->string('staff_name');
            $table->json('items');
            $table->integer('total_entries')->default(0);
            $table->string('quantity_summary')->nullable();
            $table->string('main_reason')->nullable();
            $table->decimal('total_cost_impact', 10, 2)->default(0.00);
            $table->text('general_comments')->nullable();
            $table->text('prevention_action')->nullable();
            $table->string('signed_by_staff_name');
            $table->longText('signature')->nullable();
            $table->string('status')->default('Passed');
            $table->timestamps();

            $table->index(['tenant_id', 'branch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('food_waste_logs');
    }
};
