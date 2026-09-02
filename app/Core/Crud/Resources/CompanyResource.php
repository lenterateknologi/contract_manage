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
use App\Exports\CompaniesExport;
use App\Imports\CompaniesImport;
use App\Models\Company;
use App\Models\CompanyGroup;
use App\Models\Region;

class CompanyResource extends Resource
{
    public static string $model = Company::class;

    public static array $with = ['group', 'region'];

    public static ?string $title = 'Perusahaan';

    public static ?string $slug = 'companies';

    public static int $formColumns = 3;

    public static ?string $exportClass = CompaniesExport::class;

    public static ?string $importClass = CompaniesImport::class;

    public static function table(): array
    {
        return [
            TextColumn::make('code', 'Kode Perusahaan')->sortable()->searchable(),
            TextColumn::make('name', 'Nama Perusahaan')->sortable()->searchable(),
            TextColumn::make('alias', 'Alias')->sortable()->searchable(),
            TextColumn::make('company_group_name', 'Grup Perusahaan')->sortable()->searchable(),
            TextColumn::make('region_name', 'Wilayah (Region)')->sortable()->searchable(),
            TextColumn::make('city_name', 'Kota / Lokasi')->sortable()->searchable(),
            TextColumn::make('npwp', 'NPWP')->sortable()->searchable(),
            TextColumn::make('oracle_code', 'Kode Oracle')->sortable()->searchable(),
            BooleanColumn::make('is_used', 'Sistem'),
            BooleanColumn::make('is_active', 'Portal'),
        ];
    }

    public static function form(): array
    {
        return [
            TextInput::make('code', 'Kode')
                ->required()
                ->rules(['string', 'max:50']),
            TextInput::make('name', 'Nama Perusahaan')
                ->required()
                ->rules(['string', 'max:255']),
            TextInput::make('alias', 'Alias')
                ->rules(['nullable', 'string', 'max:50']),
            TextInput::make('npwp', 'NPWP')
                ->rules(['nullable', 'string', 'max:50']),
            TextInput::make('company_group_name', 'Group Perusahaan')
                ->rules(['nullable', 'string', 'max:255']),
            TextInput::make('region_name', 'Region')
                ->rules(['nullable', 'string', 'max:150']),
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
            TextInput::make('phone', 'No. Telepon')
                ->rules(['nullable', 'string', 'max:50']),
            TextInput::make('fax', 'Fax')
                ->rules(['nullable', 'string', 'max:50']),
            TextInput::make('email', 'Email')
                ->rules(['nullable', 'email', 'max:150']),
            TextInput::make('oracle_code', 'Oracle Code')
                ->rules(['nullable', 'string', 'max:50']),
            TextareaInput::make('address', 'Alamat')
                ->rules(['nullable', 'string'])
                ->columnSpan(2),
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
                ->options(fn () => \App\Models\CompanyGroup::where('is_used', true)->orderBy('name')->pluck('name', 'id')->toArray()),
            Filter::make('region_id', 'Wilayah (Region)')
                ->type('searchable')
                ->options(fn () => \App\Models\Region::where('is_used', true)->orderBy('name')->pluck('name', 'id')->toArray()),
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
