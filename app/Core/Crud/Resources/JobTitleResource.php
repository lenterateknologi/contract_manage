<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Columns\BooleanColumn;
use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Fields\SelectInput;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Fields\ToggleInput;
use App\Core\Crud\Filters\Filter;
use App\Core\Crud\Resource;
use App\Exports\JobTitlesExport;
use App\Imports\JobTitlesImport;
use App\Models\JobLevel;
use App\Models\JobTitle;

class JobTitleResource extends Resource
{
    public static string $model = JobTitle::class;

    public static ?string $title = 'Data Job Title';

    public static ?string $slug = 'job-titles';

    public static ?string $exportClass = JobTitlesExport::class;

    public static ?string $importClass = JobTitlesImport::class;

    public static array $with = ['jobLevel'];

    public static function table(): array
    {
        return [
            TextColumn::make('idjobtitle', 'ID Job Portal')->sortable()->searchable(),
            TextColumn::make('code', 'Kode Posisi')->sortable()->searchable(),
            TextColumn::make('name', 'Nama Posisi / Jabatan')->sortable()->searchable(),
            TextColumn::make('job_level_name', 'Job Level')->sortable()->searchable(),
            BooleanColumn::make('is_used', 'Sistem'),
            BooleanColumn::make('is_active', 'Portal'),
        ];
    }

    public static function form(): array
    {
        return [
            TextInput::make('idjobtitle', 'ID Job Portal')
                ->rules(['nullable', 'integer']),
            TextInput::make('code', 'Kode Posisi')
                ->required()
                ->rules(['string', 'max:50']),
            TextInput::make('name', 'Nama Posisi / Jabatan')
                ->required()
                ->rules(['string', 'max:255']),
            SelectInput::make('job_level_id', 'Job Level')
                ->options(fn () => JobLevel::orderBy('name')->pluck('name', 'id')->toArray())
                ->rules(['nullable', 'string', 'exists:m_job_levels,id']),
            ToggleInput::make('is_used', 'Sistem')
                ->default(false),
            ToggleInput::make('is_active', 'Portal')
                ->default(true),
        ];
    }

    public static function filters(): array
    {
        return [
            Filter::make('name', 'Nama Posisi / Jabatan')
                ->type('searchable')
                ->options(fn () => JobTitle::whereNotNull('name')->where('name', '!=', '')->distinct()->orderBy('name')->pluck('name', 'name')->toArray()),
            Filter::make('job_level_id', 'Job Level')
                ->type('searchable')
                ->options(function () {
                    $options = ['__empty__' => '- (Tanpa Level / Belum Ditentukan)'];
                    $levels = JobLevel::where('is_used', true)->orderBy('name')->pluck('name', 'id')->toArray();
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
