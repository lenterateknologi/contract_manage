<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Columns\BooleanColumn;
use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Fields\TextareaInput;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Fields\ToggleInput;
use App\Core\Crud\Filters\Filter;
use App\Core\Crud\Resource;
use App\Exports\VendorsExport;
use App\Imports\VendorsImport;
use App\Models\Vendor;

class VendorResource extends Resource
{
    public static string $model = Vendor::class;

    public static ?string $title = 'Vendor';

    public static ?string $slug = 'vendors';

    public static int $formColumns = 2;

    public static ?string $exportClass = VendorsExport::class;

    public static ?string $importClass = VendorsImport::class;

    public static function table(): array
    {
        return [
            TextColumn::make('external_code', 'Kode COMA')->sortable()->searchable(),
            TextColumn::make('code', 'Kode Lokal')->sortable()->searchable(),
            TextColumn::make('name', 'Nama Vendor')->sortable()->searchable(),
            TextColumn::make('company_type', 'Tipe Perusahaan')->sortable()->searchable(),
            TextColumn::make('email', 'Email')->sortable()->searchable(),
            TextColumn::make('city', 'Kota')->sortable()->searchable(),
            TextColumn::make('vendor_status', 'Status Rekanan')->sortable()->searchable(),
            BooleanColumn::make('is_active', 'Status Aktif'),
        ];
    }

    public static function form(): array
    {
        return [
            // ponytail: external_code readonly — diisi otomatis dari sync COMA
            TextInput::make('external_code', 'Kode COMA')
                ->type('readonly')
                ->placeholder('Diisi otomatis dari sync COMA'),
            TextInput::make('code', 'Kode Lokal')
                ->required()
                ->rules(['string', 'max:50']),
            TextInput::make('name', 'Nama Vendor')
                ->required()
                ->rules(['string', 'max:255']),
            TextInput::make('company_type', 'Tipe Perusahaan')
                ->rules(['nullable', 'string', 'max:100']),
            TextInput::make('email', 'Email')
                ->rules(['nullable', 'email', 'max:255']),
            TextInput::make('phone', 'No. Telepon')
                ->rules(['nullable', 'string', 'max:50']),
            TextInput::make('pic_name', 'Nama PIC')
                ->rules(['nullable', 'string', 'max:255']),
            TextInput::make('npwp', 'NPWP')
                ->rules(['nullable', 'string', 'max:50']),
            TextareaInput::make('address', 'Alamat')
                ->rules(['nullable', 'string'])
                ->columnSpan(2),
            ToggleInput::make('is_active', 'Status Aktif')
                ->default(true),
        ];
    }

    public static function filters(): array
    {
        return [
            Filter::make('company_type', 'Tipe Perusahaan')
                ->options(function () {
                    return \App\Models\Vendor::query()
                        ->whereNotNull('company_type')
                        ->where('company_type', '!=', '')
                        ->distinct()
                        ->pluck('company_type', 'company_type')
                        ->toArray();
                }),
            Filter::make('vendor_status', 'Status Rekanan')
                ->options(function () {
                    return \App\Models\Vendor::query()
                        ->whereNotNull('vendor_status')
                        ->where('vendor_status', '!=', '')
                        ->distinct()
                        ->pluck('vendor_status', 'vendor_status')
                        ->toArray();
                }),
            Filter::make('is_active', 'Status Aktif')
                ->options([
                    '1' => 'Aktif',
                    '0' => 'Nonaktif',
                ]),
        ];
    }
}
