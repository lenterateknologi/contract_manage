import { Columns, FileText, Heading1, Image as ImageIcon, Layout, List, Scissors, Type } from 'lucide-react';

export const FIELD_TYPES: any[] = [
    {
        category: 'Layout & Branding',
        color: 'bg-black',
        items: [
            {
                value: 'static_text',
                label: 'Teks Statis / Judul',
                icon: Heading1,
                defaultLabel: 'KLIK UNTUK EDIT JUDUL',
                defaultOptions: { font_size: 14, font_weight: 'bold', font_family: "'Inter', sans-serif", padding_all: 0 },
            },
            {
                value: 'image',
                label: 'Logo / Gambar',
                icon: ImageIcon,
                defaultLabel: 'Logo',
                defaultOptions: { logo_size: 150, alignment: 'left', font_family: "'Inter', sans-serif" },
            },
            {
                value: 'group',
                label: 'Pembungkus Blok (Container)',
                icon: Layout,
                defaultLabel: '',
                defaultOptions: { border_style: 'solid', border_width: 1, padding_all: 0 },
            },
            {
                value: 'grid_x',
                label: 'Bagi Kolom (Grid Horizontal)',
                icon: Columns,
                defaultLabel: 'GRID',
                defaultOptions: { grid_cols: 2, col_sizes: ['1fr', '1fr'] },
            },
            {
                value: 'grid_y',
                label: 'Bagi Baris (Grid Vertical)',
                icon: List,
                defaultLabel: 'GRID VERTICAL',
                defaultOptions: { gap: 16 },
            },
            {
                value: 'page_break',
                label: 'Pemisah Halaman (Page Break)',
                icon: Scissors,
                defaultLabel: '--- PAGE BREAK ---',
                defaultOptions: {},
            },
        ],
    },
    {
        category: 'Form inputs',
        color: 'bg-black',
        items: [
            {
                value: 'labeled_value',
                label: 'Baris Data (Label : Nilai)',
                icon: Type,
                defaultLabel: 'Nama Field',
                defaultPlaceholder: '...',
                defaultOptions: {
                    value_type: 'textfield',
                    label_width: '180',
                    show_colon: true,
                    field_style: 'dashed_bottom',
                    font_size: 11,
                    font_family: "'Inter', sans-serif",
                },
            },
            {
                value: 'textfield',
                label: 'Input Teks Singkat',
                icon: Type,
                defaultLabel: 'Input Teks',
                defaultPlaceholder: 'Masukkan teks...',
                defaultOptions: { field_style: 'dashed_bottom', font_size: 11, font_family: "'Inter', sans-serif" },
            },
            {
                value: 'textarea',
                label: 'Input Deskripsi Panjang',
                icon: FileText,
                defaultLabel: 'Input Panjang',
                defaultPlaceholder: 'Masukkan teks detail...',
                defaultOptions: { field_style: 'solid', min_height: 80, font_size: 11, font_family: "'Inter', sans-serif" },
            },
            {
                value: 'searchable_select',
                label: 'Menu Pilihan (Dropdown)',
                icon: List,
                defaultLabel: 'Menu Pilihan',
                defaultPlaceholder: 'Pilih...',
                defaultOptions: { items: [], font_size: 11, font_family: "'Inter', sans-serif" },
            },
        ],
    },
    {
        category: 'Kop Surat & Header (Presets)',
        color: 'bg-primary',
        items: [
            {
                value: 'preset_header_Style_01',
                label: 'Kop Style 01 (Logo & Detail)',
                icon: ImageIcon,
                defaultLabel: 'Kop Style 01',
            },
            {
                value: 'preset_header_Style_02',
                label: 'Kop Style 02 (Hanya Teks)',
                icon: Type,
                defaultLabel: 'Kop Style 02',
            },
            {
                value: 'preset_header_logo_info',
                label: 'Kop Logo + Info Surat (Nomor/Topik)',
                icon: ImageIcon,
                defaultLabel: 'Kop Logo Info',
            },
            {
                value: 'preset_header_info_only',
                label: 'Kop Info Surat (Tanpa Logo)',
                icon: FileText,
                defaultLabel: 'Kop Info Surat',
            },
        ],
    },
    {
        category: 'Blok Isi Surat (Presets)',
        color: 'bg-emerald-600',
        items: [
            {
                value: 'preset_content_opening',
                label: 'Pembukaan (Hari/Tgl)',
                icon: FileText,
                defaultLabel: 'Pembukaan Kontrak',
            },
            {
                value: 'preset_party_block',
                label: 'Blok Pihak (Nama, Jabatan, Alamat)',
                icon: FileText,
                defaultLabel: 'Blok Pihak',
            },
            {
                value: 'preset_party_block_double',
                label: 'Blok Dua Pihak (Pihak 1 & 2)',
                icon: Columns,
                defaultLabel: 'Blok Dua Pihak',
            },
            {
                value: 'preset_content_commercial',
                label: 'Detail Komersial & Operasional',
                icon: List,
                defaultLabel: 'Detail Komersial',
            },
        ],
    },
];
