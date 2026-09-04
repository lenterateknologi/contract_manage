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
use App\Models\Company;
use App\Models\CompanyGroup;
use App\Models\Region;

class BusinessUnitResource extends Resource
{
    public static string $model = BusinessUnit::class;

    public static ?string $title = 'Bisnis Unit';

    public static ?string $slug = 'business-units';

    public static int $formColumns = 3;

    public static ?string $exportClass = BusinessUnitsExport::class;

    public static ?string $importClass = BusinessUnitsImport::class;

    public static array $withCount = ['users'];

    public static function table(): array
    {
        return [
            TextColumn::make('code', 'Kode Bisnis Unit')->sortable()->searchable(),
            TextColumn::make('name', 'Nama Bisnis Unit')->sortable()->searchable(),
            TextColumn::make('company_name', 'Perusahaan')->sortable()->searchable(),
            TextColumn::make('location_name', 'Lokasi Kerja')->sortable()->searchable(),
            TextColumn::make('company_group_name', 'Grup Perusahaan')->sortable()->searchable(),
            TextColumn::make('region_name', 'Wilayah (Region)')->sortable()->searchable(),
            TextColumn::make('komoditi_name', 'Komoditi')->sortable()->searchable(),
            TextColumn::make('kebun', 'Kebun / Mill')->sortable()->searchable(),
            TextColumn::make('users_count', 'Total User')->sortable()->alignRight(),
            BooleanColumn::make('is_used', 'Sistem')->alignRight(),
            BooleanColumn::make('is_active', 'Portal')->alignRight(),
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
                ->options(fn () => CompanyGroup::where('is_used', true)->orderBy('name')->pluck('name', 'id')->toArray()),
            Filter::make('region_id', 'Wilayah (Region)')
                ->type('searchable')
                ->options(fn () => Region::where('is_used', true)->orderBy('name')->pluck('name', 'id')->toArray()),
            Filter::make('company_id', 'Perusahaan (Company)')
                ->type('searchable')
                ->options(fn () => Company::where('is_used', true)->orderBy('name')->pluck('name', 'id')->toArray()),
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
