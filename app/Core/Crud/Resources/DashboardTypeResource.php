<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Columns\BooleanColumn;
use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Fields\Section;
use App\Core\Crud\Fields\SelectInput;
use App\Core\Crud\Fields\TextareaInput;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Fields\ToggleInput;
use App\Core\Crud\Filters\Filter;
use App\Core\Crud\Resource;
use App\Models\BusinessUnit;
use App\Models\Company;
use App\Models\CompanyGroup;
use App\Models\ContractType;
use App\Models\DashboardType;
use App\Models\Department;
use App\Models\Division;
use App\Models\JobLevel;
use App\Models\JobTitle;
use App\Models\Region;
use App\Models\Role;

class DashboardTypeResource extends Resource
{
    public static string $model = DashboardType::class;

    public static array $with = ['role', 'division', 'department'];

    public static ?string $title = 'Tipe Dashboard';

    public static int $formColumns = 3;

    public static ?string $slug = 'dashboard-types';

    public static function table(): array
    {
        return [
            TextColumn::make('name', 'Nama Tipe')->sortable()->searchable(),
            TextColumn::make('contract_type_names', 'Tipe Kontrak')->sortable(),
            TextColumn::make('role_names', 'Role Akses')->sortable(),
            TextColumn::make('division_names', 'Divisi')->sortable(),
            TextColumn::make('department_names', 'Departemen')->sortable(),
            TextColumn::make('users_count', 'Total User')->alignRight(),
            BooleanColumn::make('show_overview', 'Ringkasan (Semua)'),
            BooleanColumn::make('show_overview_contract', 'Ringkasan Kontrak'),
            BooleanColumn::make('show_overview_non_contract', 'Ringkasan Non Kontrak'),
            BooleanColumn::make('show_overview_nda', 'Ringkasan NDA'),
            BooleanColumn::make('show_workload', 'Beban Kerja'),
            BooleanColumn::make('show_master_data', 'Master Data'),
        ];
    }

