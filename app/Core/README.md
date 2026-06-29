# Mini-Filament CRUD Guide

Mini-Filament adalah mesin CRUD berbasis skema (schema-driven) modular yang dinamis di aplikasi ini, terinspirasi oleh konsep Laravel Filament. Sistem ini secara otomatis merender halaman Indeks (Data Table), Create Form, dan Edit Form tanpa harus membuat file controller atau komponen React manual untuk setiap modul master baru.

---

## 1. Struktur Folder
Sistem Mini-Filament terbagi dalam folder berikut:
- **`app/Core/Crud/`**:
  - `Resource.php`: Base class untuk setiap schema resource.
  - `Columns/`: Class kolom tabel (seperti `TextColumn`, `BooleanColumn`).
  - `Fields/`: Class input form (seperti `TextInput`, `SelectInput`, `TextareaInput`, `ToggleInput`).
  - `Filters/`: Class penyaringan data (`Filter`).
  - `Resources/`: Kumpulan file schema resource (seperti `UserResource.php`, `VendorResource.php`).
- **`app/Http/Controllers/Core/ResourceController.php`**: Orchestrator backend yang memproses query database, validasi, penyimpanan, dan rendering halaman Inertia.
- **`resources/js/pages/Core/`**:
  - `ResourceIndex.tsx`: Komponen halaman tabel indeks dinamis.
  - `ResourceForm.tsx`: Komponen form edit dan tambah dinamis.

---

## 2. Cara Membuat Resource Baru
Untuk mendaftarkan model master baru ke dalam Mini-Filament, ikuti langkah-langkah di bawah ini:

### Langkah A: Buat File Resource
Buat file resource baru di dalam folder `app/Core/Crud/Resources/`, misalnya `ProductResource.php`:

```php
<?php

namespace App\Core\Crud\Resources;

use App\Core\Crud\Resource;
use App\Core\Crud\Columns\TextColumn;
use App\Core\Crud\Columns\BooleanColumn;
use App\Core\Crud\Fields\TextInput;
use App\Core\Crud\Fields\SelectInput;
use App\Core\Crud\Fields\TextareaInput;
use App\Core\Crud\Fields\ToggleInput;
use App\Core\Crud\Filters\Filter;
use App\Models\Product;
use App\Models\Category;

class ProductResource extends Resource
{
    // 1. Model target Eloquent
    public static string $model = Product::class;

    // 2. Relasi yang akan dieagerload
    public static array $with = ['category'];

    // 3. Judul halaman CRUD
    public static ?string $title = 'Master Produk';

    // 4. URL slug untuk CRUD (ex: /admin/core/products)
    public static ?string $slug = 'products';

    // 5. Layout kolom form (1, 2, atau 3 kolom grid)
    public static int $formColumns = 2;

    // 6. Kelas export Excel (opsional, jika ingin mengaktifkan ekspor)
    public static ?string $exportClass = \App\Exports\ProductsExport::class;

    // 7. Kelas import Excel (opsional, jika ingin mengaktifkan impor)
    public static ?string $importClass = \App\Imports\ProductsImport::class;

    /**
     * Konfigurasi Kolom Tabel (Data Table)
     */
    public static function table(): array
    {
        return [
            TextColumn::make('code', 'Kode Produk')->sortable()->searchable(),
            TextColumn::make('name', 'Nama Produk')->sortable()->searchable(),
            TextColumn::make('category.name', 'Kategori')->sortable(),
            TextColumn::make('price', 'Harga Jual')->sortable(),
            BooleanColumn::make('is_active', 'Status'),
        ];
    }

    /**
     * Konfigurasi Input Form (Create & Edit)
     */
    public static function form(): array
    {
        return [
            TextInput::make('code', 'Kode Produk')
                ->required()
                ->rules(['string', 'max:50']),
            TextInput::make('name', 'Nama Produk')
                ->required()
                ->rules(['string', 'max:255']),
            SelectInput::make('category_id', 'Kategori')
                ->required()
                ->options(fn() => Category::orderBy('name')->pluck('name', 'id')->toArray()),
            TextInput::make('price', 'Harga Jual')
                ->required()
                ->rules(['numeric', 'min:0']),
            TextareaInput::make('description', 'Deskripsi Produk')
                ->rules(['nullable', 'string'])
                ->columnSpan(2), // Membuat textarea memanjang penuh (span 2 kolom)
            ToggleInput::make('is_active', 'Status Aktif')
                ->default(true)
                ->columnSpan(2),
        ];
    }

    /**
     * Konfigurasi Filter Penyaringan Data
     */
    public static function filters(): array
    {
        return [
            Filter::make('category_id', 'Kategori')
                ->options(fn() => Category::orderBy('name')->pluck('name', 'id')->toArray()),
            Filter::make('is_active', 'Status Aktif')
                ->options([
                    '1' => 'Aktif',
                    '0' => 'Nonaktif',
                ]),
        ];
    }
}
```

### Langkah B: Daftarkan di ResourceController
Buka file `app/Http/Controllers/Core/ResourceController.php` dan daftarkan resource baru Anda ke dalam properti `$resources`:

```php
    protected array $resources = [
        // Resource lama...
        'products' => \App\Core\Crud\Resources\ProductResource::class,
    ];
```

### Langkah C: Perbarui Menu Navigasi
Perbarui path/route di menu sidebar (tabel `m_modules` di database) untuk menu terkait agar mengarah ke:
`admin/core/products` (sebagai contoh).

---

## 3. Komponen Form yang Didukung
- **`TextInput::make('name', 'Label')`**: Input teks standar. Dapat ditambahkan validasi regex/rules Laravel lainnya menggunakan `->rules([...])`.
- **`SelectInput::make('name', 'Label')->options($options)`**: Input dropdown. Opsi select dapat dioperasikan menggunakan static array biasa `['key' => 'value']` or berupa Closure/Fn `fn() => Model::pluck(...)` untuk query dinamis.
- **`TextareaInput::make('name', 'Label')`**: Input teks multibaris untuk deskripsi atau alamat panjang.
- **`ToggleInput::make('name', 'Label')`**: Input Switch ON/OFF (Boolean).

---

## 4. Keunggulan Fitur
1. **Grid Form yang Fleksibel**: Anda cukup merubah properti `public static int $formColumns = X` untuk mengganti layout kolom form (1, 2, atau 3 kolom), dan mengatur lebar individual field dengan `->columnSpan(Y)`.
2. **Dynamic Eager Loading**: Relasi yang didaftarkan di static `$with` otomatis dipanggil di query dan dapat di-render langsung di kolom tabel menggunakan dot notation (contoh: `category.name` atau `creator.profile.name`).
3. **Pencarian & Penyaringan Otomatis**: Kolom tabel yang dipasangi `->searchable()` otomatis terintegrasi ke kolom pencarian atas. Begitu pula item di `filters()` otomatis memunculkan tombol panel filter di samping pencarian.
