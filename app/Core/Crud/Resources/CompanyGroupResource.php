<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Columns\BooleanColumn;
use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Fields\ToggleInput;
use App\Core\Crud\Filters\Filter;
use App\Core\Crud\Resource;
use App\Exports\CompanyGroupsExport;
use App\Imports\CompanyGroupsImport;
use App\Models\CompanyGroup;

class CompanyGroupResource extends Resource
{
    public static string $model = CompanyGroup::class;

    public static ?string $title = 'Data Group';

    public static ?string $slug = 'company-groups';

    public static ?string $exportClass = CompanyGroupsExport::class;

    public static ?string $importClass = CompanyGroupsImport::class;

    public static array $withCount = ['companies', 'businessUnits', 'users'];

    public static function table(): array
    {
        return [
            TextColumn::make('code', 'Kode')->sortable()->searchable(),
            TextColumn::make('name', 'Nama Group')->sortable()->searchable(),
            TextColumn::make('companies_count', 'Total PT')->sortable()->alignRight(),
            TextColumn::make('business_units_count', 'Total BU')->sortable()->alignRight(),
            TextColumn::make('users_count', 'Total User')->sortable()->alignRight(),
            BooleanColumn::make('is_used', 'Sistem')->alignRight(),
            BooleanColumn::make('is_active', 'Portal')->alignRight(),
        ];
    }

    public static function form(): array
    {
        return [
            TextInput::make('code', 'Kode')
                ->required()
                ->rules(['string', 'max:50']),
            TextInput::make('name', 'Nama Group')
                ->required()
                ->rules(['string', 'max:255']),
            ToggleInput::make('is_used', 'Sistem')
                ->default(false),
            ToggleInput::make('is_active', 'Portal')
                ->default(true),
        ];
    }

    public static function filters(): array
    {
        return [
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
