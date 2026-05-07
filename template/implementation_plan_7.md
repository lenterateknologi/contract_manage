# Unified Workflow & Dynamic Rejection Logic (Final Specification)

Rencana ini telah disesuaikan dengan masukan pengguna terkait alur kerja detail F1 Kontrak, F1 Non-Kontrak, dan NDA Template.

## Architectural Principles

> [!IMPORTANT]
> **Tipe Perjanjian Baru:** Detail kontrak ditentukan berdasarkan tabel `m_contract_types` (F1 Contract, F1 Non-Contract, NDA Template).

> [!IMPORTANT]
> **Dynamic Rejection:** Setiap langkah memiliki `reject_target` yang fleksibel, memungkinkan alur kembali ke PIC atau Inisiator sesuai kebutuhan proses.

> [!IMPORTANT]
> **Attachment on Action:** Setiap tindakan (Approve/Reject) mendukung pelampiran dokumen (*attachment*).

## Standardized Step Types

| Step Type | Fungsi Utama | Keterangan |
| :--- | :--- | :--- |
| **`DRAFTING`** | Input Data / Form | Inisiasi, penomoran, penugasan PIC, upload draf, dan input Crown number. |
| **`APPROVAL`** | Persetujuan Struktural | Persetujuan hierarki (Ya/Tidak). |
| **`REVIEW`** | Pengecekan Kualitas | Review draf agreement atau sirkulasi inisiator. |
| **`UPLOAD`** | Upload TTD | PIC mengunggah dokumen TTD (Digital/Manual). |
| **`CLOSING`** | Finalisasi & Arsip | Langkah terakhir penyelesaian proses. |

---

## Proposed Changes

### 1. Workflow Definition: **F1 KONTRAK (Master)**

| Step | Nama Langkah | Step Type | Pemeran | Keterangan | Rejection Target |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Pengisian & Kelengkapan | `DRAFTING` | Initiator | Submit initial request | - |
| **2** | Review Atasan Inisiator | `APPROVAL` | SPV / Manager | Persetujuan awal | Step 1 |
| **3** | Verifikasi & Penugasan PIC | `DRAFTING` | **Legal Manager** | Assign ke Staf/PIC Legal | Step 1 |
| **4** | Drafting Agreement | `DRAFTING` | **PIC Legal** | Unggah draf kontrak | Step 3 |
| **5** | Review Draft (Internal) | `REVIEW` | **Legal Manager** | Cek draf sebelum ke inisiator | Step 4 |
| **6** | Sirkulasi Draft (Inisiator) | `REVIEW` | Initiator | Konfirmasi draf agreement | Step 4 |
| **7** | Input No & Generate F2 | `DRAFTING` | **PIC Legal** | Input No Crown & Gen F2 | Step 4 |
| **8** | Approval F2 (Legal Manager) | `APPROVAL` | Legal Manager | | Step 7 |
| **9** | Approval F2 (VP Legal) | `APPROVAL` | VP Legal | | Step 8 |
| **10** | Approval F2 (SPV Inisiator) | `APPROVAL` | SPV / Manager | Konfirmasi ulang F2 | Step 7 |
| **11** | Approval F2 (Manajemen) | `APPROVAL` | **Direksi / VP** | **(Konsolidasi CEO/VP/COO)** | Step 7 |
| **12** | Penentuan & Upload TTD | `UPLOAD` | **PIC Legal** | Tentukan Digital/Basah | Step 7 |
| **13** | Closing & Arsip | `CLOSING` | Last User | Penutupan proses | - |

---

### 2. Workflow Definition: **F1 NON-CONTRACT (Corporate Action)**

| Step | Nama Langkah | Step Type | Pemeran | Keterangan | Rejection Target |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Pengisian & Kelengkapan | `DRAFTING` | Restricted Initiator | - | - |
| **2** | Review Atasan Langsung | `APPROVAL` | SPV / Manager | - | Step 1 |
| **3** | Review Direksi (Nisa/Rendi) | `APPROVAL` | **Nisa / Rendi** | **(Optional Reviewer)** | Step 1 |
| **4** | Verifikasi & Penugasan PIC | `DRAFTING` | Legal Manager | - | Step 1 |
| **5** | Upload TTD Manual | `UPLOAD` | **PIC Legal** | Unggah TTD basah/manual | Step 4 |
| **6** | Closing & Arsip | `CLOSING` | Legal Staff | - | - |

---

### 3. Workflow Definition: **NDA TEMPLATE (Fast Track)**

| Step | Nama Langkah | Step Type | Pemeran | Keterangan | Rejection Target |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Input & Upload NDA | `DRAFTING` | Initiator | Input vendor + proyek | - |
| **2** | Closing & Arsip | `CLOSING` | Legal Staff | Tanpa review/pic | Step 1 |

---

### 4. Database Schema Update: **Table Tipe Perjanjian**

Akan ditambahkan/diperbarui tabel `m_contract_types` untuk menentukan perilaku field berdasarkan kategori:

| ID | Kode | Nama Tipe | Workflow | Fitur Detail |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `F1-CON` | F1 Contract | Master Workflow | Tax (Optional), All Initiator |
| 2 | `F1-NON` | F1 Non-Contract | Corporate Workflow | Restricted Initiator, Optional Review |
| 3 | `NDA-TMP` | NDA Template | Fast Track | No Review, Direct Archive, Vendor info |

---

## Technical Implementation Details

### Backend (Laravel)
- **ContractWorkflowService:** Mendukung rejeksi ke PIC (Step 4/7) atau Inisiator (Step 1).
- **Attachment Logic:** Menambahkan field `attachment_path` pada tabel transaksi approval/reject.
- **Dynamic Reviewer:** Implementasi pemilihan reviewer (Nisa/Rendi) pada F1 Non-Contract.

### Frontend (React)
- **Workflow Form:** Update UI untuk mendukung konfigurasi target rejeksi yang lebih kompleks.
- **Approval Modal:** Menambahkan input untuk unggah attachment saat melakukan approval/reject.

## Verification Plan
1. Seed database dengan `UnifiedWorkflowSeeder` yang mencakup 13-langkah master.
2. Uji coba skenario Rejeki Inisiator vs Rejeki PIC Legal.
3. Verifikasi dokumen F2 yang di-generate oleh PIC Legal pada Step 7.
