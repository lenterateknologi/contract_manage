<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Columns\BooleanColumn;
use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Fields\SelectInput;
use App\Core\Crud\Fields\TextareaInput;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Fields\ToggleInput;
use App\Core\Crud\Filters\Filter;
use App\Core\Crud\Resource;
use App\Exports\LocationsExport;
use App\Imports\LocationsImport;
use App\Models\CompanyGroup;
use App\Models\Location;

class LocationResource extends Resource
{
    public static string $model = Location::class;

    public static ?string $title = 'Data Lokasi';

    public static ?string $slug = 'locations';

    public static ?string $exportClass = LocationsExport::class;

    public static ?string $importClass = LocationsImport::class;

    public static function table(): array
    {
        return [
            TextColumn::make('code', 'Kode Lokasi')->sortable()->searchable(),
            TextColumn::make('name', 'Nama Lokasi')->sortable()->searchable(),
            TextColumn::make('company_group_name', 'Grup Perusahaan')->sortable()->searchable(),
            TextColumn::make('location_group_name', 'Grup Lokasi')->sortable()->searchable(),
            TextColumn::make('city_name', 'Kota / Kabupaten')->sortable()->searchable(),
            TextColumn::make('province_name', 'Provinsi')->sortable()->searchable(),
            TextColumn::make('oracle_code', 'Kode Oracle')->sortable()->searchable(),
            BooleanColumn::make('is_used', 'Sistem'),
            BooleanColumn::make('is_active', 'Portal'),
        ];
    }

    public static function form(): array
    {
        return [
            TextInput::make('code', 'Kode Lokasi')
                ->required()
                ->rules(['string', 'max:50']),
            TextInput::make('name', 'Nama Lokasi')
                ->required()
                ->rules(['string', 'max:255']),
            SelectInput::make('company_group_id', 'Group Perusahaan')
                ->options(fn () => CompanyGroup::orderBy('name')->pluck('name', 'id')->toArray())
                ->rules(['nullable', 'string', 'exists:m_company_groups,id']),
            TextInput::make('location_group_name', 'Group Lokasi')
                ->rules(['nullable', 'string', 'max:255']),
            TextInput::make('city_name', 'Kota / Kabupaten')
                ->rules(['nullable', 'string', 'max:100']),
            TextInput::make('province_name', 'Provinsi')
                ->rules(['nullable', 'string', 'max:100']),
            TextInput::make('country_name', 'Negara')
                ->rules(['nullable', 'string', 'max:100']),
            TextInput::make('sub_district_name', 'Kecamatan')
                ->rules(['nullable', 'string', 'max:100']),
            TextInput::make('village_name', 'Kelurahan / Desa')
                ->rules(['nullable', 'string', 'max:100']),
            TextInput::make('zip_code', 'Kode Pos')
                ->rules(['nullable', 'string', 'max:20']),
            TextInput::make('oracle_code', 'Oracle Code')
                ->rules(['nullable', 'string', 'max:50']),
            TextInput::make('phone', 'No. Telepon')
                ->rules(['nullable', 'string', 'max:50']),
            TextInput::make('fax', 'Fax')
                ->rules(['nullable', 'string', 'max:50']),
            TextareaInput::make('address', 'Alamat')
                ->rules(['nullable', 'string']),
            ToggleInput::make('is_used', 'Sistem')
                ->default(false),
            ToggleInput::make('is_active', 'Portal')
                ->default(true),
        ];
    }

    public static function filters(): array
    {
        return [
            Filter::make('company_group_id', 'Group Perusahaan')
                ->type('searchable')
                ->options(fn () => CompanyGroup::where('is_used', true)->orderBy('name')->pluck('name', 'id')->toArray()),
            Filter::make('idlocation_group', 'Group Lokasi')
                ->type('searchable')
                ->options(fn () => \App\Models\Location::whereNotNull('idlocation_group')->whereNotNull('location_group_name')->orderBy('location_group_name')->pluck('location_group_name', 'idlocation_group')->unique()->toArray()),
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
