<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Fields\Section;
use App\Core\Crud\Fields\SelectInput;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Fields\ToggleInput;
use App\Core\Crud\Resource;
use App\Models\Company;
use App\Models\CompanyGroup;
use App\Models\ContractFilterTemplate;
use App\Models\Department;
use App\Models\Division;
use App\Models\Region;

class ContractFilterTemplateResource extends Resource
{
    public static string $model = ContractFilterTemplate::class;

    public static ?string $title = 'Konfigurasi Filter Kontrak';

    public static ?string $slug = 'contract-filter-templates';

    public static int $formColumns = 1;

    public static function table(): array
    {
        return [
            TextColumn::make('name', 'Nama Template')->sortable()->searchable(),
            TextColumn::make('company_group_status', 'Grup Perusahaan'),
            TextColumn::make('region_status', 'Wilayah (Region)'),
            TextColumn::make('company_status', 'Perusahaan'),
            TextColumn::make('division_status', 'Divisi'),
            TextColumn::make('department_status', 'Departemen'),
        ];
    }

    public static function form(): array
    {
        return [
            Section::make('Konfigurasi Filter Kontrak', [
                TextInput::make('name', 'Nama Template')
                    ->required()
                    ->rules(['string', 'max:255']),

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
