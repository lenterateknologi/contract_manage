import { CanvasArea } from '@/components/form-builder/CanvasArea';
import { FIELD_TYPES } from '@/components/form-builder/constants';
import { JSONEditorPanel } from '@/components/form-builder/JSONEditorPanel';
import { LibraryPanel } from '@/components/form-builder/LibraryPanel';
import { PropertiesPanel } from '@/components/form-builder/PropertiesPanel';
import { StructurePanel } from '@/components/form-builder/StructurePanel';
import { Button } from '@/components/ui/base/Button';
import { ScrollArea } from '@/components/ui/base/ScrollArea';
import { ConfirmationModal } from '@/components/ui/overlays/ConfirmationModal';
import { cn } from '@/lib/utils';
import { closestCenter, DndContext, DragEndEvent, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Head, Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, Download, FileText, Grid, Layout, List, Loader2, Plus, Redo, Save, Undo } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TrashZone } from './form-builder/components/TrashZone';

interface FormField {
    id: string;
    parent_id?: string | null;
    label: string;
    name: string;
    type: string;
    container_type?: string | null;
    placeholder: string;
    is_required: boolean;
    use_rich_text?: boolean;
    width: string;
    options: any | null;
    order: number;
}

interface FormTemplate {
    id?: string;
    name: string;
    description: string | null;
    has_letterhead: boolean;
    letterhead_json: any | null;
    fields: FormField[];
}

interface Props {
    template: FormTemplate;
}

interface FormDataType {
    [key: string]: any;
    name: string;
    description: string;
    has_letterhead: boolean;
    letterhead_json: any | null;
    fields: FormField[];
}

const WIDTH_OPTIONS = Array.from({ length: 20 }, (_, i) => {
    const pct = (i + 1) * 5;
    return {
        label: `${pct}%`,
        value: pct.toString(),
        cols: `col-span-${i + 1}`,
    };
});

