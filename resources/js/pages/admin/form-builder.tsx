import { InteractiveForm } from '@/components/form-renderer/InteractiveForm';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Head, Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertCircle,
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    ArrowLeft,
    ChevronDown,
    Columns,
    Download,
    Edit3,
    Eye,
    FileSignature,
    FileText,
    Grid,
    Heading1,
    Image as ImageIcon,
    Layout,
    List,
    Loader2,
    Move,
    Play,
    Plus,
    Save,
    Trash2,
    Type,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

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
        wClass: `w-[${pct}%]`,
    };
});

const FIELD_TYPES: any[] = [
    {
        category: 'Layout & Branding',
        color: 'bg-black',
        items: [
            {
                value: 'static_text',
                label: 'Teks / Judul',
                icon: Heading1,
                defaultLabel: 'KLIK UNTUK EDIT JUDUL',
                defaultOptions: { font_size: 14, font_weight: 'bold', font_family: "'Inter', sans-serif" },
            },
            {
                value: 'image',
                label: 'Gambar / Logo',
                icon: ImageIcon,
                defaultLabel: 'Logo',
                defaultOptions: { logo_size: 150, alignment: 'left', font_family: "'Inter', sans-serif" },
            },
            {
                value: 'group',
                label: 'Kotak Kontainer',
                icon: Layout,
                defaultLabel: '',
                defaultOptions: { border_style: 'solid', border_width: 1, padding_all: 10 },
            },
            {
                value: 'grid_x',
                label: 'Bagi Kolom (Horizontal)',
                icon: Columns,
                defaultLabel: 'GRID',
                defaultOptions: { grid_cols: 2, col_sizes: ['1fr', '1fr'] },
            },
        ],
    },
    {
        category: 'Form inputs',
        color: 'bg-black',
        items: [
            {
                value: 'labeled_value',
                label: 'Label & input (Key:Value)',
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
                label: 'input Teks (Satu Baris)',
                icon: Type,
                defaultLabel: 'input Teks',
                defaultPlaceholder: 'Masukkan teks...',
                defaultOptions: { field_style: 'dashed_bottom', font_size: 11, font_family: "'Inter', sans-serif" },
            },
            {
                value: 'textarea',
                label: 'input Teks (Multi Baris)',
                icon: FileText,
                defaultLabel: 'input Panjang',
                defaultPlaceholder: 'Masukkan teks detail...',
                defaultOptions: { field_style: 'solid', min_height: 80, font_size: 11, font_family: "'Inter', sans-serif" },
            },
            {
                value: 'searchable_select',
                label: 'Select V2 (Searchable)',
                icon: List,
                defaultLabel: 'Menu Pilihan',
                defaultPlaceholder: 'Pilih...',
                defaultOptions: { items: [], font_size: 11, font_family: "'Inter', sans-serif" },
            },
        ],
    },
    {
        category: 'Legal & Approval',
        color: 'bg-black    ',
        items: [
            {
                value: 'signature_box',
                label: 'Kotak Tanda Tangan',
                icon: FileSignature,
                defaultLabel: 'Diketahui oleh :',
                defaultPlaceholder: '[nama personil]',
                defaultOptions: { font_size: 11, font_weight: 'bold', font_family: "'Inter', sans-serif" },
            },
        ],
    },
];

