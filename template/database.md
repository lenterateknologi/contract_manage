# Rekap Database Schema - Contract Management System

Berikut adalah struktur tabel dan relasi yang membangun sistem manajemen kontrak ini:

## 1. Identitas & Autentikasi
### `users`
Menyimpan data pengguna sistem.
- `id` (UUID): Primary key.
- `name`, `email`, `password`: Data autentikasi.
- `role`: Peranan user (Initiator, Legal, Management, dll).
- `bg_color`, `text_color`: Properti visual avatar.

### `roles`
Daftar peranan yang tersedia di sistem.
- `id`: Primary key.
- `name`: Nama role (misal: Legal, Tax).
- `description`: Penjelasan tugas role.

## 2. Master Data
### `contract_types`
Kategori kontrak.
- `id`: Primary key.
- `name`: Nama kategori (misal: Jasa, Pengadaan).
- `description`: Penjelasan kategori.

### `workflows` (Templates & Ad-hoc)
Definisi alur persetujuan.
- `id`: Primary key.
- `contract_type`: Kaitan dengan tipe kontrak.
- `name`: Nama alur.
- `is_default`: Penanda alur otomatis utama.
- `is_template`: `true` untuk master data, `false` untuk alur kustom per kontrak.
- `created_by`, `updated_by`: Audit fields.

### `workflow_steps`
Langkah-langkah di dalam sebuah alur.
- `id`: Primary key.
- `workflow_id`: FK ke tabel `workflows`.
- `user_id` (UUID, Nullable): FK ke `users` untuk approver spesifik.
- `role`: Role yang berwenang jika `user_id` kosong.
- `step`: Urutan langkah (1, 2, 3...).
- `description`: Deskripsi instruksi langkah.

## 3. Bisnis & Operasional
### `contracts`
Data utama kontrak.
- `id` (UUID): Primary key.
- `contract_no`: Nomor unik kontrak.
- `title`, `description`: Judul dan deskripsi.
- `status`: Status saat ini (draft, in_review, approved, dll).
- `current_version`: Nomor versi aktif.
- `created_by`: FK ke `users` (inisiator).
- `contract_type_id`: FK ke `contract_types`.

### `approvals`
Tracking status persetujuan setiap langkah.
- `id`: Primary key.
- `contract_id`: FK ke `contracts`.
- `workflow_step_id`: FK ke `workflow_steps`.
- `user_id`: FK ke `users` (approver yang memproses).
- `status`: Status langkah (pending, approved, rejected).
- `note`: Catatan/alasan dari approver.
- `approved_at`: Waktu eksekusi approval.

### `contract_versions`
Riwayat revisi dokumen kontrak dan form F1/F2.
- `id`: Primary key.
- `contract_id`: FK ke `contracts`.
- `document_type`: Jenis dokumen (contract, f1, f2).
- `version_no`: Nomor versi dokumen.
- `file_path`, `file_name`: Informasi file fisik.
- `file_hash`: Untuk integritas file.
- `uploaded_by`: FK ke `users`.

## 4. Komunikasi & Log
### `contract_histories`
Audit trail lengkap per kontrak.
- `action`: Jenis aksi (misal: "Sent for Approval").
- `description`: Detail keterangan aksi.
- `actor_id`: FK ke `users` pelaku aksi.

### `contract_messages`
Pesan chat internal kontrak.
- `user_id`: FK ke `users` pengirim.
- `message`: Isi pesan.
- `read_by` (JSON): Menyimpan daftar user ID yang sudah membaca.

### `contract_attachments`
File pendukung kontrak.
- `label`, `category`: Klasifikasi lampiran.
- `file_name`, `file_path`, `file_type`: Metadata file.
- `uploaded_by`: FK ke `users`.
