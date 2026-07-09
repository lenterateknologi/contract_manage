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
use App\Models\ContractType;
use App\Models\FormTemplate;

class ContractTypeResource extends Resource
{
    public static string $model = ContractType::class;

    public static array $with = ['parent', 'f1FormTemplate', 'f2FormTemplate', 'contractFormTemplate'];

    public static ?string $title = 'Kategori Kontrak';

    public static int $formColumns = 2;

    public static ?string $slug = 'contract-types';

    public static function table(): array
    {
        return [
            // ponytail: merged code and name into one column on the frontend
            TextColumn::make('name', 'Kode & Nama Kategori')->sortable()->searchable(),
            TextColumn::make('f1_details', 'F1 (Mekanisme & Template)'),
            TextColumn::make('f2_details', 'F2 (Mekanisme & Template)'),
            TextColumn::make('agreement_details', 'Agreement (Mekanisme & Template)'),
            BooleanColumn::make('is_active', 'Status Aktif'),
        ];
    }

    public static function form(): array
    {
        return [
            Section::make('Informasi Kategori', [
                TextInput::make('code', 'Kode')
                    ->required()
                    ->rules(['string', 'max:100']),
                TextInput::make('name', 'Nama Kategori')
                    ->required()
                    ->rules(['string', 'max:255']),
                TreeSelectInput::make('parent_id', 'Parent Kategori')
                    ->options(fn () => ContractType::orderBy('name')->get(['id', 'name', 'parent_id'])->toArray()),
                ToggleInput::make('is_active', 'Status Aktif')
                    ->default(true),
                TextInput::make('description', 'Deskripsi')
                    ->rules(['nullable', 'string'])
                    ->columnSpan(2),
            ])->icon('FolderClosed'),

            Section::make('Konfigurasi Formulir F1', [
                SelectInput::make('f1_input_mechanism', 'Mekanisme Input F1')
                    ->options([
                        'manual' => 'Manual (Form Isian)',
                        'digital' => 'Digital (Upload Dokumen)',
                        'none' => 'Tidak Aktif (Disable)',
                    ]),
                SelectInput::make('f1_form_template_id', 'Template Form F1')
                    ->options(fn () => FormTemplate::orderBy('name')->pluck('name', 'id')->toArray()),
            ])->icon('FileText'),

            Section::make('Konfigurasi Formulir F2', [
                SelectInput::make('f2_input_mechanism', 'Mekanisme Input F2')
                    ->options([
                        'manual' => 'Manual (Form Isian)',
                        'digital' => 'Digital (Upload Dokumen)',
                        'none' => 'Tidak Aktif (Disable)',
                    ]),
                SelectInput::make('f2_form_template_id', 'Template Form F2')
                    ->options(fn () => FormTemplate::orderBy('name')->pluck('name', 'id')->toArray()),
            ])->icon('FileCheck'),

            Section::make('Konfigurasi Draft Perjanjian', [
                SelectInput::make('contract_input_mechanism', 'Mekanisme Input Agreement')
                    ->options([
                        'manual' => 'Manual (Form Isian)',
                        'digital' => 'Digital (Upload Dokumen)',
                        'none' => 'Tidak Aktif (Disable)',
                    ]),
                SelectInput::make('contract_form_template_id', 'Template Form Agreement')
                    ->options(fn () => FormTemplate::orderBy('name')->pluck('name', 'id')->toArray()),
            ])->icon('FileSpreadsheet'),
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
