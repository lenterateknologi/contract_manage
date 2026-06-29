<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Resource;
use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Columns\BooleanColumn;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Fields\TextareaInput;
use App\Core\Crud\Fields\ToggleInput;
use App\Core\Crud\Filters\Filter;
use App\Models\Vendor;

class VendorResource extends Resource
{
    public static string $model = Vendor::class;
    public static ?string $title = 'Vendor';
    public static ?string $slug = 'vendors';
    public static int $formColumns = 2;
    public static ?string $exportClass = \App\Exports\VendorsExport::class;
    public static ?string $importClass = \App\Imports\VendorsImport::class;

    public static function table(): array
    {
        return [
            TextColumn::make('code', 'Kode')->sortable()->searchable(),
            TextColumn::make('name', 'Nama Vendor')->sortable()->searchable(),
            TextColumn::make('company_type', 'Tipe Perusahaan')->sortable()->searchable(),
            TextColumn::make('email', 'Email')->sortable()->searchable(),
            TextColumn::make('phone', 'No. Telepon')->searchable(),
            BooleanColumn::make('is_active', 'Status Aktif'),
        ];
    }

    public static function form(): array
    {
        return [
            TextInput::make('code', 'Kode')
                ->required()
                ->rules(['string', 'max:50']),
            TextInput::make('name', 'Nama Vendor')
                ->required()
                ->rules(['string', 'max:255']),
            TextInput::make('company_type', 'Tipe Perusahaan')
                ->rules(['nullable', 'string', 'max:100']),
            TextInput::make('category', 'Kategori')
                ->rules(['nullable', 'string', 'max:100']),
            TextInput::make('email', 'Email')
                ->rules(['nullable', 'email', 'max:255']),
            TextInput::make('phone', 'No. Telepon')
                ->rules(['nullable', 'string', 'max:50']),
            TextInput::make('website', 'Website')
                ->rules(['nullable', 'string', 'max:255']),
            TextInput::make('pic_name', 'Nama PIC')
                ->rules(['nullable', 'string', 'max:255']),
            TextInput::make('pic_position', 'Jabatan PIC')
                ->rules(['nullable', 'string', 'max:255']),
            TextInput::make('director_name', 'Nama Direktur')
                ->rules(['nullable', 'string', 'max:255']),
            TextInput::make('npwp', 'NPWP')
                ->rules(['nullable', 'string', 'max:50']),
            TextInput::make('nib', 'NIB')
                ->rules(['nullable', 'string', 'max:50']),
            TextInput::make('siup', 'SIUP')
                ->rules(['nullable', 'string', 'max:50']),
            TextInput::make('bank_name', 'Nama Bank')
                ->rules(['nullable', 'string', 'max:255']),
            TextInput::make('bank_account_no', 'No. Rekening')
                ->rules(['nullable', 'string', 'max:100']),
            TextInput::make('bank_account_name', 'Nama Rekening')
                ->rules(['nullable', 'string', 'max:255']),
            TextareaInput::make('address', 'Alamat')
                ->rules(['nullable', 'string'])
                ->columnSpan(2),
            ToggleInput::make('is_individual', 'Perorangan (Individual)')
                ->default(false),
            ToggleInput::make('is_active', 'Status Aktif')
                ->default(true),
        ];
    }

    public static function filters(): array
    {
        return [
            Filter::make('is_individual', 'Perorangan')
                ->options([
                    '1' => 'Perorangan',
                    '0' => 'Perusahaan',
                ]),
            Filter::make('is_active', 'Status Aktif')
                ->options([
                    '1' => 'Aktif',
                    '0' => 'Nonaktif',
                ]),
        ];
    }
}
