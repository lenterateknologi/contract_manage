<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Columns\BooleanColumn;
use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Fields\DateInput;
use App\Core\Crud\Fields\TextareaInput;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Fields\ToggleInput;
use App\Core\Crud\Filters\Filter;
use App\Core\Crud\Resource;
use App\Models\Holiday;

class HolidayResource extends Resource
{
    public static string $model = Holiday::class;

    public static ?string $title = 'Hari Libur & Kalender';

    public static ?string $slug = 'holidays';

    public static ?string $defaultSortBy = 'holiday_date';

    public static string $defaultSortDir = 'asc';

    public static function table(): array
    {
        return [
            TextColumn::make('holiday_date', 'Tanggal')->sortable()->searchable(),
            TextColumn::make('name', 'Nama Hari Libur')->sortable()->searchable(),
            BooleanColumn::make('is_cuti_bersama', 'Cuti Bersama'),
            BooleanColumn::make('is_active', 'Status Aktif'),
        ];
    }

    public static int $formColumns = 2;

    public static function form(): array
    {
        return [
            TextInput::make('holiday_date', 'Tanggal')
                ->type('date')
                ->required()
                ->rules(['date']),
            TextInput::make('name', 'Nama Hari Libur')
                ->required()
                ->rules(['string', 'max:255'])
                ->placeholder('Contoh: Hari Kemerdekaan RI'),
            ToggleInput::make('is_cuti_bersama', 'Cuti Bersama')
                ->default(false),
            ToggleInput::make('is_active', 'Status Aktif')
                ->default(true),
            TextareaInput::make('description', 'Keterangan')
                ->rules(['nullable', 'string'])
                ->columnSpan(2),
        ];
    }

    public static function filters(): array
    {
        return [
            Filter::make('is_cuti_bersama', 'Cuti Bersama')
                ->options([
                    '1' => 'Cuti Bersama',
                    '0' => 'Libur Nasional',
                ]),
            Filter::make('is_active', 'Status Aktif')
                ->options([
                    '1' => 'Aktif',
                    '0' => 'Nonaktif',
                ]),
        ];
    }
}
