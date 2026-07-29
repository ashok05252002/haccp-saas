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
        Schema::create('unit_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('status')->default('Active');
            $table->timestamps();
            $table->unique(['tenant_id', 'name']);
        });

        Schema::create('base_units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('code');
            $table->foreignId('unit_type_id')->constrained('unit_types')->onDelete('cascade');
            $table->string('status')->default('Active');
            $table->timestamps();
            $table->unique(['tenant_id', 'code']);
            $table->unique(['tenant_id', 'name']);
        });

        Schema::create('uoms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->string('unit_name');
            $table->string('unit_code');
            $table->foreignId('unit_type_id')->constrained('unit_types')->onDelete('cascade');
            $table->foreignId('base_unit_id')->constrained('base_units')->onDelete('cascade');
            
            $table->decimal('conversion_factor', 18, 6)->default(1.000000);
            $table->boolean('decimal_allowed')->default(true);
            $table->integer('display_order')->default(0);
            $table->string('status')->default('Active');
            $table->text('description')->nullable();
            
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->unique(['tenant_id', 'unit_code']);
            $table->unique(['tenant_id', 'unit_name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('uoms');
        Schema::dropIfExists('base_units');
        Schema::dropIfExists('unit_types');
    }
};
