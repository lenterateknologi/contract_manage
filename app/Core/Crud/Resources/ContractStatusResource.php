<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Columns\BooleanColumn;
use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Fields\TextareaInput;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Fields\ToggleInput;
use App\Core\Crud\Filters\Filter;
use App\Core\Crud\Resource;
use App\Models\ContractStatus;

class ContractStatusResource extends Resource
{
    public static string $model = ContractStatus::class;

    public static ?string $title = 'Master Status';

    public static ?string $slug = 'contract-statuses';

    public static function table(): array
    {
        return [
            TextColumn::make('code', 'Kode')->sortable()->searchable(),
            TextColumn::make('label', 'Label')->sortable()->searchable(),
            TextColumn::make('color', 'Warna Teks')->searchable(),
            TextColumn::make('bg_color', 'Warna Background')->searchable(),
            BooleanColumn::make('is_active', 'Status Aktif'),
        ];
    }

    public static int $formColumns = 3;

    public static function form(): array
    {
        return [
            TextInput::make('code', 'Kode')
                ->required()
                ->rules(['string', 'max:50']),
            TextInput::make('label', 'Label')
                ->required()
                ->rules(['string', 'max:255']),
            TextInput::make('color', 'Warna Teks')
                ->type('color')
                ->required()
                ->rules(['string', 'max:20'])
                ->default('#ffffff'),
            TextInput::make('bg_color', 'Warna Background')
                ->type('color')
                ->required()
                ->rules(['string', 'max:20'])
                ->default('#4f46e5'),
            TextInput::make('icon', 'Ikon')
                ->type('icon')
                ->rules(['nullable', 'string', 'max:50']),
            ToggleInput::make('is_active', 'Status Aktif')
                ->default(true),
            TextareaInput::make('description', 'Deskripsi')
                ->rules(['nullable', 'string'])
                ->columnSpan(2),
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
