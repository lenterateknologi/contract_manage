<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Columns\BooleanColumn;
use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Fields\SelectInput;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Fields\ToggleInput;
use App\Core\Crud\Filters\Filter;
use App\Core\Crud\Resource;
use App\Models\Department;
use App\Models\Division;

class DivisionResource extends Resource
{
    public static string $model = Division::class;

    public static array $with = ['department'];

    public static array $withCount = ['users'];

    public static ?string $title = 'Divisi';

    public static ?string $slug = 'divisions';

    public static function table(): array
    {
        return [
            TextColumn::make('code', 'Kode')->sortable()->searchable(),
            TextColumn::make('name', 'Nama Divisi')->sortable()->searchable(),
            TextColumn::make('department.name', 'Departemen')->sortable(),
            TextColumn::make('users_count', 'Total User')->sortable()->alignRight(),
            BooleanColumn::make('is_active', 'Status Aktif')->alignRight(),
        ];
    }

    public static function form(): array
    {
        return [
            TextInput::make('code', 'Kode')
                ->required()
                ->rules(['string', 'max:50']),
            TextInput::make('name', 'Nama Divisi')
                ->required()
                ->rules(['string', 'max:255']),
            SelectInput::make('department_id', 'Departemen')
                ->rules(['nullable', 'uuid'])
                ->options(fn () => Department::orderBy('name')->pluck('name', 'id')->toArray()),
            ToggleInput::make('is_active', 'Status Aktif')
                ->default(true),
        ];
    }

    public static function filters(): array
    {
        return [
            Filter::make('department_id', 'Departemen')
                ->type('searchable')
                ->options(fn () => Department::where('is_used', true)->orderBy('name')->pluck('name', 'id')->toArray()),
            Filter::make('is_active', 'Status Aktif')
                ->options([
                    '1' => 'Aktif',
                    '0' => 'Nonaktif',
                ]),
        ];
    }
}
