<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Columns\BooleanColumn;
use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Fields\ToggleInput;
use App\Core\Crud\Filters\Filter;
use App\Core\Crud\Resource;
use App\Exports\BusinessUnitsExport;
use App\Imports\BusinessUnitsImport;
use App\Models\BusinessUnit;

class BusinessUnitResource extends Resource
{
    public static string $model = BusinessUnit::class;

    public static ?string $title = 'Bisnis Unit';

    public static ?string $slug = 'business-units';

    public static int $formColumns = 2;

    public static ?string $exportClass = BusinessUnitsExport::class;

    public static ?string $importClass = BusinessUnitsImport::class;

    public static function table(): array
    {
        return [
            TextColumn::make('bu_identity', 'Bisnis Unit & Deskripsi')->sortable()->searchable(),
            TextColumn::make('company_placement', 'Perusahaan & Penempatan')->sortable()->searchable(),
            TextColumn::make('org_structure', 'Group & Region')->sortable()->searchable(),
            BooleanColumn::make('is_used', 'Sistem'),
            BooleanColumn::make('is_active', 'Portal'),
        ];
    }

    public static function form(): array
    {
        return [
            TextInput::make('code', 'Kode Bisnis Unit')
                ->required()
                ->rules(['string', 'max:50']),
            TextInput::make('name', 'Deskripsi')
                ->required()
                ->rules(['string', 'max:255']),
            TextInput::make('company_name', 'Company')
                ->rules(['nullable', 'string', 'max:255']),
            TextInput::make('company_oracle_code', 'Company Oracle Code')
                ->rules(['nullable', 'string', 'max:50']),
            TextInput::make('location_name', 'Lokasi')
                ->rules(['nullable', 'string', 'max:255']),
            TextInput::make('location_oracle_code', 'Lokasi Oracle Code')
                ->rules(['nullable', 'string', 'max:50']),
            TextInput::make('company_group_name', 'Group Perusahaan')
                ->rules(['nullable', 'string', 'max:255']),
            TextInput::make('region_name', 'Region')
                ->rules(['nullable', 'string', 'max:150']),
            TextInput::make('komoditi_name', 'Komoditi')
                ->rules(['nullable', 'string', 'max:255']),
            TextInput::make('kebun', 'Kebun')
                ->rules(['nullable', 'string', 'max:255']),
            TextInput::make('ktu', 'KTU')
                ->rules(['nullable', 'string', 'max:100']),
            TextInput::make('kpp', 'KPP')
                ->rules(['nullable', 'string', 'max:100']),
            TextInput::make('dppjamsostek', 'DPP Jamsostek')
                ->rules(['nullable', 'string', 'max:100']),
            TextInput::make('latitude', 'Latitude')
                ->rules(['nullable', 'string', 'max:50']),
            TextInput::make('longitude', 'Longitude')
                ->rules(['nullable', 'string', 'max:50']),
            ToggleInput::make('is_used', 'Sistem')
                ->default(false)
                ->columnSpan(1),
            ToggleInput::make('is_active', 'Portal')
                ->default(true)
                ->columnSpan(1),
        ];
    }

    public static function filters(): array
    {
        return [
            Filter::make('company_group_id', 'Group Perusahaan')
                ->type('searchable')
                ->options(fn () => \App\Models\CompanyGroup::orderBy('name')->pluck('name', 'id')->toArray()),
            Filter::make('region_id', 'Wilayah (Region)')
                ->type('searchable')
                ->options(fn () => \App\Models\Region::orderBy('name')->pluck('name', 'id')->toArray()),
            Filter::make('company_id', 'Perusahaan (Company)')
                ->type('searchable')
                ->options(fn () => \App\Models\Company::orderBy('name')->pluck('name', 'id')->toArray()),
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
