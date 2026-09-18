<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Columns\BooleanColumn;
use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Fields\ToggleInput;
use App\Core\Crud\Filters\Filter;
use App\Core\Crud\Resource;
use App\Models\OrganizationLevel;

class OrganizationLevelResource extends Resource
{
    public static string $model = OrganizationLevel::class;

    public static ?string $title = 'Level Organisasi';

    public static ?string $slug = 'organization-levels';

    public static ?string $defaultSortBy = 'idorg_level';

    public static string $defaultSortDir = 'asc';

    public static array $withCount = ['departments'];

    public static function table(): array
    {
        return [
            TextColumn::make('idorg_level', 'ID Level')->sortable(),
            TextColumn::make('code', 'Kode Level')->sortable()->searchable(),
            TextColumn::make('name', 'Nama Level')->sortable()->searchable(),
            TextColumn::make('departments_count', 'Total Unit / Dept')->sortable()->alignRight(),
            BooleanColumn::make('is_used', 'Sistem')->sortable()->alignRight(),
            BooleanColumn::make('is_active', 'Portal')->sortable()->alignRight(),
        ];
    }

    public static function form(): array
    {
        return [
            TextInput::make('idorg_level', 'ID Level Organisasi')
                ->rules(['nullable', 'integer']),
            TextInput::make('code', 'Kode Level')
                ->required()
                ->rules(['string', 'max:50']),
            TextInput::make('name', 'Nama Level Organisasi')
                ->required()
                ->rules(['string', 'max:255']),
            ToggleInput::make('is_used', 'Sistem')
                ->default(false),
            ToggleInput::make('is_active', 'Portal')
                ->default(true),
        ];
    }

    public static function filters(): array
    {
        return [
            Filter::make('name', 'Nama Level')
                ->type('searchable')
                ->options(fn () => OrganizationLevel::whereNotNull('name')->where('name', '!=', '')->distinct()->orderBy('name')->pluck('name', 'name')->toArray()),
            Filter::make('is_used', 'Status Sistem')
                ->options([
                    '1' => 'Digunakan (Ya)',
                    '0' => 'Tidak Digunakan',
                ]),
            Filter::make('is_active', 'Status Portal')
                ->options([
                    '1' => 'Aktif',
                    '0' => 'Nonaktif',
                ]),
        ];
    }
}
