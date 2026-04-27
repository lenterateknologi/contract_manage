<?php

namespace Database\Seeders;

use App\Models\Contract;
use App\Models\ContractAttachment;
use App\Models\ContractHistory;
use App\Models\ContractMessage;
use App\Models\ContractType;
use App\Models\ContractVersion;
use App\Models\User;
use Illuminate\Database\Seeder;

class TransactionSeeder extends Seeder
{
    private array $userMap = [];

    private array $typeMap = [];

    public function run(): void
    {
        // Wipe existing data - Use forceDelete because unique constraints (like contract_no) 
        // often don't ignore soft-deleted records.
        ContractMessage::query()->forceDelete();
        ContractHistory::query()->forceDelete();
        ContractVersion::query()->forceDelete();
        ContractAttachment::query()->forceDelete();
        Contract::query()->forceDelete();

        // Build a lookup map: email => user model
        $this->userMap = [
            'ahmad' => User::where('email', 'ahmad@example.com')->first(),
            'budi' => User::where('email', 'budi@example.com')->first(),
            'citra' => User::where('email', 'citra@example.com')->first(),
            'dian' => User::where('email', 'dian@example.com')->first(),
            'eko' => User::where('email', 'eko@example.com')->first(),
        ];

        // Build type lookup map (using code for reliability)
        foreach (ContractType::all() as $t) {
            $this->typeMap[strtolower($t->code)] = $t->id;
        }

        $this->createContract1();
        $this->createContract2();
        $this->createContract3();
        $this->createContract4();
        $this->createContract5();
        $this->createContract6();
        $this->createContract7();
        $this->createContract8();
        $this->createContract9();
        $this->createContract10();

        $this->seedRandomContracts(50);
    }

    private function seedRandomContracts(int $count): void
    {
        $titles = [
            'Perjanjian Sewa Kendaraan Operasional',
            'Kontrak Outsourcing Security Gedung',
            'MoU Sinergi Layanan Digital',
            'Perjanjian Kerjasama Distribusi Logistik',
            'Kontrak Maintenance Lift dan Eskalator',
            'Penyediaan Alat Tulis Kantor (ATK)',
            'Kontrak Renovasi Ruang Meeting',
            'Perjanjian Lisensi Font Korporat',
            'MoU Penyelenggaraan Event Tahunan',
            'Kontrak Catering Karyawan Shift Malam',
            'Sewa Area Parkir Tambahan',
            'Jasa Konsultasi Audit Pajak',
            'Pengadaan Seragam Kerja Lapangan',
            'Integrasi API Payment Gateway',
            'Kontrak Langganan Internet Fiber Optic'
        ];

        $statuses = ['draft', 'in_review', 'revision', 'approved'];
        $typeNames = array_keys($this->typeMap);
        $userNames = array_keys($this->userMap);

        for ($i = 0; $i < $count; $i++) {
            $monthOffset = rand(0, 5);
            $dayOffset = rand(1, 28);
            $createdAt = now()->subMonths($monthOffset)->subDays($dayOffset);
            
            $typeIdx = array_rand($typeNames);
            $type = $typeNames[$typeIdx];
            
            $userIdx = array_rand($userNames);
            $user = $userNames[$userIdx];
            
            $c = Contract::create([
                'contract_no' => 'REQ-CMS-' . str_pad($i + 1, 3, '0', STR_PAD_LEFT),
                'crown_no' => 'CTR-CROW-' . str_pad($i + 1, 3, '0', STR_PAD_LEFT),
                'title' => $titles[array_rand($titles)] . ' (#' . ($i + 1) . ')',
                'description' => 'Data random seeder untuk pengujian visual analytics.',
                'contract_date' => $createdAt->format('Y-m-d'),
                'contract_type_id' => $this->tid($type),
                'created_by' => $this->uid($user),
                'status' => $statuses[array_rand($statuses)],
                'current_version' => 1,
                'created_at' => $createdAt,
            ]);

            ContractVersion::create([
                'contract_id' => $c->id,
                'version_no' => 1,
                'document_type' => 'f1',
                'file_name' => "{$c->contract_no}_v1.docx",
                'change_log' => 'Initial random seed',
                'uploaded_by' => $c->created_by,
                'is_final' => ($c->status === 'approved'),
                'file_hash' => md5(uniqid()),
                'created_at' => $createdAt,
            ]);
        }
    }

