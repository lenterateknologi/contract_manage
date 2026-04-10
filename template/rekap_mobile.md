# Blueprint Mockup Mobile - Contract Management System

Dokumen ini berisi rangkuman arsitektur, gaya desain, dan alur kerja (workflow) sistem untuk membantu perancangan mockup mobile agar tetap selaras dengan sistem web saat ini.

## 1. Identitas Visual (Design System)

Sistem menggunakan gaya **High-Density Admin Console** dengan estetika premium dan bersih.

- **Palet Warna:**
    - **Primer:** Tailwind `slate-900` (Teks/Header) dan `primary` (Aksi Utama).
    - **Status Badges:** Khusus untuk membedakan kondisi kontrak:
        - `draft`: Gray/Slate
        - `in_review`: Blue
        - `revision`: Amber/Orange
        - `approved`: Emerald/Green
        - `rejected`: Rose/Red
    - **Aksen:** Glassmorphism pada sidebar web, transisi lembut (animate-in).
- **Tipografi:** Modern Sans-serif (Inter/Geist). Font Monospace digunakan untuk No. Kontrak dan ID.
- **Mode:** Mendukung Dark Mode secara native.

## 2. Struktur Menu & Modul (Information Architecture)

Untuk mobile, menu dapat dikelompokkan menjadi 4-5 Tab Utama di bagian bawah (Bottom Navigation):

1.  **Dashboard (Home):**
    - Metrik Utama (SLA, Total Kontrak, Pending).
    - Grafik Tren Pertumbuhan (Grouped Bar Chart).
    - Akses cepat ke kontrat terbaru.
2.  **Contract Registry:**
    - Daftar semua kontrak dengan sistem filter (Tipe, Range Tanggal).
    - Pencarian global.
3.  **Pending Actions:**
    - Khusus menampilkan kontrak yang menunggu persetujuan user tersebut (Bottleneck analysis).
4.  **Audits & Reports:**
    - Laporan rekapitulasi dan Audi Trail aktivitas.
5.  **Profile / Settings:**
    - Pengaturan profil, password, dan tampilan (Light/Dark).

## 3. Core Workflow (Logic & Process)

Alur kerja yang harus direplikasi dalam mockup mobile:

- **Penyusunan (Initiation):** User memilih Tipe Kontrak -> Isi metadata (Judul/Desc) -> Upload file F1 (Draft).
- **Review Alur (Approval Sequence):** Kontrak berjalan melalui serangkaian `sequence` (1, 2, 3...) berdasarkan workflow.
- **Iterasi (Revision):** Jika direview dan butuh perbaikan, status menjadi `revision`. User mengunggah versi baru (v1 -> v2 -> v3).
- **Interaksi Internal:** Adanya fitur chat/pesan internal di dalam detail kontrak untuk klarifikasi antar approver.
- **Finalisasi:** Setelah langkah terakhir disetujui, status menjadi `approved` dan dokumen F2 (Final) diunggah.

## 4. Komponen Utama Mockup (UI Components)

Elemen kunci yang wajib ada di setiap layar:

- **Header Bar:** Breadcrumbs atau Judul Halaman dengan ikon notifikasi.
- **Contract Card:**
    - Header: No. Kontrak & Status Badge.
    - Body: Judul, Tipe, dan Nama Pembuat.
    - Footer: Tanggal dibuat & indikator tahapan (current step).
- **Step Indicator (Vertical Timeline):** Menampilkan perjalan approval dari bawah ke atas atau atas ke bawah.
- **Version Selector:** Tab atau Dropdown untuk berpindah antar riwayat revisi dokumen.
- **Audit Trail List:** List item dengan ikon aksi (Pencil untuk edit, Check untuk approve, Cloud untuk upload).

## 5. Referensi Teknis (Database)

- **Contracts:** `id`, `contract_no`, `title`, `status`.
- **Approvals:** `contract_id`, `role`, `status`, `sequence`.
- **Versions:** `contract_id`, `version_no`, `document_type` (F1/F2), `uploaded_by`.
- **Messages:** `contract_id`, `user_id`, `message`.

---

_Blueprint ini dirancang berdasarkan implementasi Sistem Manajemen Kontrak versi April 2026._
