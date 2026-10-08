import { Button } from '@/components/ui/buttons/Button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialogs/Dialog';
import { Label } from '@/components/ui/forms/Label';
import { Input } from '@/components/ui/inputs/Input';
import { Textarea } from '@/components/ui/inputs/Textarea';
import { Checkbox } from '@/components/ui/selection/Checkbox';
import { SearchableMultiSelect } from '@/components/ui/selection/SearchableMultiSelect';
import { SearchableSelect } from '@/components/ui/selection/SearchableSelect';
import { cn } from '@/lib/utils';
import { Shield } from 'lucide-react';
import React from 'react';
import { ResourceFieldSchema } from '../utils/types';

interface ResourceQuickDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    resourceSlug: string;
    title: string;
    editDataId: string | null;
    formSchema: ResourceFieldSchema[];
    deptForm: any;
    onSubmit: (e: React.FormEvent) => void;
    localAccessTypes: Record<string, string>;
    setLocalAccessTypes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export function ResourceQuickDialog({
    open,
    onOpenChange,
    resourceSlug,
    title,
    editDataId,
    formSchema,
    deptForm,
    onSubmit,
    localAccessTypes,
    setLocalAccessTypes,
}: ResourceQuickDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={`flex flex-col overflow-hidden rounded-[8px] border border-slate-200/80 bg-white p-0 text-slate-800 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 ${
                    resourceSlug === 'contract-filter-templates' ? 'min-h-[580px] sm:max-w-[920px]' : 'min-h-[460px] sm:max-w-[780px]'
                }`}
            >
                <form onSubmit={onSubmit} className="flex flex-1 flex-col">
                    <div className="border-primary/20 bg-primary flex items-center justify-between rounded-t-[8px] border-b px-6 py-4 text-white dark:border-zinc-700/80 dark:bg-zinc-800/90 dark:text-zinc-200">
                        <div className="z-10 flex items-center gap-3 pr-10">
                            <div className="dark:bg-primary/20 dark:text-primary dark:border-primary/30 flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/20 text-white">
                                <Shield size={18} />
                            </div>
                            <div>
                                <DialogTitle className="text-sm font-bold tracking-tight text-white dark:text-zinc-100">
                                    {editDataId ? `Ubah ${title}` : `Tambah ${title}`}
                                </DialogTitle>
                                <DialogDescription className="mt-0.5 text-xs font-medium text-white/80 dark:text-zinc-400">
                                    {editDataId ? `Ubah informasi ${title.toLowerCase()} Anda` : `Buat data ${title.toLowerCase()} baru`}
                                </DialogDescription>
                            </div>
                        </div>
                    </div>
                    <div className="max-h-[75vh] min-h-[340px] flex-1 overflow-y-auto bg-white p-6 pb-16 dark:bg-zinc-900">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {formSchema.map((field) => {
                                if (field.isGroup) {
                                    if (field.label === 'Konfigurasi Filter Kontrak') {
                                        const DIMENSIONS = [
                                            {
                                                key: 'company_group',
                                                label: 'Grup Perusahaan (Holding)',
                                                toggleName: 'can_change_company_group',
                                                allowedName: 'allowed_company_groups',
                                            },
                                            {
                                                key: 'region',
                                                label: 'Wilayah (Region)',
                                                toggleName: 'can_change_region',
                                                allowedName: 'allowed_regions',
                                            },
                                            {
                                                key: 'company',
                                                label: 'Perusahaan (Company)',
                                                toggleName: 'can_change_company',
                                                allowedName: 'allowed_companies',
                                            },
                                            {
                                                key: 'division',
                                                label: 'Divisi',
                                                toggleName: 'can_change_division',
                                                allowedName: 'allowed_divisions',
                                            },
                                            {
                                                key: 'department',
                                                label: 'Departemen',
                                                toggleName: 'can_change_department',
                                                allowedName: 'allowed_departments',
                                            },
                                        ];

                                        const getFormattedOptions = (fieldOptions: any) => {
                                            if (!fieldOptions) return [];
                                            if (Array.isArray(fieldOptions)) {
                                                return fieldOptions.map((opt) => ({ value: String(opt), label: String(opt) }));
                                            }
                                            return Object.entries(fieldOptions).map(([k, v]) => ({ value: String(k), label: String(v) }));
                                        };

                                        const nameField = field.schema?.find((s: any) => s.name === 'name');

                                        return (
                                            <div key={field.label} className="animate-in fade-in col-span-full w-full space-y-4 duration-200">
                                                {nameField && (
                                                    <div className="grid gap-1.5">
                                                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                            {nameField.label}
                                                        </Label>
                                                        <Input
                                                            type="text"
                                                            required={nameField.required}
                                                            className="border-border bg-background focus:ring-primary h-10 rounded-lg text-xs font-normal"
                                                            placeholder={nameField.placeholder || `Masukkan ${nameField.label}...`}
                                                            value={deptForm.data.name ?? ''}
                                                            onChange={(e) => deptForm.setData('name', e.target.value)}
                                                        />
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-2 border-b border-slate-100 pt-2 pb-2 dark:border-slate-800">
                                                    <Shield size={14} className="text-primary mr-1" />
                                                    <h3 className="text-xs font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                                                        Pengaturan Dimensi Organisasi
                                                    </h3>
                                                </div>

                                                <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
                                                    {DIMENSIONS.map((dim) => {
                                                        const dimField = field.schema?.find((s: any) => s.name === dim.allowedName);
                                                        if (!dimField) return null;

                                                        const isAllowedToChange =
                                                            deptForm.data[dim.toggleName] === true ||
                                                            deptForm.data[dim.toggleName] === 1 ||
                                                            String(deptForm.data[dim.toggleName]) === 'true';
                                                        const currentValues = deptForm.data[dim.allowedName] || [];

                                                        const accessType =
                                                            localAccessTypes[dim.key] ||
                                                            (isAllowedToChange
                                                                ? currentValues.length > 0
                                                                    ? 'custom'
                                                                    : 'full_access'
                                                                : 'user_data');

                                                        return (
                                                            <div
                                                                key={dim.key}
                                                                className="grid grid-cols-[180px_160px_1fr] items-center gap-4 py-2.5 first:pt-0 last:pb-0"
                                                            >
                                                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                                    {dim.label}
                                                                </label>

                                                                <div>
                                                                    <select
                                                                        value={accessType}
                                                                        onChange={(e) => {
                                                                            const type = e.target.value;
                                                                            setLocalAccessTypes((prev) => ({
                                                                                ...prev,
                                                                                [dim.key]: type,
                                                                            }));
                                                                            if (type === 'user_data') {
                                                                                deptForm.setData((prev: any) => ({
                                                                                    ...prev,
                                                                                    [dim.toggleName]: false,
                                                                                    [dim.allowedName]: [],
                                                                                }));
                                                                            } else if (type === 'full_access') {
                                                                                deptForm.setData((prev: any) => ({
                                                                                    ...prev,
                                                                                    [dim.toggleName]: true,
                                                                                    [dim.allowedName]: [],
                                                                                }));
                                                                            } else if (type === 'custom') {
                                                                                deptForm.setData((prev: any) => ({
                                                                                    ...prev,
                                                                                    [dim.toggleName]: true,
                                                                                    [dim.allowedName]: [],
                                                                                }));
                                                                            }
                                                                        }}
                                                                        className="focus-visible:ring-primary flex h-9 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold focus-visible:ring-1 focus-visible:outline-hidden dark:border-slate-800 dark:bg-slate-900"
                                                                    >
                                                                        <option value="user_data">Sesuai User</option>
                                                                        <option value="full_access">Buka Semua</option>
                                                                        <option value="custom">Pilih Data</option>
                                                                    </select>
                                                                </div>

                                                                {accessType === 'custom' ? (
                                                                    <div>
                                                                        <SearchableMultiSelect
                                                                            values={currentValues}
                                                                            onValuesChange={(vals) => {
                                                                                deptForm.setData(dim.allowedName as any, vals);
                                                                            }}
                                                                            options={getFormattedOptions(dimField.options)}
                                                                            placeholder={`Pilih ${dim.label}...`}
                                                                            disabled={false}
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <div className="pointer-events-none opacity-50">
                                                                        <SearchableMultiSelect
                                                                            values={[]}
                                                                            onValuesChange={() => {}}
                                                                            options={[]}
                                                                            placeholder={
                                                                                accessType === 'user_data'
                                                                                    ? 'Filter Terkunci'
                                                                                    : 'Seluruh Data Diizinkan'
                                                                            }
                                                                            disabled={true}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={field.label} className="col-span-full space-y-3">
                                            <h4 className="text-foreground border-b pb-1 text-xs font-bold tracking-wider uppercase">
                                                {field.label}
                                            </h4>
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                {field.schema?.map((subField: any) => {
                                                    const isFullWidth = subField.type === 'textarea';
                                                    if (subField.type === 'switch' || subField.type === 'toggle') {
                                                        return (
                                                            <div
                                                                key={subField.name}
                                                                className={cn('grid gap-1.5', isFullWidth && 'col-span-full')}
                                                            >
                                                                <Label className="text-foreground text-xs font-medium">
                                                                    {subField.label}
                                                                </Label>
                                                                <div className="border-border bg-muted/40 flex h-10 items-center gap-2.5 rounded-lg border px-3">
                                                                    <Checkbox
                                                                        id={`dept_${subField.name}_check`}
                                                                        checked={!!deptForm.data[subField.name]}
                                                                        onCheckedChange={(checked) =>
                                                                            deptForm.setData(subField.name as any, !!checked)
                                                                        }
                                                                    />
                                                                    <Label
                                                                        htmlFor={`dept_${subField.name}_check`}
                                                                        className="text-muted-foreground cursor-pointer text-xs font-medium"
                                                                    >
                                                                        {deptForm.data[subField.name] ? 'Aktif' : 'Nonaktif'}
                                                                    </Label>
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    if (subField.type === 'select') {
                                                        const rawOptions = Array.isArray(subField.options)
                                                            ? subField.options.map((opt: any) => ({ value: String(opt), label: String(opt) }))
                                                            : Object.entries(subField.options || {}).map(([val, label]) => ({
                                                                  value: String(val),
                                                                  label: String(label),
                                                              }));

                                                        return (
                                                            <div
                                                                key={subField.name}
                                                                className={cn('grid gap-1.5', isFullWidth && 'col-span-full')}
                                                            >
                                                                <Label className="text-foreground text-xs font-medium">
                                                                    {subField.label}
                                                                </Label>
                                                                <SearchableSelect
                                                                    value={
                                                                        deptForm.data[subField.name]
                                                                            ? String(deptForm.data[subField.name])
                                                                            : ''
                                                                    }
                                                                    onValueChange={(val) => deptForm.setData(subField.name as any, val)}
                                                                    options={rawOptions}
                                                                    placeholder={subField.placeholder || `Pilih ${subField.label}...`}
                                                                    allowClear={!subField.required}
                                                                />
                                                            </div>
                                                        );
                                                    }

                                                    if (subField.type === 'textarea') {
                                                        return (
                                                            <div key={subField.name} className="col-span-full grid gap-1.5">
                                                                <Label className="text-foreground text-xs font-medium">
                                                                    {subField.label}
                                                                </Label>
                                                                <Textarea
                                                                    required={subField.required}
                                                                    className="border-border bg-background focus:ring-primary h-20 resize-none rounded-lg text-xs leading-relaxed font-normal"
                                                                    placeholder={subField.placeholder || `Masukkan ${subField.label}...`}
                                                                    value={deptForm.data[subField.name] ?? ''}
                                                                    onChange={(e) => deptForm.setData(subField.name as any, e.target.value)}
                                                                />
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div key={subField.name} className="grid gap-1.5">
                                                            <Label className="text-foreground text-xs font-medium">{subField.label}</Label>
                                                            <Input
                                                                type={subField.type || 'text'}
                                                                required={subField.required}
                                                                className="border-border bg-background focus:ring-primary h-10 rounded-lg text-xs font-normal"
                                                                value={deptForm.data[subField.name] ?? ''}
                                                                onChange={(e) => deptForm.setData(subField.name as any, e.target.value)}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                }

                                if (field.type === 'switch' || field.type === 'toggle') {
                                    const isUsedField = field.name === 'is_used';
                                    const isChecked = !!deptForm.data[field.name];
                                    return (
                                        <div key={field.name} className="grid gap-1.5">
                                            <Label className="text-foreground text-xs font-medium">{field.label}</Label>
                                            <div className="border-border bg-muted/40 flex h-10 items-center gap-2.5 rounded-lg border px-3">
                                                <Checkbox
                                                    id={`dept_${field.name}_check`}
                                                    checked={isChecked}
                                                    onCheckedChange={(checked) => deptForm.setData(field.name as any, !!checked)}
                                                />
                                                <Label
                                                    htmlFor={`dept_${field.name}_check`}
                                                    className="text-muted-foreground cursor-pointer text-xs font-medium"
                                                >
                                                    {isUsedField
                                                        ? isChecked
                                                            ? 'Ya (Digunakan)'
                                                            : 'Tidak (Tidak Digunakan)'
                                                        : isChecked
                                                          ? 'Aktif'
                                                          : 'Nonaktif'}
                                                </Label>
                                            </div>
                                        </div>
                                    );
                                }

                                if (field.type === 'textarea') {
                                    return (
                                        <div key={field.name} className="col-span-full grid gap-1.5">
                                            <Label className="text-foreground text-xs font-medium">{field.label}</Label>
                                            <Textarea
                                                required={field.required}
                                                className="border-border bg-background focus:ring-primary h-20 resize-none rounded-lg text-xs leading-relaxed font-normal"
                                                placeholder={field.placeholder || `Masukkan ${field.label}...`}
                                                value={deptForm.data[field.name] ?? ''}
                                                onChange={(e) => deptForm.setData(field.name as any, e.target.value)}
                                            />
                                        </div>
                                    );
                                }

                                if (field.type === 'select') {
                                    const rawOptions = Array.isArray(field.options)
                                        ? field.options.map((opt: any) => ({ value: String(opt), label: String(opt) }))
                                        : Object.entries(field.options || {}).map(([val, label]) => ({
                                              value: String(val),
                                              label: String(label),
                                          }));

                                    return (
                                        <div key={field.name} className="grid gap-1.5">
                                            <Label className="text-foreground text-xs font-medium">{field.label}</Label>
                                            <SearchableSelect
                                                value={deptForm.data[field.name] ? String(deptForm.data[field.name]) : ''}
                                                onValueChange={(val) => deptForm.setData(field.name as any, val)}
                                                options={rawOptions}
                                                placeholder={field.placeholder || `Pilih ${field.label}...`}
                                                allowClear={!field.required}
                                            />
                                        </div>
                                    );
                                }

                                // Default (text/number/etc.)
                                return (
                                    <div key={field.name} className="grid gap-1.5">
                                        <Label className="text-foreground text-xs font-medium">{field.label}</Label>
                                        <Input
                                            type={field.type || 'text'}
                                            required={field.required}
                                            className="border-border bg-background focus:ring-primary h-10 rounded-lg text-xs font-normal"
                                            placeholder={field.placeholder || `Masukkan ${field.label}...`}
                                            value={deptForm.data[field.name] ?? ''}
                                            onChange={(e) => deptForm.setData(field.name as any, e.target.value)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="mt-auto flex justify-end gap-2 rounded-b-[8px] border-t border-slate-200/80 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-9 rounded-lg border-slate-200/80 bg-white px-4 text-xs font-medium text-slate-800 dark:border-zinc-700/80 dark:bg-zinc-800 dark:text-zinc-200"
                            onClick={() => onOpenChange(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            className="h-9 rounded-lg px-5 text-xs font-bold shadow-xs"
                            disabled={deptForm.processing}
                        >
                            {editDataId ? 'Simpan' : 'Tambah'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
export default ResourceQuickDialog;
