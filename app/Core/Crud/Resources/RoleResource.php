<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Fields\Section;
use App\Core\Crud\Fields\SelectInput;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Fields\ToggleInput;
use App\Core\Crud\Resource;
use App\Exports\RolesExport;
use App\Imports\RolesImport;
use App\Models\Company;
use App\Models\CompanyGroup;
use App\Models\Department;
use App\Models\Division;
use App\Models\Region;
use App\Models\Role;

class RoleResource extends Resource
{
    public static string $model = Role::class;

    public static ?string $title = 'Manajemen Role';

    public static ?string $slug = 'roles';

    public static ?string $exportClass = RolesExport::class;

    public static ?string $importClass = RolesImport::class;

    public static function table(): array
    {
        return [
            TextColumn::make('name', 'Nama Role')->sortable()->searchable(),
            TextColumn::make('description', 'Deskripsi')->searchable(),
        ];
    }

    public static function form(): array
    {
        return [
            TextInput::make('name', 'Nama Role')->required()->rules(['string', 'max:255']),
            TextInput::make('description', 'Deskripsi')->rules(['nullable', 'string', 'max:500']),

            Section::make('Konfigurasi Filter Kontrak', [
                ToggleInput::make('can_change_company_group', 'Dapat Mengubah Grup Perusahaan')
                    ->default(false),
                SelectInput::make('allowed_company_groups', 'Grup Perusahaan yang Diizinkan')
                    ->multiple(true)
                    ->options(fn () => CompanyGroup::orderBy('name')->pluck('name', 'id')->toArray()),

                ToggleInput::make('can_change_region', 'Dapat Mengubah Wilayah (Region)')
                    ->default(false),
                SelectInput::make('allowed_regions', 'Wilayah (Region) yang Diizinkan')
                    ->multiple(true)
                    ->options(fn () => Region::orderBy('name')->pluck('name', 'id')->toArray()),

                ToggleInput::make('can_change_company', 'Dapat Mengubah Perusahaan (Company)')
                    ->default(false),
                SelectInput::make('allowed_companies', 'Perusahaan (Company) yang Diizinkan')
                    ->multiple(true)
                    ->options(fn () => Company::orderBy('name')->pluck('name', 'id')->toArray()),

                ToggleInput::make('can_change_division', 'Dapat Mengubah Divisi')
                    ->default(false),
                SelectInput::make('allowed_divisions', 'Divisi yang Diizinkan')
                    ->multiple(true)
                    ->options(fn () => Division::orderBy('name')->pluck('name', 'id')->toArray()),

                ToggleInput::make('can_change_department', 'Dapat Mengubah Departemen')
                    ->default(false),
                SelectInput::make('allowed_departments', 'Departemen yang Diizinkan')
                    ->multiple(true)
                    ->options(fn () => Department::orderBy('name')->pluck('name', 'id')->toArray()),
            ])->icon('Settings2'),
        ];
    }
}
