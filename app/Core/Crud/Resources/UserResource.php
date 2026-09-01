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
use App\Models\Department;
use App\Models\Division;
use App\Models\Region;
use App\Models\Role;
use App\Models\User;

class UserResource extends Resource
{
    public static string $model = User::class;

    public static ?string $exportClass = UsersExport::class;

    public static ?string $importClass = UsersImport::class;

    public static array $with = ['roleRelation', 'department', 'division', 'company', 'companyGroup', 'region'];

    public static ?string $title = 'Registri Otoritas Pengguna';

    public static int $formColumns = 2;

    public static ?string $slug = 'users';

    public static function table(): array
    {
        return [
            TextColumn::make('name', 'Karyawan & Akun')->sortable()->searchable(),
            TextColumn::make('jobtitle_name', 'Jabatan & Akses')->sortable()->searchable(),
            TextColumn::make('company_name', 'Penempatan & Organisasi')->sortable()->searchable(),
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
                TextInput::make('gender', 'Jenis Kelamin (L/P)')
                    ->rules(['nullable', 'string', 'max:10']),
                TextInput::make('jobtitle_name', 'Jabatan (Job Title)')
                    ->rules(['nullable', 'string', 'max:255']),
                TextInput::make('joblevel_name', 'Level Jabatan (Job Level)')
                    ->rules(['nullable', 'string', 'max:255']),
                TextInput::make('reporting_to', 'Atasan Langsung (Reporting To)')
                    ->rules(['nullable', 'string', 'max:255']),
            ])->icon('User'),

            Section::make('Penempatan & Organisasi', [
                SelectInput::make('company_name', 'Perusahaan (Company)')
                    ->options(fn () => Company::orderBy('name')->whereNotNull('name')->pluck('name', 'name')->toArray())
                    ->meta([
                        'company_map' => Company::whereNotNull('name')->get()->keyBy('name')->map(fn ($c) => [
                            'group_name'  => $c->company_group_name,
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
                TextInput::make('location_name', 'Lokasi Kerja')
                    ->rules(['nullable', 'string', 'max:255']),
                TextInput::make('org_name', 'Unit Organisasi')
                    ->rules(['nullable', 'string', 'max:255']),
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
                    ->options(fn () => \App\Models\ContractFilterTemplate::orderBy('name')->pluck('name', 'id')->toArray())
                    ->placeholder('Pilih Template Filter...')
                    ->helperText('Template pembatasan akses dokumen kontrak.'),
            ])->icon('Settings2'),
        ];
    }

    public static function filters(): array
    {
        return [
            Filter::make('company_group_id', 'Grup Perusahaan')
                ->type('searchable')
                ->options(fn () => \App\Models\CompanyGroup::orderBy('name')->pluck('name', 'id')->toArray()),
            Filter::make('region_id', 'Wilayah (Region)')
                ->type('searchable')
                ->options(fn () => \App\Models\Region::orderBy('name')->pluck('name', 'id')->toArray()),
            Filter::make('company_id', 'Perusahaan (Company)')
                ->type('searchable')
                ->options(fn () => \App\Models\Company::orderBy('name')->pluck('name', 'id')->toArray()),
            Filter::make('role_id', 'Role Akses')
                ->type('searchable')
                ->options(fn () => Role::orderBy('name')->pluck('name', 'id')->toArray()),
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
