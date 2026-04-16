<?php

namespace Database\Seeders;

use App\Models\ContractStatus;
use Illuminate\Database\Seeder;

class ContractStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $statuses = [
            [
                'code' => 'draft',
                'name' => 'Draft',
                'color' => '#64748b',
                'bg_color' => '#f1f5f9',
                'icon' => 'file-text',
                'description' => 'Kontrak baru yang masih dalam tahap awal.',
                'sort_order' => 1,
            ],
            [
                'code' => 'in_review',
                'name' => 'Dalam Review',
                'color' => '#3b82f6',
                'bg_color' => '#eff6ff',
                'icon' => 'clock',
                'description' => 'Kontrak sedang dalam proses persetujuan (approval).',
                'sort_order' => 2,
            ],
            [
                'code' => 'revision',
                'name' => 'Revisi',
                'color' => '#f59e0b',
                'bg_color' => '#fffbeb',
                'icon' => 'edit-3',
                'description' => 'Kontrak dikembalikan untuk perbaikan.',
                'sort_order' => 3,
            ],
            [
                'code' => 'approved',
                'name' => 'Disetujui',
                'color' => '#10b981',
                'bg_color' => '#ecfdf5',
                'icon' => 'check-circle',
                'description' => 'Kontrak telah disetujui oleh seluruh pihak.',
                'sort_order' => 4,
            ],
            [
                'code' => 'locked',
                'name' => 'Terkunci',
                'color' => '#6366f1',
                'bg_color' => '#eef2ff',
                'icon' => 'lock',
                'description' => 'Kontrak telah difinalisasi dan tidak dapat diubah.',
                'sort_order' => 5,
            ],
            [
                'code' => 'archived',
                'name' => 'Arsip',
                'color' => '#94a3b8',
                'bg_color' => '#f8fafc',
                'icon' => 'archive',
                'description' => 'Kontrak yang sudah tidak aktif atau selesai.',
                'sort_order' => 6,
            ],
        ];

        foreach ($statuses as $status) {
            ContractStatus::updateOrCreate(['code' => $status['code']], $status);
        }
    }
}
