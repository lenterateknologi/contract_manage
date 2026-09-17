<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Columns\BooleanColumn;
use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Fields\Section;
use App\Core\Crud\Fields\SelectInput;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Fields\ToggleInput;
use App\Core\Crud\Fields\TreeSelectInput;
use App\Core\Crud\Filters\Filter;
use App\Core\Crud\Resource;
use App\Models\ContractSlaConfig;
use App\Models\ContractType;
use App\Models\Workflow;
use Illuminate\Support\Facades\Cache;

class ContractSlaConfigResource extends Resource
{
    public static string $model = ContractSlaConfig::class;

    public static array $with = ['contractType', 'workflow'];

    public static ?string $title = 'SLA Kategori Kontrak';

    public static ?string $slug = 'contract-sla-configs';

    public static int $formColumns = 2;

    public static function table(): array
    {
        return [
            TextColumn::make('name', 'Nama Konfigurasi SLA')->sortable()->searchable(),
            TextColumn::make('contractType.name', 'Kategori Kontrak')->sortable()->searchable(),
            TextColumn::make('sla_total_formatted', 'Durasi SLA (Hari & Jam)'),
            TextColumn::make('sla_working_hours_formatted', 'Jam Kerja & Cut-Off'),
            BooleanColumn::make('is_active', 'Status Aktif'),
        ];
    }

    public static function form(): array
    {
        return [
            Section::make('Informasi Kategori, Alur SLA & Jam Kerja', [
                TextInput::make('name', 'Nama Konfigurasi SLA')
                    ->required()
                    ->rules(['string', 'max:255'])
                    ->placeholder('Contoh: SLA Standar Pengadaan Barang'),

                TreeSelectInput::make('contract_type_id', 'Kategori Kontrak')
                    ->required()
                    ->options(fn () => Cache::remember('options_contract_types_tree_sla', now()->addMinutes(10), fn () => ContractType::orderBy('name')->get(['id', 'name', 'parent_id'])->toArray())),

                SelectInput::make('workflow_id', 'Workflow Terkait (Opsional)')
                    ->options(fn () => Workflow::where('is_active', true)->orderBy('name')->pluck('name', 'id')->toArray())
                    ->rules(['nullable', 'string']),

                ToggleInput::make('is_active', 'Status Aktif')
                    ->default(true),

                TextInput::make('sla_cutoff_hour', 'Jam Cut-off Masuk Harian (Jam)')
                    ->type('number')
                    ->required()
                    ->default(16)
                    ->rules(['integer', 'min:0', 'max:23'])
                    ->helperText('Pengajuan lewat jam ini dihitung mulai hari kerja berikutnya.'),

                SelectInput::make('working_days', 'Hari Kerja Aktif (Perhitungan SLA)')
                    ->multiple(true)
                    ->options([
                        '1' => 'Senin (Monday)',
                        '2' => 'Selasa (Tuesday)',
                        '3' => 'Rabu (Wednesday)',
                        '4' => 'Kamis (Thursday)',
                        '5' => 'Jumat (Friday)',
                        '6' => 'Sabtu (Saturday)',
                        '7' => 'Minggu (Sunday)',
                    ])
                    ->default(['1', '2', '3', '4', '5'])
                    ->helperText('Tentukan hari yang dihitung dalam durasi SLA (uncheck Sabtu & Minggu jika libur).'),
            ])->icon('Layers'),

            Section::make('Target Durasi SLA per Status Workflow', [
                TextInput::make('sla_stages', 'Daftar Rincian Target SLA (Status & Durasi)')
                    ->type('text')
                    ->rules(['nullable', 'array'])
                    ->columnSpan(2),
            ])->icon('ListOrdered'),
        ];
    }

    public static function filters(): array
    {
        return [
            Filter::make('is_active', 'Status Aktif')
                ->options([
                    '1' => 'Aktif',
                    '0' => 'Nonaktif',
                ]),
        ];
    }
}
