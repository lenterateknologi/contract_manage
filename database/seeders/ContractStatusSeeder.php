<?php

namespace Database\Seeders;

use App\Models\ContractStatus;
use App\Models\User;
use Illuminate\Database\Seeder;

class ContractStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::firstWhere('email', 'admin@example.com') ?? User::first();
        $adminId = $admin ? $admin->id : null;

        $statuses = [
            [
                'code' => 'draft',
                'label' => 'Draft',
                'color' => '#64748b',
                'bg_color' => '#f1f5f9',
                'icon' => 'file-text',
                'description' => 'Kontrak baru yang masih dalam tahap awal.',
                'sequence' => 1,
            ],
            [
                'code' => 'in_review',
                'label' => 'Dalam Review',
                'color' => '#3b82f6',
                'bg_color' => '#eff6ff',
                'icon' => 'clock',
                'description' => 'Kontrak sedang dalam proses persetujuan (approval).',
                'sequence' => 2,
            ],
            [
                'code' => 'revision',
                'label' => 'Revisi',
                'color' => '#f59e0b',
                'bg_color' => '#fffbeb',
                'icon' => 'edit-3',
                'description' => 'Kontrak dikembalikan untuk perbaikan.',
                'sequence' => 3,
            ],
            [
                'code' => 'approved',
                'label' => 'Disetujui',
                'color' => '#10b981',
                'bg_color' => '#ecfdf5',
                'icon' => 'check-circle',
                'description' => 'Kontrak telah disetujui oleh seluruh pihak.',
                'sequence' => 4,
            ],
            [
                'code' => 'locked',
                'label' => 'Terkunci',
                'color' => '#6366f1',
                'bg_color' => '#eef2ff',
                'icon' => 'lock',
                'description' => 'Kontrak telah difinalisasi dan tidak dapat diubah.',
                'sequence' => 5,
            ],
            [
                'code' => 'archived',
                'label' => 'Arsip',
                'color' => '#94a3b8',
                'bg_color' => '#f8fafc',
                'icon' => 'archive',
                'description' => 'Kontrak yang sudah tidak aktif atau selesai.',
                'sequence' => 6,
            ],
            [
                'code' => 'rejected',
                'label' => 'Rejected',
                'color' => '#ef4444',
                'bg_color' => '#fef2f2',
                'icon' => 'x-circle',
                'description' => 'Kontrak ditolak.',
                'sequence' => 7,
            ],
        ];

        foreach ($statuses as $status) {
            ContractStatus::updateOrCreate(
                ['code' => $status['code']],
                array_merge($status, [
                    'created_by' => $adminId,
                    'updated_by' => $adminId,
                ])
            );
        }
    }
}