    public static function form(): array
    {
        return [
            Section::make('Informasi & Identitas Konfigurasi', [
                TextInput::make('name', 'Nama Tipe Dashboard')
                    ->required()
                    ->rules(['string', 'max:255'])
                    ->helperText('Contoh: Dashboard Manager Vendor, Dashboard Procurement, dll.'),
                TextareaInput::make('description', 'Deskripsi')
                    ->rules(['nullable', 'string'])
                    ->helperText('Penjelasan peruntukan tipe dashboard ini.')
                    ->columnSpan(2),
            ])->icon('LayoutDashboard'),

            Section::make('Target Pengguna (User Matrix)', [
                SelectInput::make('role_ids', 'Role Akses')
                    ->multiple(true)
                    ->options(fn () => Role::orderBy('name')->pluck('name', 'id')->toArray())
                    ->placeholder('Pilih satu atau lebih Role...')
                    ->searchable()
                    ->helperText('Kosongkan jika berlaku untuk semua role.'),
                SelectInput::make('job_level_ids', 'Level Jabatan (Job Level)')
                    ->multiple(true)
                    ->options(fn () => JobLevel::where('is_used', true)->orderBy('name')->pluck('name', 'id')->toArray())
                    ->placeholder('Pilih satu atau lebih Level Jabatan...')
                    ->searchable()
                    ->helperText('Kosongkan jika berlaku untuk semua level jabatan.'),
                SelectInput::make('job_title_ids', 'Jabatan (Job Title)')
                    ->multiple(true)
                    ->options(fn () => JobTitle::where('is_used', true)->orderBy('name')->pluck('name', 'id')->toArray())
                    ->placeholder('Pilih satu atau lebih Jabatan...')
                    ->searchable()
                    ->helperText('Kosongkan jika berlaku untuk semua jabatan.'),
            ])->icon('Users'),

            Section::make('Cakupan Dokumen & Pengajuan (Document Scoping)', [
                SelectInput::make('contract_type_ids', 'Tipe Kontrak')
                    ->multiple(true)
                    ->options(fn () => ContractType::orderBy('name')->pluck('name', 'id')->toArray())
                    ->placeholder('Pilih satu atau lebih Tipe Kontrak...')
                    ->searchable()
                    ->helperText('Hanya pengajuan dengan tipe kontrak yang dipilih yang akan dihitung & ditampilkan pada dashboard user. Kosongkan untuk semua tipe.'),
                SelectInput::make('categories', 'Kategori Pengajuan')
                    ->multiple(true)
                    ->options([
                        'contract' => 'Kontrak',
                        'non-contract' => 'Non Kontrak',
                        'nda' => 'NDA',
                    ])
                    ->placeholder('Pilih Kategori...')
                    ->helperText('Kosongkan jika mencakup semua kategori.'),
            ])->icon('FileText'),

            Section::make('Cakupan Organisasi & Dynamic Scoping', [
                SelectInput::make('division_ids', 'Divisi')
                    ->multiple(true)
                    ->options(fn () => Division::orderBy('name')->pluck('name', 'id')->toArray())
                    ->placeholder('Pilih satu atau lebih Divisi...')
                    ->searchable()
                    ->helperText('Pilih divisi spesifik atau aktifkan switch "Sesuai Profil User" di kanan atas.'),
                SelectInput::make('department_ids', 'Departemen')
                    ->multiple(true)
                    ->options(fn () => Department::where('is_used', true)->orderBy('name')->pluck('name', 'id')->toArray())
                    ->placeholder('Pilih satu atau lebih Departemen...')
                    ->searchable()
                    ->helperText('Pilih departemen spesifik atau aktifkan switch "Sesuai Profil User" di kanan atas.'),
                SelectInput::make('company_ids', 'Perusahaan (Company)')
                    ->multiple(true)
                    ->options(fn () => Company::orderBy('name')->pluck('name', 'id')->toArray())
                    ->placeholder('Pilih Perusahaan...')
                    ->searchable()
                    ->helperText('Pilih perusahaan spesifik atau aktifkan switch "Sesuai Profil User" di kanan atas.'),
                SelectInput::make('company_group_ids', 'Grup Perusahaan')
                    ->multiple(true)
                    ->options(fn () => CompanyGroup::orderBy('name')->pluck('name', 'id')->toArray())
                    ->placeholder('Pilih Grup Perusahaan...')
                    ->searchable()
                    ->helperText('Pilih grup perusahaan spesifik atau aktifkan switch "Sesuai Profil User" di kanan atas.'),
                SelectInput::make('region_ids', 'Region / Wilayah')
                    ->multiple(true)
                    ->options(fn () => Region::orderBy('name')->pluck('name', 'id')->toArray())
                    ->placeholder('Pilih Wilayah (Region)...')
                    ->searchable()
                    ->helperText('Pilih region spesifik atau aktifkan switch "Sesuai Profil User" di kanan atas.'),
                SelectInput::make('business_unit_ids', 'Unit Bisnis (Business Unit)')
                    ->multiple(true)
                    ->options(fn () => BusinessUnit::orderBy('name')->pluck('name', 'id')->toArray())
                    ->placeholder('Pilih Unit Bisnis...')
                    ->searchable()
                    ->helperText('Kosongkan untuk mencakup semua unit bisnis.'),
            ])->icon('Building2'),

            Section::make('Konfigurasi Visibility Tab Dashboard', [
                ToggleInput::make('show_overview', 'Ringkasan Semua (Gabungan)')
                    ->default(false)
                    ->icon('LayoutGrid')
                    ->helperText('Menampilkan tab statistik ringkasan dan KPI gabungan seluruh kategori dokumen.'),
                ToggleInput::make('show_overview_contract', 'Ringkasan Kontrak')
                    ->default(false)
                    ->icon('FileText')
                    ->helperText('Menampilkan tab statistik khusus dokumen bertipe Kontrak Vendor / Rekanan.'),
                ToggleInput::make('show_overview_non_contract', 'Ringkasan Non Kontrak')
                    ->default(false)
                    ->icon('Files')
                    ->helperText('Menampilkan tab statistik khusus dokumen operasional Non-Kontrak.'),
                ToggleInput::make('show_overview_nda', 'Ringkasan NDA')
                    ->default(false)
                    ->icon('ShieldCheck')
                    ->helperText('Menampilkan tab statistik khusus perjanjian Non-Disclosure Agreement.'),
                ToggleInput::make('show_workload', 'Beban Kerja (Workload)')
                    ->default(false)
                    ->icon('Briefcase')
                    ->helperText('Menampilkan tab analisa beban kerja dan SLA antrian pengajuan tim / user.'),
                ToggleInput::make('show_master_data', 'Master Data')
                    ->default(false)
                    ->icon('Database')
                    ->helperText('Menampilkan tab akses pintas ke registri master data & matriks referensi.'),
            ])->icon('Eye'),
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