const generatePresetFields = (presetType: string, startingOrder: number, parentId: string | null = null, currentFieldCount: number = 0): FormField[] => {
    const layoutId = Math.random().toString(36).substr(2, 9);
    const fields: FormField[] = [];

    if (presetType === 'preset_header_Style_01') {
        const headerRowId = Math.random().toString(36).substr(2, 9);
        const logoId = Math.random().toString(36).substr(2, 9);
        const textContainerId = Math.random().toString(36).substr(2, 9);
        const companyNameId = Math.random().toString(36).substr(2, 9);
        const companyDetailsId = Math.random().toString(36).substr(2, 9);
        const dividerId = Math.random().toString(36).substr(2, 9);
        const docTitleId = Math.random().toString(36).substr(2, 9);
        const docSubtitleId = Math.random().toString(36).substr(2, 9);

        // Outer Container (grid_y)
        fields.push({
            id: layoutId,
            parent_id: parentId,
            label: 'Kop Style_01 (Container)',
            name: `preset_layout_${currentFieldCount + 1}`,
            type: 'grid_y',
            placeholder: '',
            is_required: false,
            width: '100',
            order: startingOrder,
            options: { gap: 8, align_items: 'stretch', border_style: 'none' },
        });

        // Horizontal Row (grid_x)
        fields.push({
            id: headerRowId,
            parent_id: layoutId,
            label: 'Header Row',
            name: `preset_row_${currentFieldCount + 2}`,
            type: 'grid_x',
            placeholder: '',
            is_required: false,
            width: '100',
            order: startingOrder + 0.05,
            options: { grid_cols: 2, col_sizes: ['110px', '1fr'], gap: 16, border_style: 'none' },
        });

        // Logo Image
        fields.push({
            id: logoId,
            parent_id: headerRowId,
            label: 'Logo',
            name: `preset_logo_${currentFieldCount + 3}`,
            type: 'image',
            placeholder: '',
            is_required: false,
            width: '100',
            order: startingOrder + 0.1,
            options: { logo_url: '/storage/fr_logo.png', width: 90, height: 90, alignment: 'center' },
        });

        // Text Container (grid_y) inside the row
        fields.push({
            id: textContainerId,
            parent_id: headerRowId,
            label: 'Text Container',
            name: `preset_text_container_${currentFieldCount + 4}`,
            type: 'grid_y',
            placeholder: '',
            is_required: false,
            width: '100',
            order: startingOrder + 0.15,
            options: { gap: 4, align_items: 'flex-start', justify_content: 'center', border_style: 'none' },
        });

        // Company Name
        fields.push({
            id: companyNameId,
            parent_id: textContainerId,
            label: 'KOP Style 1',
            name: `preset_text_${currentFieldCount + 5}`,
            type: 'static_text',
            placeholder: '',
            is_required: false,
            width: '100',
            order: startingOrder + 0.2,
            options: { font_size: 18, font_weight: 'bold', font_family: "'Inter', sans-serif", color: '#0f3d6b', border_style: 'none' },
        });

        // Company Details
        fields.push({
            id: companyDetailsId,
            parent_id: textContainerId,
            label: 'Alamat: Jl. Surya Kencana, Komp. Pamulang Elok, DI\nEmail: Style_01.group@gmail.com | Telp: +62 878-3155-4715\nWebsite: www.Style_01.com',
            name: `preset_text_${currentFieldCount + 6}`,
            type: 'static_text',
            placeholder: '',
            is_required: false,
            width: '100',
            order: startingOrder + 0.25,
            options: { font_size: 11, font_weight: 'semibold', font_family: "'Inter', sans-serif", color: '#475569', line_height: '1.4', border_style: 'none' },
        });

        // Thick Divider line
        fields.push({
            id: dividerId,
            parent_id: layoutId,
            label: ' ',
            name: `preset_line_${currentFieldCount + 7}`,
            type: 'static_text',
            placeholder: '',
            is_required: false,
            width: '100',
            order: startingOrder + 0.3,
            options: { border_style: 'solid', border_width: 3, border_color: '#000000', margin_top: 8, margin_bottom: 8 },
        });

        // Document Title (Underlined)
        fields.push({
            id: docTitleId,
            parent_id: layoutId,
            label: 'SURAT KONTRAK KERJA',
            name: `preset_title_${currentFieldCount + 8}`,
            type: 'static_text',
            placeholder: '',
            is_required: false,
            width: '100',
            order: startingOrder + 0.35,
            options: { font_size: 14, font_weight: 'bold', font_family: "'Inter', sans-serif", alignment: 'center', text_decoration: 'underline', border_style: 'none' },
        });

        // Document Number
        fields.push({
            id: docSubtitleId,
            parent_id: layoutId,
            label: 'Nomor : 14.012/PT.OGD/11/2022',
            name: `preset_subtitle_${currentFieldCount + 9}`,
            type: 'static_text',
            placeholder: '',
            is_required: false,
            width: '100',
            order: startingOrder + 0.4,
            options: { font_size: 11, font_weight: 'normal', font_family: "'Inter', sans-serif", alignment: 'center', border_style: 'none' },
        });
    } else if (presetType === 'preset_header_Style_02') {
        const textContainerId = Math.random().toString(36).substr(2, 9);
        const companyNameId = Math.random().toString(36).substr(2, 9);
        const companyDetailsId = Math.random().toString(36).substr(2, 9);
        const dividerId = Math.random().toString(36).substr(2, 9);
        const docTitleId = Math.random().toString(36).substr(2, 9);
        const docSubtitleId = Math.random().toString(36).substr(2, 9);

        // Outer Container (grid_y)
        fields.push({
            id: layoutId,
            parent_id: parentId,
            label: 'Kop Style_02 (Container)',
            name: `preset_layout_${currentFieldCount + 1}`,
            type: 'grid_y',
            placeholder: '',
            is_required: false,
            width: '100',
            order: startingOrder,
            options: { gap: 8, align_items: 'stretch', border_style: 'none' },
        });

        // Text Container (grid_y)
        fields.push({
            id: textContainerId,
            parent_id: layoutId,
            label: 'Text Container',
            name: `preset_text_container_${currentFieldCount + 2}`,
            type: 'grid_y',
            placeholder: '',
            is_required: false,
            width: '100',
            order: startingOrder + 0.1,
            options: { gap: 4, align_items: 'center', justify_content: 'center', border_style: 'none' },
        });

        // Company Name
        fields.push({
            id: companyNameId,
            parent_id: textContainerId,
            label: 'KOP Style 2',
            name: `preset_text_${currentFieldCount + 3}`,
            type: 'static_text',
            placeholder: '',
            is_required: false,
            width: '100',
            order: startingOrder + 0.15,
            options: { font_size: 20, font_weight: 'bold', font_family: "'Inter', sans-serif", color: '#0f3d6b', alignment: 'center', border_style: 'none' },
        });

        // Company Details
        fields.push({
            id: companyDetailsId,
            parent_id: textContainerId,
            label: 'Alamat: Jl. Surya Kencana, Komp. Pamulang Elok, DI\nEmail: Style_02.group@gmail.com | Telp: +62 878-3155-4715\nWebsite: www.Style_02.com',
            name: `preset_text_${currentFieldCount + 4}`,
            type: 'static_text',
            placeholder: '',
            is_required: false,
            width: '100',
            order: startingOrder + 0.2,
            options: { font_size: 11, font_weight: 'semibold', font_family: "'Inter', sans-serif", color: '#475569', alignment: 'center', line_height: '1.4', border_style: 'none' },
        });

        // Thick Divider line
        fields.push({
            id: dividerId,
            parent_id: layoutId,
            label: ' ',
            name: `preset_line_${currentFieldCount + 5}`,
            type: 'static_text',
            placeholder: '',
            is_required: false,
            width: '100',
            order: startingOrder + 0.25,
            options: { border_style: 'solid', border_width: 3, border_color: '#000000', margin_top: 8, margin_bottom: 8 },
        });

        // Document Title (Underlined)
        fields.push({
            id: docTitleId,
            parent_id: layoutId,
            label: 'SURAT KONTRAK KERJA',
            name: `preset_title_${currentFieldCount + 6}`,
            type: 'static_text',
            placeholder: '',
            is_required: false,
            width: '100',
            order: startingOrder + 0.3,
            options: { font_size: 14, font_weight: 'bold', font_family: "'Inter', sans-serif", alignment: 'center', text_decoration: 'underline', border_style: 'none' },
        });

        // Document Number
        fields.push({
            id: docSubtitleId,
            parent_id: layoutId,
            label: 'Nomor : 14.012/PT.OGD/11/2022',
            name: `preset_subtitle_${currentFieldCount + 7}`,
            type: 'static_text',
            placeholder: '',
            is_required: false,
            width: '100',
            order: startingOrder + 0.35,
            options: { font_size: 11, font_weight: 'normal', font_family: "'Inter', sans-serif", alignment: 'center', border_style: 'none' },
        });
    } else if (presetType === 'preset_content_opening') {
        fields.push({
            id: layoutId,
            parent_id: parentId,
            label: 'Pada hari ini Rabu, 23 November 2022 telah ditandatangani Surat Kontrak Kerja antara:',
            name: `preset_opening_${currentFieldCount + 1}`,
            type: 'static_text',
            placeholder: '',
            is_required: false,
            width: '100',
            order: startingOrder,
            options: { 
                font_size: 12, 
                font_weight: 'normal', 
                font_family: "'Times New Roman', serif", 
                line_height: '1.6', 
                margin_top: 10, 
                margin_bottom: 10,
                text_align: 'justify'
            },
        });
    } else if (presetType === 'preset_party_block' || presetType === 'preset_party_block_double') {
        // Helper to build a single party block
        const buildPartyBlock = (partyNum: number, parentBlockId: string | null, baseOrder: number, baseCount: number): FormField[] => {
            const partyFields: FormField[] = [];
            const blockId = Math.random().toString(36).substr(2, 9);
            const headerRowId = Math.random().toString(36).substr(2, 9);
            const numberLabelId = Math.random().toString(36).substr(2, 9);
            const namaId = Math.random().toString(36).substr(2, 9);
            const jabatanId = Math.random().toString(36).substr(2, 9);
            const alamatId = Math.random().toString(36).substr(2, 9);
            const descId = Math.random().toString(36).substr(2, 9);

            // Outer container (grid_y) for the whole party block
            partyFields.push({
                id: blockId,
                parent_id: parentBlockId,
                label: `Blok Pihak ${partyNum === 1 ? 'Pertama' : partyNum === 2 ? 'Kedua' : partyNum}`,
                name: `party_block_${baseCount + (partyNum * 10)}`,
                type: 'grid_y',
                placeholder: '',
                is_required: false,
                width: '100',
                order: baseOrder + (partyNum * 0.1),
                options: { gap: 0, align_items: 'stretch', border_style: 'none', margin_bottom: 8 },
            } as FormField);

            // Header row: number + (first labeled_value Nama in same line)
            partyFields.push({
                id: headerRowId,
                parent_id: blockId,
                label: `Pihak ${partyNum === 1 ? 'Pertama' : partyNum === 2 ? 'Kedua' : partyNum}`,
                name: `party_header_${baseCount + (partyNum * 10) + 1}`,
                type: 'grid_x',
                placeholder: '',
                is_required: false,
                width: '100',
                order: baseOrder + (partyNum * 0.1) + 0.01,
                options: { grid_cols: 2, col_sizes: ['28px', '1fr'], gap: 0, border_style: 'none' },
            } as FormField);

            // Party number label (1. / 2.)
            partyFields.push({
                id: numberLabelId,
                parent_id: headerRowId,
                label: `${partyNum}.`,
                name: `party_num_${baseCount + (partyNum * 10) + 2}`,
                type: 'static_text',
                placeholder: '',
                is_required: false,
                width: '100',
                order: baseOrder + (partyNum * 0.1) + 0.02,
                options: { font_size: 12, font_weight: 'normal', font_family: "'Times New Roman', serif", border_style: 'none' },
            } as FormField);

            // Nama field (labeled_value inside header row)
            partyFields.push({
                id: namaId,
                parent_id: headerRowId,
                label: 'Nama',
                name: `party_nama_${baseCount + (partyNum * 10) + 3}`,
                type: 'labeled_value',
                placeholder: '',
                is_required: false,
                width: '100',
                order: baseOrder + (partyNum * 0.1) + 0.03,
                options: {
                    label_width: '90',
                    show_colon: true,
                    field_style: 'none',
                    font_size: 12,
                    font_weight: 'normal',
                    font_family: "'Times New Roman', serif",
                },
            } as FormField);

            // Jabatan field (directly in blockId, below header row)
            partyFields.push({
                id: jabatanId,
                parent_id: blockId,
                label: 'Jabatan',
                name: `party_jabatan_${baseCount + (partyNum * 10) + 4}`,
                type: 'labeled_value',
                placeholder: '',
                is_required: false,
                width: '100',
                order: baseOrder + (partyNum * 0.1) + 0.04,
                options: {
                    label_width: '90',
                    show_colon: true,
                    field_style: 'none',
                    font_size: 12,
                    font_weight: 'normal',
                    font_family: "'Times New Roman', serif",
                    margin_left: 28,
                },
            } as FormField);

            // Alamat field
            partyFields.push({
                id: alamatId,
                parent_id: blockId,
                label: 'Alamat',
                name: `party_alamat_${baseCount + (partyNum * 10) + 5}`,
                type: 'labeled_value',
                placeholder: '',
                is_required: false,
                width: '100',
                order: baseOrder + (partyNum * 0.1) + 0.05,
                options: {
                    label_width: '90',
                    show_colon: true,
                    field_style: 'none',
                    font_size: 12,
                    font_weight: 'normal',
                    font_family: "'Times New Roman', serif",
                    margin_left: 28,
                },
            } as FormField);

            // Description paragraph (selanjutnya disebut PIHAK ...)
            partyFields.push({
                id: descId,
                parent_id: blockId,
                label: partyNum === 1
                    ? 'Dalam hal ini bertindak atas nama perusahaan yang berkedudukan sebagai Pemberi Kerja yang selanjutnya disebut **PIHAK PERTAMA.**'
                    : 'Dalam hal ini bertindak untuk dan atas nama sendiri selanjutnya disebut **PIHAK KEDUA.**',
                name: `party_desc_${baseCount + (partyNum * 10) + 6}`,
                type: 'static_text',
                placeholder: '',
                is_required: false,
                width: '100',
                order: baseOrder + (partyNum * 0.1) + 0.06,
                options: {
                    font_size: 12,
                    font_weight: 'normal',
                    font_family: "'Times New Roman', serif",
                    line_height: '1.6',
                    text_align: 'justify',
                    border_style: 'none',
                    margin_left: 28,
                    margin_top: 2,
                },
            } as FormField);

            return partyFields;
        };

        if (presetType === 'preset_party_block') {
            // Single party block (e.g. Pihak 1)
            const singleFields = buildPartyBlock(1, parentId, startingOrder, currentFieldCount);
            fields.push(...singleFields);
        } else {
            // Double party: Pihak 1 and Pihak 2 in sequence under a grid_y wrapper
            const wrapId = Math.random().toString(36).substr(2, 9);
            fields.push({
                id: wrapId,
                parent_id: parentId,
                label: 'Blok Para Pihak',
                name: `parties_wrapper_${currentFieldCount + 1}`,
                type: 'grid_y',
                placeholder: '',
                is_required: false,
                width: '100',
                order: startingOrder,
                options: { gap: 8, align_items: 'stretch', border_style: 'none' },
            } as FormField);

            const p1Fields = buildPartyBlock(1, wrapId, startingOrder + 0.01, currentFieldCount);
            const p2Fields = buildPartyBlock(2, wrapId, startingOrder + 0.11, currentFieldCount + 20);
            fields.push(...p1Fields, ...p2Fields);
        }
    } else if (presetType === 'preset_content_commercial') {
        const titleId = Math.random().toString(36).substr(2, 9);
            const fieldsToGenerate = [
                { label: 'MASA BERLAKU / JANGKA WAKTU', name: 'masa_berlaku' },
                { label: 'LOKASI / AREA PEKERJAAN', name: 'lokasi_pekerjaan' },
                { label: 'DIMENSI / LUAS (M2)', name: 'dimensi_luas' },
                { label: 'NILAI TRANSAKSI / IMBALAN JASA', name: 'nilai_transaksi' },
                { label: 'MEKANISME & SYARAT PEMBAYARAN', name: 'mekanisme_pembayaran' },
                { label: 'PEMBEBANAN PPN', name: 'beban_ppn' },
                { label: 'PEMBEBANAN PPH', name: 'beban_pph' },
                { label: 'RINGKASAN KLAUSUL PENTING', name: 'ringkasan_klausul' },
            ];

            fields.push({
                id: layoutId,
                parent_id: parentId,
                label: 'Blok Detail Komersial (Container)',
                name: `preset_commercial_layout_${currentFieldCount + 1}`,
                type: 'grid_y',
                placeholder: '',
                is_required: false,
                width: '100',
                order: startingOrder,
                options: { gap: 4, align_items: 'stretch', margin_top: 15, margin_bottom: 10 },
            } as FormField);

            fields.push({
                id: titleId,
                parent_id: layoutId,
                label: 'DETAIL KOMERSIAL & OPERASIONAL',
                name: `preset_commercial_title_${currentFieldCount + 2}`,
                type: 'static_text',
                placeholder: '',
                is_required: false,
                width: '100',
                order: startingOrder + 0.01,
                options: { font_size: 12, font_weight: 'bold', font_family: "'Times New Roman', serif", text_decoration: 'underline', margin_bottom: 8 },
            } as FormField);

            fieldsToGenerate.forEach((item, idx) => {
                fields.push({
                    id: Math.random().toString(36).substr(2, 9),
                    parent_id: layoutId,
                    label: item.label,
                    name: `${item.name}_${currentFieldCount + idx + 3}`,
                    type: 'labeled_value',
                    placeholder: '—',
                    is_required: false,
                    width: '100',
                    order: startingOrder + 0.02 + (idx * 0.01),
                    options: { 
                        label_width: '220', 
                        show_colon: true, 
                        field_style: 'dashed_bottom',
                        font_size: 11,
                        font_family: "'Times New Roman', serif"
                    },
                } as FormField);
            });
    }

    return fields;
};

