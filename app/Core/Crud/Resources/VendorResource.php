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
            TextColumn::make('vendor_code', 'Kode Vendor')->sortable()->searchable(),
            TextColumn::make('vendor_name', 'Nama Vendor')->sortable()->searchable(),
            BooleanColumn::make('is_active', 'Status Aktif'),
        ];
    }

    public static function form(): array
    {
        return [
            TextInput::make('vendor_code', 'Kode Vendor')
                ->required()
                ->rules(['string', 'max:50']),
            TextInput::make('vendor_name', 'Nama Vendor')
                ->required()
                ->rules(['string', 'max:255']),
            ToggleInput::make('is_active', 'Status Aktif')
                ->default(true),
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
