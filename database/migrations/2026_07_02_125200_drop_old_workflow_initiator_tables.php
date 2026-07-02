<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('m_workflow_initiator_roles');
        Schema::dropIfExists('m_workflow_initiator_departments');
        Schema::dropIfExists('m_workflow_initiator_users');
    }

    public function down(): void
    {
        // No rollback for dropping tables in this refactoring step since data will be seeded/recreated.
    }
};
