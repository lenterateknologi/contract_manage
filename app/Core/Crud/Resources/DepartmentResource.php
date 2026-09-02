<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Columns\BooleanColumn;
use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Fields\SelectInput;
use App\Core\Crud\Fields\TextareaInput;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Fields\ToggleInput;
use App\Core\Crud\Filters\Filter;
use App\Core\Crud\Resource;
use App\Exports\DepartmentsExport;
use App\Imports\DepartmentsImport;
use App\Models\Company;
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
            TextColumn::make('org_group_name', 'Group Organisasi')->sortable()->searchable(),
            TextColumn::make('org_level_name', 'Level Organisasi')->sortable()->searchable(),
            BooleanColumn::make('is_used', 'Sistem'),
            BooleanColumn::make('is_active', 'Portal'),
        ];
    }

    public static function form(): array
    {
        return [
            TextInput::make('code', 'Kode Organisasi')
                ->required()
                ->rules(['string', 'max:50']),
            TextInput::make('name', 'Nama Departemen / Organisasi')
                ->required()
                ->rules(['string', 'max:255']),
            SelectInput::make('company_id', 'Perusahaan (Company)')
                ->options(fn () => Company::where('is_used', true)->orderBy('name')->pluck('name', 'id')->toArray())
                ->searchable()
                ->placeholder('Pilih Perusahaan...')
                ->rules(['nullable', 'string', 'exists:m_companies,id']),
            SelectInput::make('org_group_name', 'Group Organisasi')
                ->options(fn () => Department::whereNotNull('org_group_name')->where('org_group_name', '!=', '')->distinct()->orderBy('org_group_name')->pluck('org_group_name', 'org_group_name')->toArray())
                ->searchable()
                ->placeholder('Pilih Group Organisasi...')
                ->rules(['nullable', 'string', 'max:255']),
            SelectInput::make('org_level_name', 'Level Organisasi')
                ->options(fn () => Department::whereNotNull('org_level_name')->where('org_level_name', '!=', '')->distinct()->orderBy('org_level_name')->pluck('org_level_name', 'org_level_name')->toArray())
                ->searchable()
                ->placeholder('Pilih Level Organisasi...')
                ->rules(['nullable', 'string', 'max:100']),
            TextareaInput::make('description', 'Deskripsi')
                ->rules(['nullable', 'string']),
            ToggleInput::make('is_used', 'Sistem')
                ->default(false),
            ToggleInput::make('is_active', 'Portal')
                ->default(true),
        ];
    }

    public static function filters(): array
    {
        return [
            Filter::make('name', 'Nama Departemen')
                ->type('searchable')
                ->options(fn () => Department::whereNotNull('name')->where('name', '!=', '')->distinct()->orderBy('name')->pluck('name', 'name')->toArray()),
            Filter::make('org_group_name', 'Group Organisasi')
                ->type('searchable')
                ->options(function () {
                    $options = ['__empty__' => '- (Tanpa Group / Kosong)'];
                    $groups = Department::whereNotNull('org_group_name')->where('org_group_name', '!=', '')->distinct()->orderBy('org_group_name')->pluck('org_group_name', 'org_group_name')->toArray();
                    return $options + $groups;
                }),
            Filter::make('org_level_name', 'Level Organisasi')
                ->type('searchable')
                ->options(function () {
                    $options = ['__empty__' => '- (Tanpa Level / Kosong)'];
                    $levels = Department::whereNotNull('org_level_name')->where('org_level_name', '!=', '')->distinct()->orderBy('org_level_name')->pluck('org_level_name', 'org_level_name')->toArray();
                    return $options + $levels;
                }),
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
