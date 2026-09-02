<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Columns\BooleanColumn;
use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Fields\Section;
use App\Core\Crud\Fields\SelectInput;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Fields\ToggleInput;
use App\Core\Crud\Filters\Filter;
use App\Core\Crud\Resource;
use App\Exports\UsersExport;
use App\Imports\UsersImport;
use App\Models\Company;
use App\Models\CompanyGroup;
use App\Models\ContractFilterTemplate;
use App\Models\Department;
use App\Models\JobLevel;
use App\Models\JobTitle;
use App\Models\Location;
use App\Models\Region;
use App\Models\Role;
use App\Models\User;

class UserResource extends Resource
{
    public static string $model = User::class;

    public static ?string $exportClass = UsersExport::class;

    public static ?string $importClass = UsersImport::class;

    public static array $with = ['roleRelation'];

    public static ?string $title = 'Registri Otoritas Pengguna';

    public static int $formColumns = 3;

    public static ?string $slug = 'users';

    public static function table(): array
    {
        return [
            TextColumn::make('nik', 'NIK')->sortable()->searchable(),
            TextColumn::make('name', 'Nama Karyawan')->sortable()->searchable(),
            TextColumn::make('email', 'Email')->sortable()->searchable(),
            TextColumn::make('username', 'Username')->sortable()->searchable(),
            TextColumn::make('org_name', 'Departemen')->sortable()->searchable(),
            TextColumn::make('division_name', 'Divisi')->sortable()->searchable(),
            TextColumn::make('jobtitle_name', 'Jabatan (Job Title)')->sortable()->searchable(),
            TextColumn::make('joblevel_name', 'Level (Job Level)')->sortable()->searchable(),
            TextColumn::make('role_name', 'Role Akses')->sortable()->searchable(),
            TextColumn::make('company_name', 'Perusahaan')->sortable()->searchable(),
            TextColumn::make('company_group_code', 'Grup Perusahaan')->sortable()->searchable(),
            TextColumn::make('location_name', 'Lokasi Kerja')->sortable()->searchable(),
            TextColumn::make('region_name', 'Wilayah (Region)')->sortable()->searchable(),
            BooleanColumn::make('is_used', 'Sistem'),
            BooleanColumn::make('is_active', 'Portal'),
        ];
    }

    public static function form(): array
    {
        return [
            Section::make('Informasi Karyawan (Portal)', [
                TextInput::make('nik', 'NIK')
                    ->rules(['nullable', 'string', 'max:50'])
                    ->helperText('Nomor Induk Karyawan.'),
                TextInput::make('name', 'Nama Karyawan')
                    ->required()
                    ->rules(['string', 'max:255'])
                    ->helperText('Nama lengkap karyawan.'),
                TextInput::make('email', 'Email Kantor')
                    ->required()
                    ->rules(['email'])
                    ->helperText('Alamat email kantor (officeMail).'),
                TextInput::make('mobile_no', 'No. Handphone')
                    ->rules(['nullable', 'string', 'max:50'])
                    ->helperText('Nomor ponsel / mobile.'),
                SelectInput::make('gender', 'Jenis Kelamin')
                    ->options([
                        'M' => 'M - Laki-Laki (Male)',
                        'F' => 'F - Perempuan (Female)',
                    ])
                    ->placeholder('Pilih Jenis Kelamin (M / F)...')
                    ->rules(['nullable', 'string', 'max:10']),
                SelectInput::make('job_position_id', 'Jabatan (Job Title)')
                    ->options(fn () => JobTitle::where('is_used', true)->orderBy('name')->pluck('name', 'id')->toArray())
                    ->searchable()
                    ->placeholder('Pilih Jabatan...')
                    ->helperText('Posisi jabatan terhubung ke Master Job Title.'),
                SelectInput::make('job_level_id', 'Level Jabatan (Job Level)')
                    ->options(fn () => JobLevel::where('is_used', true)->orderBy('name')->pluck('name', 'id')->toArray())
                    ->searchable()
                    ->placeholder('Pilih Level Jabatan...')
                    ->helperText('Tingkat jabatan terhubung ke Master Job Level.'),
                TextInput::make('reporting_to', 'Atasan Langsung (Reporting To)')
                    ->rules(['nullable', 'string', 'max:255']),
            ])->icon('User'),

            Section::make('Penempatan & Organisasi', [
                SelectInput::make('company_name', 'Perusahaan (Company)')
                    ->options(fn () => Company::where('is_used', true)->orderBy('name')->whereNotNull('name')->pluck('name', 'name')->toArray())
                    ->meta([
                        'company_map' => Company::where('is_used', true)->whereNotNull('name')->get()->keyBy('name')->map(fn ($c) => [
                            'group_name' => $c->company_group_name,
                            'region_name' => $c->region_name,
                        ])->toArray(),
                    ])
                    ->searchable()
                    ->placeholder('Pilih Perusahaan...')
                    ->rules(['nullable', 'string', 'max:255'])
                    ->helperText('Group perusahaan dan region akan otomatis disesuaikan dengan master unit bisnis.'),
                TextInput::make('company_group_name', 'Grup Perusahaan (Group)')
                    ->type('readonly')
                    ->helperText('Otomatis terisi dari master bisnis unit/perusahaan.')
                    ->columnSpan(1),
                TextInput::make('region_name', 'Wilayah (Region)')
                    ->type('readonly')
                    ->helperText('Otomatis terisi dari master bisnis unit/perusahaan.')
                    ->columnSpan(1),
                SelectInput::make('location_id', 'Lokasi Kerja')
                    ->options(fn () => Location::where('is_used', true)->orderBy('name')->pluck('name', 'id')->toArray())
                    ->searchable()
                    ->placeholder('Pilih Lokasi Kerja...')
                    ->helperText('Lokasi penempatan kerja terhubung ke Master Lokasi.'),
                SelectInput::make('department_id', 'Departemen / Unit Organisasi')
                    ->options(fn () => Department::where('is_used', true)->orderBy('name')->pluck('name', 'id')->toArray())
                    ->searchable()
                    ->placeholder('Pilih Departemen...')
                    ->helperText('Unit organisasi terhubung ke Master Departemen.'),
                SelectInput::make('role_id', 'Role Akses Sistem')
                    ->required()
                    ->options(fn () => Role::orderBy('name')->pluck('name', 'id')->toArray())
                    ->helperText('Role kewenangan di dalam sistem aplikasi.'),
                ToggleInput::make('is_used', 'Sistem')
                    ->default(false)
                    ->helperText('Digunakan di dalam aplikasi ini.'),
                ToggleInput::make('is_active', 'Portal')
                    ->default(true)
                    ->helperText('Status aktif dari data portal master.'),
            ])->icon('Building2'),

            Section::make('Konfigurasi Akun & Keamanan', [
                TextInput::make('username', 'Username')
                    ->required()
                    ->rules(['string', 'max:50'])
                    ->helperText('Username login aplikasi.'),
                TextInput::make('password', 'Password')
                    ->rules(['nullable', 'string', 'min:8'])
                    ->placeholder('Kosongkan jika tidak ingin mengubah password')
                    ->helperText('Minimal 8 karakter.'),
                SelectInput::make('contract_filter_template_id', 'Template Filter Kontrak')
                    ->options(fn () => ContractFilterTemplate::orderBy('name')->pluck('name', 'id')->toArray())
                    ->placeholder('Pilih Template Filter...')
                    ->helperText('Template pembatasan akses dokumen kontrak.'),
            ])->icon('Settings2'),
        ];
    }

