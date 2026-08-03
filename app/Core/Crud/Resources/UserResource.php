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

    public static array $with = ['roleRelation', 'department', 'division', 'company', 'region'];

    public static ?string $title = 'Registri Otoritas Pengguna';

    public static int $formColumns = 2;

    public static ?string $slug = 'users';

    public static function table(): array
    {
        return [
            TextColumn::make('name', 'Nama')->sortable()->searchable(),
            TextColumn::make('username', 'Username')->sortable()->searchable(),
            TextColumn::make('email', 'Email')->sortable()->searchable(),
            TextColumn::make('role_relation.name', 'Role')->sortable(),
            TextColumn::make('division.name', 'Divisi')->sortable(),
            TextColumn::make('department.name', 'Departemen')->sortable(),
            TextColumn::make('region.name', 'Regional')->sortable(),
            BooleanColumn::make('is_active', 'Status Aktif'),
        ];
    }

    public static function form(): array
    {
        return [
            Section::make('Informasi Akun', [
                TextInput::make('name', 'Nama')
                    ->required()
                    ->rules(['string', 'max:255']),
                TextInput::make('email', 'Email')
                    ->required()
                    ->rules(['email']),
                TextInput::make('username', 'Username')
                    ->required()
                    ->rules(['string', 'max:50']),
                TextInput::make('password', 'Password')
                    ->rules(['nullable', 'string', 'min:8'])
                    ->placeholder('Kosongkan jika tidak ingin mengubah password'),
                TextInput::make('phone_number', 'No. Telepon')
                    ->rules(['nullable', 'string']),
                ToggleInput::make('is_active', 'Status Aktif')
                    ->default(true),
            ])->icon('User'),

            Section::make('Struktur Organisasi', [
                SelectInput::make('role_id', 'Role Akses')
                    ->required()
                    ->options(fn () => Role::orderBy('name')->pluck('name', 'id')->toArray()),
                SelectInput::make('division_id', 'Divisi')
                    ->options(fn () => Division::orderBy('name')->pluck('name', 'id')->toArray()),
                SelectInput::make('department_id', 'Departemen')
                    ->options(fn () => Department::orderBy('name')->pluck('name', 'id')->toArray()),
                SelectInput::make('company_id', 'Perusahaan PT')
                    ->options(fn () => Company::orderBy('name')->pluck('name', 'id')->toArray()),
                SelectInput::make('company_group_id', 'Holding / Group')
                    ->options(fn () => CompanyGroup::orderBy('name')->pluck('name', 'id')->toArray()),
                SelectInput::make('region_id', 'Regional')
                    ->options(fn () => Region::orderBy('name')->pluck('name', 'id')->toArray()),
            ])->icon('Building2'),

            Section::make('Konfigurasi Filter Kontrak', [
                SelectInput::make('contract_filter_template_id', 'Template Filter Kontrak')
                    ->options(fn () => \App\Models\ContractFilterTemplate::orderBy('name')->pluck('name', 'id')->toArray())
                    ->placeholder('Pilih Template Filter...'),
            ])->icon('Settings2'),
        ];
    }

    public static function filters(): array
    {
        return [
            Filter::make('role_id', 'Role Akses')
                ->type('searchable')
                ->options(fn () => Role::orderBy('name')->pluck('name', 'id')->toArray()),
            Filter::make('company_group_id', 'Holding / Group')
                ->type('searchable')
                ->options(fn () => CompanyGroup::orderBy('name')->pluck('name', 'id')->toArray()),
            Filter::make('division_id', 'Divisi')
                ->type('searchable')
                ->options(fn () => Division::orderBy('name')->pluck('name', 'id')->toArray()),
            Filter::make('department_id', 'Departemen')
                ->type('searchable')
                ->options(fn () => Department::orderBy('name')->pluck('name', 'id')->toArray()),
            Filter::make('region_id', 'Regional')
                ->type('searchable')
                ->options(fn () => Region::orderBy('name')->pluck('name', 'id')->toArray()),
            Filter::make('is_active', 'Status Aktif')
                ->options([
                    '1' => 'Aktif',
                    '0' => 'Nonaktif',
                ]),
        ];
    }
}