function FormBuilder({ template }: Props) {
    const { data, setData, post, processing } = useForm<FormDataType>({
        name: template.name || '',
        description: template.description || '',
        has_letterhead: template.has_letterhead || false,
        letterhead_json: template.letterhead_json || {
            margins: { top: 15, bottom: 15, left: 15, right: 15 },
            palette: { primary: '#0f172a', secondary: '#475569', accent: '#3b82f6' },
        },
        fields: ((template?.fields as any[]) || []).map((f) => {
            // Migrate legacy width strings
            let width = f.width || '100';
            if (width === '1/1') width = '100';
            else if (width === '1/2') width = '50';
            else if (width === '1/3') width = '35';
            else if (width === '1/4') width = '25';
            else if (width === '1/5') width = '20';

            // Migrate Types
            let type = f.type;
            const options = f.options || {};
            if (type === 'text') {
                type = 'textfield';
            } else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(type)) {
                // Preserve font size for headers being converted to static text
                const defaultSizes: Record<string, number> = { h1: 24, h2: 20, h3: 18, h4: 16, h5: 14, h6: 12 };
                if (!options.font_size) {
                    options.font_size = defaultSizes[type];
                }
                type = 'static_text';
            }

            // Standardize font defaults during migration
            if (!options.font_family) options.font_family = "'Montserrat', sans-serif";
            if (!options.font_size) options.font_size = type === 'static_text' ? 14 : 11;
            if (!options.font_weight) options.font_weight = 'bold';

            return {
                ...f,
                id: f.id || Math.random().toString(36).substr(2, 9),
                type: type,
                width: width,
                parent_id: f.parent_id || null,
                options: options,
            };
        }),
    });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'editor' | 'filling' | 'pdf'>('editor');
    const [previewData, setPreviewData] = useState<Record<string, any>>({});

    // Helper to update preview data
    const updatePreviewData = (name: string, value: any) => {
        setPreviewData((prev) => ({ ...prev, [name]: value }));
    };

    const selectedFieldId = useMemo(() => selectedFieldIds[selectedFieldIds.length - 1] || null, [selectedFieldIds]);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fieldId?: string } | null>(null);
    const [leftWidth, setLeftWidth] = useState(420);
    const [rightWidth, setRightWidth] = useState(320);
    const [isResizingLeft, setIsResizingLeft] = useState(false);
    const [isResizingRight, setIsResizingRight] = useState(false);

    // Essential UI States
    const [activeLibItem, setActiveLibItem] = useState<string | null>(null);
    const [localJsonStr, setLocalJsonStr] = useState('');
    const [isFullscreenJson, setIsFullscreenJson] = useState(false);
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [pdfJobId, setPdfJobId] = useState<string | null>(null);
    const [pdfJobStatus, setPdfJobStatus] = useState<any>(null);
    const [leftPanelTab, setLeftPanelTab] = useState<'library' | 'structure' | 'json'>('library');

    // Undo / Redo State
    const [history, setHistory] = useState<FormField[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isUndoingRedoing, setIsUndoingRedoing] = useState(false);

    // Custom Dialog State (replaces native alert/confirm)
    const [dialog, setDialog] = useState<{
        open: boolean;
        title: string;
        description: string;
        variant: 'danger' | 'warning' | 'info';
        confirmText?: string;
        onConfirm: () => void;
    }>({
        open: false,
        title: '',
        description: '',
        variant: 'danger',
        onConfirm: () => { },
    });
    const closeDialog = () => setDialog((d) => ({ ...d, open: false }));
    const openDialog = (opts: Omit<typeof dialog, 'open'>) => setDialog({ ...opts, open: true });

    // --- UNDO / REDO LOGIC ---
    useEffect(() => {
        if (isUndoingRedoing) {
            setIsUndoingRedoing(false);
            return;
        }

        const currentFields = JSON.stringify(data.fields);
        const lastSnapshot = historyIndex >= 0 ? JSON.stringify(history[historyIndex]) : null;

        if (currentFields !== lastSnapshot) {
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(JSON.parse(currentFields));

            // Limit to last 20 changes
            if (newHistory.length > 20) {
                newHistory.shift();
                setHistory(newHistory);
                setHistoryIndex(19);
            } else {
                setHistory(newHistory);
                setHistoryIndex(newHistory.length - 1);
            }
        }
    }, [data.fields, history, historyIndex, isUndoingRedoing]);

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            setIsUndoingRedoing(true);
            const prevIndex = historyIndex - 1;
            setHistoryIndex(prevIndex);
            setData('fields', JSON.parse(JSON.stringify(history[prevIndex])));
        }
    }, [history, historyIndex, setData]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            setIsUndoingRedoing(true);
            const nextIndex = historyIndex + 1;
            setHistoryIndex(nextIndex);
            setData('fields', JSON.parse(JSON.stringify(history[nextIndex])));
        }
    }, [history, historyIndex, setData]);

    // --- ACTIONS & MOVEMENT ---
    const handleMoveSelected = useCallback((direction: 'up' | 'down') => {
        if (selectedFieldIds.length === 0) return;

        let newFields = [...data.fields];
        // Sort selected IDs by their current order in the fields array
        const sortedSelectedIds = [...selectedFieldIds].sort((a, b) => {
            const fieldA = newFields.find((f) => f.id === a);
            const fieldB = newFields.find((f) => f.id === b);
            return (fieldA?.order || 0) - (fieldB?.order || 0);
        });

        if (direction === 'up') {
            const firstId = sortedSelectedIds[0];
            const firstField = newFields.find((f) => f.id === firstId);
            if (!firstField) return;

            // Find siblings in the same parent
            const siblings = newFields.filter((f) => f.parent_id === firstField.parent_id).sort((a, b) => a.order - b.order);

            const firstIndexInSiblings = siblings.findIndex((s) => s.id === firstId);
            if (firstIndexInSiblings > 0) {
                const neighbor = siblings[firstIndexInSiblings - 1];
                // Move selected group items to just before neighbor
                const neighborOrder = neighbor.order;
                sortedSelectedIds.forEach((id, i) => {
                    const f = newFields.find((field) => field.id === id);
                    if (f) f.order = neighborOrder - 0.5 + i * 0.1;
                });
            }
        } else {
            const lastId = sortedSelectedIds[sortedSelectedIds.length - 1];
            const lastField = newFields.find((f) => f.id === lastId);
            if (!lastField) return;

            const siblings = newFields.filter((f) => f.parent_id === lastField.parent_id).sort((a, b) => a.order - b.order);

            const lastIndexInSiblings = siblings.findIndex((s) => s.id === lastId);
            if (lastIndexInSiblings < siblings.length - 1) {
                const neighbor = siblings[lastIndexInSiblings + 1];
                // Move selected group items to just after neighbor
                const neighborOrder = neighbor.order;
                sortedSelectedIds.forEach((id, i) => {
                    const f = newFields.find((field) => field.id === id);
                    if (f) f.order = neighborOrder + 0.5 + i * 0.1;
                });
            }
        }

        // Re-normalize all field orders
        newFields = newFields.sort((a, b) => a.order - b.order).map((f, i) => ({ ...f, order: i }));
        setData('fields', newFields);
    }, [data.fields, selectedFieldIds, setData]);

    const moveField = (id: string, direction: 'up' | 'down' | 'in' | 'out') => {
        // Redirect simple up/down to the batch handler if multiple selected
        if ((direction === 'up' || direction === 'down') && selectedFieldIds.length > 1) {
            handleMoveSelected(direction);
            return;
        }

        const field = (data?.fields || []).find((f) => f.id === id);
        if (!field) return;

        const allInParent = (data?.fields || []).filter((f) => f.parent_id === field.parent_id).sort((a, b) => (a.order || 0) - (b.order || 0));
        const index = allInParent.findIndex((f) => f.id === id);

        let newParentId = field.parent_id;
        let newFields = [...data.fields];

        if (direction === 'up' && index > 0) {
            const swapWith = allInParent[index - 1];
            const activeIdx = newFields.findIndex((f) => f.id === id);
            const swapIdx = newFields.findIndex((f) => f.id === swapWith.id);
            const tempOrder = newFields[activeIdx].order;
            newFields[activeIdx].order = newFields[swapIdx].order;
            newFields[swapIdx].order = tempOrder;
        } else if (direction === 'down' && index < allInParent.length - 1) {
            const swapWith = allInParent[index + 1];
            const activeIdx = newFields.findIndex((f) => f.id === id);
            const swapIdx = newFields.findIndex((f) => f.id === swapWith.id);
            const tempOrder = newFields[activeIdx].order;
            newFields[activeIdx].order = newFields[swapIdx].order;
            newFields[swapIdx].order = tempOrder;
        } else if (direction === 'out' && field.parent_id) {
            const parent = data.fields.find((f) => f.id === field.parent_id);
            newParentId = parent?.parent_id || null;
            const activeIdx = newFields.findIndex((f) => f.id === id);
            newFields[activeIdx].parent_id = newParentId;
            newFields[activeIdx].order = 999; // Move to bottom
        } else if (direction === 'in' && index > 0) {
            const prevSibling = allInParent[index - 1];
            if (['group', 'grid_view', 'grid_x', 'grid_y'].includes(prevSibling.type)) {
                newParentId = prevSibling.id;
                const activeIdx = newFields.findIndex((f) => f.id === id);
                newFields[activeIdx].parent_id = newParentId;
                newFields[activeIdx].order = 999; // Move to bottom
            }
        }

        // Re-normalize all orders
        newFields = newFields.sort((a, b) => (a.order || 0) - (b.order || 0)).map((f, i) => ({ ...f, order: i }));
        setData('fields', newFields);
    };

    // --- EFFECTS ---
    // Close context menu and handle keyboard shortcuts
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setContextMenu(null);
            }

            // Delete Shortcuts
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedFieldIds.length > 0 && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                    e.preventDefault();
                    removeField(selectedFieldIds);
                }
            }

            // Undo / Redo Shortcuts
            if ((e.ctrlKey || e.metaKey)) {
                if (e.key === 'z') {
                    if (e.shiftKey) {
                        e.preventDefault();
                        redo();
                    } else {
                        e.preventDefault();
                        undo();
                    }
                } else if (e.key === 'y') {
                    e.preventDefault();
                    redo();
                } else if (e.key === 's') {
                    e.preventDefault();
                    // We need to trigger the submit, but we don't have a direct reference to the event
                    // Let's call the same logic as handleSave but without the event
                    post(route('admin.form-templates.save', template.id));
                } else if (e.key === 'd') {
                    // Cmd/Ctrl+D: Duplicate selected
                    if (selectedFieldIds.length > 0 && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                        e.preventDefault();
                        selectedFieldIds.forEach((id) => duplicateField(id));
                    }
                }
            }

            // Movement Shortcuts
            if (selectedFieldIds.length > 0 && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    handleMoveSelected('up');
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    handleMoveSelected('down');
                }
            }
        };
        window.addEventListener('click', handleClick);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('click', handleClick);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedFieldIds, handleMoveSelected, undo, redo]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizingLeft) {
                setLeftWidth(Math.max(200, Math.min(600, e.clientX)));
            }
            if (isResizingRight) {
                setRightWidth(Math.max(250, Math.min(500, window.innerWidth - e.clientX)));
            }
        };

        const handleMouseUp = () => {
            setIsResizingLeft(false);
            setIsResizingRight(false);
            document.body.style.cursor = 'default';
        };

        if (isResizingLeft || isResizingRight) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizingLeft, isResizingRight]);

    const handleSelectField = (id: string, e?: React.MouseEvent | React.KeyboardEvent) => {
        if (id === '') {
            setSelectedFieldIds([]);
            return;
        }

        if (e && (e.ctrlKey || e.metaKey)) {
            // Toggle selection
            setSelectedFieldIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
        } else if (e && e.shiftKey && selectedFieldIds.length > 0) {
            // Range selection
            const allIds = (data?.fields || []).map((f) => f.id);
            const startId = selectedFieldIds[selectedFieldIds.length - 1];
            const startIndex = allIds.indexOf(startId);
            const endIndex = allIds.indexOf(id);

            if (startIndex !== -1 && endIndex !== -1) {
                const start = Math.min(startIndex, endIndex);
                const end = Math.max(startIndex, endIndex);
                const rangeIds = allIds.slice(start, end + 1);
                setSelectedFieldIds((prev) => Array.from(new Set([...prev, ...rangeIds])));
            }
        } else {
            // Single selection
            setSelectedFieldIds([id]);
        }
    };

    const handleDragStart = (event: any) => {
        if (event.active.id.toString().startsWith('lib-')) {
            setActiveLibItem(event.active.id.toString().replace('lib-', ''));
        }
        // Visual feedback for Trash Zone
        document.documentElement.style.setProperty('--trash-opacity', '1');
        document.documentElement.style.setProperty('--trash-transform', 'translateY(0)');
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveLibItem(null);

        // Custom: Reset Trash Zone visual state
        document.documentElement.style.setProperty('--trash-opacity', '0');
        document.documentElement.style.setProperty('--trash-transform', 'translateY(80px)');

        if (!over) return;

        const activeId = active.id.toString();
        let overId = over.id.toString();

        // If over a placeholder, route to the parent grid layout ID
        if (overId.startsWith('placeholder:')) {
            const parts = overId.split(':');
            overId = parts[1];
        }

        // Check if dropped into trash
        if (overId === 'trash-zone') {
            removeField(activeId);
            return;
        }

        // Check if dragging from library
        if (activeId.startsWith('lib-')) {
            const typeValue = activeId.replace('lib-', '');
            const overField = (data?.fields || []).find((f) => f.id === overId);
            const parentId =
                overField && ['group', 'grid_view', 'grid_x', 'grid_y'].includes(overField.type) ? overField.id : overField?.parent_id || null;

            if (typeValue.startsWith('preset_')) {
                const overIndex = (data?.fields || []).findIndex((f) => f.id === overId);
                const startingOrder = overIndex !== -1 ? overIndex + 0.1 : (data?.fields || []).length;

                const presetFields = generatePresetFields(typeValue, startingOrder, parentId, (data?.fields || []).length);
                const newFields = [...(data?.fields || [])];

                if (overIndex !== -1) {
                    newFields.splice(overIndex + 1, 0, ...presetFields);
                } else {
                    newFields.push(...presetFields);
                }

                setData(
                    'fields',
                    newFields.map((f, i) => ({ ...f, order: i })),
                );
                setSelectedFieldIds([presetFields[0].id]);
                return;
            }

            const typeInfo = (FIELD_TYPES.flatMap((c) => c.items) as any[]).find((t) => t.value === typeValue);

            const newField: FormField = {
                id: Math.random().toString(36).substr(2, 9),
                parent_id: parentId,
                label: (typeInfo as any)?.defaultLabel || (typeInfo as any)?.label || `New ${typeValue}`,
                name: `field_${(data?.fields || []).length + 1}`,
                type: typeValue,
                placeholder: (typeInfo as any)?.defaultPlaceholder || '',
                is_required: false,
                width: '100',
                options:
                    typeValue === 'kop_surat'
                        ? {
                            logo_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=2117&auto=format&fit=crop',
                            logo_size: 80,
                            logo_position: 'left',
                            description:
                                'Jl. Sudirman No. 123, SCBD, Jakarta Selatan, 12190\nTelp: (021) 5088 1234 • Fax: (021) 5088 5678\nEmail: info@company.com • Website: www.company.com',
                        }
                        : typeValue === 'select' || typeValue === 'radio'
                            ? ['Option 1', 'Option 2']
                            : null,
                order: (data?.fields || []).length,
            };

            const overIndex = (data?.fields || []).findIndex((f) => f.id === overId);
            const newFields = [...(data?.fields || [])];
            if (overIndex !== -1) {
                newFields.splice(overIndex + 1, 0, newField);
            } else {
                newFields.push(newField);
            }

            setData(
                'fields',
                newFields.map((f, i) => ({ ...f, order: i })),
            );
            setSelectedFieldIds([newField.id]);
            return;
        }

        // Standard Reordering / Nesting logic
        if (activeId === overId) return;

        const activeField = (data?.fields || []).find((f) => f.id === activeId);
        const overField = (data?.fields || []).find((f) => f.id === overId);
        if (!activeField || !overField) return;

        const newFields = [...(data?.fields || [])];
        const oldIndex = newFields.findIndex((f) => f.id === activeId);

        // Logical shift: If drop target is a container, become its child.
        // Otherwise, inherit target's parent.
        let newParentId = overField && ['group', 'grid_view', 'grid_x', 'grid_y'].includes(overField.type) ? overField.id : overField.parent_id;

        // Prevent circular nesting (dragging parent into child)
        const isChildOf = (parentId: string | null, targetId: string): boolean => {
            if (!parentId) return false;
            if (parentId === targetId) return true;
            const parent = data.fields.find((f) => f.id === parentId);
            return isChildOf(parent?.parent_id || null, targetId);
        };

        if (isChildOf(newParentId || null, activeId)) {
            // Reorder only, don't nest if it would cause circularity
            newParentId = activeField.parent_id || null;
        }

        const updatedActive = { ...activeField, parent_id: newParentId };
        newFields.splice(oldIndex, 1);

        const newIndex = newFields.findIndex((f) => f.id === overId);
        if (['group', 'grid_view', 'grid_x', 'grid_y'].includes(overField.type)) {
            // Add to the end of the children list
            newFields.push(updatedActive);
        } else {
            // Insert at specific position
            newFields.splice(newIndex + 1, 0, updatedActive);
        }

        setData(
            'fields',
            newFields.map((f, i) => ({ ...f, order: i })),
        );
    };

    const addField = (typeValue: string) => {
        if (typeValue.startsWith('preset_')) {
            const presetFields = generatePresetFields(typeValue, data.fields.length, null, data.fields.length);
            const newFields = [...data.fields, ...presetFields].map((f, i) => ({ ...f, order: i }));
            setData('fields', newFields);
            setSelectedFieldIds([presetFields[0].id]);
            return;
        }

        const typeInfo = FIELD_TYPES.flatMap((c) => c.items).find((t) => t.value === typeValue);
        const newField: FormField = {
            id: Math.random().toString(36).substr(2, 9),
            parent_id: null,
            label: (typeInfo as any)?.defaultLabel || (typeInfo as any)?.label || `New ${typeValue}`,
            name: `field_${data.fields.length + 1}`,
            type: typeValue,
            placeholder: (typeInfo as any)?.defaultPlaceholder || '',
            is_required: false,
            width: '100',
            options: {
                ...(typeValue === 'select' || typeValue === 'radio' ? { items: [{ label: 'Option 1', value: '1' }] } : {}),
                ...((typeInfo as any)?.defaultOptions || {}),
            },
            order: data.fields.length,
        };
        const newFields = [...data.fields, newField].map((f, i) => ({ ...f, order: i }));
        setData('fields', newFields);
        setSelectedFieldIds([newField.id]);
    };

    const addFieldAfter = (targetId: string, typeValue: string) => {
        const targetField = data.fields.find((f) => f.id === targetId);
        if (!targetField) return;

        if (typeValue.startsWith('preset_')) {
            const presetFields = generatePresetFields(typeValue, targetField.order + 0.5, targetField.parent_id, data.fields.length);
            const newFields = [...data.fields, ...presetFields]
                .sort((a, b) => a.order - b.order)
                .map((f, i) => ({ ...f, order: i }));
            setData('fields', newFields);
            setSelectedFieldIds([presetFields[0].id]);
            return;
        }

        const typeInfo = FIELD_TYPES.flatMap((c) => c.items).find((t) => t.value === typeValue);
        const newField: FormField = {
            id: Math.random().toString(36).substr(2, 9),
            parent_id: targetField.parent_id,
            label: (typeInfo as any)?.defaultLabel || (typeInfo as any)?.label || `New ${typeValue}`,
            name: `field_${data.fields.length + 1}`,
            type: typeValue,
            placeholder: (typeInfo as any)?.defaultPlaceholder || '',
            is_required: false,
            width: targetField.width,
            options: {
                ...(typeValue === 'select' || typeValue === 'radio' ? { items: [{ label: 'Option 1', value: '1' }] } : {}),
                ...((typeInfo as any)?.defaultOptions || {}),
            },
            order: targetField.order + 0.5, // Temp order to facilitate sorting
        };

        const newFields = [...data.fields, newField]
            .sort((a, b) => a.order - b.order)
            .map((f, i) => ({ ...f, order: i }));

        setData('fields', newFields);
        setSelectedFieldIds([newField.id]);
    };

    const wrapFields = (wrapperType: 'group' | 'grid_x' | 'grid_y') => {
        if (selectedFieldIds.length < 1) return;

        const selectedFields = data.fields.filter((f) => selectedFieldIds.includes(f.id)).sort((a, b) => a.order - b.order);

        const firstField = selectedFields[0];
        const parentId = firstField.parent_id;

        const wrapperId = Math.random().toString(36).substr(2, 9);
        const typeInfo = FIELD_TYPES.flatMap((c) => c.items).find((t) => t.value === wrapperType);

        const wrapperField: FormField = {
            id: wrapperId,
            parent_id: parentId,
            label: (typeInfo as any)?.label || `New ${wrapperType}`,
            name: `wrap_${data.fields.length + 1}`,
            type: wrapperType,
            placeholder: '',
            is_required: false,
            width: '100',
            order: firstField.order - 0.5,
            options: wrapperType === 'grid_x' ? { grid_cols: selectedFields.length } : {},
        };

        const updatedFields = data.fields.map((f) => {
            if (selectedFieldIds.includes(f.id)) {
                return { ...f, parent_id: wrapperId };
            }
            return f;
        });

        const newFields = [...updatedFields, wrapperField].sort((a, b) => a.order - b.order).map((f, i) => ({ ...f, order: i }));

        setData('fields', newFields);
        setSelectedFieldIds([wrapperId]);
    };

    const duplicateField = (targetId: string) => {
        const originalFields = [...data.fields];
        const fieldsToDuplicate: FormField[] = [];

        // Helper to find all descendant IDs
        const getAllDescendantIds = (parentId: string, acc: string[]) => {
            const children = originalFields.filter((f) => f.parent_id === parentId);
            children.forEach((child) => {
                acc.push(child.id);
                getAllDescendantIds(child.id, acc);
            });
        };

        const targetSubtreeIds = [targetId];
        getAllDescendantIds(targetId, targetSubtreeIds);

        // Find max order in current subtree to place duplicate after it
        const targetSubtreeFields = originalFields.filter((f) => targetSubtreeIds.includes(f.id));
        const maxOrderInSubtree = Math.max(...targetSubtreeFields.map((f) => f.order));

        const getDuplicateRecursive = (id: string, newParentId: string | null, orderOffset: number) => {
            const original = originalFields.find((f) => f.id === id);
            if (!original) return;

            const newId = Math.random().toString(36).substr(2, 9);

            const duplicate: FormField = {
                ...JSON.parse(JSON.stringify(original)), // Deep copy
                id: newId,
                parent_id: newParentId,
                name: `${original.name}_copy_${Math.random().toString(36).substr(2, 4)}`,
                order: original.order + orderOffset,
            };
            fieldsToDuplicate.push(duplicate);

            // Find children and duplicate them
            const children = originalFields.filter((f) => f.parent_id === id);
            children.forEach((child) => getDuplicateRecursive(child.id, newId, orderOffset));
        };

        const targetField = originalFields.find((f) => f.id === targetId);
        if (!targetField) return;

        // Calculate offset to place duplicate subtree right after original subtree
        const offset = maxOrderInSubtree - targetField.order + 0.1;

        getDuplicateRecursive(targetId, targetField.parent_id || null, offset);

        const newFields = [...originalFields, ...fieldsToDuplicate]
            .sort((a, b) => a.order - b.order)
            .map((f, i) => ({ ...f, order: i }));

        setData('fields', newFields);
        // Select the new root duplicated field
        if (fieldsToDuplicate.length > 0) {
            setSelectedFieldIds([fieldsToDuplicate[0].id]);
        }
    };

    const removeField = (ids: string | string[]) => {
        const idArray = Array.isArray(ids) ? ids : [ids];
        openDialog({
            title: 'Hapus Elemen',
            description: idArray.length > 1
                ? `Yakin ingin menghapus ${idArray.length} elemen terpilih beserta seluruh isinya? Tindakan ini tidak dapat dibatalkan.`
                : 'Yakin ingin menghapus elemen ini beserta seluruh isinya? Tindakan ini tidak dapat dibatalkan.',
            variant: 'danger',
            confirmText: 'Ya, Hapus',
            onConfirm: () => {
                const idsToRemove = new Set<string>();
                const getDescendantIds = (targetId: string, acc: Set<string>) => {
                    acc.add(targetId);
                    data.fields
                        .filter((f) => f.parent_id === targetId)
                        .forEach((child) => getDescendantIds(child.id, acc));
                };
                idArray.forEach((id) => getDescendantIds(id, idsToRemove));

                const newFields = data.fields.filter((f) => !idsToRemove.has(f.id));
                setData(
                    'fields',
                    newFields.map((f, i) => ({ ...f, order: i })),
                );
                setSelectedFieldIds((prev) => prev.filter((i) => !idsToRemove.has(i)));
                closeDialog();
            },
        });
    };

    const handleDuplicateField = (targetId: string) => {
        openDialog({
            title: 'Duplikat Elemen',
            description: 'Duplikat elemen ini dan semua isinya?',
            variant: 'warning',
            confirmText: 'Ya, Duplikat',
            onConfirm: () => {
                duplicateField(targetId);
                closeDialog();
            },
        });
    };

    const updateField = (ids: string | string[], key: keyof FormField, value: any) => {
        const idArray = Array.isArray(ids) ? ids : [ids];
        const newFields = data.fields.map((f) => (idArray.includes(f.id) ? { ...f, [key]: value } : f));
        setData('fields', newFields);
    };

    const bulkUpdateOptions = (ids: string[], optionsUpdate: any) => {
        const newFields = data.fields.map((f) => {
            if (ids.includes(f.id)) {
                return {
                    ...f,
                    options: {
                        ...(f.options || {}),
                        ...optionsUpdate,
                    },
                };
            }
            return f;
        });
        setData('fields', newFields);
    };

    const handleTestDownload = async () => {
        setSaving(true);
        setPdfJobStatus({ status: 'pending', progress: 10 });

        try {
            const res = await axios.post(`/admin/form-templates/export-queue`, {
                template: data,
                form_data: JSON.stringify(previewData),
            });

            const jobId = res.data.job_id;
            setPdfJobId(jobId);

            // Start Polling
            const interval = setInterval(async () => {
                try {
                    const statusRes = await axios.get(`/admin/form-templates/pdf-status/${jobId}`);
                    const statusData = statusRes.data;
                    setPdfJobStatus(statusData);

                    if (statusData.status === 'completed') {
                        clearInterval(interval);
                        window.open(statusData.url, '_blank');
                        setSaving(false);
                        setPdfJobId(null);
                    } else if (statusData.status === 'failed') {
                        clearInterval(interval);
                        setSaving(false);
                        setPdfJobId(null);
                        openDialog({
                            title: 'Gagal Export PDF',
                            description: 'Gagal mendownload PDF: ' + (statusData.error || 'Unknown error'),
                            variant: 'warning',
                            confirmText: 'Tutup',
                            onConfirm: closeDialog,
                        });
                    }
                } catch (err) {
                    console.error('Polling failed:', err);
                }
            }, 2000);
        } catch (error) {
            console.error('Queue failed:', error);
            setSaving(false);
            setPdfJobId(null);
            openDialog({
                title: 'Gagal Antrikan PDF',
                description: 'Gagal antrikan PDF. Pastikan server antrian (queue) berjalan.',
                variant: 'warning',
                confirmText: 'Tutup',
                onConfirm: closeDialog,
            });
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.form-templates.save', template.id));
    };

    const selectedFields = useMemo(() => {
        return (data?.fields || []).filter((f) => selectedFieldIds.includes(f.id));
    }, [data.fields, selectedFieldIds]);

    const fieldTree = useMemo(() => {
        const buildRecursiveTree = (parentId: string | null = null): any[] => {
            return (data?.fields || [])
                .filter((f) => f.parent_id === parentId)
                .sort((a, b) => a.order - b.order)
                .map((field) => ({
                    ...field,
                    children: buildRecursiveTree(field.id),
                }));
        };
        return buildRecursiveTree(null);
    }, [data.fields]);

    // Sync local JSON when tab changes or data changes
    useEffect(() => {
        if (leftPanelTab === 'json') {
            setLocalJsonStr(JSON.stringify(fieldTree, null, 2));
        }
    }, [leftPanelTab, fieldTree]);

    // JSON Linting Logic
    useEffect(() => {
        if (!localJsonStr) {
            setJsonError(null);
            return;
        }
        try {
            const parsed = JSON.parse(localJsonStr);
            if (!Array.isArray(parsed)) {
                setJsonError('Root structure must be an array [ ... ]');
            } else {
                setJsonError(null);
            }
        } catch (e: any) {
            setJsonError(e.message);
        }
    }, [localJsonStr]);

    const handleApplyJson = () => {
        if (jsonError) {
            openDialog({
                title: 'JSON Tidak Valid',
                description: 'Perbaiki error JSON terlebih dahulu sebelum menerapkan perubahan.',
                variant: 'warning',
                confirmText: 'Tutup',
                onConfirm: closeDialog,
            });
            return;
        }
        try {
            const parsed = JSON.parse(localJsonStr);
            if (!Array.isArray(parsed)) throw new Error('Root must be an array');

            const flatten = (items: any[], parentId: string | null = null): any[] => {
                let res: any[] = [];
                items.forEach((item) => {
                    const { children, ...rest } = item;
                    res.push({ ...rest, parent_id: parentId });
                    if (children && Array.isArray(children)) {
                        res = [...res, ...flatten(children, item.id)];
                    }
                });
                return res;
            };

            const flatFields = flatten(parsed).map((f, i) => ({ ...f, order: i }));
            setData('fields', flatFields);
        } catch (e: any) {
            openDialog({
                title: 'Error Parsing JSON',
                description: 'Error parsing JSON: ' + e.message,
                variant: 'warning',
                confirmText: 'Tutup',
                onConfirm: closeDialog,
            });
        }
    };

    const allFieldIds = useMemo(() => (data?.fields || []).map((f) => f.id), [data.fields]);

    return (
        <div className="bg-muted/10 text-foreground flex h-screen flex-col overflow-hidden font-sans">
            <Head title={template.id ? `Edit ${template.name}` : 'Form Builder'} />

            {/* Custom Dialog — replaces all native alert/confirm */}
            <ConfirmationModal
                open={dialog.open}
                onClose={closeDialog}
                onConfirm={dialog.onConfirm}
                title={dialog.title}
                description={dialog.description}
                variant={dialog.variant}
                confirmText={dialog.confirmText}
            />

            <form onSubmit={handleSave} className="flex h-full flex-col overflow-hidden">
                <header className="border-border bg-card z-50 flex h-14 shrink-0 items-center justify-between border-b px-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild className="border-border/50 h-9 w-9 border">
                            <Link href={route('admin.form-templates.index')}>
                                <ArrowLeft size={18} />
                            </Link>
                        </Button>
                        <div className="flex flex-col">
                            <h1 className="text-foreground font-sans text-sm font-semibold tracking-tight uppercase">{data.name}</h1>
                            <div className="flex items-center gap-1.5 opacity-60">
                                <Layout size={10} className="text-primary" />
                                <span className="text-[9px] font-semibold tracking-[0.2em] uppercase">Visual Multi-Block Designer</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="mr-2 flex items-center gap-1 border-r pr-3">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={undo}
                                disabled={historyIndex <= 0}
                                className="h-8 w-8 transition-all active:scale-90"
                                title="Undo (Ctrl+Z)"
                            >
                                <Undo size={16} />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={redo}
                                disabled={historyIndex >= history.length - 1}
                                className="h-8 w-8 transition-all active:scale-90"
                                title="Redo (Ctrl+Y)"
                            >
                                <Redo size={16} />
                            </Button>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleTestDownload}
                            disabled={saving || !!pdfJobId}
                            className="h-8 px-4 text-[10px] active:scale-95"
                        >
                            {saving && !!pdfJobId ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Download size={14} className="mr-1.5" />}
                            {saving && !!pdfJobId ? 'Generating...' : 'Download'}
                        </Button>

                        <Button type="submit" variant="primary" className="h-8 px-6 text-[10px] shadow-xl active:scale-95" disabled={processing}>
                            <Save size={14} className="mr-1.5" /> {processing ? 'Saving...' : 'Simpan'}
                        </Button>
                    </div>
                </header>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <main className="bg-muted/5 relative flex flex-1 overflow-hidden">
                        {/* LEFT: WORKSPACE SIDEBAR */}
                        <aside
                            style={{ width: `${leftWidth}px` }}
                            className="border-border bg-card z-20 flex shrink-0 flex-col overflow-hidden border-r shadow-sm"
                        >
                            <div className="border-border bg-muted/20 border-b p-4">
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-muted-foreground/60 font-sans text-[10px] font-semibold tracking-[0.2em] uppercase">
                                        Workspace
                                    </h2>
                                    <div className="bg-primary/10 rounded-lg px-2 py-0.5">
                                        <span className="text-primary font-sans text-[8px] font-semibold uppercase">v2.0</span>
                                    </div>
                                </div>

                                <div className="bg-muted/80 ring-border/50 flex gap-1 rounded-xl p-1 ring-1">
                                    {[
                                        { id: 'library', label: 'Library', icon: Grid },
                                        { id: 'structure', label: 'Structure', icon: List },
                                        { id: 'json', label: 'JSON', icon: FileText },
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setLeftPanelTab(tab.id as any)}
                                            className={cn(
                                                'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 transition-all duration-200',
                                                leftPanelTab === tab.id
                                                    ? 'bg-card text-primary ring-border shadow-sm ring-1'
                                                    : 'text-muted-foreground/40 hover:text-foreground',
                                            )}
                                        >
                                            <tab.icon size={12} strokeWidth={3} />
                                            <span className="hidden font-sans text-[10px] font-semibold tracking-tight uppercase sm:inline-block">
                                                {tab.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <ScrollArea className="flex-1">
                                <div className="overflow-hidden p-4">
                                    {leftPanelTab === 'library' && <LibraryPanel onAddField={addField} />}

                                    {leftPanelTab === 'structure' && (
                                        <StructurePanel
                                            fieldTree={fieldTree}
                                            selectedFieldIds={selectedFieldIds}
                                            onSelectField={handleSelectField}
                                            fieldsCount={data.fields.length}
                                            onRemoveField={removeField}
                                            onRemoveAll={() => removeField((data.fields || []).map(f => f.id))}
                                            onRemoveSelected={() => removeField(selectedFieldIds)}
                                        />
                                    )}

                                    {leftPanelTab === 'json' && (
                                        <JSONEditorPanel
                                            localJsonStr={localJsonStr}
                                            onChange={setLocalJsonStr}
                                            onApply={handleApplyJson}
                                            jsonError={jsonError}
                                        />
                                    )}
                                </div>
                            </ScrollArea>
                            {/* Resizer */}
                            <div
                                onMouseDown={() => setIsResizingLeft(true)}
                                className="hover:bg-primary/30 absolute top-0 right-0 h-full w-1 cursor-col-resize transition-colors"
                            />
                        </aside>
                        {/* CENTER: LIVE CANVAS */}
                        <CanvasArea
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            data={data}
                            previewData={previewData}
                            updatePreviewData={updatePreviewData}
                            selectedFieldIds={selectedFieldIds}
                            handleSelectField={handleSelectField}
                            moveField={moveField}
                            removeField={removeField}
                            duplicateField={duplicateField}
                        />

                        {/* RIGHT: PROPERTY EDITOR */}
                        <aside
                            style={{ width: `${rightWidth}px` }}
                            className="border-border bg-card z-20 flex shrink-0 flex-col overflow-hidden border-l"
                        >
                            <div className="border-border bg-muted/20 flex items-center justify-between border-b px-4 py-3">
                                <h1 className="text-muted-foreground font-sans text-[10px] font-semibold tracking-[0.2em] uppercase">
                                    {selectedFieldIds.length > 0 ? 'Block Properties' : 'Template Settings'}
                                </h1>
                                <Layout size={12} className="text-primary opacity-50" />
                            </div>
                            <ScrollArea className="flex-1">
                                <div className="p-5">
                                    <PropertiesPanel
                                        selectedFields={selectedFields}
                                        updateField={updateField}
                                        bulkUpdateOptions={bulkUpdateOptions}
                                        templateData={data}
                                        setTemplateData={setData}
                                        onRemoveField={removeField}
                                    />
                                </div>
                            </ScrollArea>

                            {/* Resizer */}
                            <div
                                onMouseDown={() => setIsResizingRight(true)}
                                className="hover:bg-primary/30 absolute top-0 left-0 h-full w-1 cursor-col-resize transition-colors"
                            />
                        </aside>
                    </main>

                    <TrashZone />
                    <DragOverlay>
                        {activeLibItem && (
                            <div className="bg-primary border-primary-foreground/20 flex items-center gap-3 rounded-2xl border-2 px-6 py-4 font-sans text-[10px] font-semibold text-white uppercase shadow-2xl backdrop-blur-md">
                                <Plus size={16} strokeWidth={3} /> New {activeLibItem.replace('_', ' ')}
                            </div>
                        )}
                    </DragOverlay>
                </DndContext>
            </form>
        </div>
    );
}

FormBuilder.layout = (page: React.ReactNode) => page;

export default FormBuilder;
