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
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    AlignLeft,
    ArrowLeft,
    Calendar,
    CheckSquare,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    CircleDot,
    Eye,
    FileSignature,
    GripVertical,
    Hash,
    Heading1,
    Heading2,
    Heading3,
    Heading4,
    Heading5,
    Heading6,
    Image as ImageIcon,
    Layout,
    List,
    MousePointer2,
    Plus,
    Quote,
    Save,
    Table,
    Trash2,
    Type,
    Copy,
    Grid,
    Columns,
    Rows,
    Edit3,
    Play,
    Printer,
    FileText,
    Download,
    Loader2
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { InteractiveForm } from '@/components/form-renderer/InteractiveForm';
import axios from 'axios';





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

const FIELD_TYPES = [
    {
        category: 'layout',
        items: [
            { value: 'image', label: 'Gambar / Logo', icon: ImageIcon, defaultLabel: '', defaultPlaceholder: '', defaultOptions: { url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=2117&auto=format&fit=crop', size: 80, alignment: 'justify-start' } },
            { value: 'form_title', label: 'Judul Form', icon: Heading1, defaultLabel: 'Judul Dokumen', defaultPlaceholder: '' },
            { value: 'static_text', label: 'Teks (Statis)', icon: Type, defaultLabel: 'Masukkan teks di sini...', defaultPlaceholder: '', defaultFontSize: 14 },
            { value: 'group', label: 'Group / Seksi', icon: Layout, defaultLabel: 'NAMA GRUP / SEKSI', defaultPlaceholder: '' },
            { value: 'sub_content', label: 'Sub Konten', icon: AlignLeft, defaultLabel: 'Sub Judul / Deskripsi Bagian', defaultPlaceholder: '' },
            {
                value: 'rich_text',
                label: 'Rich Text',
                icon: AlignLeft,
                defaultLabel: 'Masukkan konten teks di sini...',
                defaultPlaceholder: '',
                defaultFontSize: 11,
            },
            {
                value: 'table',
                label: 'Tabel Data',
                icon: Table,
                defaultLabel: 'Tabel 1',
                defaultPlaceholder: '',
                defaultOptions: { columns: [{ label: 'Header 1', width: 50 }, { label: 'Header 2', width: 50 }] },
            },
            {
                value: 'grid_view',
                label: 'Grid View (Advanced)',
                icon: Grid,
                defaultLabel: 'GRID CONTAINER',
                defaultPlaceholder: '',
                defaultOptions: { 
                    grid_cols: 2, 
                    grid_rows: 1, 
                    col_sizes: ['1fr', '1fr', '1fr', '1fr'], 
                    row_sizes: ['auto', 'auto', 'auto', 'auto'] 
                },
            },
            {
                value: 'grid_x',
                label: 'Grid X (Horizontal Split)',
                icon: Columns,
                defaultLabel: 'HORIZONTAL SPLIT',
                defaultPlaceholder: '',
                defaultOptions: { 
                    grid_cols: 2, 
                    grid_rows: 1, 
                    col_sizes: ['1fr', '1fr', '1fr', '1fr'], 
                },
            },
            {
                value: 'grid_y',
                label: 'Grid Y (Vertical Split)',
                icon: Rows,
                defaultLabel: 'VERTICAL SPLIT',
                defaultPlaceholder: '',
                defaultOptions: { 
                    grid_cols: 1, 
                    grid_rows: 2, 
                    row_sizes: ['auto', 'auto', 'auto', 'auto'] 
                },
            },
        ],
    },
    {
        category: 'input',
        items: [
            { value: 'textfield', label: 'Textfield', icon: Type, defaultLabel: '', defaultPlaceholder: 'Masukkan teks...' },
            { value: 'textarea', label: 'Textarea', icon: AlignLeft, defaultLabel: '', defaultPlaceholder: 'Masukkan deskripsi...' },
            { value: 'number', label: 'Angka', icon: Hash, defaultLabel: '', defaultPlaceholder: '0' },
            { value: 'date', label: 'Tanggal', icon: Calendar, defaultLabel: '', defaultPlaceholder: '' },
            { value: 'select', label: 'Dropdown', icon: List, defaultLabel: '', defaultPlaceholder: 'Pilih opsi...' },
            { value: 'checkbox', label: 'Checkbox', icon: CheckSquare, defaultLabel: '', defaultPlaceholder: '' },
            { value: 'radio', label: 'Radio Button', icon: CircleDot, defaultLabel: '', defaultPlaceholder: '' },
        ],
    },
    {
        category: 'signature',
        items: [
            {
                value: 'signature_box',
                label: 'Kotak Tanda Tangan',
                icon: FileSignature,
                defaultLabel: 'Diketahui oleh :',
                defaultPlaceholder: '[nama personil]',
            },
        ],
    },
];

export default function FormBuilder({ template }: Props) {
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
        setPreviewData(prev => ({ ...prev, [name]: value }));
    };

    const selectedFieldId = useMemo(() => selectedFieldIds[selectedFieldIds.length - 1] || null, [selectedFieldIds]);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fieldId?: string } | null>(null);

    // Close context menu on any click or escape key
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setContextMenu(null);
        };
        window.addEventListener('click', handleClick);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('click', handleClick);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);
    const [leftPanelTab, setLeftPanelTab] = useState<'elements' | 'properties'>('elements');
    const [middlePanelTab, setMiddlePanelTab] = useState<'structure' | 'json'>('structure');
    const [activeLibItem, setActiveLibItem] = useState<string | null>(null);

    // Resizing State
    const [leftWidth, setLeftWidth] = useState(320);
    const [middleWidth, setMiddleWidth] = useState(280);
    const [isResizingLeft, setIsResizingLeft] = useState(false);
    const [isResizingMiddle, setIsResizingMiddle] = useState(false);
    const [saving, setSaving] = useState(false);
    const [pdfJobId, setPdfJobId] = useState<string | null>(null);
    const [pdfJobStatus, setPdfJobStatus] = useState<any>(null);



    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizingLeft) {
                setLeftWidth(Math.max(240, Math.min(600, e.clientX)));
            }
            if (isResizingMiddle) {
                const centerStart = leftWidth;
                setMiddleWidth(Math.max(200, Math.min(500, e.clientX - centerStart)));
            }
        };

        const handleMouseUp = () => {
            setIsResizingLeft(false);
            setIsResizingMiddle(false);
            document.body.style.cursor = 'default';
        };

        if (isResizingLeft || isResizingMiddle) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizingLeft, isResizingMiddle, leftWidth]);

    useEffect(() => {
        if (selectedFieldIds.length > 0) setLeftPanelTab('properties');
    }, [selectedFieldIds]);

    const handleSelectField = (id: string, e?: React.MouseEvent | React.KeyboardEvent) => {
        if (e && (e.ctrlKey || e.metaKey)) {
            // Toggle selection
            setSelectedFieldIds(prev => 
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            );
        } else if (e && e.shiftKey && selectedFieldIds.length > 0) {
            // Range selection
            const allIds = data.fields.map(f => f.id);
            const startId = selectedFieldIds[selectedFieldIds.length - 1];
            const startIndex = allIds.indexOf(startId);
            const endIndex = allIds.indexOf(id);
            
            if (startIndex !== -1 && endIndex !== -1) {
                const start = Math.min(startIndex, endIndex);
                const end = Math.max(startIndex, endIndex);
                const rangeIds = allIds.slice(start, end + 1);
                setSelectedFieldIds(prev => Array.from(new Set([...prev, ...rangeIds])));
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
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveLibItem(null);
        if (!over) return;

        const activeId = active.id.toString();
        const overId = over.id.toString();

        // Check if dragging from library
        if (activeId.startsWith('lib-')) {
            const typeValue = activeId.replace('lib-', '');
            const typeInfo = FIELD_TYPES.flatMap((c) => c.items).find((t) => t.value === typeValue);

            const overField = (data?.fields || []).find((f) => f.id === overId);
            const parentId = overField && ['group', 'grid_view', 'grid_x', 'grid_y'].includes(overField.type) ? overField.id : overField?.parent_id || null;

            const newField: FormField = {
                id: Math.random().toString(36).substr(2, 9),
                parent_id: parentId,
                label: (typeInfo as any)?.defaultLabel || (typeInfo as any)?.label || `New ${typeValue}`,
                name: `field_${(data?.fields || []).length + 1}`,
                type: typeValue,
                placeholder: (typeInfo as any)?.defaultPlaceholder || '',
                is_required: false,
                width: '1/1',
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
            width: '1/1',
            options: typeValue === 'select' || typeValue === 'radio' ? ['Option 1', 'Option 2'] : null,
            order: data.fields.length,
        };
        const newFields = [...data.fields, newField];
        setData('fields', newFields);
        setSelectedFieldIds([newField.id]);
    };

    const addFieldAfter = (targetId: string, typeValue: string) => {
        const targetField = data.fields.find(f => f.id === targetId);
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
            options: typeValue === 'select' || typeValue === 'radio' ? ['Option 1', 'Option 2'] : null,
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

        const selectedFields = data.fields
            .filter(f => selectedFieldIds.includes(f.id))
            .sort((a, b) => a.order - b.order);
        
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
            options: wrapperType === 'grid_x' ? { grid_cols: selectedFields.length } : {}
        };

        const updatedFields = data.fields.map(f => {
            if (selectedFieldIds.includes(f.id)) {
                return { ...f, parent_id: wrapperId };
            }
            return f;
        });

        const newFields = [...updatedFields, wrapperField]
            .sort((a, b) => a.order - b.order)
            .map((f, i) => ({ ...f, order: i }));

        setData('fields', newFields);
        setSelectedFieldIds([wrapperId]);
    };

    const duplicateField = (targetId: string) => {
        const originalFields = [...data.fields];
        const fieldsToDuplicate: FormField[] = [];
        const idMap = new Map<string, string>();

        const getDuplicateRecursive = (id: string, newParentId: string | null) => {
            const original = originalFields.find(f => f.id === id);
            if (!original) return;

            const newId = Math.random().toString(36).substr(2, 9);
            idMap.set(id, newId);

            const duplicate: FormField = {
                ...JSON.parse(JSON.stringify(original)), // Deep copy
                id: newId,
                parent_id: newParentId,
                name: `${original.name}_copy`,
                order: original.order + 0.1
            };
            fieldsToDuplicate.push(duplicate);

            // Find children
            const children = originalFields.filter(f => f.parent_id === id);
            children.forEach(child => getDuplicateRecursive(child.id, newId));
        };

        getDuplicateRecursive(targetId, originalFields.find(f => f.id === targetId)?.parent_id || null);

        const newFields = [...originalFields, ...fieldsToDuplicate]
            .sort((a, b) => a.order - b.order)
            .map((f, i) => ({ ...f, order: i }));

        setData('fields', newFields);
        setSelectedFieldIds([fieldsToDuplicate[0].id]);
    };

    const removeField = (id: string) => {
        const newFields = data.fields.filter((f) => f.id !== id && f.parent_id !== id);
        setData(
            'fields',
            newFields.map((f, i) => ({ ...f, order: i })),
        );
        if (selectedFieldId === id) setSelectedFieldIds([]);
    };

    const updateField = (id: string, key: keyof FormField, value: any) => {
        const newFields = data.fields.map((f) => (f.id === id ? { ...f, [key]: value } : f));
        setData('fields', newFields);
    };

    const moveField = (id: string, direction: 'up' | 'down' | 'in' | 'out') => {
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

    const handleTestDownload = async () => {
        setSaving(true);
        setPdfJobStatus({ status: 'pending', progress: 10 });

        try {
            const res = await axios.post(`/admin/form-templates/export-queue`, { 
                template: data,
                form_data: JSON.stringify(previewData) 
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
                        setSaving(false);
                        setPdfJobId(null);
                        
                        // Trigger download
                        const link = document.createElement('a');
                        link.href = statusData.url;
                        link.setAttribute('download', `${data.name || 'form-preview'}.pdf`);
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                    } else if (statusData.status === 'failed') {
                        clearInterval(interval);
                        setSaving(false);
                        setPdfJobId(null);
                        alert('Gagal mendownload PDF: ' + (statusData.error || 'Unknown error'));
                    }
                } catch (err) {
                    console.error('Polling failed:', err);
                }
            }, 2000);

        } catch (error) {
            console.error('Queue failed:', error);
            setSaving(false);
            setPdfJobId(null);
            alert('Gagal antrikan PDF. Pastikan server antrian (queue) berjalan.');
        }
    };



    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.form-templates.save', template.id));
    };

    const selectedField = (data?.fields || []).find((f) => f.id === selectedFieldId);

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

    const allFieldIds = useMemo(() => (data?.fields || []).map((f) => f.id), [data.fields]);

    return (
        <div className="font-inter flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900">
            <Head title={template.id ? `Edit ${template.name}` : 'Form Builder'} />

            <form onSubmit={handleSave} className="flex h-full flex-col overflow-hidden">
                <header className="z-20 flex h-14 shrink-0 items-center justify-between border-b bg-white px-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild className="h-9 w-9 border">
                            <Link href={route('admin.form-templates.index')}>
                                <ArrowLeft size={18} />
                            </Link>
                        </Button>
                        <div className="flex flex-col">
                            <h1 className="text-sm leading-tight font-black tracking-tight text-slate-900 uppercase">{data.name}</h1>
                            <div className="flex items-center gap-1.5 opacity-60">
                                <Layout size={10} className="text-indigo-600" />
                                <span className="text-[9px] font-bold tracking-widest uppercase">Enterprise Form Designer</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {template.id && (
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="h-8 text-[10px] font-black tracking-wider text-green-600 uppercase hover:bg-green-50 hover:text-green-700"
                            >
                                <a href={route('admin.form-templates.fill', template.id)} target="_blank" rel="noopener noreferrer">
                                    <Eye size={14} className="mr-1.5" /> Isi Form
                                </a>
                            </Button>
                        )}
                        <Button
                            type="submit"
                            size="sm"
                            className="h-8 bg-indigo-600 text-[10px] font-black tracking-wider uppercase shadow-lg shadow-indigo-500/20 hover:bg-indigo-700"
                            disabled={processing}
                        >
                            <Save size={14} className="mr-1.5" /> {processing ? 'Saving...' : 'Save Template'}
                        </Button>
                    </div>
                </header>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <main className="relative flex flex-1 overflow-hidden">
                        {/* LEFT: LIBRARY & PROPERTIES */}
                        <aside
                            style={{ width: `${leftWidth}px` }}
                            className="z-20 flex shrink-0 flex-col overflow-hidden border-r bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
                        >
                            <div className="border-b bg-slate-50/50 p-1">
                                <div className="flex w-full items-center gap-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-200/50 p-1">
                                    {['elements', 'properties'].map((tab) => (
                                        <button
                                            key={tab}
                                            style={{ flex: 1 }}
                                            type="button"
                                            onClick={() => setLeftPanelTab(tab as any)}
                                            className={cn(
                                                'h-8 rounded-lg px-2 text-[9px] font-black tracking-widest whitespace-nowrap uppercase transition-all',
                                                leftPanelTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600',
                                            )}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <ScrollArea className="flex-1">
                                {leftPanelTab === 'elements' ? (
                                    <div className="space-y-8 p-6">
                                        {FIELD_TYPES.map((cat) => (
                                            <div key={cat.category}>
                                                <h3 className="mb-4 w-fit rounded bg-indigo-50/50 px-2 py-1 text-[9px] font-black tracking-[0.2em] text-indigo-600 uppercase">
                                                    {cat.category}
                                                </h3>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {cat.items.map((type) => (
                                                        <LibDraggable key={type.value} type={type} onClick={() => addField(type.value)} />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex h-full flex-col">
                                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/30 px-6 py-4">
                                            <h2 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                                {selectedField ? 'Properties' : 'Document'}
                                            </h2>
                                            {selectedField && (
                                                <Button
                                                    variant="ghost"
                                                    className="h-6 px-2 text-[8px] font-black text-indigo-600 uppercase transition-all hover:bg-indigo-50 hover:text-indigo-700 active:scale-95"
                                                    onClick={() => setSelectedFieldIds([])}
                                                >
                                                    Global Settings
                                                </Button>
                                            )}
                                        </div>
                                        <div className="scrollbar-hide flex-1 overflow-auto p-6">
                                            {selectedField ? (
                                                <div className="animate-in fade-in slide-in-from-right-2 space-y-8">
                                                    <div className="space-y-6">
                                                        {/* TOP LEVEL PROPERTIES: NAME & LABEL */}
                                                        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                                            <div className="space-y-1.5">
                                                                <div className="flex items-center justify-between">
                                                                    <Label className="text-[10px] font-black tracking-widest text-indigo-600 uppercase">
                                                                        Field Name / Key
                                                                    </Label>
                                                                    <span className="text-[9px] font-bold text-slate-400 italic">(Internal ID)</span>
                                                                </div>
                                                                <Input
                                                                    value={selectedField.name}
                                                                    onChange={(e) => updateField(selectedField.id, 'name', e.target.value)}
                                                                    className="h-8 border-indigo-100 bg-indigo-50/20 text-[11px] font-mono font-bold"
                                                                    placeholder="e.g. clause_1"
                                                                />
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <Label className="text-[10px] font-black tracking-wider uppercase">
                                                                    {selectedField.type === 'kop_surat' ? 'Company Name' : 'Label / Content'}
                                                                </Label>
                                                                <Textarea
                                                                    value={selectedField.label}
                                                                    onChange={(e: any) => updateField(selectedField.id, 'label', e.target.value)}
                                                                    className="min-h-[60px] text-[11px] leading-relaxed"
                                                                    placeholder="Masukkan label atau konten..."
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* KOP SURAT / F1 HEADER LOGO CONTROLS */}
                                                        {(selectedField.type === 'kop_surat' || selectedField.type === 'f1_header') && (
                                                            <div className="space-y-4">
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-[9px] font-black tracking-wider uppercase">
                                                                        Logo Image
                                                                    </Label>
                                                                    <div className="flex items-center gap-3">
                                                                        <div
                                                                            onDragOver={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                            }}
                                                                            onDrop={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                const file = e.dataTransfer.files?.[0];
                                                                                if (file && file.type.startsWith('image/')) {
                                                                                    const reader = new FileReader();
                                                                                    reader.onloadend = () => {
                                                                                        updateField(selectedField.id, 'options', {
                                                                                            ...selectedField.options,
                                                                                            logo_url: reader.result,
                                                                                        });
                                                                                    };
                                                                                    reader.readAsDataURL(file);
                                                                                }
                                                                            }}
                                                                            className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-indigo-300 hover:bg-indigo-50/30"
                                                                        >
                                                                            {selectedField.options?.logo_url ? (
                                                                                <img
                                                                                    src={selectedField.options.logo_url}
                                                                                    className="h-full w-full rounded-lg object-contain p-1"
                                                                                />
                                                                            ) : (
                                                                                <ImageIcon className="text-slate-300" size={16} />
                                                                            )}
                                                                        </div>
                                                                        <div className="flex flex-1 flex-col gap-1">
                                                                            <input
                                                                                type="file"
                                                                                accept="image/*"
                                                                                id="sidebar-logo-upload"
                                                                                className="hidden"
                                                                                onChange={(e) => {
                                                                                    const file = e.target.files?.[0];
                                                                                    if (file) {
                                                                                        const reader = new FileReader();
                                                                                        reader.onloadend = () =>
                                                                                            updateField(selectedField.id, 'options', {
                                                                                                ...selectedField.options,
                                                                                                logo_url: reader.result,
                                                                                            });
                                                                                        reader.readAsDataURL(file);
                                                                                    }
                                                                                }}
                                                                            />
                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                size="sm"
                                                                                className="h-8 w-full text-[10px] font-bold uppercase"
                                                                                asChild
                                                                            >
                                                                                <label htmlFor="sidebar-logo-upload" className="cursor-pointer">
                                                                                    Upload Logo
                                                                                </label>
                                                                            </Button>

                                                                            {selectedField.type === 'kop_surat' && (
                                                                                <div className="flex gap-1">
                                                                                    {['left', 'right'].map((pos) => (
                                                                                        <Button
                                                                                            key={pos}
                                                                                            type="button"
                                                                                            variant={
                                                                                                (selectedField.options?.logo_position || 'left') ===
                                                                                                pos
                                                                                                    ? 'default'
                                                                                                    : 'outline'
                                                                                            }
                                                                                            className="h-6 flex-1 text-[9px] font-black uppercase"
                                                                                            onClick={() =>
                                                                                                updateField(selectedField.id, 'options', {
                                                                                                    ...selectedField.options,
                                                                                                    logo_position: pos,
                                                                                                })
                                                                                            }
                                                                                        >
                                                                                            {pos}
                                                                                        </Button>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-1.5">
                                                                    <div className="flex items-center justify-between">
                                                                        <Label className="text-[9px] font-black tracking-wider uppercase">
                                                                            Logo Size (px)
                                                                        </Label>
                                                                        <span className="text-[9px] font-bold">
                                                                            {selectedField.options?.logo_size || 60}px
                                                                        </span>
                                                                    </div>
                                                                    <input
                                                                        type="range"
                                                                        min="30"
                                                                        max="200"
                                                                        step="5"
                                                                        value={selectedField.options?.logo_size || 60}
                                                                        onChange={(e) =>
                                                                            updateField(selectedField.id, 'options', {
                                                                                ...selectedField.options,
                                                                                logo_size: parseInt(e.target.value),
                                                                            })
                                                                        }
                                                                        className="bg-muted accent-primary h-1.5 w-full cursor-pointer appearance-none rounded-lg"
                                                                    />
                                                                </div>

                                                                {selectedField.type === 'kop_surat' && (
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-[9px] font-black tracking-wider uppercase">
                                                                            Address & Contact Details
                                                                        </Label>
                                                                        <Textarea
                                                                            value={selectedField.options?.description || ''}
                                                                            onChange={(e: any) =>
                                                                                updateField(selectedField.id, 'options', {
                                                                                    ...selectedField.options,
                                                                                    description: e.target.value,
                                                                                })
                                                                            }
                                                                            className="min-h-[80px] text-[11px]"
                                                                            placeholder="Jl. Sudirman No. 123..."
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* IMAGE FIELD CONTROLS */}
                                                        {selectedField.type === 'image' && (
                                                            <div className="space-y-4">
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-[9px] font-black tracking-wider uppercase">
                                                                        Image Tool
                                                                    </Label>
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        id="generic-image-upload"
                                                                        className="hidden"
                                                                        onChange={(e) => {
                                                                            const file = e.target.files?.[0];
                                                                            if (file) {
                                                                                const reader = new FileReader();
                                                                                reader.onloadend = () =>
                                                                                    updateField(selectedField.id, 'label', reader.result);
                                                                                reader.readAsDataURL(file);
                                                                            }
                                                                        }}
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-8 w-full text-[10px] font-bold uppercase"
                                                                        asChild
                                                                    >
                                                                        <label htmlFor="generic-image-upload" className="cursor-pointer">
                                                                            Change Image
                                                                        </label>
                                                                    </Button>
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <div className="flex items-center justify-between">
                                                                        <Label className="text-[9px] font-black tracking-wider uppercase">
                                                                            Zoom / Scale
                                                                        </Label>
                                                                        <span className="text-[9px] font-bold">
                                                                            {selectedField.options?.image_scale || 100}%
                                                                        </span>
                                                                    </div>
                                                                    <input
                                                                        type="range"
                                                                        min="20"
                                                                        max="200"
                                                                        step="5"
                                                                        value={selectedField.options?.image_scale || 100}
                                                                        onChange={(e) =>
                                                                            updateField(selectedField.id, 'options', {
                                                                                ...selectedField.options,
                                                                                image_scale: parseInt(e.target.value),
                                                                            })
                                                                        }
                                                                        className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* TABLE CONTROLS */}
                                                        {selectedField.type === 'table' && (
                                                            <div className="space-y-4">
                                                                <div className="space-y-2">
                                                                    <Label className="text-[9px] font-black tracking-wider uppercase">Table Columns</Label>
                                                                    {(selectedField.options?.columns || []).map((col: any, idx: number) => (
                                                                        <div key={idx} className="flex gap-2">
                                                                            <Input 
                                                                                value={col.label} 
                                                                                onChange={(e) => {
                                                                                    const newCols = [...selectedField.options.columns];
                                                                                    newCols[idx].label = e.target.value;
                                                                                    updateField(selectedField.id, 'options', { ...selectedField.options, columns: newCols });
                                                                                }}
                                                                                className="h-7 text-[10px] font-bold"
                                                                                placeholder="Header..."
                                                                            />
                                                                            <Input 
                                                                                type="number"
                                                                                value={col.width} 
                                                                                onChange={(e) => {
                                                                                    const newCols = [...selectedField.options.columns];
                                                                                    newCols[idx].width = parseInt(e.target.value);
                                                                                    updateField(selectedField.id, 'options', { ...selectedField.options, columns: newCols });
                                                                                }}
                                                                                className="h-7 w-16 text-center text-[10px] font-bold"
                                                                            />
                                                                            <Button 
                                                                                variant="ghost" 
                                                                                size="icon" 
                                                                                className="h-7 w-7 text-red-500"
                                                                                onClick={() => {
                                                                                    const newCols = selectedField.options.columns.filter((_: any, i: number) => i !== idx);
                                                                                    updateField(selectedField.id, 'options', { ...selectedField.options, columns: newCols });
                                                                                }}
                                                                            >
                                                                                <Trash2 size={12} />
                                                                            </Button>
                                                                        </div>
                                                                    ))}
                                                                    <Button 
                                                                        variant="outline" 
                                                                        size="sm" 
                                                                        className="h-7 w-full text-[9px] font-black uppercase"
                                                                        onClick={() => {
                                                                            const newCols = [...(selectedField.options?.columns || []), { label: 'New Column', width: 25 }];
                                                                            updateField(selectedField.id, 'options', { ...selectedField.options, columns: newCols });
                                                                        }}
                                                                    >
                                                                        <Plus size={10} className="mr-1" /> Add Column
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* PLACEHOLDER */}
                                                        {![
                                                            'kop_surat',
                                                            'form_title',
                                                            'grid_row',
                                                            'sub_content',
                                                            'image',
                                                            'group',
                                                            'static_text',
                                                            'rich_text',
                                                            'table',
                                                            'h1',
                                                            'h2',
                                                            'h3',
                                                            'h4',
                                                            'h5',
                                                            'h6',
                                                        ].includes(selectedField.type) && (
                                                            <div className="space-y-1.5">
                                                                <Label className="text-[9px] font-black tracking-wider uppercase">Placeholder</Label>
                                                                <Input
                                                                    value={selectedField.placeholder}
                                                                    onChange={(e) => updateField(selectedField.id, 'placeholder', e.target.value)}
                                                                    className="h-8 text-[11px]"
                                                                />
                                                            </div>
                                                        )}

                                                        {/* GROUP CONTROLS */}
                                                        {selectedField.type === 'group' && (
                                                            <div className="space-y-4">
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-[9px] font-black tracking-wider uppercase">
                                                                        Content Alignment
                                                                    </Label>
                                                                    <div className="grid grid-cols-3 gap-1">
                                                                        {[
                                                                            { label: 'Left', value: 'justify-start' },
                                                                            { label: 'Center', value: 'justify-center' },
                                                                            { label: 'Right', value: 'justify-end' },
                                                                            { label: 'Between', value: 'justify-between' },
                                                                            { label: 'Around', value: 'justify-around' },
                                                                        ].map((align) => (
                                                                            <Button
                                                                                key={align.value}
                                                                                type="button"
                                                                                variant={
                                                                                    (selectedField.options?.alignment || 'justify-start') ===
                                                                                    align.value
                                                                                        ? 'default'
                                                                                        : 'outline'
                                                                                }
                                                                                className="h-7 overflow-hidden text-[9px] font-black uppercase"
                                                                                onClick={() =>
                                                                                    updateField(selectedField.id, 'options', {
                                                                                        ...selectedField.options,
                                                                                        alignment: align.value,
                                                                                    })
                                                                                }
                                                                            >
                                                                                {align.label}
                                                                            </Button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-[9px] font-black tracking-wider uppercase">
                                                                        Group Style
                                                                    </Label>
                                                                    <div className="flex gap-1">
                                                                        {[
                                                                            { label: 'Normal', value: 'normal' },
                                                                            { label: 'Frameless', value: 'frameless' },
                                                                        ].map((style) => (
                                                                            <Button
                                                                                key={style.value}
                                                                                type="button"
                                                                                variant={
                                                                                    (selectedField.options?.group_style || 'normal') === style.value
                                                                                        ? 'default'
                                                                                        : 'outline'
                                                                                }
                                                                                className="h-7 flex-1 text-[9px] font-black uppercase"
                                                                                onClick={() =>
                                                                                    updateField(selectedField.id, 'options', {
                                                                                        ...selectedField.options,
                                                                                        group_style: style.value,
                                                                                    })
                                                                                }
                                                                            >
                                                                                {style.label}
                                                                            </Button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* WIDTH OPTIONS */}
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[9px] font-black tracking-wider uppercase">
                                                                Width Percentage (%)
                                                            </Label>
                                                            <div className="flex items-center gap-2">
                                                                <Input
                                                                    type="number"
                                                                    min="5"
                                                                    max="100"
                                                                    step="5"
                                                                    value={selectedField.width}
                                                                    onChange={(e) => updateField(selectedField.id, 'width', e.target.value)}
                                                                    className="h-8 text-[11px] font-bold"
                                                                />
                                                                <span className="text-[10px] font-black text-slate-400">/ 100</span>
                                                            </div>
                                                        </div>

                                                        {/* DESIGN ADJUSTMENTS (Margin, Padding, Gap, Font) */}
                                                        <div className="space-y-4 border-t border-slate-100 pt-4">
                                                            <Label className="mb-2 block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                                                Design Adjustments
                                                            </Label>

                                                            {/* MARGIN LRTB */}
                                                            <div className="space-y-1.5">
                                                                <Label className="text-[9px] font-bold text-slate-500 uppercase">
                                                                    Margin (T-B-L-R)
                                                                </Label>
                                                                <div className="grid grid-cols-4 gap-1">
                                                                    {['margin_top', 'margin_bottom', 'margin_left', 'margin_right'].map((k) => (
                                                                        <Input
                                                                            key={k}
                                                                            type="number"
                                                                            value={selectedField.options?.[k] ?? ''}
                                                                            onChange={(e) =>
                                                                                updateField(selectedField.id, 'options', {
                                                                                    ...selectedField.options,
                                                                                    [k]: e.target.value ? parseInt(e.target.value) : undefined,
                                                                                })
                                                                            }
                                                                            className="h-8 px-1 text-center text-[10px] font-bold"
                                                                            placeholder={k.split('_')[1].charAt(0).toUpperCase()}
                                                                            title={k.replace('_', ' ')}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* PADDING LRTB */}
                                                            <div className="space-y-1.5">
                                                                <Label className="text-[9px] font-bold text-slate-500 uppercase">
                                                                    Padding (T-B-L-R)
                                                                </Label>
                                                                <div className="grid grid-cols-4 gap-1">
                                                                    {['padding_top', 'padding_bottom', 'padding_left', 'padding_right'].map((k) => (
                                                                        <Input
                                                                            key={k}
                                                                            type="number"
                                                                            value={selectedField.options?.[k] ?? ''}
                                                                            onChange={(e) =>
                                                                                updateField(selectedField.id, 'options', {
                                                                                    ...selectedField.options,
                                                                                    [k]: e.target.value ? parseInt(e.target.value) : undefined,
                                                                                })
                                                                            }
                                                                            className="h-8 bg-indigo-50/30 px-1 text-center font-mono text-[10px] font-bold text-indigo-600"
                                                                            placeholder={k.split('_')[1].charAt(0).toUpperCase()}
                                                                            title={k.replace('_', ' ')}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-3">
                                                                {/* GAP (For Containers) */}
                                                                {['group', 'grid_row', 'metadata_grid'].includes(selectedField.type) && (
                                                                    <>
                                                                        <div className="space-y-1.5">
                                                                            <Label className="text-[9px] font-bold text-slate-500 uppercase">
                                                                                Child Gap (px)
                                                                            </Label>
                                                                            <Input
                                                                                type="number"
                                                                                value={selectedField.options?.gap ?? ''}
                                                                                onChange={(e) =>
                                                                                    updateField(selectedField.id, 'options', {
                                                                                        ...selectedField.options,
                                                                                        gap: e.target.value ? parseInt(e.target.value) : undefined,
                                                                                    })
                                                                                }
                                                                                className="h-8 text-[10px] font-bold"
                                                                                placeholder="Def (0)"
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-1.5">
                                                                            <Label className="text-[9px] font-bold text-slate-500 uppercase">
                                                                                Grid Cols
                                                                            </Label>
                                                                            <select
                                                                                value={selectedField.options?.grid_cols || '0'}
                                                                                onChange={(e) =>
                                                                                    updateField(selectedField.id, 'options', {
                                                                                        ...selectedField.options,
                                                                                        grid_cols: parseInt(e.target.value),
                                                                                    })
                                                                                }
                                                                                className="flex h-8 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                                                                            >
                                                                                <option value="0">Flex</option>
                                                                                <option value="2">2 Col</option>
                                                                                <option value="3">3 Col</option>
                                                                                <option value="4">4 Col</option>
                                                                                <option value="5">5 Col</option>
                                                                            </select>
                                                                        </div>
                                                                        <div className="space-y-1.5">
                                                                            <Label className="text-[9px] font-bold text-slate-500 uppercase">
                                                                                Grid Rows
                                                                            </Label>
                                                                            <select
                                                                                value={selectedField.options?.grid_rows || '0'}
                                                                                onChange={(e) =>
                                                                                    updateField(selectedField.id, 'options', {
                                                                                        ...selectedField.options,
                                                                                        grid_rows: parseInt(e.target.value),
                                                                                    })
                                                                                }
                                                                                className="flex h-8 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                                                                            >
                                                                                <option value="0">Auto</option>
                                                                                <option value="1">1 Row</option>
                                                                                <option value="2">2 Row</option>
                                                                                <option value="3">3 Row</option>
                                                                                <option value="4">4 Row</option>
                                                                                <option value="5">5 Row</option>
                                                                            </select>
                                                                        </div>
                                                                    </>
                                                                )}

                                                                {/* HIT POINTS (Spans) - Only if parent is a grid group */}
                                                                {(function () {
                                                                    const parent = data.fields.find(f => f.id === selectedField.parent_id);
                                                                    if (parent?.type === 'group' && (parent.options?.grid_cols > 0 || parent.options?.grid_rows > 0)) {
                                                                        return (
                                                                            <>
                                                                                <div className="space-y-1.5">
                                                                                    <Label className="text-[9px] font-bold text-slate-500 uppercase">
                                                                                        Col Span
                                                                                    </Label>
                                                                                    <Input
                                                                                        type="number"
                                                                                        min={1}
                                                                                        max={5}
                                                                                        value={selectedField.options?.grid_col_span || 1}
                                                                                        onChange={(e) =>
                                                                                            updateField(selectedField.id, 'options', {
                                                                                                ...selectedField.options,
                                                                                                grid_col_span: parseInt(e.target.value) || 1,
                                                                                            })
                                                                                        }
                                                                                        className="h-8 text-[10px] font-bold"
                                                                                    />
                                                                                </div>
                                                                                <div className="space-y-1.5">
                                                                                    <Label className="text-[9px] font-bold text-slate-500 uppercase">
                                                                                        Row Span
                                                                                    </Label>
                                                                                    <Input
                                                                                        type="number"
                                                                                        min={1}
                                                                                        max={5}
                                                                                        value={selectedField.options?.grid_row_span || 1}
                                                                                        onChange={(e) =>
                                                                                            updateField(selectedField.id, 'options', {
                                                                                                ...selectedField.options,
                                                                                                grid_row_span: parseInt(e.target.value) || 1,
                                                                                            })
                                                                                        }
                                                                                        className="h-8 text-[10px] font-bold"
                                                                                    />
                                                                                </div>
                                                                            </>
                                                                        );
                                                                    }
                                                                    return null;
                                                                })()}

                                                                {/* GRID VIEW / X / Y SIZING */}
                                                        {['grid_view', 'grid_x', 'grid_y'].includes(selectedField.type) && (
                                                            <div className="space-y-4 border-t border-slate-100 pt-4">
                                                                <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                                                    {selectedField.type === 'grid_x' ? 'Horizontal Split Settings' : 
                                                                     selectedField.type === 'grid_y' ? 'Vertical Split Settings' : 
                                                                     'Advanced Grid Configuration'}
                                                                </Label>
                                                                
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    {selectedField.type !== 'grid_y' && (
                                                                        <div className="space-y-1.5">
                                                                            <Label className="text-[9px] font-bold text-slate-500 uppercase">Columns (Max 6)</Label>
                                                                            <Input 
                                                                                type="number" min={1} max={6}
                                                                                value={selectedField.options?.grid_cols || 1}
                                                                                onChange={e => updateField(selectedField.id, 'options', {
                                                                                    ...selectedField.options,
                                                                                    grid_cols: Math.min(6, parseInt(e.target.value) || 1)
                                                                                })}
                                                                                className="h-8 text-[11px] font-bold"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                    {selectedField.type !== 'grid_x' && (
                                                                        <div className="space-y-1.5">
                                                                            <Label className="text-[9px] font-bold text-slate-500 uppercase">Rows (Max 6)</Label>
                                                                            <Input 
                                                                                type="number" min={1} max={6}
                                                                                value={selectedField.options?.grid_rows || 1}
                                                                                onChange={e => updateField(selectedField.id, 'options', {
                                                                                    ...selectedField.options,
                                                                                    grid_rows: Math.min(6, parseInt(e.target.value) || 1)
                                                                                })}
                                                                                className="h-8 text-[11px] font-bold"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Column Sizes */}
                                                                {selectedField.type !== 'grid_y' && (
                                                                    <div className="space-y-2">
                                                                        <Label className="text-[9px] font-bold text-slate-500 uppercase">Col Proportions (e.g. 1fr, 25%, 200px)</Label>
                                                                        <div className="grid grid-cols-3 gap-2">
                                                                            {Array.from({ length: selectedField.options?.grid_cols || 1 }).map((_, i) => (
                                                                                <div key={`col-${i}`} className="space-y-1">
                                                                                    <Label className="text-[8px] font-black text-slate-400">Idx {i+1}</Label>
                                                                                    <Input 
                                                                                        value={selectedField.options?.col_sizes?.[i] || '1fr'}
                                                                                        onChange={e => {
                                                                                            const newSizes = [...(selectedField.options?.col_sizes || ['1fr','1fr','1fr','1fr'])];
                                                                                            newSizes[i] = e.target.value;
                                                                                            updateField(selectedField.id, 'options', { ...selectedField.options, col_sizes: newSizes });
                                                                                        }}
                                                                                        className="h-7 px-1 text-center text-[10px] font-bold font-mono"
                                                                                    />
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Row Sizes */}
                                                                {selectedField.type !== 'grid_x' && (
                                                                    <div className="space-y-2">
                                                                        <Label className="text-[9px] font-bold text-slate-500 uppercase">Row Proportions (e.g. auto, 100px)</Label>
                                                                        <div className="grid grid-cols-3 gap-2">
                                                                            {Array.from({ length: selectedField.options?.grid_rows || 1 }).map((_, i) => (
                                                                                <div key={`row-${i}`} className="space-y-1">
                                                                                    <Label className="text-[8px] font-black text-slate-400">Idx {i+1}</Label>
                                                                                    <Input 
                                                                                        value={selectedField.options?.row_sizes?.[i] || 'auto'}
                                                                                        onChange={e => {
                                                                                            const newSizes = [...(selectedField.options?.row_sizes || ['auto','auto','auto','auto'])];
                                                                                            newSizes[i] = e.target.value;
                                                                                            updateField(selectedField.id, 'options', { ...selectedField.options, row_sizes: newSizes });
                                                                                        }}
                                                                                        className="h-7 px-1 text-center text-[10px] font-bold font-mono"
                                                                                    />
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* STYLING: Background & Border */}
                                                                <div className="space-y-3 border-t border-slate-100 pt-3">
                                                                    <Label className="text-[9px] font-bold text-slate-500 uppercase">Container Styling</Label>
                                                                    
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <div className="space-y-1">
                                                                            <Label className="text-[8px] font-bold text-slate-400">Background Color</Label>
                                                                            <div className="flex gap-2">
                                                                                <Input 
                                                                                    type="color"
                                                                                    value={selectedField.options?.bg_color || '#ffffff'}
                                                                                    onChange={e => updateField(selectedField.id, 'options', { ...selectedField.options, bg_color: e.target.value })}
                                                                                    className="h-8 w-8 p-0 border-none cursor-pointer overflow-hidden rounded-full"
                                                                                />
                                                                                <Input 
                                                                                    value={selectedField.options?.bg_color || '#ffffff'}
                                                                                    onChange={e => updateField(selectedField.id, 'options', { ...selectedField.options, bg_color: e.target.value })}
                                                                                    className="h-8 text-[10px] font-mono"
                                                                                    placeholder="#ffffff"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <Label className="text-[8px] font-bold text-slate-400">Border Style</Label>
                                                                            <select 
                                                                                value={selectedField.options?.border_style || 'none'}
                                                                                onChange={e => updateField(selectedField.id, 'options', { ...selectedField.options, border_style: e.target.value })}
                                                                                className="w-full h-8 px-2 text-[10px] font-bold bg-white border rounded"
                                                                            >
                                                                                <option value="none">None</option>
                                                                                <option value="solid">Full Border</option>
                                                                                <option value="top">Top Only</option>
                                                                                <option value="bottom">Bottom Only</option>
                                                                                <option value="left">Left Only</option>
                                                                                <option value="right">Right Only</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>

                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <div className="space-y-1">
                                                                            <Label className="text-[8px] font-bold text-slate-400">Border Color</Label>
                                                                            <Input 
                                                                                type="color"
                                                                                value={selectedField.options?.border_color || '#000000'}
                                                                                onChange={e => updateField(selectedField.id, 'options', { ...selectedField.options, border_color: e.target.value })}
                                                                                className="h-7 w-full p-0 border-none rounded"
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <Label className="text-[8px] font-bold text-slate-400">Border Width (px)</Label>
                                                                            <Input 
                                                                                type="number" min={0} max={10}
                                                                                value={selectedField.options?.border_width || 1}
                                                                                onChange={e => updateField(selectedField.id, 'options', { ...selectedField.options, border_width: parseInt(e.target.value) || 0 })}
                                                                                className="h-7 text-[10px] font-bold"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {selectedField.type === 'image' && (
                                                            <div className="space-y-4">
                                                                <div className="space-y-2">
                                                                    <Label className="text-[9px] font-bold text-slate-500 uppercase">Image Configuration</Label>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[8px] font-bold text-slate-400">Image URL</Label>
                                                                        <Input 
                                                                            value={selectedField.options?.url || ''}
                                                                            onChange={e => updateField(selectedField.id, 'options', { ...selectedField.options, url: e.target.value })}
                                                                            className="h-8 text-[10px]"
                                                                            placeholder="https://..."
                                                                        />
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-3 pt-1">
                                                                        <div className="space-y-1">
                                                                            <Label className="text-[8px] font-bold text-slate-400">Width (px)</Label>
                                                                            <Input 
                                                                                type="number"
                                                                                value={selectedField.options?.size || 80}
                                                                                onChange={e => updateField(selectedField.id, 'options', { ...selectedField.options, size: parseInt(e.target.value) || 0 })}
                                                                                className="h-8 text-[10px] font-bold"
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <Label className="text-[8px] font-bold text-slate-400">Alignment</Label>
                                                                            <select 
                                                                                value={selectedField.options?.alignment || 'justify-start'}
                                                                                onChange={e => updateField(selectedField.id, 'options', { ...selectedField.options, alignment: e.target.value })}
                                                                                className="w-full h-8 px-2 text-[10px] font-bold bg-white border rounded"
                                                                            >
                                                                                <option value="justify-start">Left</option>
                                                                                <option value="justify-center">Center</option>
                                                                                <option value="justify-end">Right</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* FONT SIZE */}
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-[9px] font-bold text-slate-500 uppercase">
                                                                        Font Size (px)
                                                                    </Label>
                                                                    <Input
                                                                        type="number"
                                                                        value={selectedField.options?.font_size || ''}
                                                                        onChange={(e) =>
                                                                            updateField(selectedField.id, 'options', {
                                                                                ...selectedField.options,
                                                                                font_size: e.target.value ? parseInt(e.target.value) : undefined,
                                                                            })
                                                                        }
                                                                        className="h-8 text-[10px] font-bold"
                                                                        placeholder="Def (14)"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        className="h-10 w-full gap-2 text-[10px] font-black tracking-widest uppercase transition-all active:scale-95"
                                                        onClick={() => removeField(selectedField.id)}
                                                    >
                                                        <Trash2 size={14} /> Remove Element
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="animate-in fade-in slide-in-from-bottom-4 p-6">
                                                    <div className="mb-6 flex flex-col items-center border-b border-slate-100 pb-6 text-center">
                                                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm">
                                                            <Layout size={20} />
                                                        </div>
                                                        <h3 className="text-[11px] font-black tracking-widest text-slate-800 uppercase">
                                                            Document Settings
                                                        </h3>
                                                        <p className="mt-1 text-[9px] font-bold text-slate-400 uppercase">
                                                            Global paper configuration
                                                        </p>
                                                    </div>

                                                    <div className="space-y-6">
                                                        <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-4 w-1 rounded-full bg-indigo-500" />
                                                                <Label className="text-[10px] font-black tracking-wider text-slate-600 uppercase">
                                                                    Paper Margins (mm)
                                                                </Label>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4">
                                                                {[
                                                                    { label: 'Top', key: 'top' },
                                                                    { label: 'Bottom', key: 'bottom' },
                                                                    { label: 'Left', key: 'left' },
                                                                    { label: 'Right', key: 'right' },
                                                                ].map((m) => (
                                                                    <div key={m.key} className="space-y-1.5">
                                                                        <Label className="text-[9px] font-bold text-slate-400 uppercase">
                                                                            {m.label}
                                                                        </Label>
                                                                        <div className="relative">
                                                                            <Input
                                                                                type="number"
                                                                                value={data.letterhead_json?.margins?.[m.key] ?? 15}
                                                                                onChange={(e) => {
                                                                                    const newMargins = {
                                                                                        ...(data.letterhead_json?.margins || {
                                                                                            top: 15,
                                                                                            bottom: 15,
                                                                                            left: 15,
                                                                                            right: 15,
                                                                                        }),
                                                                                        [m.key]: parseInt(e.target.value) || 0,
                                                                                    };
                                                                                    setData('letterhead_json', {
                                                                                        ...data.letterhead_json,
                                                                                        margins: newMargins,
                                                                                    });
                                                                                }}
                                                                                className="h-9 border-slate-200 bg-white px-3 text-[11px] font-bold transition-all focus:border-indigo-500"
                                                                            />
                                                                            <span className="absolute top-1/2 right-2 -translate-y-1/2 text-[8px] font-black text-slate-300 uppercase">
                                                                                mm
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col items-center py-4 text-center opacity-20">
                                                            <MousePointer2 size={16} className="mb-2" />
                                                            <p className="text-[8px] font-black tracking-widest uppercase">
                                                                Select an element for component settings
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </ScrollArea>
                        </aside>

                        {/* RESIZER LEFT */}
                        <div
                            onMouseDown={() => setIsResizingLeft(true)}
                            className="hover:bg-primary/30 group relative z-[60] w-1.5 cursor-col-resize transition-colors"
                        >
                            <div className="group-hover:bg-primary/50 absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-200" />
                        </div>

                        {/* CENTER: STRUCTURAL CANVAS (Optional Sidebar) */}
                        <section
                            style={{ width: `${middleWidth}px` }}
                            className="flex shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-slate-50"
                        >
                            <div className="flex h-12 shrink-0 items-center justify-between border-b bg-white p-2 shadow-sm">
                                <div className="flex w-full items-center gap-1 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 p-1">
                                    {['structure', 'json'].map((tab) => (
                                        <button
                                            key={tab}
                                            style={{ flex: 1 }}
                                            type="button"
                                            onClick={() => setMiddlePanelTab(tab as any)}
                                            className={cn(
                                                'h-7 rounded-md px-2 text-[9px] font-black tracking-widest whitespace-nowrap uppercase transition-all',
                                                middlePanelTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600',
                                            )}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <ScrollArea className="flex-1">
                                {middlePanelTab === 'structure' ? (
                                    <div className="space-y-1 p-4">
                                        <SortableContext items={allFieldIds} strategy={verticalListSortingStrategy}>
                                            {fieldTree.map((field) => {
                                                const renderStructureRecursive = (f: any, level: number = 0) => (
                                                    <SortableField
                                                        key={f.id}
                                                        field={f}
                                                        isSelected={(id: string) => selectedFieldIds.includes(id)}
                                                        onSelect={(e: React.MouseEvent) => handleSelectField(f.id, e)}
                                                        onRemove={() => removeField(f.id)}
                                                        onMove={(dir: any) => moveField(f.id, dir)}
                                                        level={level}
                                                    >
                                                        {f.children && f.children.length > 0 && (
                                                            <div className="mt-1 ml-4 space-y-1 border-l border-indigo-100 pl-2">
                                                                {f.children.map((child: any) => renderStructureRecursive(child, level + 1))}
                                                            </div>
                                                        )}
                                                    </SortableField>
                                                );
                                                return renderStructureRecursive(field);
                                            })}
                                        </SortableContext>
                                    </div>
                                ) : (
                                    <div className="p-4 font-mono text-[9px]">
                                        <div className="max-h-[80vh] overflow-auto rounded-xl border border-slate-800 bg-slate-900 p-4 text-indigo-300 shadow-inner">
                                            <pre className="whitespace-pre-wrap">{JSON.stringify(fieldTree, null, 2)}</pre>
                                        </div>
                                    </div>
                                )}
                            </ScrollArea>
                        </section>

                        {/* RESIZER MIDDLE */}
                        <div
                            onMouseDown={() => setIsResizingMiddle(true)}
                            className="hover:bg-primary/30 group relative z-50 w-1.5 cursor-col-resize transition-colors"
                        >
                            <div className="group-hover:bg-primary/50 absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-200" />
                        </div>

                        <section 
                            className="relative flex flex-1 flex-col overflow-hidden bg-slate-200/50"
                            onContextMenu={(e) => {
                                e.preventDefault();
                                setContextMenu({ x: e.pageX, y: e.pageY });
                            }}
                        >
                            <div className="z-10 flex h-12 items-center justify-between border-b bg-white p-4 px-8 shadow-sm">
                                <h2 className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                    <Eye size={12} /> Live Preview Rendering
                                </h2>
                                <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/50 p-1">
                                    <Button
                                        variant={viewMode === 'editor' ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setViewMode('editor')}
                                        className={cn(
                                            "h-7 px-3 text-[10px] font-black tracking-widest uppercase transition-all",
                                            viewMode === 'editor' ? "bg-indigo-600 shadow-sm" : "text-slate-500"
                                        )}
                                    >
                                        <Edit3 size={12} className="mr-1.5" /> Editor
                                    </Button>
                                    <Button
                                        variant={viewMode === 'filling' ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setViewMode('filling')}
                                        className={cn(
                                            "h-7 px-3 text-[10px] font-black tracking-widest uppercase transition-all",
                                            viewMode === 'filling' ? "bg-indigo-600 shadow-sm" : "text-slate-500"
                                        )}
                                    >
                                        <Play size={12} className="mr-1.5" /> Interactive
                                    </Button>
                                    <Button
                                        variant={viewMode === 'pdf' ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setViewMode('pdf')}
                                        className={cn(
                                            "h-7 px-3 text-[10px] font-black tracking-widest uppercase transition-all",
                                            viewMode === 'pdf' ? "bg-indigo-600 shadow-sm" : "text-slate-500"
                                        )}
                                    >
                                        <FileText size={12} className="mr-1.5" /> PDF
                                    </Button>

                                    {viewMode === 'pdf' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleTestDownload}
                                                disabled={saving}
                                                className="h-7 px-3 text-[10px] font-black tracking-widest uppercase border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm active:scale-95"
                                            >
                                                {saving ? (
                                                    <>
                                                        <Loader2 size={12} className="mr-1.5 animate-spin" />
                                                        {pdfJobStatus?.status === 'pending' ? 'Queued...' : `Processing ${pdfJobStatus?.progress || 0}%`}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Download size={12} className="mr-1.5" />
                                                        Test Download PDF
                                                    </>
                                                )}
                                            </Button>

                                    )}
                                </div>

                                <div className="flex items-center gap-4 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                                    <span>210 x 297 mm</span>
                                    <span className="h-3 w-[1px] bg-slate-200"></span>
                                    <span>Scale 100%</span>
                                </div>
                            </div>
                            <ScrollArea className="pattern-dots flex-1 bg-slate-200/30">
                                <div className="flex min-h-full cursor-default justify-center p-12 py-20" onClick={() => setSelectedFieldIds([])}>
                                    <div className="relative mx-auto flex min-h-full w-full flex-col overflow-hidden transition-all h-full">
                                        {viewMode === 'editor' ? (
                                            <div
                                                className="relative mx-auto flex min-h-[297mm] w-[210mm] flex-col overflow-hidden bg-white text-slate-950 shadow-[0_0_50px_-12px_rgba(0,0,0,0.15)] ring-1 ring-slate-200 transition-all"
                                                style={{
                                                    paddingTop: `${data.letterhead_json?.margins?.top ?? 15}mm`,
                                                    paddingBottom: `${data.letterhead_json?.margins?.bottom ?? 15}mm`,
                                                    paddingLeft: `${data.letterhead_json?.margins?.left ?? 15}mm`,
                                                    paddingRight: `${data.letterhead_json?.margins?.right ?? 15}mm`,
                                                }}
                                            >
                                                <div className="flex-1">
                                                    <SortableContext items={allFieldIds} strategy={verticalListSortingStrategy}>
                                                        <div
                                                            style={{
                                                                display: 'block',
                                                                position: 'relative',
                                                                minHeight: '100%',
                                                            }}
                                                        >
                                                            <CustomStyles />
                                                            {fieldTree.map((field: any) => {
                                                                const renderChildren = (pid: string, isFlex = false) =>
                                                                    (data?.fields || [])
                                                                        .filter((f) => f.parent_id === pid)
                                                                        .map((child) => (
                                                                            <DesignerElement
                                                                                key={child.id}
                                                                                field={child}
                                                                                allFields={data?.fields || []}
                                                                                isSelected={(id) => selectedFieldIds.includes(id)}
                                                                                onSelect={(e: React.MouseEvent) => handleSelectField(child.id, e)}
                                                                                onMove={(dir) => moveField(child.id, dir)}
                                                                                isFlex={isFlex}
                                                                                renderChildren={renderChildren}
                                                                                duplicateField={duplicateField}
                                                                                addFieldAfter={addFieldAfter}
                                                                                removeField={removeField}
                                                                                viewMode={viewMode}
                                                                                previewData={previewData}
                                                                                updatePreviewData={updatePreviewData}
                                                                                onContextMenu={(e, id) => {
                                                                                    setContextMenu({ x: e.pageX, y: e.pageY, fieldId: id });
                                                                                }}
                                                                            />
                                                                        ));

                                                                return (
                                                                    <DesignerElement
                                                                        key={field.id}
                                                                        field={field}
                                                                        allFields={data.fields}
                                                                        isSelected={(id) => selectedFieldIds.includes(id)}
                                                                        onSelect={(e: React.MouseEvent) => handleSelectField(field.id, e)}
                                                                        onMove={(dir) => moveField(field.id, dir)}
                                                                        renderChildren={renderChildren}
                                                                        duplicateField={duplicateField}
                                                                        addFieldAfter={addFieldAfter}
                                                                        removeField={removeField}
                                                                        viewMode={viewMode}
                                                                        previewData={previewData}
                                                                        updatePreviewData={updatePreviewData}
                                                                        onContextMenu={(e, id) => {
                                                                            setContextMenu({ x: e.pageX, y: e.pageY, fieldId: id });
                                                                        }}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    </SortableContext>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-12 flex justify-center w-full">
                                                <InteractiveForm 
                                                    template={data as any}
                                                    formData={previewData}
                                                    onChange={updatePreviewData}
                                                    readOnly={viewMode === 'pdf'}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </ScrollArea>
                            <footer className="z-20 flex h-10 shrink-0 items-center justify-between border-t bg-slate-50 px-6">
                                <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    <div className="flex items-center gap-1.5"><MousePointer2 size={10} /> Right-click for Context Menu</div>
                                    <div className="h-3 w-px bg-slate-200"></div>
                                    <div>{data.fields.length} Elements</div>
                                </div>
                            </footer>

                            {/* CUSTOM CONTEXT MENU */}
                            {contextMenu && (
                                <div 
                                    className="fixed z-[1000] min-w-[200px] overflow-hidden rounded-lg border border-slate-200 bg-white/95 p-1 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in duration-200"
                                    style={{ left: contextMenu.x, top: contextMenu.y }}
                                    onClick={e => e.stopPropagation()}
                                >
                                    {contextMenu.fieldId ? (
                                        <>
                                            <div className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 mb-1">Field Actions</div>
                                            <ContextMenuItem 
                                                icon={Plus} 
                                                label="Add Textbox After" 
                                                onClick={() => addFieldAfter(contextMenu.fieldId!, 'textfield')} 
                                            />
                                            <ContextMenuItem 
                                                icon={Copy} 
                                                label="Duplicate" 
                                                onClick={() => duplicateField(contextMenu.fieldId!)} 
                                            />
                                            <div className="my-1 border-t border-slate-100"></div>
                                            <ContextMenuItem 
                                                icon={Trash2} 
                                                label="Delete" 
                                                className="text-red-600 hover:bg-red-50 hover:text-red-700 font-bold"
                                                onClick={() => removeField(contextMenu.fieldId!)} 
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <div className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 mb-1">Canvas Actions</div>
                                            <div className="group relative">
                                                <div className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer">
                                                    <div className="flex items-center gap-2">
                                                        <Plus size={14} className="text-indigo-500" />
                                                        <span>Tambah Elemen</span>
                                                    </div>
                                                    <ChevronRight size={12} className="opacity-50" />
                                                </div>
                                                
                                                {/* Submenu */}
                                                <div className="absolute left-full top-0 ml-1 hidden min-w-[180px] rounded-lg border border-slate-200 bg-white shadow-xl group-hover:block p-1">
                                                    {FIELD_TYPES.map(cat => (
                                                        <div key={cat.category}>
                                                            <div className="px-2 py-1 text-[8px] font-black text-slate-400 uppercase bg-slate-50/50 mb-0.5">{cat.category}</div>
                                                            {cat.items.map(item => (
                                                                <ContextMenuItem 
                                                                    key={item.value}
                                                                    icon={item.icon}
                                                                    label={item.label}
                                                                    onClick={() => addField(item.value)}
                                                                />
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <ContextMenuItem 
                                                icon={Layout} 
                                                label="Clear Selection" 
                                                onClick={() => setSelectedFieldIds([])} 
                                            />
                                        </>
                                    )}
                                </div>
                            )}
                        </section>
                    </main>

                    <DragOverlay>
                        {activeLibItem && (
                            <div className="bg-primary border-primary-foreground/20 flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-xs font-black text-white uppercase opacity-90 shadow-2xl">
                                <Plus size={14} /> New {activeLibItem}
                            </div>
                        )}
                    </DragOverlay>
                </DndContext>
            </form>
        </div>
    );
}

const ContextMenuItem = ({ icon: Icon, label, onClick, className }: any) => (
    <button
        type="button"
        onClick={(e) => {
            e.stopPropagation();
            onClick();
        }}
        className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-bold text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-600",
            className
        )}
    >
        <Icon size={14} className="opacity-70" />
        <span>{label}</span>
    </button>
);

function LibDraggable({ type, onClick }: any) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `lib-${type.value}` });
    return (
        <Button
            ref={setNodeRef}
            type="button"
            variant="outline"
            onClick={onClick}
            {...listeners}
            {...attributes}
            className={cn(
                'hover:bg-primary/5 group h-12 touch-none justify-start rounded-xl border-dashed px-4 text-[11px] font-bold transition-all',
                isDragging && 'ring-primary scale-95 border-solid opacity-50 shadow-lg ring-2',
            )}
        >
            <div className="flex w-full items-center gap-3">
                <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                    <type.icon size={14} />
                </div>
                <div className="flex min-w-0 flex-col items-start">
                    <span className="truncate">{type.label}</span>
                    <span className="truncate text-[7px] font-medium tracking-tighter text-slate-400 uppercase opacity-60 group-hover:opacity-100">
                        {type.value}
                    </span>
                </div>
                <Plus size={10} className="ml-auto opacity-20" />
            </div>
        </Button>
    );
}

function SortableField({ field, isSelected, onSelect, onRemove, onMove, children, level = 0 }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
    const style = {
        transform: CSS.Translate.toString(transform as any),
        transition,
        zIndex: isDragging ? 100 : 'auto',
        opacity: isDragging ? 0.3 : 1,
    };
    return (
        <div ref={setNodeRef} style={style} className="group">
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(e);
                }}
                className={cn(
                    'bg-background relative flex cursor-pointer items-center gap-2 rounded-xl border p-2 transition-all',
                    isSelected(field.id) ? 'border-primary ring-primary/10 shadow-md ring-1' : 'border-border/40 shadow-sm',
                )}
            >
                <div {...attributes} {...listeners} className="cursor-grab p-1 opacity-20 hover:opacity-100">
                    <GripVertical size={12} />
                </div>
                <div className="min-w-0 flex-1">
                    <span className="block truncate text-[10px] leading-none font-black tracking-tight uppercase">{field.label}</span>
                    <span className="text-muted-foreground text-[7px] leading-none font-bold uppercase opacity-60">{field.type}</span>
                </div>

                <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                            e.stopPropagation();
                            onMove('up');
                        }}
                    >
                        <ChevronUp size={12} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                            e.stopPropagation();
                            onMove('down');
                        }}
                    >
                        <ChevronDown size={12} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                            e.stopPropagation();
                            onMove('out');
                        }}
                    >
                        <ChevronLeft size={12} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                            e.stopPropagation();
                            onMove('in');
                        }}
                    >
                        <ChevronRight size={12} />
                    </Button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                        className="hover:bg-destructive/10 hover:text-destructive ml-1 rounded-md p-1"
                    >
                        <Trash2 size={11} />
                    </button>
                </div>
            </div>
            {children}
        </div>
    );
}

const DOC_THEME = {
    colors: {
        primary: '#4f46e5',
        primaryBg: 'rgba(79, 70, 229, 0.05)',
        border: '#cbd5e1', // slate-300
        borderSoft: '#e2e8f0', // slate-200
        text: '#0f172a', // slate-900
        textMuted: '#64748b', // slate-500
        bg: '#ffffff',
        accentBg: '#f8fafc', // slate-50
        accentBgSoft: '#fbfcfd',
    },
    spacing: {
        px: '1px',
        safe: '12px',
        loose: '20px',
    },
};

const CustomStyles = () => (
    <style
        dangerouslySetInnerHTML={{
            __html: `
        .designer-element {
            transition: all 0.2s ease;
            position: relative;
            cursor: pointer;
            box-sizing: border-box;
            outline: 1px dashed transparent;
        }
        /* Specificity trick: parents will show outline, but we want to emphasize the child */
        .designer-element:hover {
            outline: 2px dashed rgba(79, 70, 229, 0.25) !important;
            z-index: 10 !important;
        }
        /* When a child is hovered, dim the parent's outline */
        .designer-element:hover .designer-element:hover {
            outline: 2px dashed rgba(79, 70, 229, 0.6) !important;
            background-color: rgba(79, 70, 229, 0.02);
        }
        
        .designer-element.selected {
            outline: 2px solid #4f46e5 !important;
            box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1) !important;
            z-index: 50 !important;
            background-color: rgba(79, 70, 229, 0.02);
        }
        
        .move-controls {
            display: none !important;
            z-index: 100 !important;
        }
        
        .designer-element:hover > .move-controls,
        .designer-element.selected > .move-controls {
            display: flex !important;
        }

        /* Ensure parent doesn't show controls if child is hovered */
        .designer-element:hover:has(.designer-element:hover) > .move-controls:not(.selected *) {
            display: none !important;
        }
    `,
        }}
    />
);

function DesignerElement({
    field,
    allFields,
    isSelected,
    onSelect,
    onMove,
    renderChildren,
    isFlex = false,
    duplicateField,
    addFieldAfter,
    removeField,
    onContextMenu,
    viewMode = 'editor',
    previewData = {},
    updatePreviewData = () => {},
}: {
    field: FormField;
    allFields: FormField[];
    isSelected: (id: string) => boolean;
    onSelect: (e: React.MouseEvent) => void;
    onMove: (dir: 'up' | 'down' | 'in' | 'out') => void;
    renderChildren: (pid: string, isFlex?: boolean) => React.ReactNode[];
    isFlex?: boolean;
    duplicateField: (id: string) => void;
    addFieldAfter: (targetId: string, typeValue: string) => void;
    removeField: (id: string) => void;
    onContextMenu?: (e: React.MouseEvent, fieldId: string) => void;
    viewMode?: 'editor' | 'filling' | 'pdf';
    previewData?: Record<string, any>;
    updatePreviewData?: (name: string, value: any) => void;
}) {
    const isEditor = viewMode === 'editor';
    const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({ 
        id: field.id,
        disabled: !isEditor
    });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 'auto',
        opacity: isDragging ? 0.3 : 1,
        display: 'inline-block',
        verticalAlign: 'top',
        // For containers with children, use minWidth to allow growth, otherwise fixed width %
        [['group', 'grid_x', 'grid_y'].includes(field.type) ? 'minWidth' : 'width']: `${field.width}%`,
        marginTop: `${field.options?.margin_top ?? 0}px`,
        marginBottom: `${field.options?.margin_bottom ?? 0}px`,
        marginLeft: `${field.options?.margin_left ?? 0}px`,
        marginRight: `${field.options?.margin_right ?? 0}px`,
        gridColumn: field.options?.grid_col_span ? `span ${field.options.grid_col_span}` : undefined,
        gridRow: field.options?.grid_row_span ? `span ${field.options.grid_row_span}` : undefined,
        cursor: isEditor ? 'pointer' : 'default',
        outline: !isEditor ? 'none' : undefined,
    };

    const getPaddingStyle = (defaults = { t: 0, b: 0, l: 0, r: 0 }) => ({
        paddingTop: `${field.options?.padding_top ?? field.options?.padding_y ?? defaults.t}px`,
        paddingBottom: `${field.options?.padding_bottom ?? field.options?.padding_y ?? defaults.b}px`,
        paddingLeft: `${field.options?.padding_left ?? field.options?.padding_x ?? defaults.l}px`,
        paddingRight: `${field.options?.padding_right ?? field.options?.padding_x ?? defaults.r}px`,
    });
    const widthClass = ''; // Width handled by native style now

    const MoveControls = () => (
        <div className="move-controls absolute top-2 right-2 z-50 items-center gap-1">
            {/* QUICK ACTIONS */}
            <div className="flex items-center gap-0.5 rounded-lg border border-indigo-200 bg-indigo-50/95 p-0.5 shadow-md backdrop-blur-sm">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700"
                    title="Add Element After"
                    onClick={(e) => {
                        e.stopPropagation();
                        addFieldAfter(field.id, field.type);
                    }}
                >
                    <Plus size={12} strokeWidth={3} />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700"
                    title="Duplicate Element"
                    onClick={(e) => {
                        e.stopPropagation();
                        duplicateField(field.id);
                    }}
                >
                    <Copy size={12} strokeWidth={3} />
                </Button>
                <div className="mx-0.5 h-4 w-px bg-indigo-200" />
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-600 hover:bg-red-50 hover:text-red-700"
                    title="Direct Delete"
                    onClick={(e) => {
                        e.stopPropagation();
                        removeField(field.id);
                    }}
                >
                    <Trash2 size={12} strokeWidth={3} />
                </Button>
            </div>

            {/* MOVEMENT ACTIONS */}
            <div className="flex items-center gap-0.5 rounded-lg border bg-white/95 p-0.5 shadow-sm backdrop-blur-sm">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                        e.stopPropagation();
                        onMove('up');
                    }}
                >
                    <ChevronUp size={12} />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                        e.stopPropagation();
                        onMove('down');
                    }}
                >
                    <ChevronDown size={12} />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                        e.stopPropagation();
                        onMove('out');
                    }}
                >
                    <ChevronLeft size={12} />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                        e.stopPropagation();
                        onMove('in');
                    }}
                >
                    <ChevronRight size={12} />
                </Button>
            </div>
            <div {...attributes} {...listeners} className="bg-background cursor-grab rounded border p-0.5 shadow-sm">
                <GripVertical size={12} />
            </div>
        </div>
    );

    // Pure Elements Only Rendering
    const isSel = isSelected(field.id);

    const getSelectionClass = (rounded = 'rounded-xl') => cn(
        'transition-all duration-200'
    );

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'designer-element group relative',
                isEditor && isSelected(field.id) && 'selected',
                isDragging && 'opacity-30',
                !isEditor && 'hover:outline-none'
            )}
            onClick={(e) => {
                if (!isEditor) return;
                e.stopPropagation();
                onSelect(e);
            }}
            onContextMenu={(e) => {
                if (!isEditor) return;
                e.stopPropagation();
                onContextMenu?.(e, field.id);
            }}
            {...(isEditor ? { ...attributes, ...listeners } : {})}
        >
            {isEditor && <MoveControls />}
            
            <div style={{ ...getPaddingStyle(), position: 'relative' }}>
                {field.type === 'group' ? (
                    <div 
                        className={cn(
                            "min-h-0 transition-colors bg-white/40",
                            field.options?.group_style !== 'frameless' && "p-0.5",
                            field.options?.border_style === 'solid' ? "border-solid border-[#000]" : (isEditor ? "border-dashed border-slate-200" : "border-none"),
                        )}
                        style={{
                            borderStyle: (field.options?.border_style as any) || undefined,
                            borderWidth: field.options?.border_width ? `${field.options.border_width}px` : (field.options?.border_style === 'solid' ? '1px' : undefined),
                            borderColor: field.options?.border_color || undefined,
                        }}
                    >
                        <div className="flex flex-wrap items-start content-start gap-0.5">{renderChildren(field.id)}</div>
                    </div>
                ) : field.type === 'grid_x' ? (
                    <div
                        className="grid w-full gap-0.5"
                        style={{
                            gridTemplateColumns: (field.options?.col_sizes || []).filter((s: string) => s).join(' ') || `repeat(${field.options?.grid_cols || 1}, 1fr)`,
                            border: isEditor ? '1px dashed #e2e8f0' : 'none',
                        }}
                    >
                        {renderChildren(field.id, true)}
                    </div>
                ) : field.type === 'grid_y' ? (
                    <div
                        className="grid w-full gap-0.5"
                        style={{
                            gridTemplateRows: (field.options?.row_sizes || []).filter((s: string) => s).join(' ') || `repeat(${field.options?.grid_rows || 1}, 1fr)`,
                            border: isEditor ? '1px dashed #e2e8f0' : 'none',
                        }}
                    >
                        {renderChildren(field.id)}
                    </div>
                ) : field.type === 'image' ? (
                    <div
                        className={cn(
                            'flex w-full',
                            field.options?.alignment === 'center' ? 'justify-center' : field.options?.alignment === 'right' ? 'justify-end' : 'justify-start'
                        )}
                    >
                        <img
                            src={field.options?.logo_url || '/storage/app/public/fr_logo.png'}
                            style={{
                                width: field.options?.logo_size ? `${field.options.logo_size}px` : '120px',
                                height: 'auto',
                            }}
                            alt="document logo"
                        />
                    </div>
                ) : field.type === 'static_text' ? (
                    <div
                        className="w-full"
                        style={{
                            fontSize: field.options?.font_size ? `${field.options.font_size}px` : '14px',
                            fontWeight: field.options?.font_weight || 'normal',
                            textAlign: (field.options?.alignment as any) || 'left',
                            color: field.options?.color || '#000',
                            whiteSpace: 'pre-wrap',
                            lineHeight: field.options?.line_height || '1.2',
                        }}
                    >
                        {field.label || 'Teks Statis'}
                    </div>
                ) : field.type === 'textfield' ? (
                    <Input
                        disabled={viewMode === 'pdf' || isEditor}
                        placeholder={field.placeholder}
                        value={viewMode === 'filling' ? (previewData[field.name] || '') : field.label}
                        onChange={(e) => viewMode === 'filling' && updatePreviewData(field.name, e.target.value)}
                        className={cn(
                            "h-7 text-[11px] font-medium transition-all shadow-none",
                            field.options?.field_style === 'dashed_bottom' 
                                ? "rounded-none border-t-0 border-l-0 border-r-0 border-b border-dashed border-slate-400 bg-transparent px-0 focus:border-indigo-500 focus:ring-0" 
                                : "border-slate-300",
                            viewMode === 'pdf' && "border-none p-0 h-auto font-bold bg-transparent"
                        )}
                    />
                ) : field.type === 'textarea' ? (
                    <Textarea
                        disabled={viewMode === 'pdf' || isEditor}
                        placeholder={field.placeholder}
                        value={viewMode === 'filling' ? (previewData[field.name] || '') : field.label}
                        onChange={(e) => viewMode === 'filling' && updatePreviewData(field.name, e.target.value)}
                        className={cn(
                            "min-h-[60px] text-[11px] font-medium transition-all shadow-none",
                            field.options?.border_style === 'solid' ? "border-solid border-slate-300" : "border-none bg-transparent",
                            viewMode === 'pdf' && "p-0 min-h-0 font-bold"
                        )}
                    />
                ) : field.type === 'checkbox' ? (
                    <div className="flex items-center gap-2 py-0.5">
                        <div 
                            className={cn(
                                "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border-2 border-slate-900 bg-white shadow-sm transition-all",
                                (viewMode === 'filling' || viewMode === 'pdf') && "cursor-pointer",
                                viewMode === 'filling' && previewData[field.name] && "bg-slate-900"
                            )}
                            onClick={() => viewMode === 'filling' && updatePreviewData(field.name, !previewData[field.name])}
                        >
                            {((viewMode === 'filling' && previewData[field.name]) || (isEditor && field.options?.default_checked)) && (
                                <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="4">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            )}
                        </div>
                        <span className="text-[10px] font-bold text-slate-800 uppercase leading-none">{field.label}</span>
                    </div>
                ) : field.type === 'radio' ? (
                    <div className="flex items-center gap-2 py-0.5">
                        <div 
                            className={cn(
                                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 bg-white shadow-sm transition-all",
                                (viewMode === 'filling' || viewMode === 'pdf') && "cursor-pointer",
                                viewMode === 'filling' && previewData[field.name] && "bg-slate-900"
                            )}
                            onClick={() => viewMode === 'filling' && updatePreviewData(field.name, true)}
                        >
                            {((viewMode === 'filling' && previewData[field.name]) || (isEditor && field.options?.default_checked)) && (
                                <div className="h-1.5 w-1.5 rounded-full bg-white" />
                            )}
                        </div>
                        <span className="text-[10px] font-bold text-slate-800 uppercase leading-none">{field.label}</span>
                    </div>
                ) : (
                    <div className="rounded border border-dashed border-slate-300 p-2 text-center text-[10px] text-slate-400 uppercase">
                        {field.type} Placeholder
                    </div>
                )}
            </div>
            
            {/* DRAG STATE INDICATOR */}
            {isOver && isEditor && !isDragging && (
                <div className="pointer-events-none absolute inset-0 -m-0.5 rounded border-2 border-indigo-400 bg-indigo-50/10 ring-2 ring-indigo-400/10 animate-pulse" />
            )}
        </div>
    );
}

FormBuilder.layout = (page: React.ReactNode) => <div className="h-screen w-full">{page}</div>;