    private function uid(string $name): string
    {
        return $this->userMap[$name]->id;
    }

    private function tid(string $code): string
    {
        $id = $this->typeMap[strtolower($code)] ?? null;
        if (!$id) {
            // Fallback for names if code not found
            $id = ContractType::where('name', 'ilike', $code)->value('id');
        }
        return $id ?? ContractType::first()->id; // Fallback to first if all else fails
    }

    private function createContract1(): void
    {
        $c = Contract::create([
            'contract_no' => 'REQ-2025-001',
            'crown_no' => 'CTR-2025-001',
            'title' => 'Kontrak Vendor IT Infrastructure',
            'description' => 'Pengadaan perangkat server dan jaringan untuk pusat data perusahaan.',
            'contract_date' => now()->format('Y-m-d'),
            'contract_type_id' => $this->tid('PGB'),
            'created_by' => $this->uid('ahmad'),
            'status' => 'in_review',
            'current_version' => 2,
            'created_at' => now()->subDays(2),
        ]);

        ContractVersion::create(['contract_id' => $c->id, 'version_no' => 1, 'document_type' => 'f1', 'file_name' => 'CTR-2025-001_v1_initial.docx',  'change_log' => 'Draft awal kontrak',        'uploaded_by' => $this->uid('ahmad'), 'is_final' => false, 'file_hash' => 'a1b2c3d4e5f6...', 'created_at' => '2025-03-01 09:05:00']);
        ContractVersion::create(['contract_id' => $c->id, 'version_no' => 2, 'document_type' => 'f1', 'file_name' => 'CTR-2025-001_v2_revision.docx', 'change_log' => 'Revisi klausul pembayaran', 'uploaded_by' => $this->uid('ahmad'), 'is_final' => false, 'file_hash' => 'f6e5d4c3b2a1...', 'created_at' => '2025-03-05 10:00:00']);

        ContractHistory::create(['contract_id' => $c->id, 'action' => 'CONTRACT_CREATED',  'description' => 'Kontrak dibuat',       'actor_id' => $this->uid('ahmad'), 'created_at' => '2025-03-01 09:00:00']);
        ContractHistory::create(['contract_id' => $c->id, 'action' => 'FILE_UPLOADED',     'description' => 'Upload versi v1',      'actor_id' => $this->uid('ahmad'), 'created_at' => '2025-03-01 09:05:00']);
        ContractHistory::create(['contract_id' => $c->id, 'action' => 'APPROVAL_APPROVED', 'description' => 'Disetujui oleh Legal', 'actor_id' => $this->uid('budi'),  'created_at' => '2025-03-03 14:30:00']);
        ContractHistory::create(['contract_id' => $c->id, 'action' => 'FILE_UPLOADED',     'description' => 'Upload revisi v2',     'actor_id' => $this->uid('ahmad'), 'created_at' => '2025-03-05 10:00:00']);

        ContractMessage::create(['contract_id' => $c->id, 'user_id' => $this->uid('budi'),  'message' => 'Pasal 5 soal SLA perlu diperjelas. Saat ini masih ambigu antara business day dan calendar day.', 'read_by' => [$this->uid('ahmad'), $this->uid('budi')], 'created_at' => '2025-03-02 10:15:00']);
        ContractMessage::create(['contract_id' => $c->id, 'user_id' => $this->uid('ahmad'), 'message' => 'Noted, akan saya revisi. Maksudnya business day ya pak?',                                           'read_by' => [$this->uid('ahmad'), $this->uid('budi')], 'created_at' => '2025-03-02 10:32:00']);
        ContractMessage::create(['contract_id' => $c->id, 'user_id' => $this->uid('budi'),  'message' => 'Betul, business day. Tolong tambahkan juga definisinya di klausul awal.',                           'read_by' => [$this->uid('ahmad'), $this->uid('budi')], 'created_at' => '2025-03-02 10:45:00']);
        ContractMessage::create(['contract_id' => $c->id, 'user_id' => $this->uid('ahmad'), 'message' => 'Sudah diupdate di v2, silakan dicek kembali.',                                                      'read_by' => [$this->uid('ahmad')],                     'created_at' => '2025-03-05 09:10:00']);
    }

