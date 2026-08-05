<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Fields\TextareaInput;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Resource;
use App\Exports\RegionsExport;
use App\Imports\RegionsImport;
use App\Models\Region;

class RegionResource extends Resource
{
    public static string $model = Region::class;

    public static ?string $title = 'Data Region';

    public static ?string $slug = 'regions';

    public static ?string $exportClass = RegionsExport::class;

    public static ?string $importClass = RegionsImport::class;

    public static function table(): array
    {
        return [
            TextColumn::make('code', 'Kode')->sortable()->searchable(),
            TextColumn::make('name', 'Nama Region')->sortable()->searchable(),
            TextColumn::make('alias', 'Alias')->sortable()->searchable(),
            TextColumn::make('description', 'Deskripsi')->searchable(),
        ];
    }

    public static function form(): array
    {
        return [
            TextInput::make('code', 'Kode')
                ->required()
                ->rules(['string', 'max:50']),
            TextInput::make('name', 'Nama Region')
                ->required()
                ->rules(['string', 'max:255']),
            TextInput::make('alias', 'Alias')
                ->rules(['nullable', 'string', 'max:50']),
            TextareaInput::make('description', 'Deskripsi')
                ->rules(['nullable', 'string']),
        ];
    }
}
