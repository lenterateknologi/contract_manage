<?php

namespace Database\Seeders\System;

use App\Models\ContractStatus;
use Illuminate\Database\Seeder;

class ContractStatusSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = [
            ['code' => 'draft', 'label' => 'Draft', 'color' => '#64748b', 'bg_color' => '#f1f5f9', 'icon' => 'FileText', 'is_active' => true, 'description' => 'Dokumen dalam proses penyusunan awal (belum diajukan)'],
            ['code' => 'queue', 'label' => 'Antrian', 'color' => '#64748b', 'bg_color' => '#f1f5f9', 'icon' => 'ListOrdered', 'is_active' => true, 'description' => 'Menunggu giliran proses dalam antrian'],
            ['code' => 'in_review', 'label' => 'Dalam Review', 'color' => '#3b82f6', 'bg_color' => '#eff6ff', 'icon' => 'Clock', 'is_active' => true, 'description' => 'Dokumen sedang dalam proses telaah dan verifikasi alur kerja'],
            
            // --- Tipe Spesifik Review Dokumen & Form ---
            ['code' => 'review_f1', 'label' => 'Review F1', 'color' => '#0284c7', 'bg_color' => '#e0f2fe', 'icon' => 'FileCheck', 'is_active' => true, 'description' => 'Dalam proses review Formulir 1 (F1 - Permohonan / Identifikasi Kebutuhan Kontrak)'],
            ['code' => 'review_f2', 'label' => 'Review F2', 'color' => '#0d9488', 'bg_color' => '#ccfbf1', 'icon' => 'FileSearch', 'is_active' => true, 'description' => 'Dalam proses review Formulir 2 (F2 - Evaluasi & Kelayakan Pengadaan / Vendor)'],
            ['code' => 'review_agreement', 'label' => 'Review Agreement', 'color' => '#2563eb', 'bg_color' => '#dbeafe', 'icon' => 'FileText', 'is_active' => true, 'description' => 'Dalam proses penelaahan draft perjanjian / klausul kontrak hukum'],
            
            // --- Rekomendasi Status Review Fungsional ---
            ['code' => 'review_legal', 'label' => 'Review Legal', 'color' => '#4f46e5', 'bg_color' => '#e0e7ff', 'icon' => 'Shield', 'is_active' => true, 'description' => 'Pemeriksaan kepatuhan hukum, risiko perdata, dan klausul khusus oleh Tim Legal'],
            ['code' => 'review_finance', 'label' => 'Review Keuangan & Pajak', 'color' => '#0891b2', 'bg_color' => '#cffafe', 'icon' => 'Calculator', 'is_active' => true, 'description' => 'Verifikasi anggaran, syarat pembayaran, termin tagihan, dan aspek perpajakan'],
            ['code' => 'review_compliance', 'label' => 'Review Kepatuhan & Risiko', 'color' => '#7c3aed', 'bg_color' => '#ede9fe', 'icon' => 'ShieldAlert', 'is_active' => true, 'description' => 'Analisis mitigasi risiko dan kepatuhan tata kelola perusahaan (GCG)'],
            ['code' => 'review_vendor', 'label' => 'Review Pihak Ketiga / Vendor', 'color' => '#d97706', 'bg_color' => '#fef3c7', 'icon' => 'Users', 'is_active' => true, 'description' => 'Proses penelaahan bersama, negosiasi klausul, dan feedback dari mitra / vendor luar'],
            
            ['code' => 'pending', 'label' => 'Menunggu Persetujuan', 'color' => '#f59e0b', 'bg_color' => '#fffbeb', 'icon' => 'AlertCircle', 'is_active' => true, 'description' => 'Dokumen menunggu persetujuan / approval dari pejabat berwenang'],
            ['code' => 'revision', 'label' => 'Revisi', 'color' => '#f97316', 'bg_color' => '#fff7ed', 'icon' => 'RefreshCw', 'is_active' => true, 'description' => 'Dokumen dikembalikan ke pemohon untuk perbaikan / klarifikasi'],
            ['code' => 'approved', 'label' => 'Disetujui', 'color' => '#10b981', 'bg_color' => '#ecfdf5', 'icon' => 'CheckCircle', 'is_active' => true, 'description' => 'Seluruh tahapan persetujuan telah selesai dan disetujui'],
            ['code' => 'active', 'label' => 'Aktif', 'color' => '#6366f1', 'bg_color' => '#eef2ff', 'icon' => 'Zap', 'is_active' => true, 'description' => 'Kontrak sedang berjalan aktif'],
            ['code' => 'rejected', 'label' => 'Ditolak', 'color' => '#ef4444', 'bg_color' => '#fef2f2', 'icon' => 'XCircle', 'is_active' => true, 'description' => 'Pengajuan dokumen ditolak'],
            ['code' => 'signed', 'label' => 'Ditandatangani', 'color' => '#8b5cf6', 'bg_color' => '#f5f3ff', 'icon' => 'FileCheck', 'is_active' => true, 'description' => 'Dokumen telah selesai ditandatangani para pihak'],
            ['code' => 'closed', 'label' => 'Selesai', 'color' => '#059669', 'bg_color' => '#ecfdf5', 'icon' => 'CheckCheck', 'is_active' => true, 'description' => 'Dokumen telah selesai ditandatangani dan diproses final'],
            ['code' => 'completed', 'label' => 'Selesai', 'color' => '#059669', 'bg_color' => '#ecfdf5', 'icon' => 'CheckCheck', 'is_active' => true, 'description' => 'Dokumen telah selesai masa berlakunya / tuntas'],
            ['code' => 'expired', 'label' => 'Kedaluwarsa', 'color' => '#94a3b8', 'bg_color' => '#f8fafc', 'icon' => 'AlertTriangle', 'is_active' => true, 'description' => 'Masa berlaku dokumen kontrak telah habis'],
            ['code' => 'archived', 'label' => 'Diarsipkan', 'color' => '#94a3b8', 'bg_color' => '#f8fafc', 'icon' => 'Archive', 'is_active' => true, 'description' => 'Dokumen telah selesai masa berlaku atau dipindahkan ke arsip'],
            ['code' => 'locked', 'label' => 'Terkunci', 'color' => '#64748b', 'bg_color' => '#f1f5f9', 'icon' => 'Lock', 'is_active' => true, 'description' => 'Dokumen dikunci dari perubahan'],
            ['code' => 'cancelled', 'label' => 'Dibatalkan', 'color' => '#71717a', 'bg_color' => '#f4f4f5', 'icon' => 'Ban', 'is_active' => true, 'description' => 'Pengajuan dokumen kontrak dibatalkan'],
        ];

        foreach ($statuses as $status) {
            $record = ContractStatus::withTrashed()->firstOrNew(['code' => $status['code']]);
            $record->fill($status);
            $record->save();
        }
    }
}