    private function createContract2(): void
    {
        $c = Contract::create([
            'contract_no' => 'REQ-2025-002',
            'crown_no' => 'CTR-2025-002',
            'title' => 'MoU Kerjasama Pemasaran Regional',
            'description' => 'Nota kesepahaman untuk ekspansi pasar wilayah Jawa Timur.',
            'contract_date' => now()->subMonths(1)->format('Y-m-d'),
            'contract_type_id' => $this->tid('PKS'),
            'created_by' => $this->uid('ahmad'),
            'status' => 'approved',
            'current_version' => 3,
            'created_at' => now()->subMonths(1)->subDays(10),
        ]);

        ContractVersion::create(['contract_id' => $c->id, 'version_no' => 1, 'document_type' => 'f1', 'file_name' => 'CTR-2025-002_v1_initial.docx',  'change_log' => 'Draft awal',            'uploaded_by' => $this->uid('ahmad'), 'is_final' => false, 'file_hash' => 'aa112233...', 'created_at' => '2025-02-15 10:10:00']);
        ContractVersion::create(['contract_id' => $c->id, 'version_no' => 2, 'document_type' => 'f1', 'file_name' => 'CTR-2025-002_v2_revision.docx', 'change_log' => 'Revisi term kerjasama', 'uploaded_by' => $this->uid('ahmad'), 'is_final' => false, 'file_hash' => 'bb223344...', 'created_at' => '2025-02-20 11:00:00']);
        ContractVersion::create(['contract_id' => $c->id, 'version_no' => 3, 'document_type' => 'f1', 'file_name' => 'CTR-2025-002_v3_final.docx',    'change_log' => 'Final setelah revisi',  'uploaded_by' => $this->uid('ahmad'), 'is_final' => true,  'file_hash' => 'cc334455...', 'created_at' => '2025-02-25 14:00:00']);

        ContractHistory::create(['contract_id' => $c->id, 'action' => 'CONTRACT_CREATED',  'description' => 'Kontrak dibuat',           'actor_id' => $this->uid('ahmad'), 'created_at' => '2025-02-15 10:00:00']);
        ContractHistory::create(['contract_id' => $c->id, 'action' => 'FILE_UPLOADED',     'description' => 'Upload v1',                'actor_id' => $this->uid('ahmad'), 'created_at' => '2025-02-15 10:10:00']);
        ContractHistory::create(['contract_id' => $c->id, 'action' => 'APPROVAL_APPROVED', 'description' => 'Disetujui Legal',          'actor_id' => $this->uid('budi'),  'created_at' => '2025-02-18 15:00:00']);
        ContractHistory::create(['contract_id' => $c->id, 'action' => 'APPROVAL_REJECTED', 'description' => 'Ditolak Tax – revisi PPN', 'actor_id' => $this->uid('citra'), 'created_at' => '2025-02-21 09:00:00']);
        ContractHistory::create(['contract_id' => $c->id, 'action' => 'FILE_UPLOADED',     'description' => 'Upload revisi v2',         'actor_id' => $this->uid('ahmad'), 'created_at' => '2025-02-21 11:00:00']);
        ContractHistory::create(['contract_id' => $c->id, 'action' => 'FILE_UPLOADED',     'description' => 'Upload final v3',          'actor_id' => $this->uid('ahmad'), 'created_at' => '2025-02-25 14:00:00']);
        ContractHistory::create(['contract_id' => $c->id, 'action' => 'APPROVAL_APPROVED', 'description' => 'Disetujui Tax',            'actor_id' => $this->uid('citra'), 'created_at' => '2025-02-26 10:00:00']);
        ContractHistory::create(['contract_id' => $c->id, 'action' => 'APPROVAL_APPROVED', 'description' => 'Disetujui Management',     'actor_id' => $this->uid('dian'),  'created_at' => '2025-02-27 11:00:00']);
        ContractHistory::create(['contract_id' => $c->id, 'action' => 'APPROVAL_APPROVED', 'description' => 'Disetujui Direksi',        'actor_id' => $this->uid('eko'),   'created_at' => '2025-02-28 14:00:00']);
        ContractHistory::create(['contract_id' => $c->id, 'action' => 'CONTRACT_APPROVED', 'description' => 'Kontrak final APPROVED',   'actor_id' => $this->uid('eko'),   'created_at' => '2025-02-28 14:01:00']);

        ContractMessage::create(['contract_id' => $c->id, 'user_id' => $this->uid('citra'), 'message' => 'Perlu klarifikasi soal PPN 11% di pasal 8. Apakah sudah termasuk dalam harga kontrak?', 'read_by' => [$this->uid('ahmad'), $this->uid('budi'), $this->uid('citra')],                            'created_at' => '2025-02-19 14:00:00']);
        ContractMessage::create(['contract_id' => $c->id, 'user_id' => $this->uid('ahmad'), 'message' => 'Belum termasuk pak, akan ditambahkan klausul pajak terpisah.',                          'read_by' => [$this->uid('ahmad'), $this->uid('budi'), $this->uid('citra')],                            'created_at' => '2025-02-19 14:30:00']);
        ContractMessage::create(['contract_id' => $c->id, 'user_id' => $this->uid('dian'),  'message' => 'Oke, jika sudah lengkap silakan ajukan ke saya untuk approval management.',             'read_by' => [$this->uid('ahmad'), $this->uid('budi'), $this->uid('citra'), $this->uid('dian')],        'created_at' => '2025-02-19 15:00:00']);
        ContractMessage::create(['contract_id' => $c->id, 'user_id' => $this->uid('citra'), 'message' => 'V3 sudah sesuai, saya approve.',                                                        'read_by' => [$this->uid('ahmad'), $this->uid('budi'), $this->uid('citra'), $this->uid('dian')],        'created_at' => '2025-02-26 10:00:00']);
    }

