import { CanvasArea } from '@/pages/form-builder/components/builder/CanvasArea';
import { FIELD_TYPES } from '@/pages/form-builder/components/builder/constants';
import { FormElement } from '@/pages/form-builder/components/fields/FormElement';
import { JSONEditorPanel } from '@/pages/form-builder/components/builder/JSONEditorPanel';
import { LibraryPanel } from '@/pages/form-builder/components/builder/LibraryPanel';
import { PropertiesPanel } from '@/pages/form-builder/components/builder/PropertiesPanel';
import { StructurePanel } from '@/pages/form-builder/components/builder/StructurePanel';
import { Button } from '@/components/ui/buttons/Button';
import { ScrollArea } from '@/components/ui/utilities/ScrollArea';
import { ConfirmationModal } from '@/components/ui/dialogs/ConfirmationModal';
import { cn } from '@/lib/utils';
import { closestCenter, DndContext, DragEndEvent, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Head, Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, Clock, Download, Edit3, Eye, GitBranch, GitCommit, Grid, HelpCircle, Layout, List, Loader2, Play, Plus, Redo, RotateCcw, Save, Trash2, Undo, User } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TrashZone } from './components/TrashZone';

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

const generatePresetFields = (
    presetType: string,
    startingOrder: number,
    parentId: string | null = null,
    currentFieldCount: number = 0,
): FormField[] => {
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
            options: {
                logo_url: '/storage/fr_logo.png',
                width: 90,
                height: 90,
                alignment: 'center',
                v_alignment: 'middle',
                margin_top: 0,
                margin_bottom: 0,
                margin_left: 0,
                margin_right: 0,
            },
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
            options: {
                font_size: 11,
                font_weight: 'semibold',
                font_family: "'Inter', sans-serif",
                color: '#475569',
                line_height: '1.4',
                border_style: 'none',
            },
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
            name: 'meta_judul_kontrak',
            type: 'static_text',
            placeholder: '',
            is_required: false,
            width: '100',
            order: startingOrder + 0.35,
            options: {
                font_size: 14,
                font_weight: 'bold',
                font_family: "'Inter', sans-serif",
                alignment: 'center',
                text_decoration: 'underline',
                border_style: 'none',
            },
        });

        // Document Number
        fields.push({
            id: docSubtitleId,
            parent_id: layoutId,
            label: 'Nomor : 14.012/PT.OGD/11/2022',
            name: 'meta_no_kontrak',
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
            options: {
                font_size: 20,
                font_weight: 'bold',
                font_family: "'Inter', sans-serif",
                color: '#0f3d6b',
                alignment: 'center',
                border_style: 'none',
            },
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
            options: {
                font_size: 11,
                font_weight: 'semibold',
                font_family: "'Inter', sans-serif",
                color: '#475569',
                alignment: 'center',
                line_height: '1.4',
                border_style: 'none',
            },
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
            options: {
                font_size: 14,
                font_weight: 'bold',
                font_family: "'Inter', sans-serif",
                alignment: 'center',
                text_decoration: 'underline',
                border_style: 'none',
            },
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
                text_align: 'justify',
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
                name: `party_block_${baseCount + partyNum * 10}`,
                type: 'grid_y',
                placeholder: '',
                is_required: false,
                width: '100',
                order: baseOrder + partyNum * 0.1,
                options: { gap: 0, align_items: 'stretch', border_style: 'none', margin_bottom: 8 },
            } as FormField);

            // Header row: number + (first labeled_value Nama in same line)
            partyFields.push({
                id: headerRowId,
                parent_id: blockId,
                label: `Pihak ${partyNum === 1 ? 'Pertama' : partyNum === 2 ? 'Kedua' : partyNum}`,
                name: `party_header_${baseCount + partyNum * 10 + 1}`,
                type: 'grid_x',
                placeholder: '',
                is_required: false,
                width: '100',
                order: baseOrder + partyNum * 0.1 + 0.01,
                options: { grid_cols: 2, col_sizes: ['28px', '1fr'], gap: 0, border_style: 'none' },
            } as FormField);

            // Party number label (1. / 2.)
            partyFields.push({
                id: numberLabelId,
                parent_id: headerRowId,
                label: `${partyNum}.`,
                name: `party_num_${baseCount + partyNum * 10 + 2}`,
                type: 'static_text',
                placeholder: '',
                is_required: false,
                width: '100',
                order: baseOrder + partyNum * 0.1 + 0.02,
                options: { font_size: 12, font_weight: 'normal', font_family: "'Times New Roman', serif", border_style: 'none' },
            } as FormField);

            // Nama field (labeled_value inside header row)
            partyFields.push({
                id: namaId,
                parent_id: headerRowId,
                label: 'Nama',
                name: partyNum === 1 ? 'meta_p1_signer' : 'meta_p2_signer',
                type: 'labeled_value',
                placeholder: '',
                is_required: false,
                width: '100',
                order: baseOrder + partyNum * 0.1 + 0.03,
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
                name: partyNum === 1 ? 'meta_p1_signer_position' : 'meta_p2_signer_position',
                type: 'labeled_value',
                placeholder: '',
                is_required: false,
                width: '100',
                order: baseOrder + partyNum * 0.1 + 0.04,
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
                name: partyNum === 1 ? 'meta_p1_alamat' : 'meta_p2_alamat',
                type: 'labeled_value',
                placeholder: '',
                is_required: false,
                width: '100',
                order: baseOrder + partyNum * 0.1 + 0.05,
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
                label:
                    partyNum === 1
                        ? 'Dalam hal ini bertindak atas nama perusahaan yang berkedudukan sebagai Pemberi Kerja yang selanjutnya disebut **PIHAK PERTAMA.**'
                        : 'Dalam hal ini bertindak untuk dan atas nama sendiri selanjutnya disebut **PIHAK KEDUA.**',
                name: `party_desc_${baseCount + partyNum * 10 + 6}`,
                type: 'static_text',
                placeholder: '',
                is_required: false,
                width: '100',
                order: baseOrder + partyNum * 0.1 + 0.06,
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
                order: startingOrder + 0.02 + idx * 0.01,
                options: {
                    label_width: '220',
                    show_colon: true,
                    field_style: 'dashed_bottom',
                    font_size: 11,
                    font_family: "'Times New Roman', serif",
                },
            } as FormField);
        });
    } else if (presetType === 'preset_header_logo_info') {
        // Root outer wrapper with border
        const outerId = Math.random().toString(36).substr(2, 9);
        const gridXId = Math.random().toString(36).substr(2, 9);
        const logoId = Math.random().toString(36).substr(2, 9);
        const rightColId = Math.random().toString(36).substr(2, 9);

        const infoFields = [
            { label: 'NOMOR', name: 'nomor' },
            { label: 'TOPIK', name: 'topik' },
            { label: 'SUB TOPIK', name: 'sub_topik' },
            { label: 'LAMPIRAN', name: 'lampiran' },
        ];

        // Outer grid_y — full bordered wrapper
        fields.push({
            id: outerId,
            parent_id: parentId,
            label: 'Kop Logo & Info Surat',
            name: `preset_logo_info_wrapper_${currentFieldCount + 1}`,
            type: 'grid_y',
            placeholder: '',
            is_required: false,
            width: '100',
            order: startingOrder,
            options: {
                gap: 0,
                justify_content: 'center',
            },
        } as FormField);

        // Inner grid_x: logo left | info right
        fields.push({
            id: gridXId,
            parent_id: outerId,
            label: 'Header Row',
            name: `preset_logo_info_row_${currentFieldCount + 2}`,
            type: 'grid_x',
            placeholder: '',
            is_required: false,
            width: '100',
            order: startingOrder + 0.01,
            options: {
                grid_cols: 2,
                col_sizes: ['150px', '500px'],
                gap: 0,
                border_style: 'none',
                align_items: 'center',
                justify_content: 'space-between',
            },
        } as FormField);

        // Logo image (left column)
        fields.push({
            id: logoId,
            parent_id: gridXId,
            label: 'Logo Perusahaan',
            name: `preset_logo_img_${currentFieldCount + 3}`,
            type: 'image',
            placeholder: '',
            is_required: false,
            width: '100',
            order: startingOrder + 0.02,
            options: {
                logo_url: '/storage/fr_logo.png',
                width: 130,
                height: 130,
                alignment: 'center',
                v_alignment: 'middle',
                object_fit: 'contain',
                margin_top: 0,
                margin_bottom: 0,
                margin_left: 0,
                margin_right: 0,
            },
        } as FormField);

        // Right column: grid_y for info fields
        fields.push({
            id: rightColId,
            parent_id: gridXId,
            label: 'Info Surat',
            name: `preset_logo_info_right_${currentFieldCount + 4}`,
            type: 'grid_y',
            placeholder: '',
            is_required: false,
            width: '100',
            order: startingOrder + 0.03,
            options: {
                gap: 4,
                align_items: 'stretch',
                justify_content: 'center',
                border_style: 'none',
                border_width: 0,
                border_color: '#9ca3af',
                border_left: false,
                border_right: false,
                border_top: false,
                border_bottom: false,
                padding_top: 4,
                padding_bottom: 4,
                padding_left: 12,
                padding_right: 12,
            },
        } as FormField);

        // Info labeled_value fields
        infoFields.forEach((item, idx) => {
            fields.push({
                id: Math.random().toString(36).substr(2, 9),
                parent_id: rightColId,
                label: item.label,
                name: `preset_${item.name}_${currentFieldCount + 5 + idx}`,
                type: 'labeled_value',
                placeholder: '—',
                is_required: false,
                width: '100',
                order: startingOrder + 0.04 + idx * 0.01,
                options: {
                    value_type: 'textfield',
                    label_width: '90',
                    show_colon: true,
                    field_style: 'dashed_bottom',
                    font_size: 11,
                    font_weight: 'bold',
                    font_family: "'Inter', sans-serif",
                    margin_top: 0,
                    margin_bottom: 0,
                    margin_left: 0,
                    margin_right: 0,
                    padding_top: 0,
                    padding_bottom: 0,
                    padding_left: 0,
                    padding_right: 0,
                },
            } as FormField);
        });
    } else if (presetType === 'preset_header_info_only') {
        const outerId = Math.random().toString(36).substr(2, 9);
        const rightColId = Math.random().toString(36).substr(2, 9);

        const infoFields = [
            { label: 'NOMOR', name: 'nomor' },
            { label: 'TOPIK', name: 'topik' },
            { label: 'SUB TOPIK', name: 'sub_topik' },
            { label: 'LAMPIRAN', name: 'lampiran' },
        ];

        // Outer grid_y — aligned to stretch (full width)
        fields.push({
            id: outerId,
            parent_id: parentId,
            label: 'Info Surat Container',
            name: `preset_info_only_wrapper_${currentFieldCount + 1}`,
            type: 'grid_y',
            placeholder: '',
            is_required: false,
            width: '100',
            order: startingOrder,
            options: {
                gap: 0,
                border_style: 'none',
                border_width: 0,
                border_color: '#9ca3af',
                align_items: 'stretch',
                justify_content: 'center',
            },
        } as FormField);

        // Info container: grid_y for info fields, width 100%
        fields.push({
            id: rightColId,
            parent_id: outerId,
            label: 'Info Surat',
            name: `preset_info_only_right_${currentFieldCount + 2}`,
            type: 'grid_y',
            placeholder: '',
            is_required: false,
            width: '100',
            order: startingOrder + 0.01,
            options: {
                gap: 4,
                align_items: 'stretch',
                justify_content: 'center',
                border_style: 'none',
                border_width: 0,
                border_color: '#9ca3af',
                border_left: false,
                border_right: false,
                border_top: false,
                border_bottom: false,
                padding_top: 4,
                padding_bottom: 4,
                padding_left: 0,
                padding_right: 0,
            },
        } as FormField);

        // Info labeled_value fields
        infoFields.forEach((item, idx) => {
            fields.push({
                id: Math.random().toString(36).substr(2, 9),
                parent_id: rightColId,
                label: item.label,
                name: `preset_${item.name}_${currentFieldCount + 3 + idx}`,
                type: 'labeled_value',
                placeholder: '—',
                is_required: false,
                width: '100',
                order: startingOrder + 0.02 + idx * 0.01,
                options: {
                    value_type: 'textfield',
                    label_width: '90',
                    show_colon: true,
                    field_style: 'dashed_bottom',
                    font_size: 11,
                    font_weight: 'bold',
                    font_family: "'Inter', sans-serif",
                    height: '7mm',
                    margin_top: 0,
                    margin_bottom: 0,
                    margin_left: 0,
                    margin_right: 0,
                    padding_top: 0,
                    padding_bottom: 0,
                    padding_left: 0,
                    padding_right: 0,
                },
            } as FormField);
        });
    } else if (presetType === 'preset_grouped_01') {
        const rootGridId = Math.random().toString(36).substr(2, 9);
        const logoId = Math.random().toString(36).substr(2, 9);
        const verticalGridId = Math.random().toString(36).substr(2, 9);

        // Root Container: grid_x (#019fb708-8ba5-70d6-9af0-bf0d54f728fb)
        fields.push({
            id: rootGridId,
            parent_id: parentId,
            label: 'Kop Header & Info Surat (GRID)',
            name: `field_1_${currentFieldCount + 1}`,
            type: 'grid_x',
            placeholder: '',
            is_required: false,
            width: '100',
            order: startingOrder,
            options: {
                grid_cols: 2,
                col_sizes: ['1fr', '1fr'],
                border_style: 'solid',
                border_width: 1,
                border_color: '#0f172a',
                font_family: "'Montserrat', sans-serif",
                font_size: 11,
                font_weight: 'bold',
            },
        } as FormField);

        // Child 1: Logo Image (#019fb708-8ba8-73a4-ad8b-921b78bfb1f5)
        fields.push({
            id: logoId,
            parent_id: rootGridId,
            label: 'Logo',
            name: `field_2_${currentFieldCount + 2}`,
            type: 'image',
            placeholder: '',
            is_required: false,
            width: '100',
            order: startingOrder + 0.01,
            options: {
                logo_size: 150,
                alignment: 'left',
                font_family: "'Inter', sans-serif",
                width: '30mm',
                height: '43mm',
                padding_x: 0,
                margin_x: 2,
                margin_y: 2,
                logo_url: 'https://ap-south-1.linodeobjects.com/anj-web/assets/images/fr_logo.png',
                url: 'https://ap-south-1.linodeobjects.com/anj-web/assets/images/fr_logo.png',
                font_size: 11,
                font_weight: 'bold',
            },
        } as FormField);

        // Child 2: GRID VERTICAL Sub-container (#019fb708-8bb6-7186-9b89-57b08a8e2b34)
        fields.push({
            id: verticalGridId,
            parent_id: rootGridId,
            label: 'GRID VERTICAL',
            name: `field_3_${currentFieldCount + 3}`,
            type: 'grid_y',
            placeholder: '',
            is_required: false,
            width: '100',
            order: startingOrder + 0.02,
            options: {
                gap: 0,
                padding_x: 1,
                padding_y: 1,
                height: null,
                width: '140mm',
                font_family: "'Montserrat', sans-serif",
                font_size: 11,
                font_weight: 'bold',
            },
        } as FormField);

        // Sub-children of GRID VERTICAL (Nomor, Ex SOP NO, TOPIK, SUB TOPIK, LAMPIRAN)
        const items = [
            { label: 'Nomor', name: 'field_4' },
            { label: 'Ex SOP NO', name: 'field_5' },
            { label: 'TOPIK', name: 'field_6' },
            { label: 'SUB TOPIK', name: 'field_8' },
            { label: 'LAMPIRAN', name: 'field_7' },
        ];

        items.forEach((item, idx) => {
            fields.push({
                id: Math.random().toString(36).substr(2, 9),
                parent_id: verticalGridId,
                label: item.label,
                name: `${item.name}_${currentFieldCount + idx + 4}`,
                type: 'labeled_value',
                placeholder: '...',
                is_required: false,
                width: '100',
                order: startingOrder + 0.03 + idx * 0.01,
                options: {
                    value_type: 'textfield',
                    label_width: '80',
                    show_colon: true,
                    field_style: 'bordered',
                    font_size: 12,
                    font_family: "'Times New Roman', serif",
                    height: null,
                    padding_x: 0,
                    padding_y: 0,
                    margin_x: 0,
                    margin_y: 0,
                    font_weight: 'normal',
                },
            } as FormField);
        });
    } else if (presetType === 'preset_grouped_02') {
        const wrapId = Math.random().toString(36).substr(2, 9);
        // Container Group (#019fb708-8bbd-7245-8628-b393ca0295e7)
        fields.push({
            id: wrapId,
            parent_id: parentId,
            label: 'Data Penjual/Supplier (Container)',
            name: `grouped_supplier_block_${currentFieldCount + 1}`,
            type: 'group',
            placeholder: '',
            is_required: false,
            width: '100',
            order: startingOrder,
            options: {
                border_style: 'solid',
                border_width: 1,
                padding_all: 0,
                padding_x: 0,
                padding_y: 0,
                margin_y: 0,
                margin_x: 0,
                font_family: "'Montserrat', sans-serif",
                font_size: 11,
                font_weight: 'bold',
                width: '100%',
            },
        } as FormField);

        // Header text inside group
        fields.push({
            id: Math.random().toString(36).substr(2, 9),
            parent_id: wrapId,
            label: 'Data Penjual/Supplier:',
            name: `field_17_${currentFieldCount + 2}`,
            type: 'static_text',
            placeholder: '',
            is_required: false,
            width: '100',
            order: startingOrder + 0.01,
            options: {
                font_size: 12,
                font_weight: 'bold',
                font_family: "'Times New Roman', serif",
                padding_all: 0,
            },
        } as FormField);

        // Labeled Value 1: Nama Penjual/Supplier
        fields.push({
            id: Math.random().toString(36).substr(2, 9),
            parent_id: wrapId,
            label: 'Nama Penjual/Supplier',
            name: `field_15_${currentFieldCount + 3}`,
            type: 'labeled_value',
            placeholder: '...',
            is_required: false,
            width: '100',
            order: startingOrder + 0.02,
            options: {
                value_type: 'textfield',
                label_width: '120',
                show_colon: true,
                field_style: 'bordered',
                font_size: 12,
                font_family: "'Times New Roman', serif",
                font_weight: 'normal',
                margin_y: 0,
                items: [
                    { label: 'PT', value: '1' },
                    { label: 'Perorangan', value: '2' },
                ],
            },
        } as FormField);

        // Labeled Value 2: Nama Wakil
        fields.push({
            id: Math.random().toString(36).substr(2, 9),
            parent_id: wrapId,
            label: 'Nama Wakil',
            name: `field_15_copy_${currentFieldCount + 4}`,
            type: 'labeled_value',
            placeholder: '...',
            is_required: false,
            width: '100',
            order: startingOrder + 0.03,
            options: {
                value_type: 'textfield',
                label_width: '120',
                show_colon: true,
                field_style: 'bordered',
                font_size: 12,
                font_family: "'Times New Roman', serif",
                font_weight: 'normal',
                margin_y: 0,
                items: [
                    { label: 'PT', value: '1' },
                    { label: 'Perorangan', value: '2' },
                ],
            },
        } as FormField);

        // Labeled Value 3: Alamat Penjual
        fields.push({
            id: Math.random().toString(36).substr(2, 9),
            parent_id: wrapId,
            label: 'Alamat Penjual',
            name: `field_15_copy_alamat_${currentFieldCount + 5}`,
            type: 'labeled_value',
            placeholder: '...',
            is_required: false,
            width: '100',
            order: startingOrder + 0.04,
            options: {
                value_type: 'textarea',
                label_width: '120',
                show_colon: true,
                field_style: 'bordered',
                font_size: 12,
                font_family: "'Times New Roman', serif",
                font_weight: 'normal',
                max_lines: 2,
                margin_y: 0,
                items: [
                    { label: 'PT', value: '1' },
                    { label: 'Perorangan', value: '2' },
                ],
            },
        } as FormField);
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
    const [zoom, setZoom] = useState(100);
    const [showShortcutsModal, setShowShortcutsModal] = useState(false);
    const [showVersionModal, setShowVersionModal] = useState(false);
    // Custom Presets State (Loaded from LocalStorage)
    const [customPresets, setCustomPresets] = useState<{
        value: string;
        label: string;
        fields: FormField[];
    }[]>(() => {
        try {
            const saved = localStorage.getItem('form_builder_custom_presets');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const saveAsCustomPreset = (fieldId: string) => {
        const targetField = data.fields.find((f) => f.id === fieldId);
        if (!targetField) return;

        // Get target field and all descendants
        const getBranchFields = (rootId: string): FormField[] => {
            const result: FormField[] = [];
            const collect = (id: string) => {
                const f = data.fields.find((field) => field.id === id);
                if (f) {
                    result.push(f);
                    data.fields.filter((child) => child.parent_id === id).forEach((child) => collect(child.id));
                }
            };
            collect(rootId);
            return result;
        };

        const branchFields = getBranchFields(fieldId);
        const presetName = prompt('Masukkan nama Custom Element Preset:', targetField.label || 'Custom Group Element');
        if (!presetName) return;

        const newPreset = {
            value: `custom_preset_${Date.now()}`,
            label: presetName,
            fields: branchFields,
        };

        const updatedPresets = [...customPresets, newPreset];
        setCustomPresets(updatedPresets);
        try {
            localStorage.setItem('form_builder_custom_presets', JSON.stringify(updatedPresets));
        } catch (e) {
            console.error('Failed to save custom preset:', e);
        }
    };

    const removeCustomPreset = (presetValue: string) => {
        openDialog({
            title: 'Hapus Preset Kustom',
            description: 'Apakah Anda yakin ingin menghapus preset kustom ini dari daftar?',
            variant: 'danger',
            confirmText: 'Ya, Hapus',
            onConfirm: () => {
                const updated = customPresets.filter((p) => p.value !== presetValue);
                setCustomPresets(updated);
                try {
                    localStorage.setItem('form_builder_custom_presets', JSON.stringify(updated));
                } catch (e) {
                    console.error('Failed to delete custom preset:', e);
                }
                closeDialog();
            },
        });
    };

    // Save Commit Dialog State
    const [showSaveCommitModal, setShowSaveCommitModal] = useState(false);
    const [saveCommitNote, setSaveCommitNote] = useState('');

    // Git Commit Log Versioning State
    const [commitMessageInput, setCommitMessageInput] = useState('');
    const [commitLogs, setCommitLogs] = useState<{
        hash: string;
        message: string;
        author: string;
        timestamp: string;
        fieldsCount: number;
        fields: FormField[];
    }[]>([
        {
            hash: 'init-01',
            message: 'Initial commit: Template schema created',
            author: 'Wahyudi Ramadhan',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            fieldsCount: (template?.fields || []).length,
            fields: (template?.fields || []),
        }
    ]);
    const [viewMode, setViewMode] = useState<'visual-editor' | 'interactive-form' | 'pdf-preview'>('visual-editor');
    const [previewData, setPreviewData] = useState<Record<string, any>>({});

    // Helper to update preview data
    const updatePreviewData = (name: string, value: any) => {
        setPreviewData((prev) => ({ ...prev, [name]: value }));
    };

    const selectedFieldId = useMemo(() => selectedFieldIds[selectedFieldIds.length - 1] || null, [selectedFieldIds]);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fieldId?: string } | null>(null);
    const [leftWidth, setLeftWidth] = useState(300);
    const [rightWidth, setRightWidth] = useState(280);
    const [isResizingLeft, setIsResizingLeft] = useState(false);
    const [isResizingRight, setIsResizingRight] = useState(false);

    // Essential UI States
    const [activeLibItem, setActiveLibItem] = useState<string | null>(null);
    const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
    const [localJsonStr, setLocalJsonStr] = useState('');
    const [isFullscreenJson, setIsFullscreenJson] = useState(false);
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

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
    const handleMoveSelected = useCallback(
        (direction: 'up' | 'down') => {
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
        },
        [data.fields, selectedFieldIds, setData],
    );

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
            if (e.ctrlKey || e.metaKey) {
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
            setActiveFieldId(null);
        } else {
            setActiveLibItem(null);
            setActiveFieldId(event.active.id.toString());
        }
        // Visual feedback for Trash Zone
        document.documentElement.style.setProperty('--trash-opacity', '1');
        document.documentElement.style.setProperty('--trash-transform', 'translateY(0)');
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveLibItem(null);
        setActiveFieldId(null);
        document.documentElement.style.setProperty('--trash-opacity', '0');
        document.documentElement.style.setProperty('--trash-transform', 'translateY(80px)');

        const { active, over } = event;

        if (!over) return;

        let activeId = active.id.toString();
        let overId = over.id.toString();

        if (activeId.startsWith('struct_')) activeId = activeId.replace('struct_', '');
        if (overId.startsWith('struct_')) overId = overId.replace('struct_', '');

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

        if (overId === 'canvas-area' || overId === 'canvas-bottom') {
            if (!activeField) return;
            const newFields = [...(data?.fields || [])];
            const oldIndex = newFields.findIndex((f) => f.id === activeId);

            const updatedActive = { ...activeField, parent_id: null };
            newFields.splice(oldIndex, 1);
            newFields.push(updatedActive);

            setData(
                'fields',
                newFields.map((f, i) => ({ ...f, order: i })),
            );
            return;
        }

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
        if (typeValue.startsWith('custom_preset_')) {
            const preset = customPresets.find((p) => p.value === typeValue);
            if (preset) {
                // Re-id fields to prevent ID collisions
                const idMap = new Map<string, string>();
                preset.fields.forEach((f) => idMap.set(f.id, Math.random().toString(36).substr(2, 9)));

                const newPresetFields: FormField[] = preset.fields.map((f, idx) => ({
                    ...f,
                    id: idMap.get(f.id) || f.id,
                    parent_id: f.parent_id ? idMap.get(f.parent_id) || null : null,
                    order: data.fields.length + idx,
                }));

                const newFields = [...data.fields, ...newPresetFields].map((f, i) => ({ ...f, order: i }));
                setData('fields', newFields);
                setSelectedFieldIds([newPresetFields[0].id]);
            }
            return;
        }

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
            const newFields = [...data.fields, ...presetFields].sort((a, b) => a.order - b.order).map((f, i) => ({ ...f, order: i }));
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

        const newFields = [...data.fields, newField].sort((a, b) => a.order - b.order).map((f, i) => ({ ...f, order: i }));

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

        const newFields = [...originalFields, ...fieldsToDuplicate].sort((a, b) => a.order - b.order).map((f, i) => ({ ...f, order: i }));

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
            description:
                idArray.length > 1
                    ? `Yakin ingin menghapus ${idArray.length} elemen terpilih beserta seluruh isinya? Tindakan ini tidak dapat dibatalkan.`
                    : 'Yakin ingin menghapus elemen ini beserta seluruh isinya? Tindakan ini tidak dapat dibatalkan.',
            variant: 'danger',
            confirmText: 'Ya, Hapus',
            onConfirm: () => {
                const idsToRemove = new Set<string>();
                const getDescendantIds = (targetId: string, acc: Set<string>) => {
                    acc.add(targetId);
                    data.fields.filter((f) => f.parent_id === targetId).forEach((child) => getDescendantIds(child.id, acc));
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

        try {
            const res = await axios.post(`/admin/form-templates/export-queue`, {
                template: data,
                form_data: JSON.stringify(previewData),
            });

            const jobId = res.data.job_id;

            // Poll the status endpoint until complete or failed
            const interval = setInterval(async () => {
                try {
                    const statusRes = await axios.get(`/admin/form-templates/pdf-status/${jobId}`);
                    const statusData = statusRes.data;

                    if (statusData.status === 'completed') {
                        clearInterval(interval);
                        setSaving(false);
                        if (statusData.url) {
                            window.open(statusData.url, '_blank');
                        }
                    } else if (statusData.status === 'failed') {
                        clearInterval(interval);
                        setSaving(false);
                        openDialog({
                            title: 'Gagal Export PDF',
                            description: `Proses export gagal: ${statusData.error || 'Terjadi kesalahan internal.'}`,
                            variant: 'warning',
                            confirmText: 'Tutup',
                            onConfirm: closeDialog,
                        });
                    }
                } catch (err) {
                    clearInterval(interval);
                    setSaving(false);
                    console.error('Polling PDF status failed:', err);
                }
            }, 2000);

        } catch (error) {
            console.error('Export PDF failed:', error);
            setSaving(false);
            openDialog({
                title: 'Gagal Export PDF',
                description: 'Gagal mengekspor PDF. Silakan coba lagi.',
                variant: 'warning',
                confirmText: 'Tutup',
                onConfirm: closeDialog,
            });
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        executeDirectSave();
    };

    const executeDirectSave = () => {
        post(route('admin.form-templates.save', template.id));
    };

    const executeSaveCommit = (customNote?: string) => {
        const commitMsg = (customNote || saveCommitNote).trim() || `Update template: ${data.fields.length} elements`;
        const randomHash = Math.random().toString(36).substring(2, 9);

        setCommitLogs((prev) => [
            {
                hash: randomHash,
                message: commitMsg,
                author: 'Wahyudi Ramadhan',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                fieldsCount: data.fields.length,
                fields: [...data.fields],
            },
            ...prev,
        ]);

        setSaveCommitNote('');
        setShowSaveCommitModal(false);
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

            <form onSubmit={handleSave} className="flex h-full flex-col overflow-hidden bg-slate-100/60 dark:bg-zinc-950">
                {/* Header Bar */}
                <header className="border-b border-slate-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 z-50 flex h-16 shrink-0 items-center justify-between px-5 backdrop-blur-md">
                    {/* Left Brand & Title + Auto-Save Status */}
                    <div className="flex items-center gap-3.5 min-w-0">
                        <Link
                            href={route('admin.form-templates.index')}
                            className="p-2 border border-slate-200 dark:border-zinc-800 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-slate-700 dark:text-slate-300 shrink-0"
                            title="Kembali ke Daftar Template"
                        >
                            <ArrowLeft size={16} />
                        </Link>
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="text-slate-900 dark:text-white font-sans text-xs lg:text-sm font-bold tracking-tight uppercase truncate max-w-[180px] lg:max-w-[280px]">
                                    {data.name}
                                </h1>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowVersionModal(true)}
                                    className="flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase text-primary hover:underline"
                                    title="Buka Git Commit History"
                                >
                                    <GitCommit size={11} />
                                    <span>main ({commitLogs.length} Commits)</span>
                                </button>
                                <span className="text-slate-300 dark:text-zinc-700">•</span>
                                <div className="flex items-center gap-1.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                    </span>
                                    <span>Tersimpan</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Center Mode Tabs & History Controls */}
                    <div className="flex items-center gap-3">
                        {/* Undo / Redo */}
                        <div className="flex items-center gap-0.5 bg-slate-100/80 dark:bg-zinc-800/60 p-1 rounded-xl border border-slate-200/50 dark:border-zinc-700/50">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={undo}
                                disabled={historyIndex <= 0}
                                className="h-7 w-7 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-zinc-700 transition-all active:scale-95 disabled:opacity-30"
                                title="Undo (Ctrl+Z)"
                            >
                                <Undo size={14} />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={redo}
                                disabled={historyIndex >= history.length - 1}
                                className="h-7 w-7 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-zinc-700 transition-all active:scale-95 disabled:opacity-30"
                                title="Redo (Ctrl+Y)"
                            >
                                <Redo size={14} />
                            </Button>
                        </div>

                        {/* View Mode Tabs */}
                        <div className="flex bg-slate-200/60 dark:bg-zinc-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-zinc-700/60 shadow-inner">
                            {[
                                { id: 'visual-editor', label: 'Visual Editor', icon: Edit3 },
                                { id: 'interactive-form', label: 'Interactive Form', icon: Play },
                                { id: 'pdf-preview', label: 'PDF Preview', icon: Eye },
                            ].map((mode) => (
                                <button
                                    key={mode.id}
                                    type="button"
                                    onClick={() => setViewMode(mode.id as any)}
                                    className={cn(
                                        'flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all uppercase',
                                        viewMode === mode.id
                                            ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs'
                                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                                    )}
                                >
                                    <mode.icon size={13} strokeWidth={2.2} />
                                    <span className="hidden md:inline-block font-sans tracking-tight">
                                        {mode.label}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Zoom Controls */}
                        <div className="hidden lg:flex items-center gap-1 bg-slate-100/80 dark:bg-zinc-800/60 p-1 rounded-xl border border-slate-200/50 dark:border-zinc-700/50 text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => setZoom((z) => Math.max(50, z - 10))}
                                className="h-7 w-6 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-zinc-700 transition-all"
                                title="Zoom Out"
                            >
                                -
                            </button>
                            <button
                                type="button"
                                onClick={() => setZoom(100)}
                                className="h-7 px-1.5 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-zinc-700 transition-all font-mono text-[11px]"
                                title="Reset Zoom"
                            >
                                {zoom}%
                            </button>
                            <button
                                type="button"
                                onClick={() => setZoom((z) => Math.min(150, z + 10))}
                                className="h-7 w-6 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-zinc-700 transition-all"
                                title="Zoom In"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Right Actions & Shortcuts Button */}
                    <div className="flex items-center gap-2">
                        {/* Keyboard Shortcuts Helper Modal Trigger */}
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowShortcutsModal(true)}
                            className="h-9 w-9 rounded-xl border border-slate-200/80 dark:border-zinc-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                            title="Panduan Keyboard Shortcuts"
                        >
                            <HelpCircle size={16} />
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleTestDownload}
                            disabled={saving}
                            className="h-9 px-3 text-xs font-semibold rounded-xl border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
                        >
                            {saving ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Download size={14} className="mr-1.5" />}
                            <span className="hidden sm:inline">{saving ? 'Exporting...' : 'PDF'}</span>
                        </Button>

                        <Button
                            type="submit"
                            variant="secondary"
                            className="h-9 px-3.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 shadow-xs transition-all"
                            disabled={processing}
                            title="Simpan perubahan template langsung"
                        >
                            <Save size={14} className="mr-1.5" />
                            <span>{processing ? 'Saving...' : 'Simpan'}</span>
                        </Button>

                        <Button
                            type="button"
                            variant="primary"
                            onClick={() => setShowSaveCommitModal(true)}
                            className="h-9 px-4 text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                            disabled={processing}
                            title="Simpan perubahan sekaligus buat Git commit log baru"
                        >
                            <GitCommit size={14} />
                            <span>Simpan & Commit</span>
                        </Button>
                    </div>
                </header>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <main className="bg-slate-100/40 dark:bg-zinc-950 relative flex flex-1 overflow-hidden">
                        {/* CENTER: LIVE CANVAS (Takes full area background) */}
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
                            zoom={zoom}
                        />

                        {/* LEFT: FLOATING WORKSPACE SIDEBAR */}
                        <aside
                            style={{ width: `${leftWidth}px` }}
                            className={cn(
                                "absolute top-4 left-4 bottom-4 z-30 flex flex-col rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 shadow-2xl backdrop-blur-md overflow-hidden",
                                isResizingLeft ? "select-none" : "transition-all"
                            )}
                        >
                            <div className="border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 p-3 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-slate-400 dark:text-zinc-500 font-sans text-[10px] font-bold tracking-wider uppercase">
                                        Workspace
                                    </h2>
                                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase text-primary">v2.0</span>
                                </div>

                                <div className="flex bg-slate-200/60 dark:bg-zinc-800 p-1 rounded-xl border border-slate-200/80 dark:border-zinc-700/60">
                                    {[
                                        { id: 'library', label: 'Library', icon: Grid },
                                        { id: 'structure', label: 'Structure', icon: List },
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setLeftPanelTab(tab.id as any)}
                                            className={cn(
                                                'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all',
                                                leftPanelTab === tab.id
                                                    ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs'
                                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                                            )}
                                        >
                                            <tab.icon size={13} />
                                            <span className="hidden font-sans text-[11px] font-semibold tracking-tight uppercase sm:inline-block">
                                                {tab.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <ScrollArea className="flex-1">
                                <div className="overflow-hidden p-3.5">
                                    {leftPanelTab === 'library' && (
                                        <LibraryPanel
                                            onAddField={addField}
                                            customPresets={customPresets}
                                            onRemoveCustomPreset={removeCustomPreset}
                                        />
                                    )}

                                    {leftPanelTab === 'structure' && (
                                        <StructurePanel
                                            fieldTree={fieldTree}
                                            selectedFieldIds={selectedFieldIds}
                                            onSelectField={handleSelectField}
                                            fieldsCount={data.fields.length}
                                            onRemoveField={removeField}
                                            onRemoveAll={() => removeField((data.fields || []).map((f) => f.id))}
                                            onRemoveSelected={() => removeField(selectedFieldIds)}
                                        />
                                    )}
                                </div>
                            </ScrollArea>
                            {/* Resizer */}
                            <div
                                onMouseDown={() => setIsResizingLeft(true)}
                                className="hover:bg-primary/50 absolute top-0 right-0 h-full w-2 cursor-col-resize transition-colors hover:w-2 z-40"
                            />
                        </aside>

                        {/* RIGHT: FLOATING PROPERTY EDITOR */}
                        <aside
                            style={{ width: `${rightWidth}px` }}
                            className={cn(
                                "absolute top-4 right-4 bottom-4 z-30 flex flex-col rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 shadow-2xl backdrop-blur-md overflow-hidden",
                                isResizingRight ? "select-none" : "transition-all"
                            )}
                        >
                            <div className="border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 flex items-center justify-between px-3.5 py-3">
                                <h1 className="text-slate-400 dark:text-zinc-500 font-sans text-[10px] font-bold tracking-wider uppercase">
                                    {selectedFieldIds.length > 0 ? 'Block Properties' : 'Template Settings'}
                                </h1>
                                <Layout size={14} className="text-primary opacity-60" />
                            </div>
                            <ScrollArea className="flex-1">
                                <div className="p-3.5">
                                    <PropertiesPanel
                                        selectedFields={selectedFields}
                                        updateField={updateField}
                                        bulkUpdateOptions={bulkUpdateOptions}
                                        templateData={data}
                                        setTemplateData={setData}
                                        onRemoveField={removeField}
                                        onDuplicateField={(ids) => {
                                            if (Array.isArray(ids)) {
                                                ids.forEach((id) => duplicateField(id));
                                            } else {
                                                duplicateField(ids);
                                            }
                                        }}
                                        onSaveAsCustomPreset={saveAsCustomPreset}
                                    />
                                </div>
                            </ScrollArea>

                            {/* Resizer */}
                            <div
                                onMouseDown={() => setIsResizingRight(true)}
                                className="hover:bg-primary/50 absolute top-0 left-0 h-full w-2 cursor-col-resize transition-colors z-40"
                            />
                        </aside>
                    </main>

                    <TrashZone />
                    <DragOverlay>
                        {/* Dragging from Library */}
                        {activeLibItem && (() => {
                            const typeInfo = FIELD_TYPES.flatMap((c) => c.items).find((t) => t.value === activeLibItem);
                            const isPreset = activeLibItem.startsWith('preset_');

                            if (isPreset) {
                                return (
                                    <div className="bg-primary border-primary-foreground/20 flex items-center gap-3 rounded-none border-2 px-6 py-4 font-sans text-[10px] font-semibold text-white uppercase backdrop-blur-md">
                                        <Plus size={16} strokeWidth={3} /> New {typeInfo?.label || activeLibItem.replace('_', ' ')}
                                    </div>
                                );
                            }

                            const dummyField: any = {
                                id: 'dummy-drag',
                                parent_id: null,
                                label: typeInfo?.defaultLabel || typeInfo?.label || `New ${activeLibItem}`,
                                name: `dummy_drag_field`,
                                type: activeLibItem,
                                placeholder: typeInfo?.defaultPlaceholder || '',
                                is_required: false,
                                width: '100',
                                options: {
                                    ...(activeLibItem === 'select' || activeLibItem === 'searchable_select' || activeLibItem === 'radio' ? { items: [{ label: 'Option 1', value: '1' }] } : {}),
                                    ...(typeInfo?.defaultOptions || {}),
                                },
                                order: 0,
                            };

                            return (
                                <div className="pointer-events-none opacity-90 w-[400px] shadow-2xl scale-95 origin-top-left">
                                    <FormElement
                                        field={dummyField}
                                        allFields={[]}
                                        value=""
                                        isBuilder={true}
                                    />
                                </div>
                            );
                        })()}

                        {/* Dragging an existing field */}
                        {activeFieldId && (() => {
                            const draggingField = data.fields.find(f => f.id === activeFieldId);
                            if (!draggingField) return null;
                            return (
                                <div className="pointer-events-none opacity-90 shadow-2xl scale-95 origin-top-left">
                                    <FormElement
                                        field={draggingField}
                                        allFields={data.fields}
                                        value=""
                                        isBuilder={true}
                                        isSelected={true}
                                    />
                                </div>
                            );
                        })()}
                    </DragOverlay>
                </DndContext>

                {/* Keyboard Shortcuts Helper Modal */}
                <ConfirmationModal
                    open={showShortcutsModal}
                    onClose={() => setShowShortcutsModal(false)}
                    onConfirm={() => setShowShortcutsModal(false)}
                    title="Keyboard Shortcuts"
                    description="Panduan tombol cepat untuk mempercepat pembuatan form."
                    confirmText="Tutup"
                    cancelText=""
                    variant="info"
                >
                    <div className="space-y-2 py-2 font-sans text-xs">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center justify-between border-b pb-1">
                                <span className="text-muted-foreground">Undo:</span>
                                <kbd className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px] font-bold">Ctrl + Z</kbd>
                            </div>
                            <div className="flex items-center justify-between border-b pb-1">
                                <span className="text-muted-foreground">Redo:</span>
                                <kbd className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px] font-bold">Ctrl + Y</kbd>
                            </div>
                            <div className="flex items-center justify-between border-b pb-1">
                                <span className="text-muted-foreground">Geser Ke Atas:</span>
                                <kbd className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px] font-bold">Arrow Up</kbd>
                            </div>
                            <div className="flex items-center justify-between border-b pb-1">
                                <span className="text-muted-foreground">Geser Ke Bawah:</span>
                                <kbd className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px] font-bold">Arrow Down</kbd>
                            </div>
                            <div className="flex items-center justify-between border-b pb-1">
                                <span className="text-muted-foreground">Hapus Elemen:</span>
                                <kbd className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px] font-bold">Delete / Backspace</kbd>
                            </div>
                            <div className="flex items-center justify-between border-b pb-1">
                                <span className="text-muted-foreground">Batalkan Pilihan:</span>
                                <kbd className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px] font-bold">Escape</kbd>
                            </div>
                        </div>
                    </div>
                </ConfirmationModal>

                {/* Git Commit History Modal */}
                <ConfirmationModal
                    open={showVersionModal}
                    onClose={() => setShowVersionModal(false)}
                    onConfirm={() => setShowVersionModal(false)}
                    title="Git Commit History"
                    description="Histori revisi versi draf berbasis Git commit log."
                    confirmText="Selesai"
                    cancelText=""
                    variant="info"
                    className="max-w-3xl"
                    icon={<GitBranch size={22} />}
                >
                    <div className="space-y-3 py-1 font-sans text-xs max-h-[420px] overflow-y-auto pr-1">
                        {/* New Commit Input Box */}
                        <div className="bg-slate-100/80 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60 p-2.5 rounded-xl space-y-2 text-left">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-[11px]">
                                    <GitCommit size={13} className="text-primary" /> Commit State Saat Ini
                                </span>
                                <div className="flex items-center gap-2">
                                    {commitLogs.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (confirm('Apakah Anda yakin ingin menghapus seluruh riwayat commit log (kecuali commit HEAD saat ini)?')) {
                                                    setCommitLogs((prev) => prev.slice(0, 1));
                                                }
                                            }}
                                            className="text-[10px] font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                                        >
                                            <Trash2 size={11} /> Hapus Riwayat
                                        </button>
                                    )}
                                    <span className="font-mono text-[10px] text-muted-foreground bg-slate-200/60 dark:bg-zinc-700 px-1.5 py-0.5 rounded">branch: main</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Tulis pesan commit (mis: Tambah input NIK & TTD)..."
                                    value={commitMessageInput}
                                    onChange={(e) => setCommitMessageInput(e.target.value)}
                                    className="flex-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (!commitMessageInput.trim()) return;
                                            const randomHash = Math.random().toString(36).substring(2, 9);
                                            setCommitLogs((prev) => [
                                                {
                                                    hash: randomHash,
                                                    message: commitMessageInput.trim(),
                                                    author: 'Wahyudi Ramadhan',
                                                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                                    fieldsCount: data.fields.length,
                                                    fields: [...data.fields],
                                                },
                                                ...prev,
                                            ]);
                                            setCommitMessageInput('');
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="primary"
                                    disabled={!commitMessageInput.trim()}
                                    onClick={() => {
                                        if (!commitMessageInput.trim()) return;
                                        const randomHash = Math.random().toString(36).substring(2, 9);
                                        setCommitLogs((prev) => [
                                            {
                                                hash: randomHash,
                                                message: commitMessageInput.trim(),
                                                author: 'Wahyudi Ramadhan',
                                                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                                fieldsCount: data.fields.length,
                                                fields: [...data.fields],
                                            },
                                            ...prev,
                                        ]);
                                        setCommitMessageInput('');
                                    }}
                                    className="h-7 text-[10px] px-3 font-semibold rounded-lg shrink-0"
                                >
                                    Commit
                                </Button>
                            </div>
                        </div>

                        {/* Compact Timeline List */}
                        <div className="relative border-l-2 border-slate-200 dark:border-zinc-800 ml-3 space-y-2 pt-1 pb-1 text-left">
                            {commitLogs.map((commit, idx) => (
                                <div key={commit.hash} className="relative pl-4">
                                    {/* Commit Dot */}
                                    <div
                                        className={cn(
                                            'absolute -left-[5px] top-2.5 h-2.5 w-2.5 rounded-full border-2 bg-white dark:bg-zinc-950',
                                            idx === 0
                                                ? 'border-emerald-500 bg-emerald-500 ring-2 ring-emerald-500/20'
                                                : 'border-slate-300 dark:border-zinc-700',
                                        )}
                                    />

                                    <div className="flex items-center justify-between border border-slate-200/80 dark:border-zinc-800 p-2.5 rounded-xl bg-white dark:bg-zinc-900/60 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors">
                                        <div className="space-y-1 min-w-0 pr-3 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-primary shrink-0">
                                                    {commit.hash}
                                                </span>
                                                {idx === 0 && (
                                                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider shrink-0">
                                                        HEAD
                                                    </span>
                                                )}
                                                <h4 className="font-semibold text-slate-900 dark:text-white text-xs leading-none truncate">
                                                    {commit.message}
                                                </h4>
                                            </div>

                                            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex items-center gap-1 font-medium"><User size={10} /> {commit.author}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1"><Clock size={10} /> {commit.timestamp}</span>
                                                    <span>•</span>
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{commit.fieldsCount} Elements</span>
                                                </div>

                                                {/* Compact Inline Change Badges */}
                                                <div className="hidden sm:flex items-center gap-1">
                                                    {commit.fields.slice(0, 3).map((f) => (
                                                        <span key={f.id} className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.2 rounded text-[9px] font-mono truncate max-w-[80px]">
                                                            {f.label || f.name}
                                                        </span>
                                                    ))}
                                                    {commit.fields.length > 3 && (
                                                        <span className="text-slate-400 text-[9px] italic">+{commit.fields.length - 3}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant={idx === 0 ? "ghost" : "outline"}
                                                disabled={idx === 0}
                                                onClick={() => {
                                                    const selectedCommit = commit;
                                                    const newHeadCommit = {
                                                        hash: Math.random().toString(36).substring(2, 9),
                                                        message: `Checkout to ${selectedCommit.hash}: ${selectedCommit.message}`,
                                                        author: 'Wahyudi Ramadhan',
                                                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                                        fieldsCount: selectedCommit.fields.length,
                                                        fields: [...selectedCommit.fields],
                                                    };
                                                    setData('fields', selectedCommit.fields);
                                                    setSelectedFieldIds([]);
                                                    setCommitLogs((prev) => [newHeadCommit, ...prev]);
                                                    setShowVersionModal(false);
                                                }}
                                                className="h-7 text-[10px] px-2.5 font-semibold rounded-lg"
                                            >
                                                <RotateCcw size={11} className="mr-1" /> Checkout
                                            </Button>

                                            {commitLogs.length > 1 && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setCommitLogs((prev) => prev.filter((c) => c.hash !== commit.hash));
                                                    }}
                                                    className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                                                    title="Hapus Commit Ini"
                                                >
                                                    <Trash2 size={12} />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </ConfirmationModal>

                {/* Save Form & Create Commit Note Modal */}
                <ConfirmationModal
                    open={showSaveCommitModal}
                    onClose={() => setShowSaveCommitModal(false)}
                    onConfirm={() => executeSaveCommit()}
                    title="Simpan Form & Commit Snapshot"
                    description="Tambahkan catatan perubahan untuk commit snapshot versi baru ini."
                    confirmText={processing ? 'Menyimpan...' : 'Simpan & Commit'}
                    cancelText="Batal"
                    variant="info"
                    className="max-w-md"
                    icon={<GitCommit size={22} />}
                >
                    <div className="space-y-3 py-2 text-left font-sans text-xs">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Catatan Perubahan (Commit Message):
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Contoh: Menambahkan field NIK, TTD, dan menyesuaikan margin halaman..."
                            value={saveCommitNote}
                            onChange={(e) => setSaveCommitNote(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:outline-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                    e.preventDefault();
                                    executeSaveCommit();
                                }
                            }}
                        />
                        <span className="text-[10px] text-muted-foreground block italic">
                            Tekan <kbd className="font-mono bg-muted px-1 py-0.5 rounded text-[9px]">Ctrl+Enter</kbd> atau klik Simpan & Commit untuk menyimpan.
                        </span>
                    </div>
                </ConfirmationModal>
            </form>
        </div>
    );
}

FormBuilder.layout = (page: React.ReactNode) => page;

export default FormBuilder;
