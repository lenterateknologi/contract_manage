# Contract Management System (CMS)

Sistem Manajemen Kontrak terintegrasi dengan alur kerja persetujuan (workflow approval) bertingkat.

## Fitur Utama

- **Workflow Approval**: Persetujuan dinamis berbasis departemen, peran (role), atau nominal kontrak.
- **Document Versioning**: Manajemen versi dokumen perjanjian (.docx) dan riwayat perubahannya.
- **Audit Trail**: Pencatatan riwayat aksi secara lengkap dari draft hingga final.
- **Dashboard & Reporting**: Visualisasi status kontrak dan ekspor laporan ke Excel/PDF.

## Tech Stack

- **Backend**: Laravel 12 (PHP 8.2+)
- **Frontend**: React 19, Inertia.js v2, Tailwind CSS v4

## Instalasi dan Pengaturan

1. Clone repositori dan masuk ke direktori proyek.
2. Salin file konfigurasi lingkungan:
   ```bash
   cp .env.example .env
   ```
3. Instal dependensi backend dan frontend:
   ```bash
   composer install
   npm install
   ```
4. Generate key aplikasi dan jalankan migrasi database:
   ```bash
   php artisan key:generate
   php artisan migrate
   ```
5. Jalankan seeder untuk mengisi data master awal:
   ```bash
   php artisan db:seed
   ```
6. Jalankan server lokal:
   ```bash
   # Terminal 1 (Backend)
   php artisan serve
   
   # Terminal 2 (Frontend)
   npm run dev
   ```