    private function createContract3(): void
    {
        $c = Contract::create([
            'contract_no' => 'CTR-2025-003',
            'title' => 'Perjanjian Sewa Gudang Logistik',
            'description' => 'Kontrak sewa gudang untuk keperluan distribusi produk wilayah Barat.',
            'contract_date' => now()->subMonths(1)->format('Y-m-d'),
            'contract_type_id' => $this->tid('SEWA'),
            'created_by' => $this->uid('ahmad'),
            'status' => 'revision',
            'current_version' => 1,
            'created_at' => now()->subMonths(1)->subDays(5),
        ]);

        ContractVersion::create(['contract_id' => $c->id, 'version_no' => 1, 'document_type' => 'f1', 'file_name' => 'CTR-2025-003_v1_initial.docx', 'change_log' => 'Draft awal', 'uploaded_by' => $this->uid('ahmad'), 'is_final' => false, 'file_hash' => 'dd445566...', 'created_at' => '2025-03-10 08:35:00']);

        ContractHistory::create(['contract_id' => $c->id, 'action' => 'CONTRACT_CREATED',  'description' => 'Kontrak dibuat',         'actor_id' => $this->uid('ahmad'), 'created_at' => '2025-03-10 08:30:00']);
        ContractHistory::create(['contract_id' => $c->id, 'action' => 'FILE_UPLOADED',     'description' => 'Upload v1',              'actor_id' => $this->uid('ahmad'), 'created_at' => '2025-03-10 08:35:00']);
        ContractHistory::create(['contract_id' => $c->id, 'action' => 'APPROVAL_REJECTED', 'description' => 'Ditolak Legal – durasi', 'actor_id' => $this->uid('budi'),  'created_at' => '2025-03-12 11:00:00']);

        ContractMessage::create(['contract_id' => $c->id, 'user_id' => $this->uid('budi'),  'message' => 'Durasi sewa 5 tahun melebihi ketentuan internal. Maksimal 2 tahun atau perlu persetujuan BOD.', 'read_by' => [$this->uid('ahmad'), $this->uid('budi')], 'created_at' => '2025-03-12 11:05:00']);
        ContractMessage::create(['contract_id' => $c->id, 'user_id' => $this->uid('ahmad'), 'message' => 'Baik pak, akan saya revisi menjadi 2 tahun dengan opsi perpanjangan.',                          'read_by' => [$this->uid('ahmad')],                     'created_at' => '2025-03-12 13:00:00']);
    }

