import React, { useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { FormInput } from '@/components/ui/inputs/FormInput';
import { FormTextarea } from '@/components/ui/inputs/FormTextarea';
import { Button } from '@/components/ui/buttons/Button';
import { Label } from '@/components/ui/forms/Label';
import { ArrowLeft } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const COMMON_ICONS = [
    'Clock', 'CheckCircle2', 'XCircle', 'AlertCircle', 'AlertTriangle',
    'FileText', 'FileCheck', 'FileX', 'FileClock', 'FileEdit', 'FileQuestion',
    'Folder', 'FolderClosed', 'FolderOpen', 'Inbox', 'Send', 'User', 'Users',
    'Settings', 'Shield', 'Database', 'Key', 'Lock', 'Unlock', 'Eye', 'EyeOff',
    'Trash2', 'Plus', 'Check', 'X', 'HelpCircle', 'Info', 'CheckSquare',
    'Square', 'Minus', 'ChevronRight', 'ChevronDown', 'Search'
];

function IconPicker({ value, onChange }: { value: string; onChange: (val: string) => void }) {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredIcons = COMMON_ICONS.filter(icon =>
        icon.toLowerCase().includes(search.toLowerCase())
    );

    const SelectedIcon = value && (LucideIcons as any)[value]
        ? (LucideIcons as any)[value]
        : null;

    return (
        <div ref={containerRef} className="relative w-full">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-11 w-full items-center justify-between rounded-lg border border-surface-border bg-surface-base px-3 py-2 text-sm font-semibold shadow-xs hover:bg-surface-muted/30 transition-all text-left"
            >
                <div className="flex items-center gap-2">
                    {SelectedIcon ? (
                        <SelectedIcon className="h-4 w-4 text-primary" />
                    ) : (
                        <div className="h-4 w-4 rounded-full border border-dashed border-muted-foreground/50" />
                    )}
                    <span className={value ? 'text-foreground font-semibold' : 'text-muted-foreground font-medium'}>
                        {value || 'Pilih Ikon...'}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {value && (
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange('');
                            }}
                            className="p-1 rounded-md hover:bg-rose-50 text-text-soft/60 hover:text-rose-500 transition-all cursor-pointer"
                            title="Hapus Ikon"
                        >
                            <LucideIcons.X className="h-3.5 w-3.5" />
                        </span>
                    )}
                    <LucideIcons.ChevronDown className="h-4 w-4 text-text-soft/60 animate-all duration-200" />
                </div>
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border border-surface-border bg-surface-base shadow-lg p-2 flex flex-col gap-2 max-h-60 overflow-y-auto">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari ikon..."
                        className="flex h-9 w-full rounded-md border border-surface-border bg-surface-base px-3 py-1 text-xs outline-hidden focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <div className="grid grid-cols-4 gap-1 overflow-y-auto pr-1">
                        {filteredIcons.map((iconName) => {
                            const Icon = (LucideIcons as any)[iconName];
                            return (
                                <button
                                    key={iconName}
                                    type="button"
                                    onClick={() => {
                                        onChange(iconName);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    className={`flex flex-col items-center justify-center p-2 rounded-md hover:bg-primary/10 hover:text-primary transition-all gap-1 text-[10px] font-semibold text-center border border-transparent ${value === iconName ? 'bg-primary/10 text-primary border-primary/20' : 'text-text-main'
                                        }`}
                                >
                                    {Icon && <Icon className="h-4 w-4" />}
                                    <span className="truncate w-full text-[9px]">{iconName}</span>
                                </button>
                            );
                        })}
                        {filteredIcons.length === 0 && (
                            <div className="col-span-full py-4 text-center text-xs font-semibold text-text-soft">
                                Tidak ada ikon ditemukan
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

interface Props {
    resourceSlug: string;
    title: string;
    formSchema: any[];
    formColumns?: number;
    record: any | null;
}

export default function ResourceForm({ resourceSlug, title, formSchema, formColumns = 1, record }: Props) {
    const isEdit = !!record;

    // Helper to get flattened fields for initial state and validation
    const getFlattenedFields = (schema: any[]): any[] => {
        let fields: any[] = [];
        schema.forEach((item) => {
            if (item.isGroup && Array.isArray(item.schema)) {
                fields = [...fields, ...getFlattenedFields(item.schema)];
            } else {
                fields.push(item);
            }
        });
        return fields;
    };

    const flattenedFields = getFlattenedFields(formSchema);

    // Initial form state based on schema and existing record values
    const initialFormState = flattenedFields.reduce((acc: any, field: any) => {
        acc[field.name] = isEdit ? (record[field.name] ?? '') : (field.defaultValue ?? '');
        return acc;
    }, {});

    const { data, setData, post, put, errors, processing } = useForm(initialFormState);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            put(`/admin/core/${resourceSlug}/${record.id}`);
        } else {
            post(`/admin/core/${resourceSlug}`);
        }
    };

    // Dynamic grid columns configuration
    const getGridClass = () => {
        if (formColumns === 2) return 'grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 w-full';
        if (formColumns === 3) return 'grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5 w-full';
        if (formColumns >= 4) return 'grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-5 w-full';
        return 'flex flex-col gap-5 w-full';
    };

    const getSpanClass = (field: any) => {
        if (formColumns <= 1) return 'w-full';
        if (!field.columnSpan || field.columnSpan === 1) return 'col-span-1';
        if (field.columnSpan >= formColumns) return 'col-span-full';
        return `md:col-span-${field.columnSpan}`;
    };

    const renderField = (field: any) => {
        const IconComponent = field.icon && (LucideIcons as any)[field.icon]
            ? (LucideIcons as any)[field.icon]
            : undefined;

        return (
            <div key={field.name} className={getSpanClass(field)}>
                {field.type === 'text' && (
                    <FormInput
                        label={field.label}
                        value={data[field.name]}
                        onChange={(e) => setData(field.name, e.target.value)}
                        error={errors[field.name]}
                        required={field.required}
                        placeholder={field.placeholder}
                        icon={IconComponent}
                    />
                )}
                {field.type === 'textarea' && (
                    <FormTextarea
                        label={field.label}
                        value={data[field.name]}
                        onChange={(e) => setData(field.name, e.target.value)}
                        error={errors[field.name]}
                        required={field.required}
                        placeholder={field.placeholder}
                    />
                )}
                {field.type === 'color' && (
                    <div className="flex flex-col gap-1.5 w-full">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase px-0.5">
                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </Label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={data[field.name] || '#ffffff'}
                                onChange={(e) => setData(field.name, e.target.value)}
                                className="h-11 w-14 cursor-pointer rounded-lg border border-surface-border bg-surface-base p-1"
                                required={field.required}
                            />
                            <input
                                type="text"
                                value={data[field.name] || ''}
                                onChange={(e) => setData(field.name, e.target.value)}
                                className="flex h-11 w-full rounded-lg border border-surface-border bg-surface-base px-3 py-2 text-sm font-semibold focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                                placeholder="#hexcode"
                            />
                            {data[field.name] && (
                                <button
                                    type="button"
                                    onClick={() => setData(field.name, '')}
                                    className="h-11 px-3 flex items-center justify-center rounded-lg border border-surface-border bg-surface-base hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 text-text-soft/60 transition-all shadow-xs"
                                    title="Hapus Warna"
                                >
                                    <LucideIcons.X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        {errors[field.name] && (
                            <span className="text-rose-500 text-[10px] font-bold uppercase mt-1">
                                {errors[field.name]}
                            </span>
                        )}
                    </div>
                )}
                {field.type === 'icon' && (
                    <div className="flex flex-col gap-1.5 w-full relative">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase px-0.5">
                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </Label>
                        <IconPicker
                            value={data[field.name] || ''}
                            onChange={(val) => setData(field.name, val)}
                        />
                        {errors[field.name] && (
                            <span className="text-rose-500 text-[10px] font-bold uppercase mt-1">
                                {errors[field.name]}
                            </span>
                        )}
                    </div>
                )}
                {field.type === 'select' && (
                    <div className="flex flex-col gap-1.5 w-full">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase px-0.5">
                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </Label>
                        <div className="relative w-full">
                            <select
                                value={data[field.name]}
                                onChange={(e) => setData(field.name, e.target.value)}
                                className={`flex h-11 w-full appearance-none rounded-lg border border-surface-border bg-surface-base pl-3 pr-10 py-2 text-sm font-sans font-semibold focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50 disabled:border-slate-200 ${data[field.name] ? 'text-foreground' : 'text-muted-foreground'
                                    }`}
                                required={field.required}
                            >
                                <option value="" className="text-muted-foreground">
                                    {field.placeholder || `Pilih ${field.label.toLowerCase()}...`}
                                </option>
                                {(Array.isArray(field.options) ? field.options : Object.entries(field.options || {})).map((option: any) => {
                                    const val = Array.isArray(field.options) ? option : option[0];
                                    const label = Array.isArray(field.options) ? option : option[1];
                                    return (
                                        <option key={val} value={val} className="text-foreground">
                                            {label}
                                        </option>
                                    );
                                })}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                <LucideIcons.ChevronDown className="h-4 w-4 text-text-soft/60" />
                            </div>
                        </div>
                        {errors[field.name] && (
                            <span className="text-rose-500 text-[10px] font-bold uppercase mt-1">
                                {errors[field.name]}
                            </span>
                        )}
                    </div>
                )}
                {field.type === 'switch' && (
                    <div className="flex flex-col gap-1.5 w-full">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase px-0.5">
                            {field.label}
                        </Label>
                        <div className="flex items-center h-11">
                            <button
                                type="button"
                                role="switch"
                                aria-checked={!!data[field.name]}
                                onClick={() => setData(field.name, !data[field.name])}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 outline-hidden active:scale-95 ${data[field.name] ? 'bg-primary dark:bg-white' : 'bg-slate-200 dark:bg-slate-800'
                                    }`}
                            >
                                <span
                                    className={`pointer-events-none block h-4 w-4 rounded-full shadow-lg transition-transform duration-300 ring-0 ${data[field.name] ? 'translate-x-6 bg-white dark:bg-primary' : 'translate-x-1 bg-white dark:bg-white/50'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <Head title={isEdit ? `Edit ${title}` : `Tambah ${title}`} />

            <div className="flex flex-col gap-6 p-6 w-full p-2">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/admin/core/${resourceSlug}`}
                        className="p-2 border border-surface-border rounded-xl hover:bg-surface-muted transition-all text-text-soft"
                    >
                        <ArrowLeft size={16} />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-text-main">
                            {isEdit ? `Edit ${title}` : `Tambah ${title}`}
                        </h1>
                        <p className="text-xs text-text-soft">
                            {isEdit ? 'Ubah informasi data yang sudah ada.' : 'Tambahkan data master baru ke sistem.'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
                    <div className={getGridClass()}>
                        {formSchema.map((field: any) => {
                            if (field.isGroup) {
                                const GroupIcon = field.icon && (LucideIcons as any)[field.icon]
                                    ? (LucideIcons as any)[field.icon]
                                    : undefined;

                                return (
                                    <div key={field.label} className="col-span-full border border-surface-border bg-surface-muted/5 dark:bg-surface-muted/10 rounded-2xl p-6 flex flex-col gap-5">
                                        <div className="flex items-center gap-2 pb-3 border-b border-surface-border">
                                            {GroupIcon && <GroupIcon className="h-4 w-4 text-primary shrink-0 opacity-80" />}
                                            <div>
                                                <h3 className="text-xs font-bold uppercase tracking-wider text-text-main">{field.label}</h3>
                                                {field.description && (
                                                    <p className="text-[11px] text-text-soft mt-0.5">{field.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className={getGridClass()}>
                                            {field.schema.map((subField: any) => renderField(subField))}
                                        </div>
                                    </div>
                                );
                            }

                            return renderField(field);
                        })}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-surface-border mt-4">
                        <Link href={`/admin/core/${resourceSlug}`}>
                            <Button type="button" variant="white">
                                Batal
                            </Button>
                        </Link>
                        <Button type="submit" variant="primary" disabled={processing}>
                            Simpan Data
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
