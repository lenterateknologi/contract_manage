<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Columns\BooleanColumn;
use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Fields\Section;
use App\Core\Crud\Fields\SelectInput;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Fields\ToggleInput;
use App\Core\Crud\Filters\Filter;
use App\Core\Crud\Resource;
use App\Models\DashboardType;
use App\Models\Department;
use App\Models\Role;

class DashboardTypeResource extends Resource
{
    public static string $model = DashboardType::class;

    public static array $with = ['role', 'department'];

    public static ?string $title = 'Tipe Dashboard';

    public static int $formColumns = 2;

    public static ?string $slug = 'dashboard-types';

    public static function table(): array
    {
        return [
            TextColumn::make('name', 'Nama Tipe')->sortable()->searchable(),
            TextColumn::make('role.name', 'Role')->sortable(),
            TextColumn::make('department.name', 'Departemen')->sortable(),
            BooleanColumn::make('show_overview', 'Ringkasan'),
            BooleanColumn::make('show_workload', 'Beban Kerja'),
            BooleanColumn::make('show_master_data', 'Master Data'),
        ];
    }

    public static function form(): array
    {
        return [
            Section::make('Informasi Tipe Dashboard', [
                TextInput::make('name', 'Nama Tipe Dashboard')
                    ->required()
                    ->rules(['string', 'max:255']),
                TextInput::make('description', 'Deskripsi')
                    ->rules(['nullable', 'string']),
                SelectInput::make('role_id', 'Role Akses')
                    ->options(fn () => Role::orderBy('name')->pluck('name', 'id')->toArray())
                    ->placeholder('Semua Role (Opsional)'),
                SelectInput::make('department_id', 'Departemen')
                    ->options(fn () => Department::orderBy('name')->pluck('name', 'id')->toArray())
                    ->placeholder('Semua Departemen (Opsional)'),
            ])->icon('LayoutDashboard'),

            Section::make('Konfigurasi Visibility Tab', [
                ToggleInput::make('show_overview', 'Tampilkan Tab Ringkasan (Overview)')
                    ->default(false),
                ToggleInput::make('show_workload', 'Tampilkan Tab Beban Kerja (Workload)')
                    ->default(false),
                ToggleInput::make('show_master_data', 'Tampilkan Tab Master Data')
                    ->default(false),
            ])->icon('Eye'),
        ];
    }

    public static function filters(): array
    {
        return [
            Filter::make('role_id', 'Role Akses')
                ->type('searchable')
                ->options(fn () => Role::orderBy('name')->pluck('name', 'id')->toArray()),
            Filter::make('department_id', 'Departemen')
                ->type('searchable')
                ->options(fn () => Department::orderBy('name')->pluck('name', 'id')->toArray()),
        ];
    }
}
