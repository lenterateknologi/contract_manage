import { FormInput } from '@/components/ui/inputs/FormInput';
import { FormTextarea } from '@/components/ui/inputs/FormTextarea';
import { Label } from '@/components/ui/forms/Label';
import { TreeSelect } from '@/components/ui/selection/TreeSelect';
import LucideIcons from '@/lib/lucide-dynamic';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';
import React from 'react';
import IconPicker from '../ui/IconPicker';
import MultiSelectField from '../ui/MultiSelectField';
import SingleSelectField from '../ui/SingleSelectField';
import SlaStageList from '../ui/SlaStageList';
import WorkingDaysSelector from '../ui/WorkingDaysSelector';
import { ResourceFieldSchema, SlaStage } from '../utils/types';

interface ResourceFieldRendererProps {
    field: ResourceFieldSchema;
    data: Record<string, any>;
    setData: (key: any, value: any) => void;
    errors: Record<string, string>;
    resourceSlug: string;
    formColumns?: number;
    record?: any;
    isFieldDisabled?: (fieldName: string) => boolean;
}

export function ResourceFieldRenderer({
    field,
    data,
    setData,
    errors,
    resourceSlug,
    formColumns = 1,
    record,
    isFieldDisabled = () => false,
}: ResourceFieldRendererProps) {
    const getSpanClass = (f: ResourceFieldSchema) => {
        if (
            ['allowed_company_groups', 'allowed_regions', 'allowed_companies', 'allowed_divisions', 'allowed_departments', 'sla_stages'].includes(
                f.name,
            )
        ) {
            return 'col-span-full';
        }
        if (f.columnSpan === 'full' || (typeof f.columnSpan === 'number' && f.columnSpan >= formColumns)) return 'col-span-full';
        if (f.columnSpan === 2) return 'col-span-1 md:col-span-2';
        if (f.columnSpan === 3) return 'col-span-1 md:col-span-2 xl:col-span-3';
        return 'col-span-1';
    };

    const IconComponent = field.icon && (LucideIcons as any)[field.icon] ? (LucideIcons as any)[field.icon] : undefined;

    return (
        <div key={field.name} className={getSpanClass(field)}>
            {field.name === 'sla_stages' ? (
                <SlaStageList
                    stages={data.sla_stages}
                    onChange={(newStages: SlaStage[], totalHours: number) => {
                        setData('sla_stages', newStages);
                        setData('sla_total_hours', totalHours);
                    }}
                />
            ) : field.name === 'sla_drafting_hours' || field.name === 'sla_total_hours' || field.name === 'sla_review_hours' ? (
                (() => {
                    const rawVal = Number(data[field.name]) || 0;
                    const daysVal = rawVal > 0 ? (rawVal / 24).toFixed(1).replace(/\.0$/, '') : '';
                    return (
                        <div className="w-full space-y-1">
                            <div className="flex items-center justify-between px-0.5">
                                <Label className="text-[11px] font-bold text-slate-700 uppercase dark:text-zinc-200">
                                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                                </Label>
                                {rawVal > 0 && (
                                    <span className="text-primary bg-primary/10 py-0.2 rounded px-1.5 text-[9.5px] font-bold">
                                        = {daysVal} Hari ({rawVal} Jam)
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                                <div className="relative">
                                    <FormInput
                                        type="number"
                                        placeholder="0"
                                        value={daysVal}
                                        onChange={(e) => {
                                            const days = parseFloat(e.target.value);
                                            const h = isNaN(days) ? '' : Math.round(days * 24);
                                            setData(field.name, h);
                                        }}
                                        rightAction={<span className="text-muted-foreground pr-2 text-[11px] font-semibold">Hari</span>}
                                    />
                                </div>
                                <div className="relative">
                                    <FormInput
                                        type="number"
                                        placeholder="0"
                                        value={data[field.name] ?? ''}
                                        onChange={(e) => {
                                            const hours = parseInt(e.target.value, 10);
                                            setData(field.name, isNaN(hours) ? '' : hours);
                                        }}
                                        rightAction={<span className="text-muted-foreground pr-2 text-[11px] font-semibold">Jam</span>}
                                        error={errors[field.name]}
                                    />
                                </div>
                            </div>
                            {field.helperText && !errors[field.name] && (
                                <p className="text-muted-foreground px-0.5 text-[10px] font-normal">{field.helperText}</p>
                            )}
                        </div>
                    );
                })()
            ) : field.name === 'sla_cutoff_hour' ? (
                (() => {
                    const cutoffVal =
                        data['sla_cutoff_hour'] !== '' && data['sla_cutoff_hour'] !== null && data['sla_cutoff_hour'] !== undefined
                            ? Number(data['sla_cutoff_hour'])
                            : '';
                    const cutoffTimeFormatted = cutoffVal !== '' && !isNaN(cutoffVal) ? `${String(cutoffVal).padStart(2, '0')}:00 WIB` : '';
                    return (
                        <div className="w-full space-y-1">
                            <div className="flex items-center justify-between px-0.5">
                                <Label className="text-[11px] font-bold text-slate-700 uppercase dark:text-zinc-200">
                                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                                </Label>
                                {cutoffTimeFormatted && (
                                    <span className="text-primary bg-primary/10 py-0.2 rounded px-1.5 font-mono text-[9.5px] font-bold">
                                        = {cutoffTimeFormatted}
                                    </span>
                                )}
                            </div>
                            <FormInput
                                type="number"
                                min="0"
                                max="23"
                                placeholder="0-23"
                                value={data['sla_cutoff_hour'] ?? ''}
                                onChange={(e) => {
                                    const h = parseInt(e.target.value, 10);
                                    setData('sla_cutoff_hour', isNaN(h) ? '' : Math.max(0, Math.min(23, h)));
                                }}
                                rightAction={<span className="text-muted-foreground pr-2 font-mono text-[11px] font-semibold">:00 WIB</span>}
                                error={errors['sla_cutoff_hour']}
                            />
                            {field.helperText && !errors['sla_cutoff_hour'] && (
                                <p className="text-muted-foreground px-0.5 text-[10px] font-normal">{field.helperText}</p>
                            )}
                        </div>
                    );
                })()
            ) : field.name === 'working_days' ? (
                <WorkingDaysSelector
                    label={field.label}
                    value={data['working_days']}
                    onChange={(days) => setData('working_days', days)}
                    helperText={field.helperText}
                    error={errors['working_days']}
                />
            ) : (field.type === 'text' ||
                  field.type === 'number' ||
                  field.type === 'integer' ||
                  field.type === 'email' ||
                  field.type === 'password') ? (
                <FormInput
                    label={field.label}
                    type={field.type === 'integer' ? 'number' : field.type}
                    value={data[field.name]}
                    onChange={(e) => setData(field.name, e.target.value)}
                    error={errors[field.name]}
                    helperText={field.helperText}
                    required={field.required}
                    placeholder={field.placeholder}
                    icon={IconComponent}
                />
            ) : null}

            {field.type === 'readonly' && (
                <div className="w-full space-y-1.5">
                    <div className="flex items-center justify-between px-0.5">
                        <label className="text-[11px] font-bold tracking-wider text-slate-700 uppercase dark:text-zinc-200">{field.label}</label>
                        <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-normal">
                            <Lock size={10} className="opacity-70" />
                            <span>Terkunci</span>
                        </span>
                    </div>
                    <div className="relative">
                        <div className="border-border text-foreground flex h-10 w-full cursor-default items-center rounded-lg border bg-slate-100/70 px-3 pr-9 text-xs font-medium select-all dark:bg-zinc-900/80">
                            {data[field.name] ?? <span className="text-muted-foreground italic">{field.placeholder || '—'}</span>}
                        </div>
                        <div
                            className="pointer-events-none absolute top-0 right-3 bottom-0 flex items-center text-slate-400 dark:text-zinc-500"
                            title="Field tidak dapat diedit"
                        >
                            <Lock size={14} className="opacity-70" />
                        </div>
                    </div>
                    {field.helperText && <p className="text-muted-foreground mt-1 px-0.5 text-[11px] font-normal">{field.helperText}</p>}
                </div>
            )}

            {field.type === 'textarea' && (
                <FormTextarea
                    label={field.label}
                    value={data[field.name]}
                    onChange={(e) => setData(field.name, e.target.value)}
                    error={errors[field.name]}
                    helperText={field.helperText}
                    required={field.required}
                    placeholder={field.placeholder}
                />
            )}

            {field.type === 'color' && (
                <div className="w-full space-y-1.5">
                    <Label className="px-0.5 text-[11px] font-bold text-slate-700 uppercase dark:text-zinc-200">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </Label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={data[field.name] || '#ffffff'}
                            onChange={(e) => setData(field.name, e.target.value)}
                            className="border-border bg-background h-9 w-12 shrink-0 cursor-pointer rounded-lg border p-1"
                            required={field.required}
                        />
                        <input
                            type="text"
                            value={data[field.name] || ''}
                            onChange={(e) => setData(field.name, e.target.value)}
                            className="border-border bg-background focus-visible:ring-primary flex h-9 w-full rounded-lg border px-3 py-1 font-mono text-xs font-semibold uppercase focus-visible:ring-1 focus-visible:outline-hidden"
                            placeholder="#hexcode"
                        />
                        {data[field.name] && (
                            <button
                                type="button"
                                onClick={() => setData(field.name, '')}
                                className="border-border bg-background text-muted-foreground flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border px-2.5 shadow-xs transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
                                title="Hapus Warna"
                            >
                                <LucideIcons.X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                    {field.helperText && !errors[field.name] && (
                        <p className="text-muted-foreground mt-1 px-0.5 text-[11px] font-normal">{field.helperText}</p>
                    )}
                    {errors[field.name] && <span className="mt-1 block text-[10px] font-bold text-rose-500 uppercase">{errors[field.name]}</span>}
                </div>
            )}

            {field.type === 'icon' && (
                <div className="relative w-full space-y-1.5">
                    <Label className="px-0.5 text-[11px] font-bold text-slate-700 uppercase dark:text-zinc-200">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </Label>
                    <IconPicker value={data[field.name] || ''} onChange={(val) => setData(field.name, val)} />
                    {field.helperText && !errors[field.name] && (
                        <p className="text-muted-foreground mt-1 px-0.5 text-[11px] font-normal">{field.helperText}</p>
                    )}
                    {errors[field.name] && <span className="mt-1 block text-[10px] font-bold text-rose-500 uppercase">{errors[field.name]}</span>}
                </div>
            )}

            {field.type === 'select' && field.multiple && field.name !== 'working_days' ? (
                (() => {
                    let toggleName: string | null = null;
                    let toggleLabel: string | undefined = undefined;

                    if (resourceSlug === 'dashboard-types') {
                        if (field.name === 'company_group_ids') {
                            toggleName = 'scope_to_user_company_group';
                            toggleLabel = 'Sesuai Profil User';
                        } else if (field.name === 'region_ids') {
                            toggleName = 'scope_to_user_region';
                            toggleLabel = 'Sesuai Profil User';
                        } else if (field.name === 'company_ids') {
                            toggleName = 'scope_to_user_company';
                            toggleLabel = 'Sesuai Profil User';
                        } else if (field.name === 'division_ids') {
                            toggleName = 'scope_to_user_division';
                            toggleLabel = 'Sesuai Profil User';
                        } else if (field.name === 'department_ids') {
                            toggleName = 'scope_to_user_department';
                            toggleLabel = 'Sesuai Profil User';
                        }
                    } else {
                        if (field.name === 'allowed_company_groups') toggleName = 'can_change_company_group';
                        else if (field.name === 'allowed_regions') toggleName = 'can_change_region';
                        else if (field.name === 'allowed_companies') toggleName = 'can_change_company';
                        else if (field.name === 'allowed_divisions') toggleName = 'can_change_division';
                        else if (field.name === 'allowed_departments') toggleName = 'can_change_department';
                    }

                    const toggleVal = toggleName
                        ? data[toggleName] === true || data[toggleName] === 1 || data[toggleName] === '1' || data[toggleName] === 'true'
                        : false;

                    const isScopedToUser = resourceSlug === 'dashboard-types' && Boolean(toggleVal);

                    return (
                        <div className="space-y-1">
                            <MultiSelectField
                                field={field}
                                value={Array.isArray(data[field.name]) ? data[field.name] : []}
                                onChange={(val) => setData(field.name, val)}
                                error={errors[field.name]}
                                toggleName={toggleName}
                                toggleLabel={toggleLabel}
                                toggleValue={toggleVal}
                                onToggleChange={toggleName ? (val) => setData(toggleName, val) : undefined}
                                disabled={isFieldDisabled(field.name)}
                                isInputDisabled={isScopedToUser}
                            />
                            {field.helperText && !errors[field.name] && (
                                <p className="text-muted-foreground mt-1 px-0.5 text-[11px] font-normal">
                                    {isScopedToUser
                                        ? `Otomatis mengikuti ${field.label.toLowerCase()} dari profil user login.`
                                        : field.helperText}
                                </p>
                            )}
                        </div>
                    );
                })()
            ) : field.type === 'select' && field.name !== 'working_days' ? (
                <div className="space-y-1">
                    <SingleSelectField
                        field={field}
                        value={data[field.name]}
                        onChange={(val) => setData(field.name, val)}
                        error={errors[field.name]}
                        disabled={isFieldDisabled(field.name)}
                    />
                    {field.helperText && !errors[field.name] && (
                        <p className="text-muted-foreground mt-1 px-0.5 text-[11px] font-normal">{field.helperText}</p>
                    )}
                </div>
            ) : null}

            {field.type === 'tree_select' && (
                <div className="w-full space-y-1.5">
                    <Label className="px-0.5 text-[11px] font-bold text-slate-700 uppercase dark:text-zinc-200">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </Label>
                    <TreeSelect
                        value={data[field.name]}
                        onValueChange={(val) => setData(field.name, val)}
                        items={field.options}
                        placeholder={field.placeholder || `Pilih ${field.label}...`}
                        disabled={isFieldDisabled(field.name)}
                        multiple={field.multiple ?? false}
                        inline={field.inline ?? false}
                        disableParentSelection={field.disableParentSelection ?? false}
                        allowClear={field.allowClear ?? true}
                        rootOptionLabel={
                            field.rootOptionLabel || (field.name === 'parent_id' ? 'Tanpa Parent (Jadikan Kategori Utama / Root)' : undefined)
                        }
                        disabledId={record?.id}
                    />
                    {field.helperText && !errors[field.name] && (
                        <p className="text-muted-foreground mt-1 px-0.5 text-[11px] font-normal">{field.helperText}</p>
                    )}
                    {errors[field.name] && <span className="mt-1 block text-[10px] font-bold text-rose-500 uppercase">{errors[field.name]}</span>}
                </div>
            )}

            {(field.type === 'switch' || field.type === 'toggle') &&
                (() => {
                    const isChecked =
                        data[field.name] === true || data[field.name] === 1 || data[field.name] === '1' || data[field.name] === 'true';
                    return (
                        <div
                            key={field.name}
                            onClick={() => setData(field.name, !isChecked)}
                            className={cn(
                                'group relative flex h-full cursor-pointer flex-col justify-between rounded-xl border p-3.5 transition-all duration-150 select-none',
                                isChecked
                                    ? 'border-primary/40 bg-primary/[0.04] dark:bg-primary/[0.08] shadow-2xs'
                                    : 'border-border bg-surface-base hover:border-border/80 hover:bg-surface-muted/30',
                            )}
                        >
                            <div className="mb-1.5 flex items-start justify-between gap-2.5">
                                <div className="flex min-w-0 items-center gap-2.5">
                                    {IconComponent && (
                                        <div
                                            className={cn(
                                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors',
                                                isChecked ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                                            )}
                                        >
                                            <IconComponent className="h-3.5 w-3.5" />
                                        </div>
                                    )}
                                    <span
                                        className={cn(
                                            'line-clamp-1 text-xs font-bold tracking-tight transition-colors',
                                            isChecked ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground',
                                        )}
                                    >
                                        {field.label}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={isChecked}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setData(field.name, !isChecked);
                                    }}
                                    className={cn(
                                        'focus-visible:ring-primary/40 relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 outline-none focus-visible:ring-2',
                                        isChecked ? 'bg-primary' : 'bg-slate-200 dark:bg-zinc-700',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'pointer-events-none block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 dark:bg-zinc-100',
                                            isChecked ? 'translate-x-4.5' : 'translate-x-1',
                                        )}
                                    />
                                </button>
                            </div>
                            {field.helperText && <p className="text-muted-foreground mt-1 text-[10.5px] leading-relaxed">{field.helperText}</p>}
                            {errors[field.name] && (
                                <span className="mt-1 block text-[10px] font-bold text-rose-500 uppercase">{errors[field.name]}</span>
                            )}
                        </div>
                    );
                })()}
        </div>
    );
}
export default ResourceFieldRenderer;
