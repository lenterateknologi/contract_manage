<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Resource;
use App\Models\Role;

class RoleResource extends Resource
{
    public static string $model = Role::class;

    public static ?string $title = 'Manajemen Role';

    public static ?string $slug = 'roles';

    public static ?string $exportClass = \App\Exports\RolesExport::class;

    public static ?string $importClass = \App\Imports\RolesImport::class;

    public static function table(): array
    {
        return [
            TextColumn::make('name', 'Nama Role')->sortable()->searchable(),
            TextColumn::make('description', 'Deskripsi')->searchable(),
        ];
    }

    public static function form(): array
    {
        return [
            TextInput::make('name', 'Nama Role')->required()->rules(['string', 'max:255']),
            TextInput::make('description', 'Deskripsi')->rules(['nullable', 'string', 'max:500']),
        ];
    }
}
