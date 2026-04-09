# Rincian Fitur Komprehensif - Contract Management System

Berikut adalah daftar lengkap fitur sistem, dipecah hingga level terkecil (granular) untuk pemahaman menyeluruh:

| Kategori | Fitur Granular | Deskripsi Detil |
| :--- | :--- | :--- |
| **Dashboard** | Total Stats | Counter real-time untuk seluruh kontrak di sistem. |
| | Approval Queue | Counter khusus untuk kontrak yang menunggu tindakan user saat ini. |
| | Completion Charts | Grafik lingkaran yang menunjukkan persentase kontrak yang telah selesai (Approved). |
| | Monthly Tracking | Counter otomatis jumlah kontrak yang dibuat pada bulan berjalan. |
| | Profile Avatar | Inisial nama otomatis dengan warna background unik per pengguna. |
| **Manajemen Kontrak** | Standard Creation | Form input: Judul, Deskripsi, No Kontrak, dan Tipe Kontrak. |
| | Auto CTR Number | Penomoran unik otomatis jika inisiator tidak mengisi nomor kontrak secara manual. |
| | Mandatory F1 | Kewajiban mengupload form F1 pada saat pembuatan kontrak baru. |
| | Transaction Safety | Penggunaan database transaction untuk menjamin integritas data saat pembuatan kontrak. |
| | Inline Editing | Mengubah judul/deskripsi kontrak selama status masih 'Draft'. |
| **Alur & Workflow** | Standard Flow | Alur default (Tax -> Legal -> Management -> Direksi -> Vendor). |
| | Workflow Picking | Inisiator dapat memilih template alur berbeda yang tersedia di sistem. |
| | Custom Step Builder | Membuat alur langkah approval kustom dari nol untuk kasus khusus. |
| | Named Approver | Memilih orang spesifik dari daftar user untuk mengisi posisi di alur kustom. |
| | Hybrid Sequence | Menggabungkan langkah berbasis Role dan langkah berbasis User spesifik. |
| | Audit Population | Otomatis mencatat `created_by` dan `updated_by` pada setiap data alur kerja. |
| **Approval Logic** | Step Validation | Approver hanya bisa bertindak jika giliran tahapannya telah tiba (sequencing). |
| | Rejection Rollback | Logika cerdas: Menolak di tahap 'Legal' kembali ke inisiator, menolak di 'Direksi' kembali ke Legal. |
| | Mandatory Revision | Kontrak yang ditolak Legal/Tax otomatis masuk status 'Revision'. |
| | Restart Workflow | Mengupload revisi file otomatis mengulang langkah approval dari awal (v1 -> v2). |
| | Quick Approve | Tombol sekali klik pada Dashboard untuk menyetujui tanpa masuk ke detail detail (jika diaktifkan). |
| **Versioning** | Auto Versioning | Penomoran otomatis v1, v2, v3 pada setiap dokumen kontrak yang diunggah. |
| | Type Categories | Tracking versi terpisah untuk Dokumen Kontrak utama, Form F1, dan Form F2. |
| | Active Version Lock | Hanya ada satu versi yang ditandai aktif sebagai referensi utama approval. |
| | Version History | Log deskripsi perubahan (change log) yang diinput oleh pengunggah revisi. |
| | Integrity Hash | Random hash generated per versi untuk validasi integritas file. |
| **Media & PDF** | Headless Preview | Konversi otomatis Docx/Doc ke PDF (via LibreOffice) untuk preview browser. |
| | PDF Previewer Modal | Jendela pratinjau PDF langsung tanpa perlu aplikasi eksternal. |
| | Direct Download | Download file dokumen (asli/PDF) dari berbagai versi di riwayat. |
| | Attachment Labels | Memberikan kategori dan label nama pada file pendukung. |
| **Collaboration** | Isolated Chat | Chat thread unik untuk setiap kontrak (tidak tercampur). |
| | Message Read Receipt | Tracking sistem siapa saja yang sudah membaca pesan tertentu (JSON list). |
| | System Status Bot | Pesan otomatis di chat jika ada perubahan status atau upload file baru. |
| | Unread Badge | Titik notifikasi biru pada daftar kontrak jika ada pesan yang belum dibaca. |
| **Admin Tools** | User Management | CRUD penuh akun user (Email, Nama, Role, Password). |
| | Dynamic Access | Sidebar menu filter otomatis (Hanya admin yang melihat Master Data). |
| | Master Role CRUD | Pengaturan daftar peranan (Role) yang tersedia di seluruh sistem. |
| | Workflow Designer | Merancang template alur default untuk setiap kategori kontrak. |
| | Expandable Detail | Fitur 'expand' pada tabel alur kerja untuk melihat rincian langkah tanpa pindah halaman. |
| **Keamanan & UI** | RBAC Middleware | Proteksi level route (hanya yang berwenang yang dapat melakukan aksi tertentu). |
| | Password Security | Update password mandiri disertai verifikasi password lama (old password). |
| | Universal Dark Mode | Perpindahan tema Light/Dark yang tersimpan di state aplikasi. |
| | Breadcrumb Nav | Navigasi hirarki di bagian atas layar untuk kemudahan berpindah menu. |
| | Toast Provider | Sistem notifikasi melayang yang memberi feedback instan pada setiap aksi. |
| | Status Badges | Label status berwarna (Kuning: Review, Hijau: Approved, Merah: Reject). |
