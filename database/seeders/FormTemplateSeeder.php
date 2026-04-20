<?php

namespace Database\Seeders;

use App\Models\ContractType;
use App\Models\FormTemplate;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class FormTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::first();
        if (! $admin) {
            return;
        }

        // Delete existing templates to refresh
        FormTemplate::query()->delete();

        $contractTypes = ContractType::all();

        foreach ($contractTypes as $type) {
            if ($type->name === 'Perjanjian Kerja Sama (PKS)') {
                $this->seedHighFidelityPKS($admin->id, $type);
            } else {
                $this->seedF1ForType($admin->id, $type);
            }
        }

        // Also seed a universal F2 template
        $this->seedUniversalF2($admin->id);
    }

    private function seedF1ForType(string $userId, ContractType $type): void
    {
        $fields = $this->getFieldsForType($type->name);

        $template = FormTemplate::create([
            'name' => 'F1 - ' . $type->name,
            'description' => 'Formulir Permintaan Pembuatan Perjanjian untuk ' . $type->name,
            'contract_type_id' => $type->id,
            'document_type' => 'f1',
            'is_active' => true,
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);

        // 1. Foundational Header (Replacement for Kop Surat)
        $headerGrid = $template->fields()->create([
            'label' => '',
            'name' => 'header_grid',
            'type' => 'grid_x',
            'width' => '100',
            'order' => 0,
            'options' => [
                'grid_cols' => 2,
                'col_sizes' => ['15%', '85%'],
                'border_style' => 'bottom',
                'border_width' => 3,
                'border_color' => '#0f172a',
                'padding_bottom' => 24,
                'gap' => 32
            ]
        ]);

        $headerGrid->children()->create([
            'form_template_id' => $template->id,
            'label' => 'Logo',
            'name' => 'header_logo',
            'type' => 'image',
            'width' => '100',
            'order' => 0,
            'options' => [
                'url' => 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=2117&auto=format&fit=crop',
                'size' => 80,
                'alignment' => 'justify-start'
            ]
        ]);

        $headerGrid->children()->create([
            'form_template_id' => $template->id,
            'label' => 'Institution Details',
            'name' => 'header_details',
            'type' => 'group',
            'width' => '100',
            'order' => 1,
            'options' => ['group_style' => 'frameless']
        ]);

        // Add details inside the group
        $lastChild = $headerGrid->children()->latest()->first();
        $template->fields()->create([
            'label' => 'PT. LENTERA KREASI TEKNOLOGI',
            'name' => 'header_name',
            'type' => 'static_text',
            'parent_id' => $lastChild->id,
            'width' => '100',
            'order' => 0,
            'options' => ['font_size' => 20, 'font_weight' => '900']
        ]);

        $template->fields()->create([
            'label' => "Jl. Sudirman No. 123, SCBD, Jakarta Selatan, 12190\nTelp: (021) 5088 1234 • Email: info@company.com",
            'name' => 'header_address',
            'type' => 'static_text',
            'parent_id' => $lastChild->id,
            'width' => '100',
            'order' => 1,
            'options' => ['font_size' => 10, 'font_weight' => '500', 'color' => '#64748b']
        ]);

        // Form Title
        $template->fields()->create([
            'label' => 'FORMULIR PERMINTAAN PEMBUATAN ' . strtoupper($type->name),
            'name' => 'form_title',
            'type' => 'form_title',
            'width' => '100',
            'order' => 1,
        ]);

        $order = 2;
        foreach ($fields as $groupName => $groupFields) {
            $group = $template->fields()->create([
                'label' => $groupName,
                'name' => Str::snake($groupName),
                'type' => 'group',
                'width' => '100',
                'order' => $order++,
            ]);

            foreach ($groupFields as $idx => $f) {
                $template->fields()->create([
                    'label' => $f['label'],
                    'name' => $f['name'],
                    'type' => $f['type'] ?? 'textfield',
                    'parent_id' => $group->id,
                    'placeholder' => $f['placeholder'] ?? 'Masukkan ' . strtolower($f['label']) . '...',
                    'is_required' => $f['is_required'] ?? false,
                    'width' => '100',
                    'order' => $idx,
                    'options' => array_merge($f['options'] ?? [], [
                        'grid_col_span' => ($f['width'] ?? '1/2') === '1/1' ? 2 : 1
                    ]),
                ]);
            }
            
            // Set group to 2 columns
            $group->update(['options' => ['grid_cols' => 2]]);
        }
    }

    private function getFieldsForType(string $typeName): array
    {
        $baseCore = [
            ['label' => 'Nomor Kontrak', 'name' => 'contract_number', 'type' => 'textfield', 'width' => '1/3'],
            ['label' => 'Judul Kontrak', 'name' => 'contract_title', 'type' => 'textfield', 'width' => '2/3', 'is_required' => true],
            ['label' => 'Mode Transaksi', 'name' => 'transaction_mode', 'type' => 'select', 'options' => ['Perjanjian Baru', 'Addendum', 'Amandement', 'Perubahan Perjanjian'], 'width' => '1/1', 'is_required' => true],
            ['label' => 'Tanggal Mulai', 'name' => 'start_date', 'type' => 'date', 'width' => '1/2'],
            ['label' => 'Tanggal Berakhir', 'name' => 'end_date', 'type' => 'date', 'width' => '1/2'],
        ];

        return ['Informasi Dasar' => $baseCore];
    }

    private function seedHighFidelityPKS(string $userId, ContractType $currentType): void
    {
        $template = FormTemplate::create([
            'name' => 'F1 - ' . $currentType->name,
            'description' => 'Formulir Permintaan Pembuatan Perjanjian (Pure Element) untuk ' . $currentType->name,
            'contract_type_id' => $currentType->id,
            'document_type' => 'f1',
            'is_active' => true,
            'created_by' => $userId,
            'updated_by' => $userId,
            'transaction_type' => 'Baru',
        ]);

        // 1. Foundational Header (Replacement for Kop Surat)
        $headerGrid = $template->fields()->create([
            'label' => '',
            'name' => 'header_pks_grid',
            'type' => 'grid_x',
            'width' => '100',
            'order' => 0,
            'options' => [
                'grid_cols' => 2,
                'col_sizes' => ['15%', '85%'],
                'border_style' => 'bottom',
                'border_width' => 3,
                'border_color' => '#0f172a',
                'padding_bottom' => 24,
                'gap' => 32
            ]
        ]);

        $headerGrid->children()->create([
            'form_template_id' => $template->id,
            'label' => 'Logo',
            'name' => 'header_pks_logo',
            'type' => 'image',
            'width' => '100',
            'order' => 0,
            'options' => [
                'url' => 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=2117&auto=format&fit=crop',
                'size' => 80,
                'alignment' => 'justify-start'
            ]
        ]);

        $headerGrid->children()->create([
            'form_template_id' => $template->id,
            'label' => 'Institution Details',
            'name' => 'header_pks_details',
            'type' => 'group',
            'width' => '100',
            'order' => 1,
            'options' => ['group_style' => 'frameless']
        ]);

        $lastChild = $headerGrid->children()->latest()->first();
        $template->fields()->create([
            'label' => 'PT. ADHITYA SERAYAKORITA',
            'name' => 'header_pks_name',
            'type' => 'static_text',
            'parent_id' => $lastChild->id,
            'width' => '100',
            'order' => 0,
            'options' => ['font_size' => 20, 'font_weight' => '900']
        ]);

        $template->fields()->create([
            'label' => "Kawasan Industri & Pergudangan Marunda Center\nBlok A No. 1, Bekasi, Jawa Barat",
            'name' => 'header_pks_address',
            'type' => 'static_text',
            'parent_id' => $lastChild->id,
            'width' => '100',
            'order' => 1,
            'options' => ['font_size' => 10, 'font_weight' => '500', 'color' => '#64748b']
        ]);

        // 2. Custom F1 Header (using Group + Styling)
        $headerGroup = $template->fields()->create([
            'label' => '',
            'name' => 'f1_header_proxy',
            'type' => 'group',
            'width' => '100',
            'order' => 1,
            'options' => [
                'bg_color' => '#1e293b',
                'padding_top' => 15,
                'padding_bottom' => 15,
                'border_style' => 'solid',
                'border_color' => '#0f172a',
                'border_width' => 2
            ]
        ]);

        $headerGroup->children()->create([
            'form_template_id' => $template->id,
            'label' => 'FORMULIR PERMINTAAN PEMBUATAN PERJANJIAN',
            'name' => 'f1_title_text',
            'type' => 'static_text',
            'width' => '100',
            'order' => 0,
            'options' => [
                'font_size' => 14,
                'font_weight' => '900',
                'alignment' => 'justify-center',
                'color' => '#ffffff'
            ]
        ]);

        // 3. Section A: DATA UMUM
        $groupUmum = $template->fields()->create([
            'label' => 'A. DATA UMUM',
            'name' => 'section_umum',
            'type' => 'group',
            'width' => '100',
            'order' => 2,
            'options' => ['grid_cols' => 2, 'gap' => 16]
        ]);

        $umumFields = [
            ['label' => 'Tanggal Pengajuan', 'name' => 'tanggal_pengajuan', 'type' => 'date'],
            ['label' => 'Judul Kontrak', 'name' => 'judul_kontrak', 'type' => 'textfield'],
            ['label' => 'Nama Pemohon', 'name' => 'nama_pemohon', 'type' => 'textfield'],
            ['label' => 'Departemen', 'name' => 'departemen_pemohon', 'type' => 'textfield'],
        ];

        foreach ($umumFields as $idx => $f) {
            $groupUmum->children()->create([
                'form_template_id' => $template->id,
                'label' => $f['label'],
                'name' => $f['name'],
                'type' => $f['type'],
                'width' => '100',
                'order' => $idx,
            ]);
        }

        // 4. Section B: RINCIAN
        $groupRincian = $template->fields()->create([
            'label' => 'B. RINCIAN PERJANJIAN',
            'name' => 'section_rincian',
            'type' => 'group',
            'width' => '100',
            'order' => 3,
        ]);

        $groupRincian->children()->create([
            'form_template_id' => $template->id,
            'label' => 'Latar Belakang & Tujuan',
            'name' => 'latar_belakang',
            'type' => 'textarea',
            'width' => '100',
            'order' => 0,
        ]);

        // 5. Section C: Signature (using Grid X)
        $sigGrid = $template->fields()->create([
            'label' => 'OTORISASI',
            'name' => 'section_sig',
            'type' => 'grid_x',
            'width' => '100',
            'order' => 4,
            'options' => ['grid_cols' => 3, 'gap' => 20]
        ]);

        $sigs = [
            ['label' => 'Dimohonkan Oleh', 'name' => 'sig_1'],
            ['label' => 'Diperiksa Oleh', 'name' => 'sig_2'],
            ['label' => 'Disetujui Oleh', 'name' => 'sig_3'],
        ];

        foreach ($sigs as $idx => $s) {
            $sigGrid->children()->create([
                'form_template_id' => $template->id,
                'label' => $s['label'],
                'name' => $s['name'],
                'type' => 'signature_box',
                'width' => '100',
                'order' => $idx,
            ]);
        }
    }

    private function seedUniversalF2(string $userId): void
    {
        $template = FormTemplate::create([
            'name' => 'F2 - RESUME DAN PERSETUJUAN (PURE ELEMENT)',
            'description' => 'Formulir F2 resume dan persetujuan menggunakan elemen dasar bergaya professional.',
            'contract_type_id' => null,
            'document_type' => 'f2',
            'is_active' => true,
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);

        // 1. Professional Header Bar
        $header = $template->fields()->create([
            'label' => 'RESUME DAN PERSETUJUAN PERJANJIAN',
            'name' => 'f2_header_text',
            'type' => 'static_text',
            'width' => '100',
            'order' => 0,
            'options' => [
                'font_size' => 16,
                'font_weight' => '900',
                'alignment' => 'justify-center',
                'border_style' => 'bottom',
                'border_width' => 3,
                'padding_bottom' => 10
            ]
        ]);

        // 2. Metadata Grid (using Grid X manually)
        $metaGroup = $template->fields()->create([
            'label' => 'DATA PERJANJIAN',
            'name' => 'meta_group',
            'type' => 'group',
            'width' => '100',
            'order' => 1,
            'options' => [
                'bg_color' => '#f8fafc',
                'border_style' => 'solid',
                'border_color' => '#e2e8f0'
            ]
        ]);

        $row1 = $template->fields()->create([
            'label' => '',
            'name' => 'row_1',
            'type' => 'grid_x',
            'parent_id' => $metaGroup->id,
            'width' => '100',
            'order' => 0,
            'options' => ['grid_cols' => 2, 'col_sizes' => ['30%', '70%'], 'border_style' => 'bottom']
        ]);

        $row1->children()->create([
            'form_template_id' => $template->id,
            'label' => 'Judul Kontrak',
            'name' => 'label_1',
            'type' => 'static_text',
            'width' => '100',
            'order' => 0,
            'options' => ['font_weight' => 'bold']
        ]);

        $row1->children()->create([
            'form_template_id' => $template->id,
            'label' => '{{Judul Kontrak}}',
            'name' => 'val_1',
            'type' => 'static_text',
            'width' => '100',
            'order' => 1,
        ]);

        // Add more rows as needed...

        // 3. Signature Grid
        $sigGrid = $template->fields()->create([
            'label' => 'PERSETUJUAN',
            'name' => 'sig_grid_f2',
            'type' => 'grid_x',
            'width' => '100',
            'order' => 2,
            'options' => ['grid_cols' => 4, 'gap' => 10]
        ]);

        for ($i=1; $i<=4; $i++) {
            $sigGrid->children()->create([
                'form_template_id' => $template->id,
                'label' => 'Pihak ' . $i,
                'name' => 'sig_f2_' . $i,
                'type' => 'signature_box',
                'width' => '100',
                'order' => $i,
            ]);
        }
    }
}