    private function createContract4(): void
    {
        $c = Contract::create([
            'contract_no' => 'CTR-2025-004',
            'title' => 'Kontrak Lisensi Software ERP',
            'description' => 'Lisensi tahunan sistem ERP untuk modul finance dan HR.',
            'contract_date' => now()->subMonths(2)->format('Y-m-d'),
            'contract_type_id' => $this->tid('JASA'),
            'created_by' => $this->uid('ahmad'),
            'status' => 'draft',
            'current_version' => 1,
            'created_at' => now()->subMonths(2)->subDays(15),
        ]);

        ContractVersion::create(['contract_id' => $c->id, 'version_no' => 1, 'document_type' => 'f1', 'file_name' => 'CTR-2025-004_v1_initial.docx', 'change_log' => 'Draft awal', 'uploaded_by' => $this->uid('ahmad'), 'is_final' => false, 'file_hash' => 'ee556677...', 'created_at' => '2025-03-14 13:05:00']);

        ContractHistory::create(['contract_id' => $c->id, 'action' => 'CONTRACT_CREATED', 'description' => 'Kontrak dibuat', 'actor_id' => $this->uid('ahmad'), 'created_at' => '2025-03-14 13:00:00']);
        ContractHistory::create(['contract_id' => $c->id, 'action' => 'FILE_UPLOADED',    'description' => 'Upload v1',      'actor_id' => $this->uid('ahmad'), 'created_at' => '2025-03-14 13:05:00']);

        ContractMessage::create(['contract_id' => $c->id, 'user_id' => $this->uid('budi'), 'message' => 'Draft sudah diterima, sedang saya review klausul lisensi dan maintenance.', 'read_by' => [$this->uid('budi')], 'created_at' => '2025-03-14 14:00:00']);
    }

    private function createContract5(): void
    {
        $c = Contract::create([
            'contract_no' => 'CTR-2025-005',
            'title' => 'Pengadaan Laptop Staff Baru',
            'description' => 'Pembelian 20 unit laptop untuk departemen marketing dan operasional.',
            'contract_date' => now()->subMonths(2)->format('Y-m-d'),
            'contract_type_id' => $this->tid('Perjanjian Pengadaan Barang'),
            'created_by' => $this->uid('ahmad'),
            'status' => 'approved',
            'current_version' => 1,
            'created_at' => now()->subMonths(2)->subDays(5),
        ]);
        ContractVersion::create(['contract_id' => $c->id, 'version_no' => 1, 'document_type' => 'f2', 'file_name' => 'CTR-2025-005_final.docx', 'change_log' => 'Final', 'uploaded_by' => $this->uid('ahmad'), 'is_final' => true, 'file_hash' => 'ff112233...', 'created_at' => '2025-03-16 10:00:00']);
        ContractHistory::create(['contract_id' => $c->id, 'action' => 'CONTRACT_APPROVED', 'description' => 'Disetujui', 'actor_id' => $this->uid('eko'), 'created_at' => '2025-03-18 09:00:00']);
    }

    private function createContract6(): void
    {
        $c = Contract::create([
            'contract_no' => 'CTR-2025-006',
            'title' => 'Sewa Ruang Kantor Level 15',
            'description' => 'Perpanjangan sewa ruang kantor utama di Wisma Atlet.',
            'contract_date' => now()->subMonths(3)->format('Y-m-d'),
            'contract_type_id' => $this->tid('Perjanjian Sewa'),
            'created_by' => $this->uid('ahmad'),
            'status' => 'in_review',
            'current_version' => 1,
            'created_at' => now()->subMonths(3)->subDays(10),
        ]);
        ContractVersion::create(['contract_id' => $c->id, 'version_no' => 1, 'document_type' => 'f1', 'file_name' => 'CTR-2025-006_draft.docx', 'change_log' => 'Draft', 'uploaded_by' => $this->uid('ahmad'), 'is_final' => false, 'file_hash' => 'gg223344...', 'created_at' => '2025-03-20 11:00:00']);
    }

