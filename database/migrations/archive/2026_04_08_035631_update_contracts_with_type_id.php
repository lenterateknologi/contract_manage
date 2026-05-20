<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->foreignUuid('contract_type_id')->nullable()->after('contract_date')->constrained('contract_types')->nullOnDelete();
            $table->dropColumn('contract_type');
        });
    }

    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->string('contract_type')->nullable()->after('contract_date');
            $table->dropForeign(['contract_type_id']);
            $table->dropColumn('contract_type_id');
        });
    }
};