function FormBuilder({ template }: Props) {
    const { data, setData, post, processing } = useForm<FormDataType>({
        name: template.name || '',
        description: template.description || '',
        has_letterhead: template.has_letterhead || false,
        letterhead_json: template.letterhead_json || {
            margins: { top: 15, bottom: 15, left: 15, right: 15 },
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
            let options = f.options || {};
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
            if (!options.font_family) options.font_family = "'Inter', sans-serif";
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
        onConfirm: () => {},
    });
    const closeDialog = () => setDialog((d) => ({ ...d, open: false }));
    const openDialog = (opts: Omit<typeof dialog, 'open'>) => setDialog({ ...opts, open: true });

    // --- ACTIONS & MOVEMENT ---
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

    const handleMoveSelected = (direction: 'up' | 'down') => {
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
    };

    // --- EFFECTS ---
    // Close context menu and handle keyboard shortcuts
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setContextMenu(null);
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
    }, [selectedFieldIds, handleMoveSelected]);

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
        const overId = over.id.toString();

        // Check if dropped into trash
        if (overId === 'trash-zone') {
            removeField(activeId);
            return;
        }

        // Check if dragging from library
        if (activeId.startsWith('lib-')) {
            const typeValue = activeId.replace('lib-', '');
            const typeInfo = (FIELD_TYPES.flatMap((c) => c.items) as any[]).find((t) => t.value === typeValue);

            const overField = (data?.fields || []).find((f) => f.id === overId);
            const parentId =
                overField && ['group', 'grid_view', 'grid_x', 'grid_y'].includes(overField.type) ? overField.id : overField?.parent_id || null;

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

        let newIndex = newFields.findIndex((f) => f.id === overId);
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
        const newFields = [...data.fields, newField];
        setData('fields', newFields);
        setSelectedFieldIds([newField.id]);
    };

    const addFieldAfter = (targetId: string, typeValue: string) => {
        const targetField = data.fields.find((f) => f.id === targetId);
        if (!targetField) return;

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
        const idMap = new Map<string, string>();

        const getDuplicateRecursive = (id: string, newParentId: string | null) => {
            const original = originalFields.find((f) => f.id === id);
            if (!original) return;

            const newId = Math.random().toString(36).substr(2, 9);
            idMap.set(id, newId);

            const duplicate: FormField = {
                ...JSON.parse(JSON.stringify(original)), // Deep copy
                id: newId,
                parent_id: newParentId,
                name: `${original.name}_copy`,
                order: original.order + 0.1,
            };
            fieldsToDuplicate.push(duplicate);

            // Find children
            const children = originalFields.filter((f) => f.parent_id === id);
            children.forEach((child) => getDuplicateRecursive(child.id, newId));
        };

        getDuplicateRecursive(targetId, originalFields.find((f) => f.id === targetId)?.parent_id || null);

        const newFields = [...originalFields, ...fieldsToDuplicate].sort((a, b) => a.order - b.order).map((f, i) => ({ ...f, order: i }));

        setData('fields', newFields);
        setSelectedFieldIds([fieldsToDuplicate[0].id]);
    };

    const removeField = (id: string) => {
        openDialog({
            title: 'Hapus Elemen',
            description: 'Yakin ingin menghapus elemen ini? Tindakan ini tidak dapat dibatalkan.',
            variant: 'danger',
            confirmText: 'Ya, Hapus',
            onConfirm: () => {
                const newFields = data.fields.filter((f) => f.id !== id && f.parent_id !== id);
                setData(
                    'fields',
                    newFields.map((f, i) => ({ ...f, order: i })),
                );
                if (selectedFieldId === id) setSelectedFieldIds([]);
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

    const updateField = (id: string, key: keyof FormField, value: any) => {
        const newFields = data.fields.map((f) => (f.id === id ? { ...f, [key]: value } : f));
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

    const selectedField = (data?.fields || []).find((f) => f.id === selectedFieldId);

    const renderFieldTree = (item: any) => {
        const isSelected = selectedFieldIds.includes(item.id);
        const Icon = FIELD_TYPES.flatMap((c) => c.items).find((t) => t.value === item.type)?.icon || FileText;

        return (
            <div key={item.id} className="animate-in fade-in slide-in-from-left-1 duration-300">
                <div
                    className={cn(
                        'group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] transition-all',
                        isSelected
                            ? 'bg-primary/10 text-primary ring-primary/20 ring-1'
                            : 'hover:bg-muted text-muted-foreground/80 hover:text-foreground',
                    )}
                    onClick={(e) => handleSelectField(item.id, e)}
                >
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center">
                        {item.children?.length > 0 ? (
                            <ChevronDown size={10} className="text-muted-foreground/40" />
                        ) : (
                            <div className="bg-muted-foreground/20 h-1 w-1 rounded-full" />
                        )}
                    </div>
                    <Icon size={12} className={cn('shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground/40')} />
                    <span className={cn('flex-1 truncate font-bold tracking-tight uppercase', isSelected && 'text-primary')}>
                        {item.label || item.type.replace('_', ' ')}
                    </span>
                    {isSelected && <div className="bg-primary h-1 w-1 rounded-full" />}
                </div>
                {item.children?.length > 0 && (
                    <div className="border-border/50 mt-0.5 ml-3.5 space-y-0.5 border-l pl-2">
                        {item.children.map((child: any) => renderFieldTree(child))}
                    </div>
                )}
            </div>
        );
    };

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

            const flatFields = flatten(parsed);
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
        <div className="font-inter bg-muted/10 text-foreground flex h-screen flex-col overflow-hidden">
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
                            <h1 className="text-foreground text-sm font-black tracking-tight uppercase">{data.name}</h1>
                            <div className="flex items-center gap-1.5 opacity-60">
                                <Layout size={10} className="text-primary" />
                                <span className="text-[9px] font-bold tracking-[0.2em] uppercase">Visual Multi-Block Designer</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {template.id && (
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="h-8 text-[10px] font-black tracking-wider uppercase transition-all hover:bg-green-50 hover:text-green-700 active:scale-95"
                            >
                                <a href={route('admin.form-templates.fill', template.id)} target="_blank" rel="noopener noreferrer">
                                    <Eye size={14} className="mr-1.5" /> Preview
                                </a>
                            </Button>
                        )}

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleTestDownload}
                            disabled={saving || !!pdfJobId}
                            className="h-8 text-[10px] font-black tracking-wider uppercase transition-all hover:bg-orange-50 hover:text-orange-700 active:scale-95"
                        >
                            {saving && !!pdfJobId ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Download size={14} className="mr-1.5" />}
                            {saving && !!pdfJobId ? 'Generating...' : 'Download'}
                        </Button>

                        <Button
                            type="submit"
                            size="sm"
                            className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90 h-8 text-[10px] font-black tracking-wider uppercase shadow-lg active:scale-95"
                            disabled={processing}
                        >
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
                                    <h2 className="text-muted-foreground/60 text-[10px] font-black tracking-[0.2em] uppercase">Workspace</h2>
                                    <div className="bg-primary/10 rounded-lg px-2 py-0.5">
                                        <span className="text-primary text-[8px] font-black uppercase">v2.0</span>
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
                                            <span className="hidden text-[10px] font-black tracking-tight uppercase sm:inline-block">
                                                {tab.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <ScrollArea className="flex-1">
                                <div className="overflow-hidden p-4">
                                    {leftPanelTab === 'library' && (
                                        <div className="animate-in fade-in slide-in-from-left-4 space-y-8 pb-12 duration-300">
                                            {FIELD_TYPES.map((cat: any) => (
                                                <div key={cat.category} className="space-y-4">
                                                    <h3 className="text-muted-foreground/30 flex items-center gap-2 text-[9px] font-black tracking-[0.3em] uppercase">
                                                        <div className={cn('h-1 w-3 rounded-full', cat.color)} />
                                                        {cat.category}
                                                    </h3>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {cat.items.map((type: any) => (
                                                            <LibDraggable
                                                                key={type.value}
                                                                type={type}
                                                                color={cat.color}
                                                                onClick={() => addField(type.value)}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {leftPanelTab === 'structure' && (
                                        <div className="animate-in fade-in slide-in-from-left-4 space-y-6 duration-300">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-muted-foreground/30 text-[9px] font-black tracking-[0.3em] uppercase">
                                                    Hierarchical View
                                                </h3>
                                                <span className="text-muted-foreground/20 text-[8px] font-bold uppercase">
                                                    {data.fields.length} Elements
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                {fieldTree.length === 0 ? (
                                                    <div className="border-muted flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-20 text-center">
                                                        <div className="bg-muted text-muted-foreground/20 mb-3 rounded-xl p-3">
                                                            <Layout size={20} />
                                                        </div>
                                                        <p className="text-muted-foreground/30 text-[10px] font-bold tracking-widest uppercase">
                                                            Canvas Kosong
                                                        </p>
                                                    </div>
                                                ) : (
                                                    fieldTree.map((f: any) => renderFieldTree(f))
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {leftPanelTab === 'json' && (
                                        <div className="animate-in fade-in slide-in-from-left-4 h-full space-y-4 duration-300">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-muted-foreground/30 text-[9px] font-black tracking-[0.3em] uppercase">
                                                    Source Code
                                                </h3>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-primary border-primary/20 hover:bg-primary/5 h-7 px-3 text-[9px] font-black uppercase active:scale-95"
                                                    onClick={() => {
                                                        try {
                                                            const newFields = JSON.parse(localJsonStr);
                                                            const flattened: any[] = [];
                                                            const flatten = (items: any[], pid: string | null = null) => {
                                                                items.forEach((item, index) => {
                                                                    const { children, ...f } = item;
                                                                    flattened.push({ ...f, parent_id: pid, order: index });
                                                                    if (children) flatten(children, f.id);
                                                                });
                                                            };
                                                            flatten(newFields);
                                                            setData('fields', flattened);
                                                            setJsonError(null);
                                                        } catch (e: any) {
                                                            setJsonError(e.message);
                                                        }
                                                    }}
                                                >
                                                    Apply Code
                                                </Button>
                                            </div>
                                            <div className="group/json relative">
                                                <textarea
                                                    value={localJsonStr}
                                                    onChange={(e) => setLocalJsonStr(e.target.value)}
                                                    className={cn(
                                                        'focus:ring-primary/20 min-h-[500px] w-full rounded-2xl border-none bg-slate-950 p-6 font-mono text-[10px] leading-relaxed text-blue-300/80 transition-all focus:ring-2',
                                                        jsonError && 'ring-destructive/50 text-destructive/80 ring-2',
                                                    )}
                                                    spellCheck={false}
                                                />
                                                <div className="text-muted-foreground/20 pointer-events-none absolute top-4 right-4 text-[8px] font-bold tracking-widest uppercase">
                                                    JSON
                                                </div>
                                            </div>
                                            {jsonError && (
                                                <div className="animate-in slide-in-from-bottom-2 bg-destructive/10 border-destructive/20 flex items-start gap-3 rounded-2xl border p-4 duration-300">
                                                    <AlertCircle size={14} className="text-destructive mt-0.5 shrink-0" />
                                                    <div className="space-y-1">
                                                        <p className="text-destructive text-[10px] font-black uppercase">Syntax Error</p>
                                                        <p className="text-destructive/70 font-mono text-[9px] leading-relaxed font-medium">
                                                            {jsonError}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
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
                        <section className="relative flex flex-1 flex-col overflow-hidden bg-slate-50/30">
                            {/* STICKY VIEW TABS - Fixed Height, Full Width */}
                            <div className="border-border bg-card/80 sticky top-0 z-30 flex h-[60px] w-full shrink-0 items-center justify-center border-b shadow-sm backdrop-blur-md">
                                <div className="bg-muted/30 ring-border/20 flex gap-1.5 rounded-2xl p-1.5 ring-1">
                                    {[
                                        { id: 'editor', label: 'Visual Editor', icon: Edit3, color: 'text-black', bg: 'bg-black' },
                                        { id: 'filling', label: 'Interactive Form', icon: Play, color: 'text-black', bg: 'bg-black' },
                                        { id: 'pdf', label: 'PDF Preview', icon: Eye, color: 'text-black', bg: 'bg-black' },
                                    ].map((mode) => (
                                        <button
                                            key={mode.id}
                                            type="button"
                                            onClick={() => setViewMode(mode.id as any)}
                                            className={cn(
                                                'flex items-center gap-2.5 rounded-xl px-5 py-2 transition-all duration-300',
                                                viewMode === mode.id
                                                    ? cn('bg-card ring-border/50 z-10 scale-105 shadow-lg ring-1', mode.color)
                                                    : 'text-muted-foreground/30 hover:text-foreground/60 hover:bg-muted/20',
                                            )}
                                        >
                                            <mode.icon size={14} strokeWidth={2.5} />
                                            <span className="text-[10px] font-black tracking-[0.1em] uppercase">{mode.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <ScrollArea className="flex-1 bg-slate-900/5">
                                <div
                                    className="flex min-h-full cursor-default items-start justify-center px-12 py-20"
                                    onClick={(e) => {
                                        if (e.target === e.currentTarget) {
                                            handleSelectField('', {} as any);
                                        }
                                    }}
                                >
                                    <div
                                        className={cn(
                                            'animate-in fade-in zoom-in-98 relative w-full max-w-[210mm] transition-all duration-500',
                                            viewMode === 'pdf' ? 'shadow-[0_0_50px_-12px_rgba(0,0,0,0.25)] ring-1 ring-slate-200' : '',
                                        )}
                                    >
                                        <InteractiveForm
                                            template={data as any}
                                            formData={previewData}
                                            onChange={updatePreviewData}
                                            selectedFieldIds={selectedFieldIds}
                                            onSelect={(id, e) => handleSelectField(id, e)}
                                            onMove={(id, dir) => moveField(id, dir)}
                                            onRemove={(id) => removeField(id)}
                                            onDuplicate={(id) => duplicateField(id)}
                                            isBuilder={viewMode === 'editor'}
                                            readOnly={viewMode === 'pdf'}
                                        />
                                    </div>
                                </div>
                            </ScrollArea>
                        </section>

                        {/* RIGHT: PROPERTY EDITOR */}
                        <aside
                            style={{ width: `${rightWidth}px` }}
                            className="border-border bg-card z-20 flex shrink-0 flex-col overflow-hidden border-l"
                        >
                            <div className="border-border bg-muted/20 flex items-center justify-between border-b px-4 py-3">
                                <h1 className="text-muted-foreground text-[10px] font-black tracking-[0.2em] uppercase">
                                    {selectedFieldId ? 'Block Properties' : 'Template Settings'}
                                </h1>
                                <Layout size={12} className="text-primary opacity-50" />
                            </div>

                            <ScrollArea className="flex-1">
                                <div className="p-5">
                                    {selectedField ? (
                                        <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
                                            {/* Header ID */}
                                            <div className="bg-muted/30 flex items-center justify-between rounded-lg p-3">
                                                <div>
                                                    <span className="text-muted-foreground block text-[8px] font-bold uppercase">Element ID</span>
                                                    <code className="text-primary text-[10px] font-black">{selectedField.name}</code>
                                                </div>
                                                <div className="bg-primary/20 text-primary flex h-6 w-6 items-center justify-center rounded-full">
                                                    <Edit3 size={12} />
                                                </div>
                                            </div>

                                            {/* MAIN PROPS */}
                                            <div className="space-y-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black tracking-widest uppercase">Internal Key</Label>
                                                    <Input
                                                        value={selectedField.name}
                                                        onChange={(e) => updateField(selectedField.id, 'name', e.target.value)}
                                                        className="h-9 font-mono text-[11px] font-bold"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black tracking-widest uppercase">Label Content</Label>
                                                    <Textarea
                                                        value={selectedField.label}
                                                        onChange={(e: any) => updateField(selectedField.id, 'label', e.target.value)}
                                                        className="min-h-[80px] text-[11px] leading-relaxed"
                                                    />
                                                </div>
                                            </div>

                                            {/* DYNAMIC OPTIONS */}
                                            <div className="border-border mt-8 border-t pt-6">
                                                <div className="mb-4 flex items-center gap-2">
                                                    <div className="bg-primary h-1 w-4 rounded-full" />
                                                    <h3 className="text-[10px] font-black tracking-[0.2em] uppercase">Visual Options</h3>
                                                </div>

                                                <div className="space-y-6">
                                                    {/* Common Styling: Spacing & Layout */}
                                                    <div className="border-border space-y-4 border-t pt-4">
                                                        <div className="flex items-center gap-2">
                                                            <Move size={12} className="text-muted-foreground" />
                                                            <h4 className="text-[9px] font-black tracking-widest uppercase">Spacing & Layout</h4>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-1.5">
                                                                <Label className="text-muted-foreground text-[8px] font-bold uppercase">
                                                                    Margin Top (px)
                                                                </Label>
                                                                <Input
                                                                    type="number"
                                                                    value={selectedField.options?.margin_top ?? 0}
                                                                    onChange={(e) =>
                                                                        updateField(selectedField.id, 'options', {
                                                                            ...selectedField.options,
                                                                            margin_top: parseInt(e.target.value) || 0,
                                                                        })
                                                                    }
                                                                    className="h-8 text-[11px] font-bold"
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <Label className="text-muted-foreground text-[8px] font-bold uppercase">
                                                                    Margin Bottom (px)
                                                                </Label>
                                                                <Input
                                                                    type="number"
                                                                    value={selectedField.options?.margin_bottom ?? 0}
                                                                    onChange={(e) =>
                                                                        updateField(selectedField.id, 'options', {
                                                                            ...selectedField.options,
                                                                            margin_bottom: parseInt(e.target.value) || 0,
                                                                        })
                                                                    }
                                                                    className="h-8 text-[11px] font-bold"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-1.5">
                                                                <Label className="text-muted-foreground text-[8px] font-bold uppercase">
                                                                    Margin Left (px)
                                                                </Label>
                                                                <Input
                                                                    type="number"
                                                                    value={selectedField.options?.margin_left ?? 0}
                                                                    onChange={(e) =>
                                                                        updateField(selectedField.id, 'options', {
                                                                            ...selectedField.options,
                                                                            margin_left: parseInt(e.target.value) || 0,
                                                                        })
                                                                    }
                                                                    className="h-8 text-[11px] font-bold"
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <Label className="text-muted-foreground text-[8px] font-bold uppercase">
                                                                    Margin Right (px)
                                                                </Label>
                                                                <Input
                                                                    type="number"
                                                                    value={selectedField.options?.margin_right ?? 0}
                                                                    onChange={(e) =>
                                                                        updateField(selectedField.id, 'options', {
                                                                            ...selectedField.options,
                                                                            margin_right: parseInt(e.target.value) || 0,
                                                                        })
                                                                    }
                                                                    className="h-8 text-[11px] font-bold"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-1.5">
                                                                <Label className="text-muted-foreground group-hover:text-primary text-[8px] font-bold uppercase transition-colors">
                                                                    Spacing Before (px)
                                                                </Label>
                                                                <Input
                                                                    type="number"
                                                                    value={selectedField.options?.spacing_before ?? 0}
                                                                    onChange={(e) =>
                                                                        updateField(selectedField.id, 'options', {
                                                                            ...selectedField.options,
                                                                            spacing_before: parseInt(e.target.value) || 0,
                                                                        })
                                                                    }
                                                                    className="focus:ring-primary/20 h-8 text-[11px] font-bold"
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <Label className="text-muted-foreground group-hover:text-primary text-[8px] font-bold uppercase transition-colors">
                                                                    Spacing After (px)
                                                                </Label>
                                                                <Input
                                                                    type="number"
                                                                    value={selectedField.options?.spacing_after ?? 0}
                                                                    onChange={(e) =>
                                                                        updateField(selectedField.id, 'options', {
                                                                            ...selectedField.options,
                                                                            spacing_after: parseInt(e.target.value) || 0,
                                                                        })
                                                                    }
                                                                    className="focus:ring-primary/20 h-8 text-[11px] font-bold"
                                                                />
                                                            </div>
                                                        </div>

                                                        {['static_text', 'labeled_value'].includes(selectedField.type) && (
                                                            <div className="space-y-1.5">
                                                                <Label className="text-muted-foreground text-[8px] font-bold uppercase">
                                                                    First Line Indent (px)
                                                                </Label>
                                                                <Input
                                                                    type="number"
                                                                    value={selectedField.options?.first_line_indent ?? 0}
                                                                    onChange={(e) =>
                                                                        updateField(selectedField.id, 'options', {
                                                                            ...selectedField.options,
                                                                            first_line_indent: parseInt(e.target.value) || 0,
                                                                        })
                                                                    }
                                                                    className="h-8 text-[11px] font-bold"
                                                                />
                                                            </div>
                                                        )}

                                                        <div className="space-y-1.5">
                                                            <Label className="text-[9px] font-black tracking-widest uppercase">Block Width</Label>
                                                            <div className="flex flex-wrap gap-1">
                                                                {['20', '25', '35', '50', '65', '75', '100'].map((w) => (
                                                                    <Button
                                                                        key={w}
                                                                        type="button"
                                                                        variant={selectedField.width === w ? 'default' : 'outline'}
                                                                        className="h-7 px-2 text-[8px] font-black uppercase"
                                                                        onClick={() => updateField(selectedField.id, 'width', w)}
                                                                    >
                                                                        {w}%
                                                                    </Button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Typography (Expanded support for text-carrying elements) */}
                                                    {['static_text', 'labeled_value', 'textfield', 'number', 'date', 'signature_box'].includes(
                                                        selectedField.type,
                                                    ) && (
                                                        <div className="border-border space-y-4 border-t pt-4">
                                                            <div className="flex items-center gap-2">
                                                                <Type size={12} className="text-muted-foreground" />
                                                                <h4 className="text-[9px] font-black tracking-widest uppercase">Typography</h4>
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <Label className="text-muted-foreground text-[8px] font-bold uppercase">
                                                                    Font Family
                                                                </Label>
                                                                <select
                                                                    value={selectedField.options?.font_family || 'sans-serif'}
                                                                    onChange={(e) =>
                                                                        updateField(selectedField.id, 'options', {
                                                                            ...selectedField.options,
                                                                            font_family: e.target.value,
                                                                        })
                                                                    }
                                                                    className="border-input bg-background focus-visible:ring-ring h-8 w-full rounded-md border px-2 py-1 text-[10px] font-bold shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                                                                >
                                                                    <option value="sans-serif">Modern (Sans)</option>
                                                                    <option value="serif">Formal (Serif)</option>
                                                                    <option value="monospace">Technical (Mono)</option>
                                                                    <option value="'Inter', sans-serif">Inter</option>
                                                                    <option value="'Roboto', sans-serif">Roboto</option>
                                                                </select>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-muted-foreground text-[8px] font-bold uppercase">
                                                                        Font Size (px)
                                                                    </Label>
                                                                    <Input
                                                                        type="number"
                                                                        value={selectedField.options?.font_size ?? 14}
                                                                        onChange={(e) =>
                                                                            updateField(selectedField.id, 'options', {
                                                                                ...selectedField.options,
                                                                                font_size: parseInt(e.target.value) || 14,
                                                                            })
                                                                        }
                                                                        className="h-8 text-[11px] font-bold"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-muted-foreground text-[8px] font-bold uppercase">
                                                                        Weight (Selection / Value)
                                                                    </Label>
                                                                    <div className="flex gap-1">
                                                                        {[
                                                                            { l: 'N', v: 'normal' },
                                                                            { l: 'B', v: 'bold' },
                                                                            { l: 'BL', v: '900' },
                                                                        ].map((w) => (
                                                                            <Button
                                                                                key={w.v}
                                                                                type="button"
                                                                                variant={
                                                                                    (selectedField.options?.font_weight || 'normal') === w.v
                                                                                        ? 'default'
                                                                                        : 'outline'
                                                                                }
                                                                                className="h-8 w-8 text-[10px] font-black"
                                                                                onClick={() =>
                                                                                    updateField(selectedField.id, 'options', {
                                                                                        ...selectedField.options,
                                                                                        font_weight: w.v,
                                                                                    })
                                                                                }
                                                                            >
                                                                                {w.l}
                                                                            </Button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {selectedField.type === 'labeled_value' && (
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-muted-foreground text-[8px] font-bold uppercase">
                                                                        Label Weight
                                                                    </Label>
                                                                    <div className="flex gap-1">
                                                                        {[
                                                                            { l: 'N', v: 'normal' },
                                                                            { l: 'B', v: 'bold' },
                                                                            { l: 'BL', v: '900' },
                                                                        ].map((w) => (
                                                                            <Button
                                                                                key={w.v}
                                                                                type="button"
                                                                                variant={
                                                                                    (selectedField.options?.font_weight_label || 'bold') === w.v
                                                                                        ? 'default'
                                                                                        : 'outline'
                                                                                }
                                                                                className="h-8 w-8 text-[10px] font-black"
                                                                                onClick={() =>
                                                                                    updateField(selectedField.id, 'options', {
                                                                                        ...selectedField.options,
                                                                                        font_weight_label: w.v,
                                                                                    })
                                                                                }
                                                                            >
                                                                                {w.l}
                                                                            </Button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className="space-y-1.5">
                                                                <Label className="text-muted-foreground text-[8px] font-bold uppercase">
                                                                    Text Alignment
                                                                </Label>
                                                                <div className="grid grid-cols-4 gap-1">
                                                                    {[
                                                                        { label: 'Left', value: 'left', icon: AlignLeft },
                                                                        { label: 'Center', value: 'center', icon: AlignCenter },
                                                                        { label: 'Right', value: 'right', icon: AlignRight },
                                                                        { label: 'Justify', value: 'justify', icon: List },
                                                                    ].map((a) => (
                                                                        <Button
                                                                            key={a.value}
                                                                            type="button"
                                                                            variant={
                                                                                (selectedField.options?.text_align ||
                                                                                    selectedField.options?.alignment ||
                                                                                    'left') === a.value
                                                                                    ? 'default'
                                                                                    : 'outline'
                                                                            }
                                                                            className="h-8 gap-1.5 p-0 text-[7px] font-black uppercase"
                                                                            onClick={() =>
                                                                                updateField(selectedField.id, 'options', {
                                                                                    ...selectedField.options,
                                                                                    text_align: a.value,
                                                                                    alignment: a.value, // Keep legacy for compat
                                                                                })
                                                                            }
                                                                        >
                                                                            <a.icon size={10} />
                                                                            {a.label}
                                                                        </Button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-between gap-4">
                                                                <Label className="text-[9px] font-black tracking-widest uppercase">Styling</Label>
                                                                <div className="flex flex-wrap gap-1">
                                                                    <Button
                                                                        type="button"
                                                                        variant={
                                                                            selectedField.options?.font_style === 'italic' ? 'default' : 'outline'
                                                                        }
                                                                        className="h-8 px-2 text-[8px] font-black uppercase italic"
                                                                        onClick={() =>
                                                                            updateField(selectedField.id, 'options', {
                                                                                ...selectedField.options,
                                                                                font_style:
                                                                                    selectedField.options?.font_style === 'italic'
                                                                                        ? 'normal'
                                                                                        : 'italic',
                                                                            })
                                                                        }
                                                                    >
                                                                        Italic
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant={
                                                                            selectedField.options?.text_decoration === 'underline'
                                                                                ? 'default'
                                                                                : 'outline'
                                                                        }
                                                                        className="h-8 px-2 text-[8px] font-black uppercase underline underline-offset-2"
                                                                        onClick={() =>
                                                                            updateField(selectedField.id, 'options', {
                                                                                ...selectedField.options,
                                                                                text_decoration:
                                                                                    selectedField.options?.text_decoration === 'underline'
                                                                                        ? 'none'
                                                                                        : 'underline',
                                                                            })
                                                                        }
                                                                    >
                                                                        Underline
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant={
                                                                            selectedField.options?.text_transform === 'uppercase'
                                                                                ? 'default'
                                                                                : 'outline'
                                                                        }
                                                                        className="h-8 px-2 text-[8px] font-black uppercase"
                                                                        onClick={() =>
                                                                            updateField(selectedField.id, 'options', {
                                                                                ...selectedField.options,
                                                                                text_transform:
                                                                                    selectedField.options?.text_transform === 'uppercase'
                                                                                        ? 'none'
                                                                                        : 'uppercase',
                                                                            })
                                                                        }
                                                                    >
                                                                        Caps
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* List & Numbering (Legal Support) */}
                                                    {['static_text'].includes(selectedField.type) && (
                                                        <div className="border-border space-y-4 border-t pt-4">
                                                            <div className="flex items-center gap-2">
                                                                <List size={12} className="text-muted-foreground" />
                                                                <h4 className="text-[9px] font-black tracking-widest text-emerald-600 uppercase">
                                                                    List & Numbering
                                                                </h4>
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <Label className="text-muted-foreground text-[8px] font-bold uppercase">
                                                                    List Type
                                                                </Label>
                                                                <div className="flex gap-1">
                                                                    {[
                                                                        { l: 'None', v: 'none' },
                                                                        { l: 'Number', v: 'number' },
                                                                        { l: 'Bullet', v: 'bullet' },
                                                                        { l: 'Legal', v: 'legal' },
                                                                    ].map((t) => (
                                                                        <Button
                                                                            key={t.v}
                                                                            type="button"
                                                                            variant={
                                                                                (selectedField.options?.list_type || 'none') === t.v
                                                                                    ? 'default'
                                                                                    : 'outline'
                                                                            }
                                                                            className="h-7 flex-1 text-[8px] font-black uppercase"
                                                                            onClick={() =>
                                                                                updateField(selectedField.id, 'options', {
                                                                                    ...selectedField.options,
                                                                                    list_type: t.v,
                                                                                    number_format:
                                                                                        t.v === 'legal'
                                                                                            ? 'Pasal {n}'
                                                                                            : t.v === 'number'
                                                                                              ? '{n}.'
                                                                                              : '',
                                                                                })
                                                                            }
                                                                        >
                                                                            {t.l}
                                                                        </Button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {(selectedField.options?.list_type === 'number' ||
                                                                selectedField.options?.list_type === 'legal') && (
                                                                <div className="animate-in slide-in-from-top-1 space-y-1.5">
                                                                    <Label className="text-muted-foreground text-[8px] font-bold uppercase">
                                                                        Format (use {'{n}'})
                                                                    </Label>
                                                                    <Input
                                                                        value={selectedField.options?.number_format || ''}
                                                                        onChange={(e) =>
                                                                            updateField(selectedField.id, 'options', {
                                                                                ...selectedField.options,
                                                                                number_format: e.target.value,
                                                                            })
                                                                        }
                                                                        className="h-8 text-[11px] font-bold"
                                                                        placeholder="e.g. Pasal {n}"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Borders (Container Support) */}
                                                    {['group', 'grid_x', 'grid_y', 'static_text'].includes(selectedField.type) && (
                                                        <div className="border-border space-y-4 border-t pt-4">
                                                            <div className="flex items-center gap-2">
                                                                <Grid size={12} className="text-muted-foreground" />
                                                                <h4 className="text-[9px] font-black tracking-widest uppercase">Borders</h4>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-muted-foreground text-[8px] font-bold uppercase">
                                                                        Style
                                                                    </Label>
                                                                    <select
                                                                        value={selectedField.options?.border_style || 'none'}
                                                                        onChange={(e) =>
                                                                            updateField(selectedField.id, 'options', {
                                                                                ...selectedField.options,
                                                                                border_style: e.target.value,
                                                                            })
                                                                        }
                                                                        className="border-input bg-background focus-visible:ring-ring h-8 w-full rounded-md border px-2 py-1 text-[10px] font-bold shadow-sm"
                                                                    >
                                                                        <option value="none">None</option>
                                                                        <option value="solid">Solid</option>
                                                                        <option value="dashed">Dashed</option>
                                                                        <option value="dotted">Dotted</option>
                                                                    </select>
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-muted-foreground text-[8px] font-bold uppercase">
                                                                        Width (px)
                                                                    </Label>
                                                                    <Input
                                                                        type="number"
                                                                        disabled={selectedField.options?.border_style === 'none'}
                                                                        value={selectedField.options?.border_width ?? 1}
                                                                        onChange={(e) =>
                                                                            updateField(selectedField.id, 'options', {
                                                                                ...selectedField.options,
                                                                                border_width: parseInt(e.target.value) || 0,
                                                                            })
                                                                        }
                                                                        className="h-8 text-[11px] font-bold"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {selectedField.type === 'labeled_value' && (
                                                        <div className="border-primary/20 bg-primary/5 space-y-4 rounded-xl border p-4">
                                                            <div className="space-y-1.5">
                                                                <Label className="text-primary text-[9px] font-black tracking-wider uppercase">
                                                                    Value Type
                                                                </Label>
                                                                <div className="grid grid-cols-3 gap-1">
                                                                    {[
                                                                        { label: 'Text', value: 'textfield' },
                                                                        { label: 'Long Text', value: 'textarea' },
                                                                        { label: 'Number', value: 'number' },
                                                                        { label: 'Date', value: 'date' },
                                                                        { label: 'Select', value: 'select' },
                                                                        { label: 'Select V2', value: 'searchable_select' },
                                                                    ].map((t) => (
                                                                        <Button
                                                                            key={t.value}
                                                                            type="button"
                                                                            variant={
                                                                                (selectedField.options?.value_type || 'textfield') === t.value
                                                                                    ? 'default'
                                                                                    : 'outline'
                                                                            }
                                                                            className="h-6 px-1 text-[8px] font-black uppercase"
                                                                            onClick={() =>
                                                                                updateField(selectedField.id, 'options', {
                                                                                    ...selectedField.options,
                                                                                    value_type: t.value,
                                                                                })
                                                                            }
                                                                        >
                                                                            {t.label}
                                                                        </Button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <Label className="text-[9px] font-black tracking-wider uppercase">
                                                                    Label Width (px)
                                                                </Label>
                                                                <Input
                                                                    type="number"
                                                                    value={selectedField.options?.label_width?.replace('px', '') || '180'}
                                                                    onChange={(e) =>
                                                                        updateField(selectedField.id, 'options', {
                                                                            ...selectedField.options,
                                                                            label_width: `${e.target.value}px`,
                                                                        })
                                                                    }
                                                                    className="h-8 text-[11px] font-bold"
                                                                />
                                                            </div>
                                                            <div className="border-primary/10 space-y-1.5 border-t pt-2">
                                                                <Label className="text-primary text-[9px] font-black tracking-wider uppercase">
                                                                    input Field Style
                                                                </Label>
                                                                <div className="grid grid-cols-2 gap-1">
                                                                    {[
                                                                        { label: 'Box Style', value: 'box' },
                                                                        { label: 'Dashed Underline', value: 'dashed_bottom' },
                                                                    ].map((s) => (
                                                                        <Button
                                                                            key={s.value}
                                                                            type="button"
                                                                            variant={
                                                                                (selectedField.options?.field_style || 'box') === s.value
                                                                                    ? 'default'
                                                                                    : 'outline'
                                                                            }
                                                                            className="h-7 px-1 text-[8px] font-black uppercase"
                                                                            onClick={() =>
                                                                                updateField(selectedField.id, 'options', {
                                                                                    ...selectedField.options,
                                                                                    field_style: s.value,
                                                                                })
                                                                            }
                                                                        >
                                                                            {s.label}
                                                                        </Button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {['select', 'searchable_select'].includes(selectedField.options?.value_type) && (
                                                                <div className="border-primary/10 space-y-4 border-t pt-4">
                                                                    <div className="flex items-center justify-between">
                                                                        <Label className="text-primary text-[9px] font-black tracking-wider uppercase">
                                                                            Dropdown Options
                                                                        </Label>
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            className="ring-primary/20 h-6 gap-1 px-1.5 text-[8px] font-black uppercase ring-1"
                                                                            onClick={() => {
                                                                                const currentItems = selectedField.options?.items || [];
                                                                                updateField(selectedField.id, 'options', {
                                                                                    ...selectedField.options,
                                                                                    items: [
                                                                                        ...currentItems,
                                                                                        {
                                                                                            label: `Option ${currentItems.length + 1}`,
                                                                                            value: `val_${currentItems.length + 1}`,
                                                                                        },
                                                                                    ],
                                                                                });
                                                                            }}
                                                                        >
                                                                            <Plus size={10} /> Add Item
                                                                        </Button>
                                                                    </div>
                                                                    <div className="scrollbar-thin max-h-[200px] space-y-2 overflow-y-auto pr-1">
                                                                        {(selectedField.options?.items || []).map((item: any, idx: number) => (
                                                                            <div
                                                                                key={idx}
                                                                                className="border-primary/5 group/opt flex items-center gap-1 rounded-lg border bg-white/50 p-1.5"
                                                                            >
                                                                                <div className="flex-1 space-y-0">
                                                                                    <input
                                                                                        value={item.label}
                                                                                        onChange={(e) => {
                                                                                            const newItems = [...selectedField.options.items];
                                                                                            newItems[idx] = {
                                                                                                ...newItems[idx],
                                                                                                label: e.target.value,
                                                                                            };
                                                                                            updateField(selectedField.id, 'options', {
                                                                                                ...selectedField.options,
                                                                                                items: newItems,
                                                                                            });
                                                                                        }}
                                                                                        className="block h-5 w-full border-none bg-transparent px-1 text-[8px] font-semibold outline-none placeholder:opacity-50 focus:ring-0"
                                                                                        placeholder="Label (User sees)"
                                                                                    />
                                                                                    <input
                                                                                        value={item.value}
                                                                                        onChange={(e) => {
                                                                                            const newItems = [...selectedField.options.items];
                                                                                            newItems[idx] = {
                                                                                                ...newItems[idx],
                                                                                                value: e.target.value,
                                                                                            };
                                                                                            updateField(selectedField.id, 'options', {
                                                                                                ...selectedField.options,
                                                                                                items: newItems,
                                                                                            });
                                                                                        }}
                                                                                        className="block h-4 w-full border-none bg-transparent px-1 font-mono text-[7px] text-slate-400 outline-none placeholder:opacity-40 focus:ring-0"
                                                                                        placeholder="Value (Saved to DB)"
                                                                                    />
                                                                                </div>
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    className="h-7 w-7 p-0 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
                                                                                    onClick={() => {
                                                                                        const newItems = selectedField.options.items.filter(
                                                                                            (_: any, i: number) => i !== idx,
                                                                                        );
                                                                                        updateField(selectedField.id, 'options', {
                                                                                            ...selectedField.options,
                                                                                            items: newItems,
                                                                                        });
                                                                                    }}
                                                                                >
                                                                                    <Trash2 size={10} />
                                                                                </Button>
                                                                            </div>
                                                                        ))}
                                                                        {(selectedField.options?.items || []).length === 0 && (
                                                                            <div className="rounded-lg border-2 border-dashed border-slate-100 py-4 text-center">
                                                                                <p className="text-[8px] font-bold tracking-tight text-slate-300 uppercase">
                                                                                    No options defined
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {selectedField.type === 'grid_x' && (
                                                        <div className="space-y-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
                                                            <div className="space-y-1.5">
                                                                <Label className="text-[9px] font-black tracking-widest uppercase">
                                                                    Grid Columns
                                                                </Label>
                                                                <div className="flex gap-1">
                                                                    {[1, 2, 3, 4, 5, 6].map((n) => (
                                                                        <Button
                                                                            key={n}
                                                                            type="button"
                                                                            variant={
                                                                                (selectedField.options?.grid_cols || 1) === n ? 'default' : 'outline'
                                                                            }
                                                                            className="h-8 w-8 text-[10px] font-black"
                                                                            onClick={() =>
                                                                                updateField(selectedField.id, 'options', {
                                                                                    ...selectedField.options,
                                                                                    grid_cols: n,
                                                                                })
                                                                            }
                                                                        >
                                                                            {n}
                                                                        </Button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <Label className="text-[9px] font-black tracking-widest uppercase">
                                                                    Column Proportions (e.g. 1fr, 25%)
                                                                </Label>
                                                                <Input
                                                                    value={(selectedField.options?.col_sizes || []).join(' ')}
                                                                    onChange={(e) =>
                                                                        updateField(selectedField.id, 'options', {
                                                                            ...selectedField.options,
                                                                            col_sizes: e.target.value.split(' '),
                                                                        })
                                                                    }
                                                                    placeholder="e.g. 1fr 2fr"
                                                                    className="h-8 font-mono text-[10px]"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {['group', 'grid_x', 'grid_y'].includes(selectedField.type) && (
                                                        <div className="border-border space-y-4 border-t pt-4">
                                                            <div className="flex items-center gap-2">
                                                                <AlignJustify size={12} className="text-muted-foreground" />
                                                                <h4 className="text-[9px] font-black tracking-widest text-indigo-600 uppercase">
                                                                    Alignment & Distribution
                                                                </h4>
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <Label className="text-muted-foreground text-[8px] font-bold uppercase">
                                                                    Justify Content (Space)
                                                                </Label>
                                                                <div className="grid grid-cols-3 gap-1">
                                                                    {[
                                                                        { l: 'Start', v: 'flex-start' },
                                                                        { l: 'Center', v: 'center' },
                                                                        { l: 'End', v: 'flex-end' },
                                                                        { l: 'Between', v: 'space-between' },
                                                                        { l: 'Around', v: 'space-around' },
                                                                        { l: 'Evenly', v: 'space-evenly' },
                                                                    ].map((t) => (
                                                                        <Button
                                                                            key={t.v}
                                                                            type="button"
                                                                            variant={
                                                                                (selectedField.options?.justify_content || 'flex-start') === t.v
                                                                                    ? 'default'
                                                                                    : 'outline'
                                                                            }
                                                                            className="h-7 text-[7px] font-black uppercase"
                                                                            onClick={() =>
                                                                                updateField(selectedField.id, 'options', {
                                                                                    ...selectedField.options,
                                                                                    justify_content: t.v,
                                                                                })
                                                                            }
                                                                        >
                                                                            {t.l}
                                                                        </Button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <Label className="text-muted-foreground text-[8px] font-bold uppercase">
                                                                    Align Items
                                                                </Label>
                                                                <div className="grid grid-cols-2 gap-1">
                                                                    {[
                                                                        { l: 'Start', v: 'flex-start' },
                                                                        { l: 'Center', v: 'center' },
                                                                        { l: 'End', v: 'flex-end' },
                                                                        { l: 'Stretch', v: 'stretch' },
                                                                    ].map((t) => (
                                                                        <Button
                                                                            key={t.v}
                                                                            type="button"
                                                                            variant={
                                                                                (selectedField.options?.align_items || 'flex-start') === t.v
                                                                                    ? 'default'
                                                                                    : 'outline'
                                                                            }
                                                                            className="h-7 text-[7px] font-black uppercase"
                                                                            onClick={() =>
                                                                                updateField(selectedField.id, 'options', {
                                                                                    ...selectedField.options,
                                                                                    align_items: t.v,
                                                                                })
                                                                            }
                                                                        >
                                                                            {t.l}
                                                                        </Button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {selectedField.type === 'image' && (
                                                        <div className="space-y-4">
                                                            <div className="space-y-1.5">
                                                                <Label className="text-[9px] font-black uppercase">Image URL</Label>
                                                                <Input
                                                                    value={selectedField.options?.url || ''}
                                                                    onChange={(e) =>
                                                                        updateField(selectedField.id, 'options', {
                                                                            ...selectedField.options,
                                                                            url: e.target.value,
                                                                        })
                                                                    }
                                                                    className="h-8 text-[10px]"
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <Label className="text-[9px] font-black uppercase">Size (px)</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={selectedField.options?.size || 120}
                                                                    onChange={(e) =>
                                                                        updateField(selectedField.id, 'options', {
                                                                            ...selectedField.options,
                                                                            size: parseInt(e.target.value) || 0,
                                                                        })
                                                                    }
                                                                    className="h-8 text-[10px]"
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <Label className="text-[9px] font-black uppercase">Horizontal Alignment</Label>
                                                                <div className="grid grid-cols-3 gap-1">
                                                                    {['left', 'center', 'right'].map((a) => (
                                                                        <Button
                                                                            key={a}
                                                                            type="button"
                                                                            variant={
                                                                                (selectedField.options?.alignment || 'left') === a
                                                                                    ? 'default'
                                                                                    : 'outline'
                                                                            }
                                                                            className="h-7 text-[8px] font-black uppercase"
                                                                            onClick={() =>
                                                                                updateField(selectedField.id, 'options', {
                                                                                    ...selectedField.options,
                                                                                    alignment: a,
                                                                                })
                                                                            }
                                                                        >
                                                                            {a}
                                                                        </Button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <Label className="text-[9px] font-black uppercase">Vertical Alignment</Label>
                                                                <div className="grid grid-cols-3 gap-1">
                                                                    {[
                                                                        { l: 'Top', v: 'top' },
                                                                        { l: 'Middle', v: 'middle' },
                                                                        { l: 'Bottom', v: 'bottom' },
                                                                    ].map((a) => (
                                                                        <Button
                                                                            key={a.v}
                                                                            type="button"
                                                                            variant={
                                                                                (selectedField.options?.v_alignment || 'top') === a.v
                                                                                    ? 'default'
                                                                                    : 'outline'
                                                                            }
                                                                            className="h-7 text-[8px] font-black uppercase"
                                                                            onClick={() =>
                                                                                updateField(selectedField.id, 'options', {
                                                                                    ...selectedField.options,
                                                                                    v_alignment: a.v,
                                                                                })
                                                                            }
                                                                        >
                                                                            {a.l}
                                                                        </Button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <Button
                                                    variant="ghost"
                                                    className="text-destructive hover:bg-destructive/10 w-full text-[9px] font-black uppercase"
                                                    onClick={() => removeField(selectedField.id)}
                                                >
                                                    <Trash2 size={12} className="mr-1.5" /> Remove Element
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                                            <div className="mb-6 flex w-full flex-col items-center border-b border-slate-100 pb-6">
                                                <div className="bg-primary/10 text-primary mb-3 flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm">
                                                    <Layout size={20} />
                                                </div>
                                                <h3 className="text-[11px] font-black tracking-widest text-slate-800 uppercase">Document Settings</h3>
                                                <p className="mt-1 text-[9px] font-bold text-slate-400 uppercase">Global configuration</p>
                                            </div>

                                            <div className="w-full space-y-6 text-left">
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black tracking-wider text-slate-600 uppercase">
                                                        Margins (mm)
                                                    </Label>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {['top', 'bottom', 'left', 'right'].map((m) => (
                                                            <div key={m} className="space-y-1">
                                                                <Label className="text-[8px] font-bold text-slate-400 uppercase">{m}</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={data.letterhead_json?.margins?.[m] ?? 15}
                                                                    onChange={(e) => {
                                                                        const newMargins = {
                                                                            ...(data.letterhead_json?.margins || {
                                                                                top: 15,
                                                                                bottom: 15,
                                                                                left: 15,
                                                                                right: 15,
                                                                            }),
                                                                            [m]: parseInt(e.target.value) || 0,
                                                                        };
                                                                        setData('letterhead_json', { ...data.letterhead_json, margins: newMargins });
                                                                    }}
                                                                    className="h-8 text-[11px] font-bold"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}{' '}
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
                            <div className="bg-primary border-primary-foreground/20 flex items-center gap-3 rounded-2xl border-2 px-6 py-4 text-[10px] font-black text-white uppercase shadow-2xl backdrop-blur-md">
                                <Plus size={16} strokeWidth={3} /> New {activeLibItem.replace('_', ' ')}
                            </div>
                        )}
                    </DragOverlay>
                </DndContext>
            </form>
        </div>
    );
}

// --- HELPER COMPONENTS ---

const ContextMenuItem = ({
    icon: Icon,
    label,
    onClick,
    variant = 'default',
}: {
    icon: any;
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive';
}) => (
    <button
        onClick={(e) => {
            e.stopPropagation();
            onClick();
        }}
        className={cn(
            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[10px] font-black uppercase transition-colors',
            variant === 'destructive' ? 'text-red-500 hover:bg-red-50' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
    >
        <Icon size={12} />
        {label}
    </button>
);

const LibDraggable = ({ type, color, onClick }: { type: any; color: string; onClick: () => void }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `lib-${type.value}`,
        data: { type: type.value, isLibItem: true },
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            onClick={onClick}
            className={cn(
                'group border-border bg-card hover:border-primary/50 relative flex cursor-grab items-center gap-3 rounded-xl border p-3 transition-all hover:shadow-lg active:scale-95 active:cursor-grabbing',
                isDragging && 'opacity-50 grayscale',
            )}
        >
            <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm ring-1 ring-black/5', color)}>
                {type.icon && <type.icon size={14} className="text-white" strokeWidth={3} />}
            </div>
            <div className="flex flex-col">
                <span className="text-foreground text-[10px] font-black tracking-tight uppercase">{type.label}</span>
                <span className="text-muted-foreground/60 text-[8px] font-bold uppercase">{type.value.replace('_', ' ')}</span>
            </div>
            <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Plus size={10} className="text-primary" />
            </div>
        </div>
    );
};

const TrashZone = () => {
    const { setNodeRef, isOver } = useDroppable({ id: 'trash-zone' });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'fixed bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-2xl border-2 border-dashed px-8 py-4 transition-all duration-300',
                isOver
                    ? 'border-destructive bg-destructive/10 text-destructive shadow-destructive/20 scale-110 shadow-2xl'
                    : 'border-border bg-card text-muted-foreground translate-y-20 opacity-0',
            )}
        >
            <Trash2 size={24} className={cn(isOver && 'animate-bounce')} />
            <div>
                <p className="text-[10px] font-black tracking-[0.2em] uppercase">Lepas untuk menghapus</p>
                <p className="text-[8px] font-bold uppercase opacity-60">Elemen akan dihapus permanen</p>
            </div>
        </div>
    );
};

FormBuilder.layout = (page: React.ReactNode) => page;

export default FormBuilder;
