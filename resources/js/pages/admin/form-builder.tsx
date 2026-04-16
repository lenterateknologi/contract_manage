import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    CircleDot,
    Eye,
    FileSignature,
    GripVertical,
    Hash,
    Heading1,
    Image as ImageIcon,
    Layout,
    List,
    MousePointer2,
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
    width: '1/1' | '1/2' | '1/3' | '1/4';
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
    fields: FormField[];
}

const WIDTH_OPTIONS = [
    { label: 'Full Width (100%)', value: '1/1', cols: 'col-span-12' },
    { label: 'Half Width (50%)', value: '1/2', cols: 'col-span-6' },
    { label: 'One Third (33%)', value: '1/3', cols: 'col-span-4' },
    { label: 'One Fourth (25%)', value: '1/4', cols: 'col-span-3' },
];

const FIELD_TYPES = [
    {
        category: 'layout',
        items: [
            { value: 'kop_surat', label: 'Kop Surat', icon: ImageIcon, defaultLabel: 'Kop Surat Instansi', defaultPlaceholder: '' },
            { value: 'form_title', label: 'Judul Form', icon: Heading1, defaultLabel: 'Judul Dokumen', defaultPlaceholder: '' },
            { value: 'group', label: 'Group / Seksi', icon: Layout, defaultLabel: 'NAMA GRUP / SEKSI', defaultPlaceholder: '' },
            { value: 'sub_content', label: 'Sub Konten', icon: AlignLeft, defaultLabel: 'Sub Judul / Deskripsi Bagian', defaultPlaceholder: '' },
            {
                value: 'image',
                label: 'Gambar',
                icon: ImageIcon,
                defaultLabel: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=2117&auto=format&fit=crop',
                defaultPlaceholder: 'URL Gambar',
            },
        ],
    },
    {
        category: 'input',
        items: [
            { value: 'text', label: 'Teks Pendek', icon: Type, defaultLabel: '', defaultPlaceholder: 'Masukkan teks...' },
            { value: 'textarea', label: 'Teks Panjang', icon: AlignLeft, defaultLabel: '', defaultPlaceholder: 'Masukkan deskripsi...' },
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
        fields: (template.fields || []).map((f) => ({
            ...f,
            id: f.id || Math.random().toString(36).substr(2, 9),
            width: f.width || '1/1',
            parent_id: f.parent_id || null,
        })),
    });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [leftPanelTab, setLeftPanelTab] = useState<'elements' | 'properties'>('elements');
    const [activeLibItem, setActiveLibItem] = useState<string | null>(null);

    useEffect(() => {
        if (selectedFieldId) setLeftPanelTab('properties');
    }, [selectedFieldId]);

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

            const overField = data.fields.find((f) => f.id === overId);
            const parentId = overField?.type === 'grid_row' || overField?.type === 'group' ? overField.id : overField?.parent_id || null;

            const newField: FormField = {
                id: Math.random().toString(36).substr(2, 9),
                parent_id: parentId,
                label: (typeInfo as any)?.defaultLabel || (typeInfo as any)?.label || `New ${typeValue}`,
                name: `field_${data.fields.length + 1}`,
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
                order: data.fields.length,
            };

            const overIndex = data.fields.findIndex((f) => f.id === overId);
            const newFields = [...data.fields];
            if (overIndex !== -1) {
                newFields.splice(overIndex + 1, 0, newField);
            } else {
                newFields.push(newField);
            }

            setData(
                'fields',
                newFields.map((f, i) => ({ ...f, order: i })),
            );
            setSelectedFieldId(newField.id);
            return;
        }

        // Standard Reordering / Nesting logic
        if (activeId === overId) return;

        const activeField = data.fields.find((f) => f.id === activeId);
        const overField = data.fields.find((f) => f.id === overId);
        if (!activeField || !overField) return;

        const newFields = [...data.fields];
        const oldIndex = newFields.findIndex((f) => f.id === activeId);

        // Logical shift
        let newParentId = overField.type === 'grid_row' || overField.type === 'group' ? overField.id : overField.parent_id;
        if (activeField.type === 'grid_row' || activeField.type === 'group') newParentId = null;

        const updatedActive = { ...activeField, parent_id: newParentId };
        newFields.splice(oldIndex, 1);

        let newIndex = newFields.findIndex((f) => f.id === overId);
        if (overField.type === 'grid_row') {
            newFields.push(updatedActive);
        } else {
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
        setSelectedFieldId(newField.id);
    };

    const removeField = (id: string) => {
        const newFields = data.fields.filter((f) => f.id !== id && f.parent_id !== id);
        setData(
            'fields',
            newFields.map((f, i) => ({ ...f, order: i })),
        );
        if (selectedFieldId === id) setSelectedFieldId(null);
    };

    const updateField = (id: string, key: keyof FormField, value: any) => {
        const newFields = data.fields.map((f) => (f.id === id ? { ...f, [key]: value } : f));
        setData('fields', newFields);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.form-templates.save', template.id));
    };

    const selectedField = data.fields.find((f) => f.id === selectedFieldId);

    const fieldTree = useMemo(() => {
        const roots = data.fields.filter((f) => !f.parent_id);
        const getChildren = (pid: string) => data.fields.filter((f) => f.parent_id === pid);
        return roots.map((root) => ({ ...root, children: getChildren(root.id) }));
    }, [data.fields]);

    const allFieldIds = useMemo(() => data.fields.map((f) => f.id), [data.fields]);

    return (
        <div className="bg-background text-foreground font-inter flex h-screen flex-col overflow-hidden">
            <Head title={template.id ? `Edit ${template.name}` : 'Form Builder'} />

            <form onSubmit={handleSave} className="flex h-full flex-col overflow-hidden">
                <header className="bg-background z-20 flex h-14 shrink-0 items-center justify-between border-b px-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                            <Link href={route('admin.form-templates.index')}>
                                <ArrowLeft size={16} />
                            </Link>
                        </Button>
                        <div className="flex flex-col">
                            <h1 className="translate-y-0.5 text-xs font-black tracking-tight uppercase">{data.name}</h1>
                            <span className="text-muted-foreground text-[9px] leading-none font-bold tracking-widest uppercase">
                                Interactive Nested Builder
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {template.id && (
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="h-8 text-[11px] font-black tracking-wider text-green-600 uppercase hover:bg-green-50 hover:text-green-700"
                            >
                                <a href={route('admin.form-templates.fill', template.id)} target="_blank" rel="noopener noreferrer">
                                    <Eye size={14} className="mr-1.5" /> Isi Form
                                </a>
                            </Button>
                        )}
                        <Button
                            type="submit"
                            size="sm"
                            className="bg-primary h-8 text-[11px] font-black tracking-wider uppercase shadow-lg"
                            disabled={processing}
                        >
                            <Save size={14} className="mr-1.5" /> {processing ? 'Saving...' : 'Save Template'}
                        </Button>
                    </div>
                </header>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <main className="flex flex-1 overflow-hidden">
                        {/* LEFT SIDEBAR */}
                        <aside className="bg-background z-20 flex w-80 shrink-0 flex-col overflow-hidden border-r">
                            <div className="flex border-b">
                                {['elements', 'properties'].map((tab) => (
                                    <button
                                        key={tab}
                                        type="button"
                                        onClick={() => setLeftPanelTab(tab as any)}
                                        className={cn(
                                            'flex-1 border-b-2 py-3 text-[10px] font-black tracking-widest uppercase transition-all',
                                            leftPanelTab === tab
                                                ? 'border-primary text-primary bg-primary/5'
                                                : 'text-muted-foreground border-transparent',
                                        )}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                            <ScrollArea className="flex-1">
                                {leftPanelTab === 'elements' ? (
                                    <div className="space-y-8 p-5">
                                        {FIELD_TYPES.map((cat) => (
                                            <div key={cat.category}>
                                                <h3 className="text-muted-foreground/60 mb-3 text-[9px] font-black tracking-[0.2em] uppercase">
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
                                    <div className="p-5">
                                        {selectedField ? (
                                            <div className="space-y-6">
                                                <div className="space-y-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[9px] font-black tracking-wider uppercase">
                                                            {selectedField.type === 'kop_surat' ? 'Company Name' : 'Label / Content'}
                                                        </Label>
                                                        <Input
                                                            value={selectedField.label}
                                                            onChange={(e) => updateField(selectedField.id, 'label', e.target.value)}
                                                            className="h-8 text-[11px] font-bold"
                                                        />
                                                    </div>
                                                    {selectedField.type === 'kop_surat' && (
                                                        <>
                                                            <div className="space-y-1.5">
                                                                <Label className="text-[9px] font-black tracking-wider uppercase">Logo Image</Label>
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
                                                                        className="bg-muted border-muted-foreground/30 hover:border-primary/50 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed transition-colors"
                                                                    >
                                                                        {selectedField.options?.logo_url ? (
                                                                            <img
                                                                                src={selectedField.options.logo_url}
                                                                                alt="Logo Preview"
                                                                                className="h-full w-full object-contain"
                                                                            />
                                                                        ) : (
                                                                            <ImageIcon size={16} className="opacity-20" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 space-y-2">
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            id="logo-upload"
                                                                            className="hidden"
                                                                            onChange={(e) => {
                                                                                const file = e.target.files?.[0];
                                                                                if (file) {
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
                                                                        />
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="h-8 w-full text-[10px] font-bold uppercase"
                                                                            asChild
                                                                        >
                                                                            <label htmlFor="logo-upload" className="cursor-pointer">
                                                                                Upload Logo
                                                                            </label>
                                                                        </Button>
                                                                        <div className="flex gap-1">
                                                                            {['left', 'right'].map((pos) => (
                                                                                <Button
                                                                                    key={pos}
                                                                                    type="button"
                                                                                    variant={
                                                                                        (selectedField.options?.logo_position || 'left') === pos
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
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <div className="flex items-center justify-between">
                                                                    <Label className="text-[9px] font-black tracking-wider uppercase">
                                                                        Logo Size (px)
                                                                    </Label>
                                                                    <span className="text-[9px] font-bold">
                                                                        {selectedField.options?.logo_size || 80}px
                                                                    </span>
                                                                </div>
                                                                <input
                                                                    type="range"
                                                                    min="40"
                                                                    max="200"
                                                                    step="10"
                                                                    value={selectedField.options?.logo_size || 80}
                                                                    onChange={(e) =>
                                                                        updateField(selectedField.id, 'options', {
                                                                            ...selectedField.options,
                                                                            logo_size: parseInt(e.target.value),
                                                                        })
                                                                    }
                                                                    className="bg-muted accent-primary h-1.5 w-full cursor-pointer appearance-none rounded-lg"
                                                                />
                                                            </div>
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
                                                        </>
                                                    )}
                                                    {!['kop_surat', 'form_title', 'grid_row', 'sub_content', 'image'].includes(
                                                        selectedField.type,
                                                    ) && (
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[9px] font-black tracking-wider uppercase">Placeholder</Label>
                                                            <Input
                                                                value={selectedField.placeholder}
                                                                onChange={(e) => updateField(selectedField.id, 'placeholder', e.target.value)}
                                                                className="h-8 text-[11px]"
                                                            />
                                                        </div>
                                                    )}
                                                    {selectedField.type === 'image' && (
                                                        <div className="space-y-4">
                                                            <div className="space-y-1.5">
                                                                <Label className="text-[9px] font-black tracking-wider uppercase">Image Upload</Label>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
                                                                        {selectedField.label ? (
                                                                            <img
                                                                                src={selectedField.label}
                                                                                alt="Preview"
                                                                                className="h-full w-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <ImageIcon size={16} className="opacity-20" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            id="generic-image-upload"
                                                                            className="hidden"
                                                                            onChange={(e) => {
                                                                                const file = e.target.files?.[0];
                                                                                if (file) {
                                                                                    const reader = new FileReader();
                                                                                    reader.onloadend = () => {
                                                                                        updateField(selectedField.id, 'label', reader.result);
                                                                                    };
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
                                                                                Upload Image
                                                                            </label>
                                                                        </Button>
                                                                    </div>
                                                                </div>
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
                                                                    min="50"
                                                                    max="200"
                                                                    step="10"
                                                                    value={selectedField.options?.image_scale || 100}
                                                                    onChange={(e) =>
                                                                        updateField(selectedField.id, 'options', {
                                                                            ...selectedField.options,
                                                                            image_scale: parseInt(e.target.value),
                                                                        })
                                                                    }
                                                                    className="bg-muted accent-primary h-1.5 w-full cursor-pointer appearance-none rounded-lg"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[9px] font-black tracking-wider uppercase">Width (A4 Columns)</Label>
                                                        <Select
                                                            value={selectedField.width}
                                                            onValueChange={(val: any) => updateField(selectedField.id, 'width', val)}
                                                        >
                                                            <SelectTrigger className="h-8 text-[11px]">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {WIDTH_OPTIONS.map((opt) => (
                                                                    <SelectItem key={opt.value} value={opt.value} className="text-[11px]">
                                                                        {opt.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    className="h-8 w-full text-[10px] font-black tracking-wider uppercase"
                                                    onClick={() => removeField(selectedField.id)}
                                                >
                                                    <Trash2 size={12} className="mr-2" /> Remove Element
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center py-20 text-center opacity-30">
                                                <MousePointer2 size={24} className="mb-2" />
                                                <p className="text-[10px] font-black tracking-widest uppercase">Select an element</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </ScrollArea>
                        </aside>

                        {/* CENTER: STRUCTURAL CANVAS */}
                        <section className="bg-muted/5 flex w-80 flex-col overflow-hidden border-r">
                            <div className="bg-background flex shrink-0 items-center justify-between border-b p-4">
                                <h2 className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                                    <Layout size={12} className="text-primary" /> Structure
                                </h2>
                            </div>
                            <ScrollArea className="flex-1">
                                <div className="p-4">
                                    <SortableContext items={allFieldIds} strategy={verticalListSortingStrategy}>
                                        <div className="space-y-2">
                                            {fieldTree.map((field) => (
                                                <SortableField
                                                    key={field.id}
                                                    field={field}
                                                    isSelected={selectedFieldId === field.id}
                                                    onSelect={() => setSelectedFieldId(field.id)}
                                                    onRemove={() => removeField(field.id)}
                                                >
                                                    {field.children.length > 0 && (
                                                        <div className="border-primary/10 mt-2 ml-6 space-y-1 border-l-2 pl-2">
                                                            {field.children.map((child) => (
                                                                <div
                                                                    key={child.id}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedFieldId(child.id);
                                                                    }}
                                                                    className={cn(
                                                                        'cursor-pointer rounded-lg border p-2 text-[10px] font-bold',
                                                                        selectedFieldId === child.id
                                                                            ? 'bg-primary/5 border-primary text-primary'
                                                                            : 'bg-background border-border',
                                                                    )}
                                                                >
                                                                    {child.label}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </SortableField>
                                            ))}
                                        </div>
                                    </SortableContext>
                                </div>
                            </ScrollArea>
                        </section>

                        {/* RIGHT: INTERACTIVE A4 DESIGNER */}
                        <section className="bg-muted/20 relative flex flex-1 flex-col overflow-hidden">
                            <div className="bg-background z-10 flex items-center justify-between border-b p-4 shadow-sm">
                                <h2 className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                                    <Eye size={12} className="text-primary" /> A4 Designer
                                </h2>
                            </div>
                            <ScrollArea className="flex-1 bg-[#f0f0f5]">
                                <div className="flex min-h-full justify-center py-12">
                                    <div className="border-border/20 mb-20 flex min-h-[1123px] w-[794px] flex-col rounded-sm border bg-white p-[15mm] shadow-2xl">
                                        <SortableContext items={allFieldIds} strategy={verticalListSortingStrategy}>
                                            <div className="grid grid-cols-12 gap-x-6 gap-y-4">
                                                {fieldTree.map((field) => (
                                                    <DesignerElement
                                                        key={field.id}
                                                        field={field}
                                                        isSelected={selectedFieldId === field.id}
                                                        onSelect={() => setSelectedFieldId(field.id)}
                                                        renderChildren={(pid: string) =>
                                                            data.fields
                                                                .filter((f) => f.parent_id === pid)
                                                                .map((child) => (
                                                                    <DesignerElement
                                                                        key={child.id}
                                                                        field={child}
                                                                        isSelected={selectedFieldId === child.id}
                                                                        onSelect={() => setSelectedFieldId(child.id)}
                                                                    />
                                                                ))
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        </SortableContext>
                                    </div>
                                </div>
                            </ScrollArea>
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
                'hover:bg-primary/5 group h-10 touch-none justify-start rounded-xl border-dashed px-3 text-[11px] font-bold',
                isDragging && 'ring-primary border-solid opacity-50 ring-2',
            )}
        >
            <type.icon size={14} className="mr-2.5 opacity-40 group-hover:opacity-100" />
            {type.label}
            <Plus size={10} className="ml-auto opacity-20" />
        </Button>
    );
}

function SortableField({ field, isSelected, onSelect, onRemove, children }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 100 : 'auto', opacity: isDragging ? 0.3 : 1 };
    return (
        <div ref={setNodeRef} style={style} className="group">
            <div
                onClick={onSelect}
                className={cn(
                    'bg-background relative flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-all',
                    isSelected ? 'border-primary ring-primary/10 shadow-lg ring-1' : 'border-border/50 shadow-sm',
                )}
            >
                <div {...attributes} {...listeners} className="cursor-grab p-1 opacity-20 hover:opacity-100">
                    <GripVertical size={14} />
                </div>
                <div className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-black tracking-tight uppercase">{field.label}</span>
                    <span className="text-muted-foreground text-[8px] font-black uppercase opacity-60">{field.type}</span>
                </div>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="hover:bg-destructive/5 hover:text-destructive rounded-lg p-1.5 opacity-0 group-hover:opacity-100"
                >
                    <Trash2 size={12} />
                </button>
            </div>
            {children}
        </div>
    );
}

function DesignerElement({ field, isSelected, onSelect, renderChildren }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 100 : 'auto', opacity: isDragging ? 0.3 : 1 };
    const widthClass = WIDTH_OPTIONS.find((opt) => opt.value === field.width)?.cols || 'col-span-12';

    if (field.type === 'kop_surat')
        return (
            <div
                ref={setNodeRef}
                style={style}
                onClick={onSelect}
                className={cn(
                    'group hover:border-primary/20 relative col-span-12 cursor-pointer rounded-xl border-2 border-dashed border-transparent p-4',
                    isSelected && 'border-primary/40 bg-primary/5',
                )}
            >
                <div
                    className={cn(
                        'mb-4 flex items-center gap-8 border-b-[3px] border-slate-900 pb-6',
                        field.options?.logo_position === 'right' && 'flex-row-reverse',
                    )}
                >
                    <div
                        style={{ width: field.options?.logo_size || 80, height: field.options?.logo_size || 80 }}
                        className="flex shrink-0 items-center justify-center overflow-hidden border border-transparent transition-all"
                    >
                        {field.options?.logo_url ? (
                            <img src={field.options.logo_url} alt="Logo" className="h-full w-full object-contain" />
                        ) : (
                            <span className="font-black text-slate-300 italic" style={{ fontSize: (field.options?.logo_size || 80) / 3 }}>
                                LT
                            </span>
                        )}
                    </div>
                    <div className={cn('flex-1 text-left', field.options?.logo_position === 'right' && 'text-right')}>
                        <h1 className="text-xl leading-tight font-black tracking-tight text-slate-900 uppercase">{field.label || 'Company Name'}</h1>
                        <div className="mt-2 space-y-0.5 text-[10px] font-bold tracking-wide whitespace-pre-line text-slate-600 uppercase">
                            {field.options?.description || 'Address and Contact Details'}
                        </div>
                    </div>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100" {...attributes} {...listeners}>
                    <GripVertical size={12} />
                </div>
            </div>
        );

    if (field.type === 'form_title')
        return (
            <div
                ref={setNodeRef}
                style={style}
                onClick={onSelect}
                className={cn(
                    'group hover:border-primary/20 relative col-span-12 cursor-pointer rounded-xl border-2 border-dashed border-transparent py-3 text-center',
                    isSelected && 'border-primary/40 bg-primary/5',
                )}
            >
                <h2 className="text-2xl font-black tracking-tight uppercase">{field.label}</h2>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100" {...attributes} {...listeners}>
                    <GripVertical size={12} />
                </div>
            </div>
        );

    if (field.type === 'sub_content')
        return (
            <div
                ref={setNodeRef}
                style={style}
                onClick={onSelect}
                className={cn(
                    'group hover:border-primary/20 relative cursor-pointer rounded-xl border-2 border-dashed border-transparent py-1',
                    widthClass,
                    isSelected && 'border-primary/40 bg-primary/5',
                )}
            >
                <p className="text-xs leading-normal font-medium text-slate-600">{field.label}</p>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100" {...attributes} {...listeners}>
                    <GripVertical size={12} />
                </div>
            </div>
        );

    if (field.type === 'group')
        return (
            <div
                ref={setNodeRef}
                style={style}
                onClick={onSelect}
                className={cn(
                    'group hover:border-primary/20 relative col-span-12 cursor-pointer rounded-xl border-2 border-dashed border-transparent bg-slate-50/50 px-3 py-4',
                    isSelected && 'border-primary/40 bg-primary/5',
                )}
            >
                {field.label && (
                    <div className="mb-4 flex items-center gap-3">
                        <div className="h-px flex-1 bg-slate-900/10"></div>
                        <h3 className="px-3 text-[11px] font-black tracking-widest text-slate-800 uppercase">{field.label}</h3>
                        <div className="h-px flex-1 bg-slate-900/10"></div>
                    </div>
                )}
                <div className="grid min-h-[30px] grid-cols-12 gap-x-4 gap-y-3">{renderChildren(field.id)}</div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100" {...attributes} {...listeners}>
                    <GripVertical size={12} />
                </div>
            </div>
        );

    if (field.type === 'image')
        return (
            <div
                ref={setNodeRef}
                style={style}
                onClick={onSelect}
                className={cn(
                    'group hover:border-primary/20 relative flex cursor-pointer justify-center overflow-hidden rounded-xl border-2 border-dashed border-transparent py-4',
                    widthClass,
                    isSelected && 'border-primary/40 bg-primary/5',
                )}
            >
                <img
                    src={field.label}
                    alt="Preview"
                    style={{ width: `${field.options?.image_scale || 100}%` }}
                    className="h-auto rounded-lg object-contain transition-all"
                />
                <div
                    className="absolute top-2 right-2 rounded bg-white/80 p-1 opacity-0 backdrop-blur-sm group-hover:opacity-100"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical size={12} />
                </div>
            </div>
        );

    if (field.type === 'signature_box')
        return (
            <div
                ref={setNodeRef}
                style={style}
                onClick={onSelect}
                className={cn(
                    'group relative cursor-pointer rounded-xl p-1 transition-all',
                    widthClass,
                    isSelected ? 'ring-primary ring-2' : 'hover:ring-muted shadow-sm ring-1 ring-transparent',
                )}
            >
                <div className="overflow-hidden rounded border border-slate-950 bg-white">
                    <div className="border-b border-slate-950 bg-slate-50 px-2 py-1 text-center text-[9px] font-black tracking-tight text-slate-900 uppercase">
                        {field.label}
                    </div>
                    <div className="flex h-20 flex-col items-center justify-end p-2">
                        <div className="text-[10px] font-black tracking-tighter text-slate-900 uppercase">{field.placeholder || ''}</div>
                    </div>
                    <div className="border-t border-slate-950 bg-slate-50 px-2 py-1 text-[8px] font-bold text-slate-400 italic">
                        Tgl. ________________
                    </div>
                </div>
                <div
                    className="bg-background absolute top-2 right-2 rounded border p-1 opacity-0 shadow-sm group-hover:opacity-100"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical size={10} />
                </div>
            </div>
        );

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={onSelect}
            className={cn(
                'group relative cursor-pointer rounded-xl p-1 transition-all',
                widthClass,
                isSelected ? 'ring-primary ring-2' : 'hover:ring-muted ring-1 ring-transparent',
            )}
        >
            <div className="space-y-1">
                <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black tracking-wide uppercase">
                        {field.label}
                        {field.is_required && '*'}
                    </Label>
                    <div {...attributes} {...listeners} className="bg-background rounded border p-1 opacity-0 shadow-sm group-hover:opacity-100">
                        <GripVertical size={10} />
                    </div>
                </div>
                {['text', 'number', 'date'].includes(field.type) && (
                    <Input type={field.type} placeholder={field.placeholder} disabled className="h-7 text-[10px]" />
                )}
            </div>
        </div>
    );
}

FormBuilder.layout = (page: React.ReactNode) => <div className="h-screen w-full">{page}</div>;
