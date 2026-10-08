<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Columns\BooleanColumn;
use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Fields\Section;
use App\Core\Crud\Fields\SelectInput;
use App\Core\Crud\Fields\TextareaInput;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Fields\ToggleInput;
use App\Core\Crud\Fields\TreeSelectInput;
use App\Core\Crud\Filter;
use App\Core\Crud\Resource;
use App\Models\Master\ContractType;
use App\Models\Master\DashboardType;
use App\Models\Master\Department;
use App\Models\Master\Division;
use App\Models\Master\Role;

class DashboardTypeResource extends Resource
{
    public static string $model = DashboardType::class;

    public static array $with = ['role', 'division', 'department'];

    public static ?string $title = 'Profil Visibilitas Dashboard';

    public static int $formColumns = 3;

    public static ?string $slug = 'dashboard-types';

    public static function table(): array
    {
        return [
            TextColumn::make('name', 'Nama Profil')->sortable()->searchable(),
            TextColumn::make('priority', 'Tingkat Prioritas (Level)')->sortable()->alignCenter(),
            TextColumn::make('role_names', 'Role Akses')->sortable(),
            TextColumn::make('org_group_names', 'Grup Organisasi')->sortable(),
            TextColumn::make('division_names', 'Divisi')->sortable(),
            TextColumn::make('department_names', 'Departemen')->sortable(),
            TextColumn::make('location_names', 'Lokasi')->sortable(),
            TextColumn::make('contract_type_names', 'Filter Tipe Kontrak'),
            TextColumn::make('users_count', 'Total User')->alignRight(),
            BooleanColumn::make('show_overview', 'Ringkasan'),
            BooleanColumn::make('show_workload', 'Beban Kerja'),
            BooleanColumn::make('show_master_data', 'Master Data'),
            BooleanColumn::make('can_create_on_behalf', 'On-Behalf'),
        ];
    }

    public static function form(): array
    {
        return [
            Section::make('Informasi & Identitas Profil Otoritas', [
                TextInput::make('name', 'Nama Profil Otoritas')
                    ->required()
                    ->rules(['string', 'max:255'])
                    ->helperText('Contoh: Otoritas Manager Legal (Khusus Kontrak), Otoritas Procurement, dll.')
                    ->columnSpan(2),
                TextInput::make('priority', 'Tingkat Prioritas (Level)')
                    ->required()
                    ->default(10)
                    ->rules(['required', 'integer', 'min:1'])
                    ->helperText('1 = Prioritas Tertinggi. Angka lebih kecil dievaluasi lebih awal.')
                    ->columnSpan(1),
                TextareaInput::make('description', 'Deskripsi')
                    ->rules(['nullable', 'string'])
                    ->helperText('Penjelasan batasan akses dan visibilitas profil ini.')
                    ->columnSpan(3),
            ])->icon('ShieldCheck'),

            Section::make('Visibilitas Tab Ringkasan & Dashboard', [
                ToggleInput::make('show_overview', 'Ringkasan Dashboard (Overview)')
                    ->default(true)
                    ->icon('LayoutGrid')
                    ->helperText('Menampilkan tab statistik ringkasan dan KPI gabungan seluruh kategori dokumen.'),
                ToggleInput::make('show_workload', 'Beban Kerja (Workload)')
                    ->default(false)
                    ->icon('Briefcase')
                    ->helperText('Menampilkan tab analisa beban kerja dan SLA antrian pengajuan tim / user.'),
                ToggleInput::make('show_master_data', 'Master Data')
                    ->default(false)
                    ->icon('Database')
                    ->helperText('Menampilkan tab akses pintas ke registri master data & matriks referensi.'),
                TreeSelectInput::make('contract_type_ids', 'Batasi Tipe Kontrak yang Ditampilkan (Opsional)')
                    ->multiple(true)
                    ->options(fn () => ContractType::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code', 'parent_id'])->toArray())
                    ->icon('FileText')
                    ->helperText('Pilih hierarki tipe kontrak tertentu yang boleh ditampilkan pada profil dashboard ini. Kosongkan untuk menampilkan seluruh tipe kontrak.')
                    ->columnSpan(3),
            ])->icon('Eye'),

            Section::make('Otoritas & Akses Template Dokumen (Corixa Repository)', [
                ToggleInput::make('template_can_read', 'Lihat & Pratinjau Dokumen Template')
                    ->default(true)
                    ->icon('Eye')
                    ->helperText('Izinkan pengguna melihat direktori folder dan membuka pratinjau dokumen template.'),
                ToggleInput::make('template_can_download', 'Download Dokumen Template')
                    ->default(true)
                    ->icon('Download')
                    ->helperText('Izinkan pengguna mengunduh berkas template kontrak.'),
                ToggleInput::make('template_can_upload', 'Upload Dokumen Template')
                    ->default(false)
                    ->icon('Upload')
                    ->helperText('Izinkan pengguna mengunggah berkas template kontrak baru.'),
                ToggleInput::make('template_can_create_folder', 'Buat Folder & Sub-Folder')
                    ->default(false)
                    ->icon('FolderPlus')
                    ->helperText('Izinkan pengguna membuat folder direktori baru.'),
                ToggleInput::make('template_can_edit', 'Ubah Nama & Pindahkan Dokumen/Folder')
                    ->default(false)
                    ->icon('Edit3')
                    ->helperText('Izinkan pengguna mengubah nama atau memindahkan folder dan file template.'),
                ToggleInput::make('template_can_toggle_visibility', 'Atur Visibilitas Dokumen (Tampil / Sembunyi)')
                    ->default(false)
                    ->icon('EyeOff')
                    ->helperText('Izinkan pengguna mengubah status visibilitas template menjadi Tampil atau Tersembunyi.'),
                ToggleInput::make('template_can_delete', 'Hapus Dokumen & Folder')
                    ->default(false)
                    ->icon('Trash2')
                    ->helperText('Izinkan pengguna menghapus dokumen template atau folder direktori.'),
            ])->icon('FileSpreadsheet'),

            Section::make('Otoritas Buat Pengajuan (On-Behalf)', [
                ToggleInput::make('can_create_on_behalf', 'Izinkan Buat Pengajuan Atas Nama Orang Lain (On-Behalf)')
                    ->default(false)
                    ->icon('UserCheck')
                    ->helperText('Izinkan pengguna dengan profil ini membuat dan mengajukan draft kontrak atas nama requester/personil lain.')
                    ->columnSpan(3),
            ])->icon('UserCheck'),
        ];
    }

    public static function filters(): array
    {
        return [
            Filter::make('role_ids', 'Role Akses')
                ->type('searchable')
                ->options(fn () => Role::orderBy('name')->pluck('name', 'id')->toArray()),
            Filter::make('division_ids', 'Divisi')
                ->type('searchable')
                ->options(fn () => Division::orderBy('name')->pluck('name', 'id')->toArray()),
            Filter::make('department_ids', 'Departemen')
                ->type('searchable')
                ->options(fn () => Department::where('is_used', true)->orderBy('name')->pluck('name', 'id')->toArray()),
        ];
    }
}
