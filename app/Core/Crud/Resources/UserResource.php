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
use App\Models\BusinessUnit;
use App\Models\Company;
use App\Models\CompanyGroup;
use App\Models\ContractFilterTemplate;
use App\Models\DashboardType;
use App\Models\Department;
use App\Models\Division;
use App\Models\JobLevel;
use App\Models\JobLevelGroup;
use App\Models\JobTitle;
use App\Models\Location;
use App\Models\OrganizationGroup;
use App\Models\Region;
use App\Models\Role;
use App\Models\User;

class UserResource extends Resource
{
    public static string $model = User::class;

    public static ?string $exportClass = UsersExport::class;

    public static ?string $importClass = UsersImport::class;

    public static array $with = ['roleRelation', 'division', 'department', 'company', 'reportingTo'];

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
            TextColumn::make('org_group_name', 'Group Organisasi')->sortable()->searchable(),
            TextColumn::make('org_name', 'Departemen')->sortable()->searchable(),
            TextColumn::make('division_name', 'Divisi')->sortable()->searchable(),
            TextColumn::make('jobtitle_name', 'Jabatan (Job Title)')->sortable()->searchable(),
            TextColumn::make('joblevel_name', 'Level (Job Level)')->sortable()->searchable(),
            TextColumn::make('supervisor_name', 'Atasan Langsung')->sortable()->searchable(),
            TextColumn::make('supervisor_job_title', 'Jabatan Atasan')->sortable()->searchable(),
            TextColumn::make('supervisor_job_level', 'Level Atasan')->sortable()->searchable(),
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
            Section::make('1. Data Karyawan & Organisasi (Sinkronisasi Master Portal)', [
                TextInput::make('nik', 'NIK')
                    ->rules(['nullable', 'string', 'max:50'])
                    ->helperText('Nomor Induk Karyawan dari master portal/HRIS.'),
                TextInput::make('name', 'Nama Karyawan (employeeName)')
                    ->required()
                    ->rules(['string', 'max:255'])
                    ->helperText('Nama lengkap karyawan.'),
                TextInput::make('email', 'Email Kantor (officeMail)')
                    ->required()
                    ->rules(['email'])
                    ->helperText('Alamat email kantor resmi.'),
                TextInput::make('mobile_no', 'No. Handphone (mobileNo)')
                    ->rules(['nullable', 'string', 'max:50'])
                    ->helperText('Nomor kontak / WhatsApp.'),
                SelectInput::make('gender', 'Jenis Kelamin (gender)')
                    ->options([
                        'M' => 'M - Laki-Laki (Male)',
                        'F' => 'F - Perempuan (Female)',
                    ])
                    ->placeholder('Pilih Jenis Kelamin (M / F)...')
                    ->rules(['nullable', 'string', 'max:10']),
                SelectInput::make('department_id', 'Departemen / Organisasi (orgName)')
                    ->options(fn () => Department::where('is_used', true)->orderBy('name')->pluck('name', 'id')->toArray())
                    ->searchable()
                    ->placeholder('Pilih Departemen...')
                    ->helperText('Unit organisasi dari master portal.'),
                SelectInput::make('job_position_id', 'Jabatan (jobtitleName)')
                    ->options(function () {
                        return JobTitle::where('is_used', true)
                            ->with('jobLevel')
                            ->orderBy('name')
                            ->get()
                            ->mapWithKeys(function ($jt) {
                                $level = $jt->jobLevel?->name ?? $jt->getRawOriginal('job_level_name');
                                $label = $level ? "{$jt->name} ({$level})" : $jt->name;

                                return [$jt->id => $label];
                            })
                            ->toArray();
                    })
                    ->meta([
                        'job_title_map' => JobTitle::where('is_used', true)->with('jobLevel')->get()->keyBy('id')->map(fn ($jt) => [
                            'job_level_id' => $jt->job_level_id,
                            'job_level_name' => $jt->jobLevel?->name ?? $jt->getRawOriginal('job_level_name') ?? '',
                        ])->toArray(),
                    ])
                    ->searchable()
                    ->placeholder('Pilih Jabatan...')
                    ->helperText('Posisi jabatan terhubung ke Master Job Title portal.'),
                TextInput::make('joblevel_name', 'Level Jabatan (joblevelName)')
                    ->type('readonly')
                    ->helperText('Otomatis terisi dari jabatan yang dipilih.')
                    ->columnSpan(1),
                SelectInput::make('location_id', 'Lokasi Kerja (locationName)')
                    ->options(fn () => Location::where('is_used', true)->orderBy('name')->pluck('name', 'id')->toArray())
                    ->meta([
                        'location_map' => Location::where('is_used', true)->get()->keyBy('id')->map(function ($loc) {
                            $bu = BusinessUnit::where('location_id', $loc->id)
                                ->orWhere('idlocation', $loc->idlocation)
                                ->whereNotNull('company_name')
                                ->first();

                            return [
                                'location_name' => $loc->name,
                                'idlocation' => $loc->idlocation,
                                'business_unit_id' => $bu?->id,
                                'company_name' => $bu?->company_name ?? '',
                                'company_id' => $bu?->company_id ?? '',
                                'idcompany' => $bu?->idcompany ?? null,
                                'company_group_name' => $bu?->company_group_name ?? ($loc->company_group_name ?? ''),
                                'company_group_id' => $bu?->company_group_id ?? ($loc->company_group_id ?? ''),
                                'region_name' => $bu?->region_name ?? '',
                                'region_id' => $bu?->region_id ?? '',
                            ];
                        })->toArray(),
                    ])
                    ->searchable()
                    ->placeholder('Pilih Lokasi Kerja...')
                    ->helperText('Lokasi penempatan kerja dari master portal.'),
                SelectInput::make('company_id', 'Perusahaan (companyName)')
                    ->options(fn () => Company::where('is_used', true)->orderBy('name')->pluck('name', 'id')->toArray())
                    ->meta([
                        'company_map' => Company::where('is_used', true)->with(['companyGroup', 'region'])->get()->keyBy('id')->map(function ($comp) {
                            return [
                                'name' => $comp->name,
                                'idcompany' => $comp->idcompany,
                                'company_group_name' => $comp->company_group_name ?? ($comp->companyGroup?->name ?? ''),
                                'company_group_id' => $comp->company_group_id,
                                'region_name' => $comp->region_name ?? ($comp->region?->name ?? ''),
                                'region_id' => $comp->region_id,
                            ];
                        })->toArray(),
                    ])
                    ->searchable()
                    ->placeholder('Pilih Perusahaan...')
                    ->helperText('Perusahaan tempat karyawan ditempatkan.')
                    ->columnSpan(1),
                TextInput::make('company_group_name', 'Grup Perusahaan (Group)')
                    ->type('readonly')
                    ->helperText('Otomatis terisi dari unit bisnis.')
                    ->columnSpan(1),
                TextInput::make('region_name', 'Wilayah (Region)')
                    ->type('readonly')
                    ->helperText('Otomatis terisi dari unit bisnis.')
                    ->columnSpan(1),
                TextInput::make('reporting_to', 'Atasan Langsung (reportingTo)')
                    ->rules(['nullable', 'string', 'max:255'])
                    ->helperText('Atasan langsung dari master portal.'),
                ToggleInput::make('is_active', 'Status Keaktifan di Portal')
                    ->default(true)
                    ->helperText('Status aktif karyawan dari database master portal.'),
            ])->icon('UserCheck'),

