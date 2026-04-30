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
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Head, Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, Download, FileText, Grid, Layout, List, Loader2, Plus, Save, Trash2 } from 'lucide-react';
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
    };
});

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
        <div className="font-sans bg-muted/10 text-foreground flex h-screen flex-col overflow-hidden">
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
                            <h1 className="text-foreground text-sm font-semibold font-sans tracking-tight uppercase">{data.name}</h1>
                            <div className="flex items-center gap-1.5 opacity-60">
                                <Layout size={10} className="text-primary" />
                                <span className="text-[9px] font-bold tracking-[0.2em] uppercase">Visual Multi-Block Designer</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
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
                                    <h2 className="text-muted-foreground/60 text-[10px] font-semibold font-sans tracking-[0.2em] uppercase">Workspace</h2>
                                    <div className="bg-primary/10 rounded-lg px-2 py-0.5">
                                        <span className="text-primary text-[8px] font-semibold font-sans uppercase">v2.0</span>
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
                                            <span className="hidden text-[10px] font-semibold font-sans tracking-tight uppercase sm:inline-block">
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
                                <h1 className="text-muted-foreground text-[10px] font-semibold font-sans tracking-[0.2em] uppercase">
                                    {selectedFieldId ? 'Block Properties' : 'Template Settings'}
                                </h1>
                                <Layout size={12} className="text-primary opacity-50" />
                            </div>
                            <ScrollArea className="flex-1">
                                <div className="p-5">
                                    <PropertiesPanel
                                        selectedField={selectedField}
                                        updateField={updateField}
                                        templateData={data}
                                        setTemplateData={setData}
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
                            <div className="bg-primary border-primary-foreground/20 flex items-center gap-3 rounded-2xl border-2 px-6 py-4 text-[10px] font-semibold font-sans text-white uppercase shadow-2xl backdrop-blur-md">
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
            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[10px] font-semibold font-sans uppercase transition-colors',
            variant === 'destructive' ? 'text-red-500 hover:bg-red-50' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
    >
        <Icon size={12} />
        {label}
    </button>
);

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
                <p className="text-[10px] font-semibold font-sans tracking-[0.2em] uppercase">Lepas untuk menghapus</p>
                <p className="text-[8px] font-bold uppercase opacity-60">Elemen akan dihapus permanen</p>
            </div>
        </div>
    );
};

FormBuilder.layout = (page: React.ReactNode) => page;

export default FormBuilder;
