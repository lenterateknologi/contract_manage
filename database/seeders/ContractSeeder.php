<?php

namespace Database\Seeders;

use App\Models\Contract;
use App\Models\ContractHistory;
use App\Models\ContractMessage;
use App\Models\ContractType;
use App\Models\ContractVersion;
use App\Models\User;
use Illuminate\Database\Seeder;

class ContractSeeder extends Seeder
{
    private array $userMap = [];
    private array $typeMap = [];

    public function run(): void
    {
        // Wipe existing data
        \App\Models\ContractMessage::query()->delete();
        \App\Models\ContractHistory::query()->delete();
        \App\Models\ContractVersion::query()->delete();
        \App\Models\ContractAttachment::query()->delete();
        Contract::query()->delete();

        // Build a lookup map: email => user model
        $this->userMap = [
            'ahmad' => User::where('email', 'ahmad@example.com')->first(),
            'budi'  => User::where('email', 'budi@example.com')->first(),
            'citra' => User::where('email', 'citra@example.com')->first(),
            'dian'  => User::where('email', 'dian@example.com')->first(),
            'eko'   => User::where('email', 'eko@example.com')->first(),
        ];

        // Build type lookup map
        foreach (ContractType::all() as $t) {
            $this->typeMap[strtolower($t->name)] = $t->id;
        }

        $this->createContract1();
        $this->createContract2();
        $this->createContract3();
        $this->createContract4();
    }

    private function uid(string $name): string
    {
        return $this->userMap[$name]->id;
    }

    private function tid(string $name): string
    {
        return $this->typeMap[strtolower($name)];
    }

    private function createContract1(): void
    {
        $c = Contract::create([
            'contract_no'      => 'CTR-2025-001',
            'title'            => 'Kontrak Vendor IT Infrastructure',
            'description'      => 'Pengadaan perangkat server dan jaringan untuk pusat data perusahaan.',
            'contract_date'    => '2025-03-01',
            'contract_type_id' => $this->tid('Vendor'),
            'created_by'       => $this->uid('ahmad'),
            'status'           => 'in_review',
            'current_version'  => 2,
            'created_at'       => '2025-03-01 00:00:00',
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
            'contract_no'      => 'CTR-2025-002',
            'title'            => 'MoU Kerjasama Pemasaran Regional',
            'description'      => 'Nota kesepahaman untuk ekspansi pasar wilayah Jawa Timur.',
            'contract_date'    => '2025-02-15',
            'contract_type_id' => $this->tid('Kemitraan'),
            'created_by'       => $this->uid('ahmad'),
            'status'           => 'approved',
            'current_version'  => 3,
            'created_at'       => '2025-02-15 00:00:00',
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
            'contract_no'      => 'CTR-2025-003',
            'title'            => 'Perjanjian Sewa Gudang Logistik',
            'description'      => 'Kontrak sewa gudang untuk keperluan distribusi produk wilayah Barat.',
            'contract_date'    => '2025-03-10',
            'contract_type_id' => $this->tid('Sewa'),
            'created_by'       => $this->uid('ahmad'),
            'status'           => 'revision',
            'current_version'  => 1,
            'created_at'       => '2025-03-10 00:00:00',
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
            'contract_no'      => 'CTR-2025-004',
            'title'            => 'Kontrak Lisensi Software ERP',
            'description'      => 'Lisensi tahunan sistem ERP untuk modul finance dan HR.',
            'contract_date'    => '2025-03-14',
            'contract_type_id' => $this->tid('Jasa'),
            'created_by'       => $this->uid('ahmad'),
            'status'           => 'draft',
            'current_version'  => 1,
            'created_at'       => '2025-03-14 00:00:00',
        ]);

        ContractVersion::create(['contract_id' => $c->id, 'version_no' => 1, 'document_type' => 'f1', 'file_name' => 'CTR-2025-004_v1_initial.docx', 'change_log' => 'Draft awal', 'uploaded_by' => $this->uid('ahmad'), 'is_final' => false, 'file_hash' => 'ee556677...', 'created_at' => '2025-03-14 13:05:00']);


        ContractHistory::create(['contract_id' => $c->id, 'action' => 'CONTRACT_CREATED', 'description' => 'Kontrak dibuat', 'actor_id' => $this->uid('ahmad'), 'created_at' => '2025-03-14 13:00:00']);
        ContractHistory::create(['contract_id' => $c->id, 'action' => 'FILE_UPLOADED',    'description' => 'Upload v1',      'actor_id' => $this->uid('ahmad'), 'created_at' => '2025-03-14 13:05:00']);

        ContractMessage::create(['contract_id' => $c->id, 'user_id' => $this->uid('budi'), 'message' => 'Draft sudah diterima, sedang saya review klausul lisensi dan maintenance.', 'read_by' => [$this->uid('budi')], 'created_at' => '2025-03-14 14:00:00']);
    }
}
