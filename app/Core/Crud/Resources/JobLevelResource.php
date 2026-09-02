<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Columns\BooleanColumn;
use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Fields\ToggleInput;
use App\Core\Crud\Filters\Filter;
use App\Core\Crud\Resource;
use App\Exports\JobLevelsExport;
use App\Imports\JobLevelsImport;
use App\Models\JobLevel;

class JobLevelResource extends Resource
{
    public static string $model = JobLevel::class;

    public static ?string $title = 'Data Job Level';

    public static ?string $slug = 'job-levels';

    public static ?string $exportClass = JobLevelsExport::class;

    public static ?string $importClass = JobLevelsImport::class;

    public static function table(): array
    {
        return [
            TextColumn::make('code', 'Kode Level')->sortable()->searchable(),
            TextColumn::make('name', 'Nama Level')->sortable()->searchable(),
            TextColumn::make('group_name', 'Grup Level')->sortable()->searchable(),
            BooleanColumn::make('is_used', 'Sistem'),
            BooleanColumn::make('is_active', 'Portal'),
        ];
    }

    public static function form(): array
    {
        return [
            TextInput::make('code', 'Kode Level')
                ->required()
                ->rules(['string', 'max:50']),
            TextInput::make('name', 'Nama Level')
                ->required()
                ->rules(['string', 'max:255']),
            TextInput::make('group_name', 'Grup Level')
                ->rules(['nullable', 'string', 'max:255']),
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
                ->options(fn () => JobLevel::whereNotNull('name')->where('name', '!=', '')->distinct()->orderBy('name')->pluck('name', 'name')->toArray()),
            Filter::make('group_name', 'Grup Level')
                ->type('searchable')
                ->options(function () {
                    $options = ['__empty__' => '- (Tanpa Grup / Kosong)'];
                    $groups = JobLevel::whereNotNull('group_name')->where('group_name', '!=', '')->distinct()->orderBy('group_name')->pluck('group_name', 'group_name')->toArray();

                    return $options + $groups;
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
