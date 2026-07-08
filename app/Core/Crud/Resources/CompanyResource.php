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

    public static int $formColumns = 2;

    public static ?string $exportClass = CompaniesExport::class;

    public static ?string $importClass = CompaniesImport::class;

    public static function table(): array
    {
        return [
            TextColumn::make('code', 'Kode')->sortable()->searchable(),
            TextColumn::make('name', 'Nama Perusahaan')->sortable()->searchable(),
            TextColumn::make('group.name', 'Group')->sortable(),
            TextColumn::make('region.name', 'Region')->sortable(),
            BooleanColumn::make('is_active', 'Status Aktif'),
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
            SelectInput::make('company_group_id', 'Company Group')
                ->required()
                ->options(fn () => CompanyGroup::orderBy('name')->pluck('name', 'id')->toArray()),
            SelectInput::make('region_id', 'Region')
                ->required()
                ->options(fn () => Region::orderBy('name')->pluck('name', 'id')->toArray()),
            TextareaInput::make('address', 'Alamat')
                ->rules(['nullable', 'string'])
                ->columnSpan(2),
            ToggleInput::make('is_active', 'Status Aktif')
                ->default(true)
                ->columnSpan(2),
        ];
    }

    public static function filters(): array
    {
        return [
            Filter::make('company_group_id', 'Company Group')
                ->options(fn () => CompanyGroup::orderBy('name')->pluck('name', 'id')->toArray()),
            Filter::make('region_id', 'Region')
                ->options(fn () => Region::orderBy('name')->pluck('name', 'id')->toArray()),
            Filter::make('is_active', 'Status Aktif')
                ->options([
                    '1' => 'Aktif',
                    '0' => 'Nonaktif',
                ]),
        ];
    }
}
