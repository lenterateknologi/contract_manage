# 🏗️ Arsitektur & Standar Folder Feature (`resources/js/features/`)

Dokumen ini adalah pedoman baku dan standar struktur direktori untuk semua modul fitur di dalam `resources/js/features/`. Setiap pengembang yang membuat atau memodifikasi modul fitur wajib mengikuti aturan dan arsitektur di bawah ini.

---

## 📌 Prinsip Utama (Core Principles)

1. **Separation of Concerns (SoC)**:
   - **View / Presentation Only**: Komponen UI di dalam `components/` hanya bertanggung jawab untuk render visual, layout, dan menerima event/props. Tidak boleh ada direct state fetching, kompleksitas bisnis, atau manipulasi data backend langsung di dalam file view.
   - **Logic & State Only**: Seluruh state management, form handling, perhitungan bisnis, dan interaksi API dikelola di dalam `hooks/` dan `services/`.
   - **Container / Controller Layer**: Untuk fitur kompleks, gunakan layer Container/Controller (atau custom hook) untuk menghubungkan logic ke view sebelum dirender ke halaman.

2. **Full Feature Encapsulation (Colocation)**:
   - Semua aset terkait fitur (komponen UI, hooks, service API, tipe TypeScript, validasi form, utilitas, dan halaman Inertia) berada dalam satu direktori fitur masing-masing.

3. **Inertia Page Resolution**:
   - Halaman yang dipanggil oleh backend Laravel (`Inertia::render('feature/page')`) diletakkan di dalam folder `pages/` milik fitur tersebut.

---

## 📂 Skema Struktur Folder Fitur

Setiap folder fitur (misal: `resources/js/features/<nama-fitur>/`) memiliki struktur baku berikut:

```text
resources/js/features/<nama-fitur>/
├── components/           # [Wajib] Komponen UI & Presentasi
│   ├── ComponentA/       # Sub-komponen modular (jika kompleks)
│   │   ├── ComponentA.tsx
│   │   └── SubItem.tsx
│   └── ComponentB.tsx
│
├── hooks/                # [Wajib] Custom hooks (State, Behavior, Business Logic)
│   ├── use<Feature>.ts
│   └── use<Feature>Form.ts
│
├── pages/                # [Wajib jika ada routing Inertia] Entry point halaman Laravel
│   ├── Index.tsx         # Diresolve oleh Inertia::render('<feature>/Index')
│   └── Detail.tsx
│
├── services/             # [Wajib jika ada API/Network] API calls, HTTP client, WebSocket
│   ├── <feature>Service.ts
│   └── <feature>RealtimeService.ts
│
├── types/                # [Wajib] Definisi TypeScript (Interfaces, Types, Enums)
│   ├── <feature>.types.ts
│   └── index.ts
│
├── validations/          # [Opsional] Skema validasi (Zod / Yup / Validator manual)
│   └── <feature>Validation.ts
│
├── utils/                # [Opsional] Helper / Transformasi data murni fitur ini
│   └── <feature>Utils.ts
│
└── index.ts              # [Wajib] Public API export modul fitur
```

---

## 📋 Penjelasan & Tanggung Jawab Tiap Folder

### 1. `components/` (Presentation-Only Views)
- **Tujuan**: Menyimpan komponen UI murni (Stateless / Dumb Components).
- **Aturan**:
  - Hanya menerima `props` dan menembakkan event callback (misal: `onSubmit`, `onDelete`, `onSelect`).
  - Tidak boleh memanggil API (`axios`, `fetch`) secara langsung.
  - Memanfaatkan `cn()` / Tailwind CSS untuk styling.
  - Jika sebuah komponen memiliki beberapa sub-komponen kecil, buat sub-folder (contoh: `components/MessageList/MessageItem.tsx`).

### 2. `hooks/` (Behavior, State & Business Logic)
- **Tujuan**: Menyimpan custom React hooks yang mengatur lifecycle data, validasi, feedback state, dan interaksi user.
- **Aturan**:
  - Mengelola local state (`useState`, `useReducer`, `useMemo`, `useCallback`).
  - Memanggil backend via service di folder `services/` atau router Inertia (`router.post`, `router.visit`).
  - Mengembalikan state bersih dan handler fungsi untuk dikonsumsi oleh komponen atau halaman.

