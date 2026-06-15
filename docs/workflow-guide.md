# 📘 Panduan Konfigurasi Workflow (Alur Kerja)

Workflow adalah mesin utama dalam sistem Manajemen Kontrak yang menentukan urutan peninjauan, persetujuan, dan penandatanganan dokumen. Panduan ini menjelaskan standar konfigurasi agar alur kerja berjalan dengan benar dan efisien.

---

## 1. Metadata Utama Workflow
Saat membuat workflow baru, tentukan parameter dasar berikut:
- **Nama Workflow**: Gunakan penamaan yang standar (contoh: `WF - Perjanjian Jasa - Regional`).
- **Tipe Kontrak**: Hubungkan dengan tipe kontrak (misal: *Perjanjian Sewa*) agar workflow otomatis terpilih saat tipe tersebut digunakan.
- **SLA (Service Level Agreement)**: Atur target waktu pengerjaan dalam satuan jam (misal: 24 jam untuk drafting).
- **Scope Initiator**: Tentukan departemen atau jabatan mana saja yang berhak memulai alur ini.

---

## 2. Definisi Tahapan (Workflow Steps)
Alur berjalan berdasarkan urutan angka (**Step 1, 2, 3, dst.**). Setiap tahapan memerlukan konfigurasi berikut:

### A. Tipe Pemeriksa (Approver Type)
Sistem memiliki 4 mekanisme penentuan pemeriksa:
1. **Role (Jabatan)**: Berdasarkan jabatan tertentu (contoh: *Legal Manager*). Gunakan opsi *Filter Department* jika ingin mencari role tersebut di departemen tertentu.
2. **Atasan (Hierarchy)**: Mencari atasan langsung dari pembuat dokumen (Atasan Level 1, 2, dst).
3. **Initiator**: Kembali ke pembuat dokumen awal (biasanya digunakan untuk tahap revisi).
4. **Assigned PIC**: Pemeriksa ditunjuk secara manual oleh petugas di tahap sebelumnya.

### B. Kategori Tahapan (Step Category)
Tentukan fase dokumen pada tahap tersebut:
- **Drafting**: Pengisian data, review konten, dan negosiasi.
- **Signing**: Proses tanda tangan dokumen (Internal/Eksternal).
- **Closing**: Tahap akhir, pemberian nomor kontrak resmi, dan pengarsipan.

---

## 3. Konfigurasi Aksi (Workflow Actions)
Setiap langkah **harus** memiliki minimal satu aksi agar alur tidak terhenti (*deadlock*).
- **Approve**: Melanjutkan dokumen ke tahap angka berikutnya.
- **Reject / Return**: Mengembalikan dokumen ke tahap sebelumnya atau ke tahap awal (Step 1).
- **Assign**: Menugaskan orang spesifik untuk memproses tahap selanjutnya.
- **Sign**: Validasi bahwa dokumen telah ditandatangani.

---

## 4. Logika Kondisional (Condition Expression)
Gunakan ekspresi logika jika sebuah tahapan hanya perlu muncul pada kriteria tertentu.
- *Contoh*: `nilai_transaksi > 100000000`
- Tahapan ini akan dilewati (*skipped*) secara otomatis jika kondisi tidak terpenuhi.

---

## 5. Prinsip "The Right Way" (Best Practices)
1. **Step 1 sebagai Safety Net**: Selalu jadikan Step 1 sebagai tahap bagi Initiator untuk memperbaiki dokumen jika terjadi penolakan dari tim Legal atau Manager.
2. **Satu Default Per Tipe**: Pastikan setiap Tipe Kontrak memiliki minimal satu workflow yang ditandai sebagai **Default**.
3. **Validasi Alur**: Periksa kembali urutan langkah dan aksi (Approve/Reject) untuk memastikan tidak ada alur yang memutar tanpa ujung.
4. **Gunakan Mandatory**: Tandai tahapan krusial (seperti Legal Review) sebagai *Mandatory* agar tidak bisa dilewati secara tidak sengaja.

---
*Dokumen ini adalah referensi resmi untuk Administrator Sistem Manajemen Kontrak.*
