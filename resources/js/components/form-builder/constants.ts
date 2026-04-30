import {
    Heading1,
    Image as ImageIcon,
    Layout,
    Columns,
    Type,
    FileText,
    List,
    Scissors,
    FileSignature,
    CheckSquare,
    CircleDot
} from 'lucide-react';

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
];
