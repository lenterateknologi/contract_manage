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
        Schema::create('t_contract_purchase_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('contract_id')->constrained('t_contracts')->cascadeOnDelete();
            $table->string('po_number');
            $table->string('title')->nullable();
            $table->date('po_date')->nullable();
            $table->decimal('amount', 18, 2)->nullable();
            $table->string('currency', 10)->default('IDR');
            $table->string('vendor_name')->nullable();
            $table->string('status')->default('active'); // active, cancelled, completed
            $table->text('description')->nullable();
            $table->string('file_path')->nullable();
            $table->string('created_by')->nullable();
            $table->string('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['contract_id', 'po_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_contract_purchase_orders');
    }
};
