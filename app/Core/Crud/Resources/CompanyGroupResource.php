<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Resource;
use App\Models\CompanyGroup;

class CompanyGroupResource extends Resource
{
    public static string $model = CompanyGroup::class;

    public static ?string $title = 'Data Group';

    public static ?string $slug = 'company-groups';

    public static ?string $exportClass = \App\Exports\CompanyGroupsExport::class;

    public static ?string $importClass = \App\Imports\CompanyGroupsImport::class;

    public static function table(): array
    {
        return [
            TextColumn::make('code', 'Kode')->sortable()->searchable(),
            TextColumn::make('name', 'Nama Group')->sortable()->searchable(),
            TextColumn::make('description', 'Deskripsi')->searchable(),
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
            TextInput::make('description', 'Deskripsi')
                ->rules(['nullable', 'string']),
        ];
    }
}