### 3. `pages/` (Inertia Entry Pages)
- **Tujuan**: Thin-wrapper / controller penghubung antara data props dari Laravel Inertia dan komponen fitur.
- **Aturan**:
  - Menerima props bawaan dari server controller (`usePage().props` atau parameter fungsi).
  - Menyediakan meta tags via `<Head title="..." />`.
  - Memasang provider lokal jika diperlukan (misal: `<ToastProvider>`).
  - Menghubungkan hook ke komponen visual utama.

### 4. `services/` (Data Access & Networking)
- **Tujuan**: Mengisolasi semua pemanggilan endpoint HTTP, API REST, WebSocket, Echo/Pusher, atau LocalStorage.
- **Aturan**:
  - Menggunakan modul HTTP client terpusat (misal: `@/api/client` atau `axios`).
  - Menerima parameter bertipe TypeScript dan mengembalikan `Promise<T>`.
  - Mempermudah mocking saat penulisan unit test.

### 5. `types/` (TypeScript Contracts)
- **Tujuan**: Mendefinisikan tipe data entitas, payload API, filter query, dan interface props.
- **Aturan**:
  - Pisahkan file jika tipe data mulai banyak (contoh: `chat.types.ts`, `message.types.ts`).
  - Selalu gunakan `export type` atau `export interface`.

### 6. `validations/` (Schema & Rule Validasi)
- **Tujuan**: Validasi input form sebelum data dikirim ke backend.
- **Aturan**:
  - Menjaga pesan error konsisten di sisi frontend.
  - Contoh: validasi password match, format email, ukuran file upload.

### 7. `utils/` (Pure Helper Functions)
- **Tujuan**: Fungsi-fungsi utilitas murni (pure functions) yang spesifik untuk domain fitur terkait.
- **Aturan**:
  - Tidak bergantung pada React hook atau state.
  - Contoh: formatting status kontrak, parsing payload pesan, masking nomor referensi.

### 8. `index.ts` (Public Barrel File)
- **Tujuan**: Entry point tunggal untuk mengekspor apa saja yang boleh diakses oleh fitur lain atau komponen global.
- **Aturan**:
  - Mengekspor komponen utama, hooks, service, dan types.
  - Memudahkan import dari luar: `import { LoginForm, useLoginForm } from '@/features/auth';`.

---

## 🧩 Contoh Penerapan Nyata

### Contoh: Fitur Chat (`features/chat/`)
```text
resources/js/features/chat/
├── components/
│   ├── Chat/
│   │   ├── Chat.tsx
│   │   └── ContractChatThread.tsx
│   ├── ConversationList/
│   ├── ConversationItem/
│   ├── MessageList/
│   ├── MessageItem/
│   ├── MessageComposer/
│   ├── AttachmentPreview/
│   ├── ChatHeader/
│   └── TypingIndicator/
├── hooks/
│   ├── useChat.ts
│   ├── useConversations.ts
│   ├── useMessages.ts
│   └── useChatRealtime.ts
├── pages/
│   └── ChatPage.tsx
├── services/
│   ├── chatService.ts
│   └── chatRealtimeService.ts
├── types/
│   ├── chat.types.ts
│   ├── conversation.types.ts
│   └── message.types.ts
├── utils/
│   ├── messageUtils.ts
│   └── conversationUtils.ts
└── index.ts
```

---

## 🚫 Yang Dilarang (Anti-Patterns)
1. ❌ **Jangan meletakkan file halaman baru di `resources/js/pages/<feature>/`**. Selalu letakkan di `resources/js/features/<feature>/pages/`.
2. ❌ **Jangan mencampur logic fetching API di dalam file JSX/TSX presentation**. Selalu pisahkan ke `services/` dan `hooks/`.
3. ❌ **Jangan import file internal fitur lain secara sembarangan**. Jika fitur A membutuhkan utilitas/komponen dari fitur B, impor melalui barrel `index.ts` milik fitur B (`@/features/B`).
