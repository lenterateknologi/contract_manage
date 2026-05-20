<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::table('form_templates', function (Blueprint $table) {
            $table->foreignUuid('contract_type_id')->nullable()->after('description')->constrained('contract_types')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('form_templates', function (Blueprint $table) {
            $table->dropForeign(['contract_type_id']);
            $table->dropColumn('contract_type_id');
        });
    }
};