    private function createContract7(): void
    {
        $c = Contract::create([
            'contract_no' => 'CTR-2025-007',
            'title' => 'Kemitraan Strategis Fintech',
            'description' => 'Integrasi sistem pembayaran dengan provider eksternal.',
            'contract_date' => now()->subMonths(3)->format('Y-m-d'),
            'contract_type_id' => $this->tid('Perjanjian Kerja Sama (PKS)'),
            'created_by' => $this->uid('ahmad'),
            'status' => 'revision',
            'current_version' => 1,
            'created_at' => now()->subMonths(3)->subDays(2),
        ]);
        ContractVersion::create(['contract_id' => $c->id, 'version_no' => 1, 'document_type' => 'f1', 'file_name' => 'CTR-2025-007_v1.docx', 'change_log' => 'Draft', 'uploaded_by' => $this->uid('ahmad'), 'is_final' => false, 'file_hash' => 'hh334455...', 'created_at' => '2025-03-22 14:00:00']);
        ContractHistory::create(['contract_id' => $c->id, 'action' => 'APPROVAL_REJECTED', 'description' => 'Ditolak Management', 'actor_id' => $this->uid('dian'), 'created_at' => '2025-03-24 10:00:00']);
    }

    private function createContract8(): void
    {
        $c = Contract::create([
            'contract_no' => 'CTR-2025-008',
            'title' => 'Jasa Konsultasi Keamanan Siber',
            'description' => 'Audit tahunan sistem keamanan informasi perusahaan.',
            'contract_date' => now()->subMonths(4)->format('Y-m-d'),
            'contract_type_id' => $this->tid('JASA'),
            'created_by' => $this->uid('ahmad'),
            'status' => 'draft',
            'current_version' => 1,
            'created_at' => now()->subMonths(4)->subDays(15),
        ]);
        ContractVersion::create(['contract_id' => $c->id, 'version_no' => 1, 'document_type' => 'f1', 'file_name' => 'CTR-2025-008_initial.docx', 'change_log' => 'Draft', 'uploaded_by' => $this->uid('ahmad'), 'is_final' => false, 'file_hash' => 'ii445566...', 'created_at' => '2025-03-25 09:00:00']);
    }

    private function createContract9(): void
    {
        $c = Contract::create([
            'contract_no' => 'CTR-2025-009',
            'title' => 'Maintainance AC Gedung 2025',
            'description' => 'Perjanjian perawatan rutin unit AC di seluruh area kantor.',
            'contract_date' => now()->subMonths(5)->format('Y-m-d'),
            'contract_type_id' => $this->tid('Perjanjian Jasa'),
            'created_by' => $this->uid('ahmad'),
            'status' => 'in_review',
            'current_version' => 1,
            'created_at' => now()->subMonths(5)->subDays(20),
        ]);
        ContractVersion::create(['contract_id' => $c->id, 'version_no' => 1, 'document_type' => 'f1', 'file_name' => 'CTR-2025-009_v1.docx', 'change_log' => 'Draft', 'uploaded_by' => $this->uid('ahmad'), 'is_final' => false, 'file_hash' => 'jj556677...', 'created_at' => '2025-03-27 15:00:00']);
    }

    private function createContract10(): void
    {
        $c = Contract::create([
            'contract_no' => 'CTR-2025-010',
            'title' => 'MoU Outsourcing Customer Service',
            'description' => 'Penyediaan tenaga kerja outsourcing untuk divisi bantuan pelanggan.',
            'contract_date' => now()->subMonths(5)->format('Y-m-d'),
            'contract_type_id' => $this->tid('Perjanjian Kerja Sama (PKS)'),
            'created_by' => $this->uid('ahmad'),
            'status' => 'approved',
            'current_version' => 1,
            'created_at' => now()->subMonths(5)->subDays(10),
        ]);
        ContractVersion::create(['contract_id' => $c->id, 'version_no' => 1, 'document_type' => 'f2', 'file_name' => 'CTR-2025-010_final.docx', 'change_log' => 'Final', 'uploaded_by' => $this->uid('ahmad'), 'is_final' => true, 'file_hash' => 'kk667788...', 'created_at' => '2025-03-29 11:00:00']);
        ContractHistory::create(['contract_id' => $c->id, 'action' => 'CONTRACT_APPROVED', 'description' => 'Disetujui', 'actor_id' => $this->uid('eko'), 'created_at' => '2025-03-31 16:00:00']);
    }
}
