<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Columns\BooleanColumn;
use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Fields\SelectInput;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Fields\ToggleInput;
use App\Core\Crud\Filters\Filter;
use App\Core\Crud\Resource;
use App\Models\ContractTemplate;
use App\Models\ContractType;
use App\Models\FormTemplate;

class ContractTypeResource extends Resource
{
    public static string $model = ContractType::class;

    public static array $with = ['parent', 'f1FormTemplate', 'f2FormTemplate'];

    public static ?string $title = 'Kategori Kontrak';

    public static int $formColumns = 2;

    public static ?string $slug = 'contract-types';

    public static function table(): array
    {
        return [
            TextColumn::make('code', 'Kode')->sortable()->searchable(),
            TextColumn::make('name', 'Nama Kategori')->sortable()->searchable(),
            TextColumn::make('parent.name', 'Parent Kategori')->sortable(),
            TextColumn::make('f1_input_mechanism', 'Mekanisme F1'),
            TextColumn::make('f2_input_mechanism', 'Mekanisme F2'),
            BooleanColumn::make('is_active', 'Status Aktif'),
        ];
    }

    public static function form(): array
    {
        return [
            TextInput::make('code', 'Kode')
                ->required()
                ->rules(['string', 'max:100']),
            TextInput::make('name', 'Nama Kategori')
                ->required()
                ->rules(['string', 'max:255']),
            TextInput::make('description', 'Deskripsi')
                ->rules(['nullable', 'string'])
                ->columnSpan(2),
            SelectInput::make('parent_id', 'Parent Kategori')
                ->options(fn () => ContractType::whereNull('parent_id')->orderBy('name')->pluck('name', 'id')->toArray()),

            // F1 Config
            SelectInput::make('f1_input_mechanism', 'Mekanisme Input F1')
                ->options([
                    'manual' => 'Manual (Form Isian)',
                    'digital' => 'Digital (Upload Dokumen)',
                    'folder' => 'Folder (Penyimpanan Saja)',
                ]),
            SelectInput::make('f1_form_template_id', 'Template Form F1')
                ->options(fn () => FormTemplate::orderBy('name')->pluck('name', 'id')->toArray()),
            SelectInput::make('f1_contract_template_id', 'Template Dokumen F1')
                ->options(fn () => ContractTemplate::orderBy('name')->pluck('name', 'id')->toArray()),

            // F2 Config
            SelectInput::make('f2_input_mechanism', 'Mekanisme Input F2')
                ->options([
                    'manual' => 'Manual (Form Isian)',
                    'digital' => 'Digital (Upload Dokumen)',
                    'folder' => 'Folder (Penyimpanan Saja)',
                ]),
            SelectInput::make('f2_form_template_id', 'Template Form F2')
                ->options(fn () => FormTemplate::orderBy('name')->pluck('name', 'id')->toArray()),
            SelectInput::make('f2_contract_template_id', 'Template Dokumen F2')
                ->options(fn () => ContractTemplate::orderBy('name')->pluck('name', 'id')->toArray()),
            ToggleInput::make('is_active', 'Status Aktif')
                ->default(true)
                ->columnSpan(2),
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
