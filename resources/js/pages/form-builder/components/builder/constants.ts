import { Columns, FileText, Heading1, Image as ImageIcon, Layout, List, Scissors, Type } from 'lucide-react';

export const FIELD_TYPES: any[] = [
    {
        category: 'Layout & Branding',
        color: 'bg-indigo-500',
        textColor: 'text-indigo-600',
        borderColor: 'border-indigo-200 hover:border-indigo-400',
        bgColor: 'bg-indigo-50/50 hover:bg-indigo-50',
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
        color: 'bg-violet-500',
        textColor: 'text-violet-600',
        borderColor: 'border-violet-200 hover:border-violet-400',
        bgColor: 'bg-violet-50/50 hover:bg-violet-50',
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
                    height: '7mm',
                },
            },
            // {
            //     value: 'textfield',
            //     label: 'Input Teks Singkat',
            //     icon: Type,
            //     defaultLabel: 'Input Teks',
            //     defaultPlaceholder: 'Masukkan teks...',
            //     defaultOptions: { field_style: 'dashed_bottom', font_size: 11, font_family: "'Inter', sans-serif" },
            // },
            // {
            //     value: 'textarea',
            //     label: 'Input Deskripsi Panjang',
            //     icon: FileText,
            //     defaultLabel: 'Input Panjang',
            //     defaultPlaceholder: 'Masukkan teks detail...',
            //     defaultOptions: { field_style: 'solid', min_height: 80, font_size: 11, font_family: "'Inter', sans-serif" },
            // },
            // {
            //     value: 'searchable_select',
            //     label: 'Menu Pilihan (Dropdown)',
            //     icon: List,
            //     defaultLabel: 'Menu Pilihan',
            //     defaultPlaceholder: 'Pilih...',
            //     defaultOptions: { items: [], font_size: 11, font_family: "'Inter', sans-serif" },
            // },
        ],
    },
    {
        category: 'Grouped Custom Elements (Presets)',
        color: 'bg-emerald-500',
        textColor: 'text-emerald-600',
        borderColor: 'border-emerald-200 hover:border-emerald-400',
        bgColor: 'bg-emerald-50/50 hover:bg-emerald-50',
        items: [
            {
                value: 'preset_grouped_01',
                label: 'Kop Header & Info Surat (#019fb708-8ba5-70d6-9af0-bf0d54f728fb)',
                icon: Layout,
                defaultLabel: 'Kop Header & Info Surat',
            },
            {
                value: 'preset_grouped_02',
                label: 'Grouped Custom Element 2 (#019fb708-8bbd-7245-8628)',
                icon: Columns,
                defaultLabel: 'Grouped Element 2',
            },
        ],
    },
];

export const getFieldCategory = (typeValue: string) => {
    return FIELD_TYPES.find((cat) => cat.items.some((item: any) => item.value === typeValue));
};
