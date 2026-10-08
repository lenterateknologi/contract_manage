import { SearchableSelect } from '@/components/ui/selection/SearchableSelect';
import LucideIcons from '@/lib/lucide-dynamic';
import { cn } from '@/lib/utils';
import React from 'react';
import { ResourceFieldSchema } from '../utils/types';

interface ResourceBulkEditModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    selectedCount: number;
    flattenedFields: ResourceFieldSchema[];
    bulkSelectedFields: Record<string, boolean>;
    setBulkSelectedFields: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    bulkFieldValues: Record<string, any>;
    setBulkFieldValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
    onSave: () => void;
    processing: boolean;
}

export function ResourceBulkEditModal({
    open,
    onClose,
    title,
    selectedCount,
    flattenedFields,
    bulkSelectedFields,
    setBulkSelectedFields,
    bulkFieldValues,
    setBulkFieldValues,
    onSave,
    processing,
}: ResourceBulkEditModalProps) {
    if (!open) return null;

    return (
        <div className="animate-in fade-in fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200 dark:bg-black/80">
            <div className="animate-in zoom-in-95 relative mx-auto my-auto flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl duration-200 dark:border-slate-800/80 dark:bg-slate-900">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 p-6 pb-4 dark:border-slate-800">
                    <div>
                        <h3 className="text-base font-normal tracking-tight text-slate-900 dark:text-slate-100">Ubah Massal Data {title}</h3>
                        <p className="text-text-main mt-0.5 text-xs font-normal">
                            Mengubah {selectedCount} data terpilih sekaligus. Centang field yang ingin diubah.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-text-main hover:text-primary rounded-lg p-1.5 transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                        <LucideIcons.X size={16} />
                    </button>
                </div>

                {/* Fields Form */}
                <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
                    {flattenedFields.map((field) => {
                        // Don't bulk edit primary keys or password fields or descriptions to avoid mistakes
                        if (field.name === 'id' || field.name === 'code' || field.name === 'password' || field.name === 'description')
                            return null;

                        const isFieldChecked = !!bulkSelectedFields[field.name];

                        return (
                            <div
                                key={field.name}
                                className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50/20 p-3 dark:border-slate-800 dark:bg-slate-800/10"
                            >
                                <div className="pt-1">
                                    <input
                                        type="checkbox"
                                        checked={isFieldChecked}
                                        onChange={(e) => {
                                            setBulkSelectedFields((prev) => ({ ...prev, [field.name]: e.target.checked }));
                                            if (e.target.checked) {
                                                if (field.type === 'switch' || field.type === 'toggle') {
                                                    setBulkFieldValues((prev) => ({ ...prev, [field.name]: prev[field.name] ?? true }));
                                                }
                                            } else {
                                                setBulkFieldValues((prev) => ({ ...prev, [field.name]: undefined }));
                                            }
                                        }}
                                        className="text-primary focus:ring-primary h-4 w-4 cursor-pointer rounded-sm border-slate-300"
                                    />
                                </div>
                                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                    <label className="text-text-main text-[11px] font-normal tracking-wider uppercase">{field.label}</label>
                                    {isFieldChecked ? (
                                        <div className="w-full">
                                            {field.type === 'select' &&
                                                (() => {
                                                    let selectOptions: { value: string; label: string }[] = [];
                                                    if (field.options) {
                                                        if (Array.isArray(field.options)) {
                                                            selectOptions = field.options.map((opt: any) => ({
                                                                value:
                                                                    typeof opt === 'object' && opt !== null
                                                                        ? String(opt.value ?? opt.id)
                                                                        : String(opt),
                                                                label:
                                                                    typeof opt === 'object' && opt !== null
                                                                        ? String(opt.label ?? opt.name)
                                                                        : String(opt),
                                                            }));
                                                        } else {
                                                            selectOptions = Object.entries(field.options).map(([val, label]) => ({
                                                                value: String(val),
                                                                label: String(label),
                                                            }));
                                                        }
                                                    }
                                                    return (
                                                        <SearchableSelect
                                                            value={
                                                                bulkFieldValues[field.name] !== undefined
                                                                    ? String(bulkFieldValues[field.name])
                                                                    : ''
                                                            }
                                                            onValueChange={(val) =>
                                                                setBulkFieldValues((prev) => ({ ...prev, [field.name]: val }))
                                                            }
                                                            options={selectOptions}
                                                            placeholder={`Pilih ${field.label}...`}
                                                            searchPlaceholder={`Cari ${field.label.toLowerCase()}...`}
                                                        />
                                                    );
                                                })()}
                                            {(field.type === 'switch' || field.type === 'toggle') && (
                                                <div className="flex h-10 items-center gap-3">
                                                    <button
                                                        type="button"
                                                        role="switch"
                                                        aria-checked={!!bulkFieldValues[field.name]}
                                                        onClick={() =>
                                                            setBulkFieldValues((prev) => ({ ...prev, [field.name]: !prev[field.name] }))
                                                        }
                                                        className={cn(
                                                            'focus-visible:ring-primary/40 relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 outline-none focus-visible:ring-2',
                                                            bulkFieldValues[field.name] ? 'bg-primary' : 'bg-slate-200 dark:bg-zinc-700',
                                                        )}
                                                    >
                                                        <span
                                                            className={cn(
                                                                'pointer-events-none block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 dark:bg-zinc-100',
                                                                bulkFieldValues[field.name] ? 'translate-x-4.5' : 'translate-x-1',
                                                            )}
                                                        />
                                                    </button>
                                                    <span className="text-text-main text-xs font-semibold">
                                                        {bulkFieldValues[field.name] ? 'Ya (Aktif)' : 'Tidak (Nonaktif)'}
                                                    </span>
                                                </div>
                                            )}
                                            {field.type === 'text' && (
                                                <input
                                                    type="text"
                                                    value={bulkFieldValues[field.name] ?? ''}
                                                    onChange={(e) =>
                                                        setBulkFieldValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                                                    }
                                                    className="border-surface-border bg-surface-base focus-visible:ring-primary flex h-10 w-full rounded-lg border px-3 py-2 text-xs font-normal focus-visible:ring-1 focus-visible:outline-hidden"
                                                    placeholder={`Masukkan ${field.label}...`}
                                                />
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-text-main text-[10px] italic">
                                            Centang kotak di samping untuk mengubah field ini massal.
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 pt-3 pb-6 dark:border-slate-800">
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-normal text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/60"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onSave}
                        disabled={processing}
                        className="bg-primary hover:bg-primary/95 flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-normal text-white shadow-md transition-all disabled:opacity-50"
                    >
                        {processing && <LucideIcons.Loader2 size={12} className="animate-spin" />}
                        Simpan Perubahan
                    </button>
                </div>
            </div>
        </div>
    );
}
export default ResourceBulkEditModal;
