<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Columns\BooleanColumn;
use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Fields\ToggleInput;
use App\Core\Crud\Filters\Filter;
use App\Core\Crud\Resource;
use App\Models\OrganizationGroup;

class OrganizationGroupResource extends Resource
{
    public static string $model = OrganizationGroup::class;

    public static ?string $title = 'Group Organisasi';

    public static ?string $slug = 'organization-groups';

    public static ?string $defaultSortBy = 'idorg_group';

    public static string $defaultSortDir = 'asc';

    public static array $withCount = ['departments'];

    public static function table(): array
    {
        return [
            TextColumn::make('idorg_group', 'ID Group')->sortable(),
            TextColumn::make('code', 'Kode Group')->sortable()->searchable(),
            TextColumn::make('name', 'Nama Group Organisasi')->sortable()->searchable(),
            TextColumn::make('oracle_code', 'Oracle Code')->sortable()->searchable(),
            TextColumn::make('departments_count', 'Total Unit / Dept')->sortable()->alignRight(),
            BooleanColumn::make('is_used', 'Sistem')->sortable()->alignRight(),
            BooleanColumn::make('is_active', 'Portal')->sortable()->alignRight(),
        ];
    }

    public static function form(): array
    {
        return [
            TextInput::make('idorg_group', 'ID Group Organisasi')
                ->rules(['nullable', 'integer']),
            TextInput::make('code', 'Kode Group')
                ->required()
                ->rules(['string', 'max:50']),
            TextInput::make('name', 'Nama Group Organisasi')
                ->required()
                ->rules(['string', 'max:255']),
            TextInput::make('oracle_code', 'Oracle Code')
                ->rules(['nullable', 'string', 'max:50']),
            ToggleInput::make('is_used', 'Sistem')
                ->default(false),
            ToggleInput::make('is_active', 'Portal')
                ->default(true),
        ];
    }

    public static function filters(): array
    {
        return [
            Filter::make('name', 'Nama Group')
                ->type('searchable')
                ->options(fn () => OrganizationGroup::whereNotNull('name')->where('name', '!=', '')->distinct()->orderBy('name')->pluck('name', 'name')->toArray()),
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
