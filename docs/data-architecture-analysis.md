# Analisis Arsitektur Data: Database Table vs. Hardcoded (Enums)

Berdasarkan analisis struktur model, migrasi, dan logika bisnis pada proyek **Contract Management** ini, berikut adalah rekomendasi mengenai data mana yang sebaiknya tetap di tabel database dan mana yang lebih efisien jika dijadikan *hardcoded* (Enum/Constant).

---

## 1. Data yang Sebaiknya Menjadi Hardcoded (Enum/Constant)

Data ini adalah **Sistem Konfigurasi** yang jarang sekali berubah. Memindahkan data ini ke kode (*hardcoded*) akan meningkatkan performa (mengurangi query `SELECT`) dan memudahkan integrasi di sisi Frontend (TypeScript).

### A. Master Actions (`m_master_actions`)
Saat ini tersimpan di tabel: `approve`, `reject`, `assign`, `upload`, `review`, `return`, `sign`.
- **Alasan**: Logika sistem (PHP & JS) sangat bergantung pada *string* kode ini. Jika administrator mengubah `approve` menjadi `konfirmasi` di database, maka logika `if ($action == 'approve')` di program akan rusak.
- **Rekomendasi**: Gunakan **PHP 8.2 Native Enums**.

### B. Contract Statuses (`m_contract_statuses`)
Saat ini tersimpan di tabel: `draft`, `in_review`, `revision`, `approved`, `locked`, `archived`, `rejected`.
- **Alasan**: Status kontrak menentukan alur UI (warna badge, izin tombol). Data ini bersifat sistemik, bukan data dinamis yang bertambah setiap hari.
- **Rekomendasi**: Pindahkan ke **Enum** atau **Config File**. Metadata seperti warna (`color`, `bg_color`) bisa tetap di database jika ingin fleksibel, namun kodenya harus statis.

### C. Approver Types & Step Categories
Data di kolom `approver_type` (`role`, `atasan`, `initiator`, `assigned_pic`) dan `step_category` (`drafting`, `signing`, `closing`).
- **Alasan**: Ini adalah opsi mesin workflow. Penambahan opsi baru memerlukan perubahan kode mesin workflow, sehingga tidak ada gunanya disimpan sebagai data dinamis.

---

## 2. Data yang Wajib Tetap di Database Table

Data ini adalah **Master Data Bisnis** yang akan terus bertambah, berubah, dan memiliki relasi kompleks.

### A. Organizational Data
- **Models**: `CompanyGroup`, `Region`, `Company`, `Department`.
- **Alasan**: Struktur perusahaan dinamis. Bisa terjadi merger, penambahan divisi baru, atau perubahan wilayah tanpa harus melakukan *deployment* kode.

### B. Access Control (RBAC)
- **Models**: `Role`, `Module`, `AccessModule`, `RoleModuleGroup`.
- **Alasan**: Administrator harus bisa mengatur siapa boleh melihat apa tanpa bantuan *developer*.

### C. Dynamic Form Templates
- **Models**: `FormTemplate`, `FormField`.
- **Alasan**: Fitur utama aplikasi ini adalah "Contract Builder". User harus bisa membuat formulir custom kapan saja (seperti yang telah kita kerjakan untuk F1 dan F2).

### D. Vendor & Contacts
- **Models**: `Vendor`, `VendorDocument`.
- **Alasan**: Data eksternal yang jumlahnya akan mencapai ribuan record.

---

## 3. Strategi Implementasi Rekomendasi

| Entitas | Status Saat Ini | Rekomendasi | Keuntungan |
| :--- | :--- | :--- | :--- |
| **Master Action** | Table | **PHP Enum** | *Type-safety* di level kode |
| **Contract Status** | Table | **PHP Enum** | Performa query & konsistensi UI |
| **Input Mechanism** | String | **PHP Enum** | Menghindari typo (`form` vs `digital`) |
| **Workflow Types** | Table | **Table** | Tetap di tabel (sudah benar) |

### Usulan Struktur Enum (Contoh: MasterAction)
```php
namespace App\Enums;

enum MasterAction: string {
    case APPROVE = 'approve';
    case REJECT = 'reject';
    case RETURN = 'return';
    case SIGN = 'sign';
}
```

---
**Kesimpulan**: Proyek ini sudah memiliki arsitektur yang cukup baik, namun terlalu banyak bergantung pada tabel database untuk hal-hal yang bersifat **Sistemik**. Dengan memindahkan "Sistemik Master" ke **Enums**, kode akan menjadi lebih bersih, *less bug-prone*, dan jauh lebih cepat.
