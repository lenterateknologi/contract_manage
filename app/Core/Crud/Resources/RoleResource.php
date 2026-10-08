<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Fields\TextareaInput;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Resource;
use App\Exports\Master\RolesExport;
use App\Imports\RolesImport;
use App\Models\Master\Role;

class RoleResource extends Resource
{
    public static string $model = Role::class;

    public static ?string $title = 'Manajemen Role';

    public static ?string $slug = 'roles';

    public static ?string $exportClass = RolesExport::class;

    public static ?string $importClass = RolesImport::class;

    public static array $with = [];

    public static array $withCount = ['users'];

    public static function table(): array
    {
        return [
            TextColumn::make('name', 'Nama Role')->sortable()->searchable(),
            TextColumn::make('description', 'Deskripsi')->sortable()->searchable(),
            TextColumn::make('users_count', 'Total User')->sortable()->alignRight(),
        ];
    }

    public static function form(): array
    {
        return [
            TextInput::make('name', 'Nama Role')->required()->rules(['string', 'max:255']),
            TextareaInput::make('description', 'Deskripsi')->rules(['nullable', 'string', 'max:500']),
        ];
    }
}
