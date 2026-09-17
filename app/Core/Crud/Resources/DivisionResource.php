<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Columns\BooleanColumn;
use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Fields\ToggleInput;
use App\Core\Crud\Filters\Filter;
use App\Core\Crud\Resource;
use App\Models\Division;

class DivisionResource extends Resource
{
    public static string $model = Division::class;

    public static array $with = [];

    public static array $withCount = ['users'];

    public static ?string $title = 'Divisi';

    public static ?string $slug = 'divisions';

    public static function table(): array
    {
        return [
            TextColumn::make('name', 'Nama Divisi')->sortable()->searchable(),
            TextColumn::make('users_count', 'Total User')->sortable()->alignRight(),
            BooleanColumn::make('is_active', 'Status Aktif')->alignRight(),
        ];
    }

    public static function form(): array
    {
        return [
            TextInput::make('name', 'Nama Divisi')
                ->required()
                ->rules(['string', 'max:255']),
            ToggleInput::make('is_active', 'Status Aktif')
                ->default(true),
        ];
    }

    public static function filters(): array
    {
        return [
            Filter::make('is_active', 'Status Aktif')
                ->options([
                    '1' => 'Aktif',
                    '0' => 'Nonaktif',
                ]),
        ];
    }
}