    public static function filters(): array
    {
        return [
            Filter::make('department_id', 'Departemen')
                ->type('searchable')
                ->options(function () {
                    $options = ['__empty__' => '- (Tanpa Departemen / Kosong)'];

                    return $options + Department::where('is_used', true)->orderBy('name')->whereNotNull('name')->pluck('name', 'id')->toArray();
                }),
            Filter::make('job_position_id', 'Jabatan (Job Title)')
                ->type('searchable')
                ->options(function () {
                    $options = ['__empty__' => '- (Tanpa Jabatan / Kosong)'];

                    return $options + JobTitle::where('is_used', true)->orderBy('name')->pluck('name', 'id')->toArray();
                }),
            Filter::make('job_level_id', 'Level Jabatan (Job Level)')
                ->type('searchable')
                ->options(function () {
                    $options = ['__empty__' => '- (Tanpa Level / Kosong)'];

                    return $options + JobLevel::where('is_used', true)->orderBy('name')->pluck('name', 'id')->toArray();
                }),
            Filter::make('location_id', 'Lokasi Kerja')
                ->type('searchable')
                ->options(function () {
                    $options = ['__empty__' => '- (Tanpa Lokasi / Kosong)'];

                    return $options + Location::where('is_used', true)->orderBy('name')->pluck('name', 'id')->toArray();
                }),
            Filter::make('company_group_id', 'Grup Perusahaan')
                ->type('searchable')
                ->options(function () {
                    $options = ['__empty__' => '- (Tanpa Grup / Kosong)'];

                    return $options + CompanyGroup::where('is_used', true)->orderBy('name')->pluck('name', 'id')->toArray();
                }),
            Filter::make('region_id', 'Wilayah (Region)')
                ->type('searchable')
                ->options(function () {
                    $options = ['__empty__' => '- (Tanpa Wilayah / Kosong)'];

                    return $options + Region::where('is_used', true)->orderBy('name')->pluck('name', 'id')->toArray();
                }),
            Filter::make('company_id', 'Perusahaan (Company)')
                ->type('searchable')
                ->options(function () {
                    $options = ['__empty__' => '- (Tanpa Perusahaan / Kosong)'];

                    return $options + Company::where('is_used', true)->orderBy('name')->pluck('name', 'id')->toArray();
                }),
            Filter::make('role_id', 'Role Akses')
                ->type('searchable')
                ->options(fn () => Role::orderBy('name')->pluck('name', 'id')->toArray()),
            Filter::make('gender', 'Jenis Kelamin')
                ->options([
                    'M' => 'M - Laki-Laki (Male)',
                    'F' => 'F - Perempuan (Female)',
                ]),
            Filter::make('is_used', 'Status Sistem')
                ->options([
                    '1' => 'Digunakan (Ya)',
                    '0' => 'Tidak Digunakan',
                ]),
            Filter::make('is_active', 'Status Portal')
                ->options([
                    '1' => 'Aktif',
                    '0' => 'Nonaktif',
                ]),
        ];
    }
}
