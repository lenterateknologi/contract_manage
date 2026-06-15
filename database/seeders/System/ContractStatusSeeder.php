<?php

namespace Database\Seeders\System;

use App\Models\ContractStatus;
use Illuminate\Database\Seeder;

class ContractStatusSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = [
            ['code' => 'draft', 'label' => 'Draft', 'color' => '#64748b', 'is_active' => true],
            ['code' => 'pending', 'label' => 'Pending Approval', 'color' => '#f59e0b', 'is_active' => true],
            ['code' => 'in_review', 'label' => 'In Review', 'color' => '#3b82f6', 'is_active' => true],
            ['code' => 'revision', 'label' => 'Need Revision', 'color' => '#ef4444', 'is_active' => true],
            ['code' => 'approved', 'label' => 'Approved', 'color' => '#10b981', 'is_active' => true],
            ['code' => 'rejected', 'label' => 'Rejected', 'color' => '#ef4444', 'is_active' => true],
            ['code' => 'signed', 'label' => 'Signed', 'color' => '#8b5cf6', 'is_active' => true],
            ['code' => 'completed', 'label' => 'Completed', 'color' => '#059669', 'is_active' => true],
            ['code' => 'expired', 'label' => 'Expired', 'color' => '#94a3b8', 'is_active' => true],
            ['code' => 'archived', 'label' => 'Archived', 'color' => '#475569', 'is_active' => true],
        ];

        foreach ($statuses as $status) {
            ContractStatus::updateOrCreate(['code' => $status['code']], $status);
        }
    }
}
