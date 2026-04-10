# Rekapitulasi Akses Menu Berdasarkan Role

Berikut adalah tabel akses menu untuk aplikasi Contract Management System:

| Menu Utama | Sub-Menu | Admin | Initiator | Legal | Tax | Management | Direksi | Vendor |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Ringkasan** | Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Manajemen Kontrak** | Semua Kontrak | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| | Menunggu Approval | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Formulir Standar** | Form F1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| | Form F2 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Data Master** | Pengguna | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| | Role | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| | Tipe Kontrak | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| | Alur Kerja | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| | Audit Trail (Log) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Catatan:**
- **Menunggu Approval**: Meskipun dapat diakses oleh semua role, konten yang ditampilkan hanya kontrak yang memerlukan tindakan persetujuan dari role tersebut.
- **Audit Trail**: Akses ke riwayat log aktivitas sistem dibatasi secara ketat hanya untuk role **Admin** demi keamanan dan integritas data.
- **Aksi Kontrak**:
    - **Draft**: Hanya dapat diubah/dihapus oleh pembuatnya (Initiator) atau Admin.
    - **In Review / Approved**: Kontrak dikunci untuk perubahan demi menjaga validitas alur kerja.
