<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Columns\BooleanColumn;
use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Fields\ToggleInput;
use App\Core\Crud\Filters\Filter;
use App\Core\Crud\Resource;
use App\Exports\DepartmentsExport;
use App\Imports\DepartmentsImport;
use App\Models\Department;

class DepartmentResource extends Resource
{
    public static string $model = Department::class;

    public static ?string $title = 'Departemen';

    public static ?string $slug = 'departments';

    public static ?string $exportClass = DepartmentsExport::class;

    public static ?string $importClass = DepartmentsImport::class;

    public static function table(): array
    {
        return [
            TextColumn::make('code', 'Kode')->sortable()->searchable(),
            TextColumn::make('name', 'Nama Departemen')->sortable()->searchable(),
            TextColumn::make('description', 'Deskripsi')->searchable(),
            BooleanColumn::make('is_active', 'Status Aktif'),
        ];
    }

    public static function form(): array
    {
        return [
            TextInput::make('code', 'Kode')
                ->required()
                ->rules(['string', 'max:50']),
            TextInput::make('name', 'Nama Departemen')
                ->required()
                ->rules(['string', 'max:255']),
            TextInput::make('description', 'Deskripsi')
                ->rules(['nullable', 'string']),
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
