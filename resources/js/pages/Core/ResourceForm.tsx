import React, { useState, useEffect } from 'react';
import { Head, useForm, Link, router } from '@inertiajs/react';
import { FormInput } from '@/components/ui/inputs/FormInput';
import { FormTextarea } from '@/components/ui/inputs/FormTextarea';
import { Button } from '@/components/ui/buttons/Button';
import { Label } from '@/components/ui/forms/Label';
import { ArrowLeft } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { TreeSelect } from '@/components/ui/selection/TreeSelect';
import { Checkbox } from '@/components/ui/selection/Checkbox';

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
                                    className={`flex flex-col items-center justify-center p-2 rounded-md hover:bg-primary/10 hover:text-primary transition-all gap-1 text-[10px] font-semibold text-center border border-transparent ${
                                        value === iconName ? 'bg-primary/10 text-primary border-primary/20' : 'text-text-main'
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
    const [activeTab, setActiveTab] = useState<'info' | 'docs'>('info');

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
        let val = isEdit ? record[field.name] : field.defaultValue;
        if (field.type === 'checkbox_list') {
            val = Array.isArray(val) ? val : [];
        } else {
            val = val ?? '';
        }
        acc[field.name] = val;
        return acc;
    }, {});

    const { data, setData, post, put, errors, processing } = useForm(initialFormState);

    // ponytail: disable template selection if input mechanism is upload (digital) or none
    const isFieldDisabled = (fieldName: string) => {
        if (fieldName === 'f1_form_template_id') return data.f1_input_mechanism === 'digital' || data.f1_input_mechanism === 'none';
        if (fieldName === 'f2_form_template_id') return data.f2_input_mechanism === 'digital' || data.f2_input_mechanism === 'none';
        if (fieldName === 'contract_form_template_id') return data.contract_input_mechanism === 'digital' || data.contract_input_mechanism === 'none';
        return false;
    };

    useEffect(() => {
        if ((data.f1_input_mechanism === 'digital' || data.f1_input_mechanism === 'none') && data.f1_form_template_id !== '') {
            setData('f1_form_template_id', '');
        }
    }, [data.f1_input_mechanism]);

    useEffect(() => {
        if ((data.f2_input_mechanism === 'digital' || data.f2_input_mechanism === 'none') && data.f2_form_template_id !== '') {
            setData('f2_form_template_id', '');
        }
    }, [data.f2_input_mechanism]);

    useEffect(() => {
        if ((data.contract_input_mechanism === 'digital' || data.contract_input_mechanism === 'none') && data.contract_form_template_id !== '') {
            setData('contract_form_template_id', '');
        }
    }, [data.contract_input_mechanism]);

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
                                className={`flex h-11 w-full appearance-none rounded-lg border border-surface-border bg-surface-base pl-3 pr-10 py-2 text-sm font-sans font-semibold focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50 disabled:border-slate-200 ${
                                    data[field.name] ? 'text-foreground' : 'text-muted-foreground'
                                }`}
                                required={field.required}
                                disabled={isFieldDisabled(field.name)}
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
                {field.type === 'tree_select' && (
                    <div className="flex flex-col gap-1.5 w-full">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase px-0.5">
                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </Label>
                        <TreeSelect
                            value={data[field.name]}
                            onValueChange={(val) => setData(field.name, val)}
                            items={field.options}
                            placeholder={field.placeholder || `Pilih ${field.label}...`}
                            disabled={isFieldDisabled(field.name)}
                        />
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
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 outline-hidden active:scale-95 ${
                                    data[field.name] ? 'bg-primary dark:bg-white' : 'bg-slate-200 dark:bg-slate-800'
                                }`}
                            >
                                <span
                                    className={`pointer-events-none block h-4 w-4 rounded-full shadow-lg transition-transform duration-300 ring-0 ${
                                        data[field.name] ? 'translate-x-6 bg-white dark:bg-primary' : 'translate-x-1 bg-white dark:bg-white/50'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                )}
                {field.type === 'checkbox_list' && (
                    <div className="flex flex-col gap-2 w-full">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase px-0.5 mb-1">
                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full border border-surface-border bg-surface-base rounded-lg p-4">
                            {(Array.isArray(field.options) ? field.options : Object.entries(field.options || {})).map((option: any) => {
                                const val = Array.isArray(field.options) ? option : option[0];
                                const label = Array.isArray(field.options) ? option : option[1];
                                const isChecked = (data[field.name] || []).includes(val);
                                
                                const handleCheckboxChange = (checked: boolean) => {
                                    const currentValues = [...(data[field.name] || [])];
                                    if (checked) {
                                        if (!currentValues.includes(val)) {
                                            currentValues.push(val);
                                        }
                                    } else {
                                        const index = currentValues.indexOf(val);
                                        if (index > -1) {
                                            currentValues.splice(index, 1);
                                        }
                                    }
                                    setData(field.name, currentValues);
                                };

                                return (
                                    <div key={val} className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
                                        <Checkbox
                                            id={`${field.name}-${val}`}
                                            checked={isChecked}
                                            onCheckedChange={handleCheckboxChange}
                                        />
                                        <label
                                            htmlFor={`${field.name}-${val}`}
                                            className="text-xs font-semibold text-text-main cursor-pointer select-none flex-1"
                                        >
                                            {label}
                                        </label>
                                    </div>
                                );
                            })}
                        </div>
                        {errors[field.name] && (
                            <span className="text-rose-500 text-[10px] font-bold uppercase mt-1">
                                {errors[field.name]}
                            </span>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <Head title={isEdit ? `Edit ${title}` : `Tambah ${title}`} />

            <div className="flex flex-col gap-6 p-6 w-full">
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

                {resourceSlug === 'vendors' && isEdit && (
                    <div className="flex border-b border-surface-border -mb-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab('info')}
                            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                                activeTab === 'info'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-text-soft hover:text-text-main'
                            }`}
                        >
                            <LucideIcons.User size={14} />
                            Informasi Vendor
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('docs')}
                            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                                activeTab === 'docs'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-text-soft hover:text-text-main'
                            }`}
                        >
                            <LucideIcons.FileCheck size={14} />
                            Dokumen Legalitas
                        </button>
                    </div>
                )}

                {(!isEdit || resourceSlug !== 'vendors' || activeTab === 'info') && (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
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
                )}

                {/* ponytail: Vendor Documents Section */}
                {resourceSlug === 'vendors' && isEdit && activeTab === 'docs' && (
                    <div className="border border-surface-border bg-surface-base rounded-2xl p-6 flex flex-col gap-5 animate-in fade-in duration-200">
                        <div className="flex items-center gap-2 pb-3 border-b border-surface-border">
                            <LucideIcons.FileCheck className="h-4 w-4 text-primary shrink-0 opacity-80" />
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-text-main">Dokumen Legalitas Vendor</h3>
                                <p className="text-[11px] text-text-soft mt-0.5">Kelola berkas legalitas dan lampiran wajib untuk vendor ini.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { type: 'NIB', label: 'Nomor Induk Berusaha (NIB)' },
                                { type: 'SIUP', label: 'Surat Izin Usaha Perdagangan (SIUP)' },
                                { type: 'NPWP', label: 'Nomor Pokok Wajib Pajak (NPWP)' },
                                { type: 'Akta Pendirian', label: 'Akta Pendirian Perusahaan' },
                                { type: 'KTP Direktur', label: 'KTP Direktur / PIC' },
                                { type: 'SPPKP', label: 'Surat Pengukuhan Pengusaha Kena Pajak (SPPKP)' },
                            ].map((docType) => {
                                const doc = record?.documents?.find((d: any) => d.document_type === docType.type);

                                return (
                                    <div key={docType.type} className="flex flex-col justify-between gap-2 p-4 border border-surface-border rounded-xl bg-surface-base min-h-[120px]">
                                        <span className="text-[10px] font-bold text-text-soft uppercase tracking-wider">{docType.label}</span>
                                        {doc ? (
                                            <div className="flex items-center justify-between gap-3 mt-1">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <LucideIcons.FileText className="h-5 w-5 text-emerald-500 shrink-0" />
                                                    <span className="text-xs font-medium text-text-main truncate" title={doc.document_name}>
                                                        {doc.document_name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <a
                                                        href={doc.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 rounded-lg hover:bg-slate-50 text-text-soft/60 hover:text-text-main transition-all"
                                                        title="Lihat / Download"
                                                    >
                                                        <LucideIcons.Download className="h-4 w-4" />
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (confirm(`Hapus dokumen ${docType.type}?`)) {
                                                                router.delete(`/admin/vendors/${record.id}/documents/${doc.id}`, {
                                                                    preserveScroll: true
                                                                });
                                                            }
                                                        }}
                                                        className="p-1.5 rounded-lg hover:bg-rose-50 text-text-soft/60 hover:text-rose-600 transition-all"
                                                        title="Hapus"
                                                    >
                                                        <LucideIcons.Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2 mt-1">
                                                <div className="flex items-center gap-1.5 text-rose-500 text-[10px] font-bold uppercase tracking-wider">
                                                    <LucideIcons.AlertCircle className="h-3.5 w-3.5" />
                                                    <span>Belum Dilengkapi</span>
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        accept=".pdf,.docx,.jpg,.jpeg,.png"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const fd = new FormData();
                                                                fd.append('document_file', file);
                                                                fd.append('document_type', docType.type);
                                                                router.post(`/admin/vendors/${record.id}/documents`, fd, {
                                                                    preserveScroll: true
                                                                });
                                                            }
                                                        }}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    />
                                                    <div className="flex h-9 items-center justify-center gap-2 rounded-lg border border-dashed border-surface-border bg-surface-muted/20 text-xs font-semibold text-text-soft hover:bg-surface-muted/40 transition-all cursor-pointer">
                                                        <LucideIcons.Upload className="h-3.5 w-3.5" /> Upload File
                                                    </div>
                                                </div>
                                                <span className="text-[9px] text-text-soft/60 font-semibold tracking-wide mt-0.5">Format: PDF, DOCX, JPG, PNG (Maks. 5MB)</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
