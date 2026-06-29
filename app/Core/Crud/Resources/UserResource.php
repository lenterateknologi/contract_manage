<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Columns\BooleanColumn;
use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Fields\SelectInput;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Fields\ToggleInput;
use App\Core\Crud\Filters\Filter;
use App\Core\Crud\Resource;
use App\Models\Company;
use App\Models\Department;
use App\Models\Role;
use App\Models\User;

class UserResource extends Resource
{
    public static string $model = User::class;

    public static ?string $exportClass = \App\Exports\UsersExport::class;

    public static ?string $importClass = \App\Imports\UsersImport::class;

    public static array $with = ['roleRelation', 'department', 'company'];

    public static ?string $title = 'Registri Otoritas Pengguna';

    public static int $formColumns = 2;

    public static ?string $slug = 'users';

    public static function table(): array
    {
        return [
            TextColumn::make('name', 'Nama')->sortable()->searchable(),
            TextColumn::make('username', 'Username')->sortable()->searchable(),
            TextColumn::make('email', 'Email')->sortable()->searchable(),
            TextColumn::make('roleRelation.name', 'Role')->sortable(),
            TextColumn::make('department.name', 'Departemen')->sortable(),
            BooleanColumn::make('is_active', 'Status Aktif'),
        ];
    }

    public static function form(): array
    {
        return [
            TextInput::make('name', 'Nama')
                ->required()
                ->rules(['string', 'max:255']),
            TextInput::make('email', 'Email')
                ->required()
                ->rules(['email']),
            TextInput::make('username', 'Username')
                ->required()
                ->rules(['string', 'max:20']),
            TextInput::make('password', 'Password')
                ->rules(['nullable', 'string', 'min:8']),
            SelectInput::make('role_id', 'Role')
                ->required()
                ->options(fn () => Role::orderBy('name')->pluck('name', 'id')->toArray()),
            SelectInput::make('department_id', 'Departemen')
                ->options(fn () => Department::orderBy('name')->pluck('name', 'id')->toArray()),
            SelectInput::make('company_id', 'Perusahaan')
                ->options(fn () => Company::orderBy('name')->pluck('name', 'id')->toArray()),
            TextInput::make('phone_number', 'No. Telepon')
                ->rules(['nullable', 'string']),
            TextInput::make('position', 'Jabatan')
                ->rules(['nullable', 'string']),
            ToggleInput::make('is_active', 'Status Aktif')
                ->default(true),
        ];
    }

    public static function filters(): array
    {
        return [
            Filter::make('role_id', 'Role Akses')
                ->options(fn () => Role::orderBy('name')->pluck('name', 'id')->toArray()),
            Filter::make('department_id', 'Departemen')
                ->options(fn () => Department::orderBy('name')->pluck('name', 'id')->toArray()),
            Filter::make('is_active', 'Status Aktif')
                ->options([
                    '1' => 'Aktif',
                    '0' => 'Nonaktif',
                ]),
        ];
    }
}
