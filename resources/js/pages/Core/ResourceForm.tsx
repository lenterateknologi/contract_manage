import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { FormInput } from '@/components/ui/inputs/FormInput';
import { FormTextarea } from '@/components/ui/inputs/FormTextarea';
import { Button } from '@/components/ui/buttons/Button';
import { Label } from '@/components/ui/forms/Label';
import { ArrowLeft } from 'lucide-react';

interface Props {
    resourceSlug: string;
    title: string;
    formSchema: any[];
    formColumns?: number;
    record: any | null;
}

export default function ResourceForm({ resourceSlug, title, formSchema, formColumns = 1, record }: Props) {
    const isEdit = !!record;

    // Initial form state based on schema and existing record values
    const initialFormState = formSchema.reduce((acc: any, field: any) => {
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

                <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
                    <div className={getGridClass()}>
                        {formSchema.map((field: any) => (
                            <div key={field.name} className={getSpanClass(field)}>
                                {field.type === 'text' && (
                                    <FormInput
                                        label={field.label}
                                        value={data[field.name]}
                                        onChange={(e) => setData(field.name, e.target.value)}
                                        error={errors[field.name]}
                                        required={field.required}
                                    />
                                )}
                                {field.type === 'textarea' && (
                                    <FormTextarea
                                        label={field.label}
                                        value={data[field.name]}
                                        onChange={(e) => setData(field.name, e.target.value)}
                                        error={errors[field.name]}
                                        required={field.required}
                                    />
                                )}
                                {field.type === 'select' && (
                                    <div className="flex flex-col gap-1.5 w-full">
                                        <Label className="text-[11px] font-bold text-muted-foreground uppercase px-0.5">
                                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                                        </Label>
                                        <select
                                            value={data[field.name]}
                                            onChange={(e) => setData(field.name, e.target.value)}
                                            className="flex h-11 w-full rounded-lg border border-surface-border bg-surface-base pl-3 pr-10 py-2 text-sm text-foreground font-sans font-semibold placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50 disabled:border-slate-200"
                                            required={field.required}
                                        >
                                            <option value="">PILIH {field.label.toUpperCase()}...</option>
                                            {(Array.isArray(field.options) ? field.options : Object.entries(field.options || {})).map((option: any) => {
                                                const val = Array.isArray(field.options) ? option : option[0];
                                                const label = Array.isArray(field.options) ? option : option[1];
                                                return (
                                                    <option key={val} value={val}>
                                                        {label}
                                                    </option>
                                                );
                                            })}
                                        </select>
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
                            </div>
                        ))}
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
