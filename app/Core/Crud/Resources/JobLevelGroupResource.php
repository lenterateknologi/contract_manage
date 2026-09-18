<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Columns\BooleanColumn;
use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Fields\ToggleInput;
use App\Core\Crud\Filters\Filter;
use App\Core\Crud\Resource;
use App\Models\JobLevelGroup;

class JobLevelGroupResource extends Resource
{
    public static string $model = JobLevelGroup::class;

    public static ?string $title = 'Data Group Job Level';

    public static ?string $slug = 'job-level-groups';

    public static array $withCount = ['jobLevels'];

    public static function table(): array
    {
        return [
            TextColumn::make('code', 'Kode Group')->sortable()->searchable(),
            TextColumn::make('name', 'Nama Group')->sortable()->searchable(),
            TextColumn::make('job_levels_count', 'Total Level')->sortable()->alignRight(),
            BooleanColumn::make('is_used', 'Sistem')->sortable()->alignRight(),
            BooleanColumn::make('is_active', 'Portal')->sortable()->alignRight(),
        ];
    }

    public static function form(): array
    {
        return [
            TextInput::make('code', 'Kode Group')
                ->required()
                ->rules(['string', 'max:50']),
            TextInput::make('name', 'Nama Group')
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
            Filter::make('name', 'Nama Group')
                ->type('searchable')
                ->options(fn () => JobLevelGroup::whereNotNull('name')->where('name', '!=', '')->distinct()->orderBy('name')->pluck('name', 'name')->toArray()),
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
