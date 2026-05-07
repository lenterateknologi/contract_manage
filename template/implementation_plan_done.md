# Rencana Implementasi: Sistem Alur Persetujuan (Workflow) Full Dinamis (Updated v3)

Penyederhanaan alur review atasan langsung: SPV dan Manager Initiator adalah level atau peran yang sama untuk persetujuan pertama.

## User Review Required

> [!IMPORTANT]
> - **Penggabungan Review Atasan**: Langkah "Review Atasan" kini disederhanakan menjadi **1 langkah tunggal** (Step 2). Ini langsung merujuk pada atasan langsung dari Initiator (SPV/Manager), sehingga tidak ada review berjenjang yang berlebihan.

---

## Skema Alur Kerja di Dashboard yang Diperbarui

### A. Flow Permohonan F1 (Fase: `f1_request`)

| Urutan | Nama Langkah | Fase | Tipe Approver | Pemeran / Peran | Kondisi Dinamis | Target Jika Ditolak |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Pengisian & Kelengkapan | `f1_request` | `drafting` | `Initiator` | - | - |
| **2** | Review Atasan Langsung | `f1_request` | `atasan` | `SPV / Manager Initiator` | - | `Kembali ke Step 1` |
| **3** | Review Perpajakan | `f1_request` | `role` | `Tax Manager` | `contract.has_tax == true` | `Kembali ke Step 1` |
| **4** | Review Manajemen (COO/VP) | `f1_request` | `role` | `COO / VP / Deputy` | Fleksibel per workflow | `Kembali ke Step 1` |
| **5** | Review Direksi (CEO) | `f1_request` | `role` | `CEO / MD` | Fleksibel per workflow | `Kembali ke Step 1` |
| **6** | Kelengkapan Dokumen | `f1_request` | `review` | `Legal Manager` | - | `Kembali ke Step 1` |

### B. Flow Pembuatan Kontrak (Fase: `contract_creation`)

| Urutan | Nama Langkah | Fase | Tipe Approver | Pemeran / Peran | Kondisi Dinamis | Target Jika Ditolak |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **7** | Assignee & Input No | `contract_creation` | `drafting` | `Legal Manager` | - | `Kembali ke Step 1` |
| **8** | Draft Kontrak & Upload Agreement | `contract_creation` | `drafting` | `Legal Staff` | - | `Kembali ke Step 7` |
| **9** | Review Kontrak (Manager Legal) | `contract_creation` | `review` | `Legal Manager` | - | `Kembali ke Step 8` |
| **10** | Review Kontrak (VP Legal) | `contract_creation` | `review` | `VP Legal` | - | `Kembali ke Step 9` |
| **11** | Sirkulasi Kontrak (Review Final) | `contract_creation` | `review` | `Initiator` | - | `Revisi Form F1` |
| **12** | Penentuan & Upload Dokumen TTD | `contract_creation` | `upload_signed_doc` | `Legal Staff / Initiator` | - | `Kembali ke Step 8` |
| **13** | Validasi Akhir & Closing | `contract_creation` | `closing_check` | `Legal Staff` | - | - |

---

## Rencana Verifikasi

1. **Unit Tests**:
   - `DirectSuperiorApprovalTest` untuk memvalidasi alur persetujuan oleh atasan langsung (SPV/Manager).
2. **UAT via UI Dashboard**:
   - Memastikan bahwa hanya ada satu langkah persetujuan atasan sebelum beralih ke tim Perpajakan atau Manajemen.
