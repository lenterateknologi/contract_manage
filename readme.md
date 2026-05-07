# 📄 Contract Management System (CMS)

## 🎯 Overview

Sistem ini dirancang untuk mengelola dokumen kontrak dengan fitur:

- Multi-level approval
- Upload & download file (Word / .docx)
- Versioning (web & file storage)
- Audit trail lengkap

---

## 🔁 Flow Utama

1. Initiator membuat contract
2. Upload file awal (.docx)
3. Sistem membuat versi pertama (v1)
4. Masuk ke proses approval berlapis
5. Jika revisi → upload ulang → versi baru
6. Jika semua approve → status final
7. Contract disimpan ke Document Management System (ELO/S3)

---

## 🗂️ Database Schema

### Contracts

```sql
Table contracts {
  id int [pk]
  contract_no varchar
  title varchar
  description text
  created_by int
  current_version_id int
  status varchar // draft, in_review, approved, rejected, archived
  created_at timestamp
}
```

### Contract Versions

```sql
Table contract_versions {
  id int [pk]
  contract_id int
  version_no int
  file_name varchar
  file_path varchar
  file_hash varchar
  change_log text
  uploaded_by int
  is_final boolean
  created_at timestamp
}
```

### Contract Approvals

```sql
Table contract_approvals {
  id int [pk]
  contract_id int
  version_id int
  approver_id int
  role varchar
  status varchar // pending, approved, rejected
  note text
  approved_at timestamp
  sequence int
}
```

### Contract Histories

```sql
Table contract_histories {
  id int [pk]
  contract_id int
  action varchar
  description text
  actor_id int
  created_at timestamp
}
```

### File Metadata

```sql
Table contract_files_metadata {
  id int [pk]
  version_id int
  file_size int
  mime_type varchar
  storage_type varchar // local, s3, elo
}
```

---

## 🔄 Versioning Strategy

### A. Versioning (Database)

- Menggunakan `version_no` increment
- `current_version_id` sebagai versi aktif
- Semua perubahan disimpan (audit trail)

Contoh:

| Version | Status   | Keterangan   |
| ------- | -------- | ------------ |
| v1      | rejected | revisi legal |
| v2      | rejected | revisi tax   |
| v3      | approved | final        |

---

### B. Versioning (File Storage)

Struktur folder:

```
/contracts/{contract_id}/
  ├── v1_initial.docx
  ├── v2_revision.docx
  ├── v3_final.docx
```

Atau:

```
{contract_id}_{version}_{timestamp}.docx
```

---

### C. File Integrity

- Gunakan hash (SHA256)
- Validasi saat upload & download
- Hindari manipulasi file

---

## 👥 Approval Flow

| Role       | Sequence |
| ---------- | -------- |
| Legal      | 1        |
| Tax        | 2        |
| Management | 3        |
| Direksi    | 4        |

### Rule:

- Approval hanya bisa dilakukan jika sequence sebelumnya sudah approve

---

## 📊 Status Lifecycle

```
DRAFT
  ↓
IN_REVIEW
  ↓
REVISION
  ↓
APPROVED
  ↓
LOCKED
  ↓
ARCHIVED
```

---

## 📦 API Design

### Contract

```
POST /contracts
GET /contracts
GET /contracts/{id}
```

### Upload & Version

```
POST /contracts/{id}/upload
GET /contracts/{id}/versions
```

### Approval

```
POST /contracts/{id}/approve
POST /contracts/{id}/reject
```

### Download

```
GET /contracts/{id}/download?version=3
```

---

## 🏗️ Storage Architecture

```
Client (Flutter)
   ↓
API (Laravel / Backend)
   ↓
Storage Service
   ↓
S3 / ELO / Local
```

---

## 🔥 Best Practices

### DO

- Simpan semua versi (immutable)
- Gunakan audit trail
- Lock contract saat final
- Gunakan hash untuk validasi file

### DON'T

- Overwrite file lama
- Hard delete version
- Skip approval sequence

---

## 🚀 Feature Lanjutan

### 🔍 Compare Version

- Bandingkan perubahan antar versi

### 📝 Comment System

- Inline comment seperti Google Docs

### 🔔 Notification

- Email / in-app
- Trigger approval & revisi

### 🔐 Access Control

- Role-based access

---

## 🧠 Insight Tambahan

- Digital signature (e-sign)
- SLA tracking approval
- Auto contract numbering
- Dashboard bottleneck approval

---

## 🏁 Kesimpulan

Sistem ini memastikan:

- Transparansi proses contract
- Versioning aman (web & file)
- Approval terstruktur
- Audit trai

# seed data

php artisan seed master

php artisan seed transaction

php artisan db:seed --class=NewContractWorkflowSeeder

# Seeding ulang User dan Workflow agar data bersih dan konsisten

php artisan db:seed --class=UserSeeder
php artisan db:seed --class=NewContractWorkflowSeeder