            Section::make('2. Konfigurasi Otoritas & Akses Sistem (Internal Aplikasi)', [
                SelectInput::make('division_id', 'Divisi Internal Sistem')
                    ->options(fn () => Division::orderBy('name')->pluck('name', 'id')->toArray())
                    ->searchable()
                    ->placeholder('Pilih Divisi...')
                    ->helperText('Unit divisi untuk scoping data dashboard dan alur workflow legal/kontrak.'),
                SelectInput::make('role_id', 'Role Hak Akses Sistem')
                    ->required()
                    ->options(fn () => Role::orderBy('name')->pluck('name', 'id')->toArray())
                    ->placeholder('Pilih Role Kewenangan...')
                    ->helperText('Menentukan hak akses modul dan matriks kebijakan sistem.'),
                TextInput::make('username', 'Username Login')
                    ->required()
                    ->rules(['string', 'max:50'])
                    ->helperText('Username untuk login ke aplikasi sistem kontrak.'),
                TextInput::make('password', 'Kata Sandi (Password)')
                    ->rules(['nullable', 'string', 'min:8'])
                    ->placeholder('Kosongkan jika tidak ingin mengubah password')
                    ->helperText('Minimal 8 karakter.'),
                ToggleInput::make('is_used', 'Aktifkan Pengguna di Sistem Ini')
                    ->default(false)
                    ->helperText('Jika Ya, user diizinkan login dan bertransaksi di aplikasi ini.'),
            ])->icon('ShieldCheck'),
        ];
    }

    public static function filters(): array
    {
        return [
            Filter::make('division_id', 'Divisi')
                ->type('searchable')
                ->options(function () {
                    $options = ['__empty__' => '- (Tanpa Divisi / Kosong)'];

                    return $options + Division::orderBy('name')->whereNotNull('name')->pluck('name', 'id')->toArray();
                }),
            Filter::make('department_id', 'Departemen')
                ->type('searchable')
                ->options(function () {
                    $options = ['__empty__' => '- (Tanpa Departemen / Kosong)'];

                    return $options + Department::where('is_used', true)->orderBy('name')->whereNotNull('name')->pluck('name', 'id')->toArray();
                }),
            Filter::make('organization_group_id', 'Group Organisasi')
                ->type('searchable')
                ->options(function () {
                    $options = ['__empty__' => '- (Tanpa Group / Kosong)'];

                    return $options + OrganizationGroup::where('is_used', true)->orderBy('name')->pluck('name', 'id')->toArray();
                }),
            Filter::make('job_position_id', 'Jabatan (Job Title)')
                ->type('searchable')
                ->options(function () {
                    $options = ['__empty__' => '- (Tanpa Jabatan / Kosong)'];

                    $jobTitles = JobTitle::where('is_used', true)
                        ->with('jobLevel')
                        ->orderBy('name')
                        ->get()
                        ->mapWithKeys(function ($jt) {
                            $level = $jt->jobLevel?->name ?? $jt->getRawOriginal('job_level_name');
                            $label = $level ? "{$jt->name} ({$level})" : $jt->name;

                            return [$jt->id => $label];
                        })
                        ->toArray();

                    return $options + $jobTitles;
                }),
            Filter::make('job_level_id', 'Level Jabatan (Job Level)')
                ->type('searchable')
                ->options(function () {
                    $options = ['__empty__' => '- (Tanpa Level / Kosong)'];

                    return $options + JobLevel::where('is_used', true)->orderBy('name')->pluck('name', 'id')->toArray();
                }),
            Filter::make('job_level_group_id', 'Group Level Jabatan')
                ->type('searchable')
                ->options(function () {
                    $options = ['__empty__' => '- (Tanpa Group Level / Kosong)'];

                    return $options + JobLevelGroup::where('is_used', true)->orderBy('name')->pluck('name', 'id')->toArray();
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
