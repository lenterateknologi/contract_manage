import React, { useState } from 'react';
import { Button } from '@/components/ui/buttons/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialogs/Dialog';
import { SearchableMultiSelect } from '@/components/ui/selection/SearchableMultiSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/Select';
import { 
    ArrowRight,
    CornerDownLeft,
    Eye,
    EyeOff,
    Filter,
    Key,
    Layers, 
    Lock,
    PlusCircle, 
    Settings2, 
    Sliders, 
    Sparkles, 
    Target,
    Unlock,
    UserCheck,
    UserPlus, 
    Users as UsersIcon,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AuthorityTableManager from './AuthorityTableManager';
import { MASTER_ACTIONS } from '../constants';

export interface CustomActionItem {
    id: string;
    action_code: string;
    name: string;
    alias: string;
    description?: string;
    is_active: boolean;
    scope: 'all_steps' | 'specific_steps';
    step_ids?: string[];
    target_step_mode?: 'current_step' | 'specific_step' | 'next_step';
    target_step_position?: 'at' | 'before' | 'after';
    target_step_id?: string;
    authorities: any[];
    eligible_personnel?: any[];
    requires_note?: boolean;
    requires_attachment?: boolean;
    visibility_condition?: 'always' | 'require_pic' | 'no_pic' | 'has_signers' | 'no_signers' | 'custom_status';
    custom_status_value?: string;
    unlocks_other_actions?: boolean;
    meta?: Record<string, any>;
}

export const DEFAULT_FIXED_CUSTOM_ACTIONS: Omit<CustomActionItem, 'authorities'>[] = [
    {
        id: 'action_assign_pic',
        action_code: 'assign',
        name: 'Tentukan / Ganti PIC',
        alias: 'Tentukan / Ganti PIC',
        description: 'Aksi global untuk menugaskan atau mengubah PIC (Person in Charge) penanggung jawab kontrak.',
        is_active: true,
        scope: 'all_steps',
        step_ids: [],
        visibility_condition: 'always',
        unlocks_other_actions: false,
    },
    {
        id: 'action_adhoc',
        action_code: 'forward',
        name: 'Tambah Approval Tambahan (Ad-Hoc)',
        alias: 'Tambah Approver Ad-Hoc',
        description: 'Aksi bersyarat untuk menambahkan reviewer / approver ad-hoc di luar alur utama.',
        is_active: true,
        scope: 'all_steps',
        step_ids: [],
        target_step_mode: 'current_step',
        target_step_position: 'at',
        visibility_condition: 'always',
        unlocks_other_actions: false,
    },
    {
        id: 'action_toggle_access',
        action_code: 'toggle_access',
        name: 'Buka / Kunci Akses Opsi Tambahan (Toggle Visibility)',
        alias: 'Buka Akses Tombol Khusus',
        description: 'Tombol kontrol untuk membuka atau mengunci/menyembunyikan akses aksi-aksi khusus lainnya bagi pengguna yang berwenang.',
        is_active: true,
        scope: 'all_steps',
        step_ids: [],
        visibility_condition: 'always',
        unlocks_other_actions: true,
    },
];

interface CustomActionsManagerProps {
    customActions: CustomActionItem[];
    onChange: (actions: CustomActionItem[]) => void;
    steps: any[];
    roles: any[];
    departments: any[];
    divisions?: any[];
    companyGroups?: any[];
    companies?: any[];
    regions?: any[];
    users: any[];
    contractStatuses?: any[];
    simulationContext?: any;
    onOpenSimulationModal?: () => void;
}

export function CustomActionsManager({
    customActions = [],
    onChange,
    steps = [],
    roles = [],
    departments = [],
    divisions = [],
    companyGroups = [],
    companies = [],
    regions = [],
    users = [],
    contractStatuses = [],
    simulationContext,
    onOpenSimulationModal,
}: CustomActionsManagerProps) {
    const [editingAuthorityActionId, setEditingAuthorityActionId] = useState<string | null>(null);
    const [editingPersonnelActionId, setEditingPersonnelActionId] = useState<string | null>(null);

    // Ensure all 4 fixed custom actions exist in state
    const normalizedActions: CustomActionItem[] = DEFAULT_FIXED_CUSTOM_ACTIONS.map((defAction) => {
        const existing = customActions.find(
            (a) => a.id === defAction.id || a.action_code === defAction.action_code
        );
        if (existing) {
            return {
                ...defAction,
                ...existing,
                id: defAction.id, // normalize ID
                action_code: defAction.action_code,
            };
        }
        return {
            ...defAction,
            authorities: [{ authority_type: 'custom', user_id: 'initiator' }],
            eligible_personnel: [],
        };
    });

    const updateAction = (index: number, data: Partial<CustomActionItem>) => {
        const updated = [...normalizedActions];
        updated[index] = { ...updated[index], ...data };
        onChange(updated);
    };

    const stepOptions = steps.map((s, sIdx) => ({
        value: String(s.id),
        label: `Tahap ${s.step || sIdx + 1}: ${s.label || s.name || s.description || `Langkah ${sIdx + 1}`}`,
    }));

    const currentEditingAuthorityAction = normalizedActions.find((a) => a.id === editingAuthorityActionId);
    const currentEditingAuthorityIndex = normalizedActions.findIndex((a) => a.id === editingAuthorityActionId);

    const currentEditingPersonnelAction = normalizedActions.find((a) => a.id === editingPersonnelActionId);
    const currentEditingPersonnelIndex = normalizedActions.findIndex((a) => a.id === editingPersonnelActionId);

    return (
        <div className="w-full min-w-0 bg-white dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 rounded-xl p-3.5 flex flex-col gap-3">
            {/* Compact Header Section */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2.5">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 text-primary p-1.5 rounded-lg shrink-0">
                        <Sliders size={15} />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-zinc-100">
                            Konfigurasi Aksi Kustom Standar
                        </h3>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                            Atur otoritas akses tombol, personil yang dapat dipilih, tahapan, dan kondisi visibilitas
                        </p>
                    </div>
                </div>

                <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {normalizedActions.length} Aksi Standar
                </span>
            </div>

            {/* Compact List of Fixed Custom Actions */}
            <div className="space-y-2.5">
                {normalizedActions.map((act, actIdx) => {
                    const actionCode = (act.action_code || 'assign').toLowerCase();
                    const authorityCount = (act.authorities || []).length;
                    const personnelCount = (act.eligible_personnel || []).length;
                    const isSelectionAction = ['assign', 'signature', 'forward'].includes(actionCode);

                    const headerThemes: Record<string, { badgeBg: string; text: string; icon: React.ReactNode; label: string }> = {
                        assign: {
                            badgeBg: 'bg-blue-600 text-white',
                            text: 'text-blue-600 dark:text-blue-400',
                            icon: <UsersIcon size={13} className="text-blue-600 dark:text-blue-400" />,
                            label: '#1 PIC',
                        },
                        signature: {
                            badgeBg: 'bg-amber-600 text-white',
                            text: 'text-amber-600 dark:text-amber-400',
                            icon: <UserCheck size={13} className="text-amber-600 dark:text-amber-400" />,
                            label: '#2 TTD',
                        },
                        forward: {
                            badgeBg: 'bg-indigo-600 text-white',
                            text: 'text-indigo-600 dark:text-indigo-400',
                            icon: <UserPlus size={13} className="text-indigo-600 dark:text-indigo-400" />,
                            label: '#3 Ad-Hoc',
                        },
                        toggle_access: {
                            badgeBg: 'bg-slate-800 text-white dark:bg-zinc-700',
                            text: 'text-slate-700 dark:text-zinc-300',
                            icon: <Unlock size={13} className="text-amber-500" />,
                            label: '#4 Akses',
                        },
                    };

                    const theme = headerThemes[actionCode] || {
                        badgeBg: 'bg-slate-600 text-white',
                        text: 'text-slate-600',
                        icon: <Sliders size={13} />,
                        label: `#${actIdx + 1}`,
                    };

                    return (
                        <div
                            key={act.id || actIdx}
                            className={cn(
                                "rounded-lg border bg-white dark:bg-zinc-900/90 transition-all p-3 shadow-2xs space-y-2.5",
                                act.is_active !== false 
                                    ? "border-slate-200/90 hover:border-slate-300 dark:border-zinc-800" 
                                    : "border-slate-200/50 bg-slate-50/50 dark:bg-zinc-900/40 opacity-60"
                            )}
                        >
                            {/* Row 1: Title, Active Toggle, and Authority & Personnel Buttons */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded tracking-wider shrink-0", theme.badgeBg)}>
                                        {theme.label}
                                    </span>
                                    <div className="flex items-center gap-1.5 truncate">
                                        <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate">
                                            {act.name}
                                        </span>
                                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 hidden sm:inline">
                                            • {act.description}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    {/* 1. Tombol Otoritas Akses Tombol (Siapa yang bisa melihat / klik tombol) */}
                                    <button
                                        type="button"
                                        title="Tentukan siapa yang berhak melihat dan mengklik tombol aksi ini"
                                        onClick={() => setEditingAuthorityActionId(act.id)}
                                        className={cn(
                                            "inline-flex items-center gap-1 px-2.5 h-7 rounded-md text-[10.5px] font-bold shadow-2xs transition-colors cursor-pointer border",
                                            authorityCount > 0
                                                ? "bg-slate-800 text-white border-slate-800 hover:bg-slate-700 dark:bg-zinc-700 dark:border-zinc-600"
                                                : "bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50"
                                        )}
                                    >
                                        <Key size={11} className="text-amber-400" />
                                        <span>Otoritas Tombol</span>
                                        <span className={cn(
                                            "ml-0.5 rounded-full px-1.5 py-0.1 text-[9px] font-bold",
                                            authorityCount > 0 ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300"
                                        )}>
                                            {authorityCount}
                                        </span>
                                    </button>

                                    {/* 2. Tombol Tentukan Personil (Pool Personil yang bisa dipilih saat aksi digunakan) */}
                                    {isSelectionAction && (
                                        <button
                                            type="button"
                                            title="Tentukan daftar personil yang bisa dipilih saat aksi ini digunakan"
                                            onClick={() => setEditingPersonnelActionId(act.id)}
                                            className={cn(
                                                "inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[10.5px] font-bold shadow-2xs transition-colors cursor-pointer border",
                                                personnelCount > 0
                                                    ? "bg-primary text-white border-primary hover:bg-primary/90"
                                                    : "bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50"
                                            )}
                                        >
                                            <UsersIcon size={12} className="text-blue-500" />
                                            <span>Tentukan Personil</span>
                                            <span className={cn(
                                                "ml-0.5 rounded-full px-1.5 py-0.1 text-[9px] font-bold",
                                                personnelCount > 0 ? "bg-white/25 text-white" : "bg-primary text-white"
                                            )}>
                                                {personnelCount}
                                            </span>
                                        </button>
                                    )}

                                    {/* Active/Inactive Toggle */}
                                    <button
                                        type="button"
                                        onClick={() => updateAction(actIdx, { is_active: act.is_active !== false ? false : true })}
                                        className={cn(
                                            'flex h-6 cursor-pointer items-center rounded-full px-2.5 text-[9px] font-bold uppercase transition-all shadow-2xs ml-1',
                                            act.is_active !== false 
                                                ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                                                : 'bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-slate-300'
                                        )}
                                    >
                                        {act.is_active !== false ? 'AKTIF' : 'NON-AKTIF'}
                                    </button>
                                </div>
                            </div>

                            {/* Row 2: Compact Inline Fields */}
                            {act.is_active !== false && (
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80 items-center text-xs">
                                    {/* Label Tombol */}
                                    <div className="sm:col-span-4 flex items-center gap-1.5">
                                        <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 shrink-0 w-16 sm:w-auto">
                                            Label:
                                        </span>
                                        <input
                                            type="text"
                                            value={act.alias || ''}
                                            onChange={(e) => updateAction(actIdx, { alias: e.target.value })}
                                            className="h-7 w-full py-1 px-2 rounded border border-slate-200 bg-white text-[11px] font-medium transition-all focus:border-primary focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100"
                                            placeholder="Label tombol..."
                                        />
                                    </div>

                                    {/* Smart Visibility Dropdown */}
                                    <div className="sm:col-span-4 flex items-center gap-1.5">
                                        <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 shrink-0 w-16 sm:w-auto">
                                            Visibilitas:
                                        </span>
                                        <div className="w-full">
                                            <Select
                                                value={act.visibility_condition || 'always'}
                                                onValueChange={(val) => updateAction(actIdx, { visibility_condition: val as any })}
                                            >
                                                <SelectTrigger className="h-7 py-1 px-2 rounded border-slate-200 bg-white text-[10.5px] font-medium dark:border-zinc-700 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-none">
                                                    <SelectValue placeholder="Pilih Kondisi" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-lg border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                                                    <SelectItem value="always" className="text-xs font-medium">
                                                        Selalu Muncul
                                                    </SelectItem>
                                                    <SelectItem value="no_pic" className="text-xs font-medium">
                                                        Jika PIC Belum Ditugaskan
                                                    </SelectItem>
                                                    <SelectItem value="require_pic" className="text-xs font-medium">
                                                        Jika PIC Sudah Ditugaskan
                                                    </SelectItem>
                                                    <SelectItem value="no_signers" className="text-xs font-medium">
                                                        Jika Penandatangan Belum Ditentukan
                                                    </SelectItem>
                                                    <SelectItem value="has_signers" className="text-xs font-medium">
                                                        Jika Penandatangan Sudah Ditentukan
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Scope Radio / MultiSelect */}
                                    <div className="sm:col-span-4 flex items-center justify-between sm:justify-end gap-2">
                                        <div className="flex items-center gap-2 shrink-0">
                                            <label className="flex items-center gap-1 text-[10.5px] text-slate-600 dark:text-zinc-400 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name={`scope_${act.id}`}
                                                    checked={act.scope !== 'specific_steps'}
                                                    onChange={() => updateAction(actIdx, { scope: 'all_steps' })}
                                                    className="text-primary h-3 w-3"
                                                />
                                                Semua Tahap
                                            </label>
                                            <label className="flex items-center gap-1 text-[10.5px] text-slate-600 dark:text-zinc-400 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name={`scope_${act.id}`}
                                                    checked={act.scope === 'specific_steps'}
                                                    onChange={() => updateAction(actIdx, { scope: 'specific_steps' })}
                                                    className="text-primary h-3 w-3"
                                                />
                                                Tahap Tertentu
                                            </label>
                                        </div>
                                    </div>

                                    {/* Specific Steps Selector if selected */}
                                    {act.scope === 'specific_steps' && (
                                        <div className="sm:col-span-12 pt-1">
                                            <SearchableMultiSelect
                                                values={act.step_ids || []}
                                                onValuesChange={(vals) => updateAction(actIdx, { step_ids: vals })}
                                                options={stepOptions}
                                                placeholder="Pilih tahapan yang mengizinkan aksi ini..."
                                            />
                                        </div>
                                    )}

                                    {/* Target Step Setting for Tentukan / Ganti PIC */}
                                    {(actionCode === 'assign' || act.id === 'action_assign_pic') && (
                                        <div className="sm:col-span-12 pt-2 mt-1 border-t border-dashed border-slate-100 dark:border-zinc-800 flex flex-wrap items-center gap-2">
                                            <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 shrink-0">
                                                Perilaku Langkah & Tahapan:
                                            </span>

                                            {/* 1. Mode Transisi Langkah */}
                                            <div className="w-48 sm:w-56">
                                                <Select
                                                    value={act.target_step_mode || 'current_step'}
                                                    onValueChange={(val) =>
                                                        updateAction(actIdx, {
                                                            target_step_mode: val as any,
                                                            target_step_id: val === 'specific_step' ? act.target_step_id || (steps[0]?.id ? String(steps[0].id) : undefined) : undefined,
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger className="h-7 py-1 px-2 rounded border-slate-200 bg-white text-[10.5px] font-medium dark:border-zinc-700 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-none">
                                                        <SelectValue placeholder="Pilih Perilaku Langkah" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-lg border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                                                        <SelectItem value="current_step" className="text-xs font-medium">
                                                            <div className="flex items-center gap-1.5">
                                                                <Layers size={12} className="text-blue-500 shrink-0" />
                                                                <span>Tetap di Tahap Saat Ini (Default)</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="next_step" className="text-xs font-medium">
                                                            <div className="flex items-center gap-1.5">
                                                                <ArrowRight size={12} className="text-emerald-500 shrink-0" />
                                                                <span>Lanjut ke Langkah Berikutnya (+1)</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="specific_step" className="text-xs font-medium">
                                                            <div className="flex items-center gap-1.5">
                                                                <Target size={12} className="text-indigo-500 shrink-0" />
                                                                <span>Lompat ke Tahap Tertentu</span>
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* 2. Dropdown Pilih Tahap Spesifik jika specific_step */}
                                            {act.target_step_mode === 'specific_step' && (
                                                <div className="w-56 sm:w-64">
                                                    <Select
                                                        value={String(act.target_step_id || steps[0]?.id || '')}
                                                        onValueChange={(val) => updateAction(actIdx, { target_step_id: val })}
                                                    >
                                                        <SelectTrigger className="h-7 py-1 px-2 rounded border-slate-200 bg-white text-[10.5px] font-medium dark:border-zinc-700 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-none">
                                                            <SelectValue placeholder="Pilih Tahap Target" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-lg border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                                                            {steps.map((s: any, sIdx: number) => (
                                                                <SelectItem key={s.id} value={String(s.id)} className="text-xs font-medium">
                                                                    Tahap {s.step || sIdx + 1}: {s.label || s.name || s.description || `Langkah ${sIdx + 1}`}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}

                                            {/* 3. Status Kontrak Target */}
                                            {contractStatuses && contractStatuses.length > 0 && (
                                                <div className="w-44 sm:w-52">
                                                    <Select
                                                        value={act.target_status || 'default'}
                                                        onValueChange={(val) => updateAction(actIdx, { target_status: val === 'default' ? null : val })}
                                                    >
                                                        <SelectTrigger className="h-7 py-1 px-2 rounded border-slate-200 bg-white text-[10.5px] font-medium dark:border-zinc-700 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-none">
                                                            <SelectValue placeholder="Status Kontrak" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-lg border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                                                            <SelectItem value="default" className="text-xs font-medium text-slate-500">
                                                                Status Tetap (Tidak Berubah)
                                                            </SelectItem>
                                                            {contractStatuses.map((status: any) => (
                                                                <SelectItem key={status.id} value={status.code} className="text-xs font-medium">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <div
                                                                            className="h-2 w-2 rounded-full"
                                                                            style={{ backgroundColor: status.color || '#cbd5e1' }}
                                                                        />
                                                                        <span>{status.code?.toUpperCase()}</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}

                                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 italic">
                                                *Default hanya simpan data PIC tanpa geser langkah/status.
                                            </span>
                                        </div>
                                    )}

                                    {/* Target Step Setting for Approval Tambahan (Ad-Hoc / Forward) */}
                                    {(actionCode === 'forward' || act.id === 'action_adhoc') && (
                                        <div className="sm:col-span-12 pt-2 mt-1 border-t border-dashed border-slate-100 dark:border-zinc-800 flex flex-wrap items-center gap-2">
                                            <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 shrink-0">
                                                Penempatan / Waktu Eksekusi:
                                            </span>

                                            {/* 1. Posisi: Sebelum / Pada / Setelah */}
                                            <div className="w-36 sm:w-44">
                                                <Select
                                                    value={act.target_step_position || 'at'}
                                                    onValueChange={(val) => updateAction(actIdx, { target_step_position: val as any })}
                                                >
                                                    <SelectTrigger className="h-7 py-1 px-2 rounded border-slate-200 bg-white text-[10.5px] font-medium dark:border-zinc-700 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-none">
                                                        <SelectValue placeholder="Pilih Posisi" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-lg border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                                                        <SelectItem value="at" className="text-xs font-medium">
                                                            <div className="flex items-center gap-1.5">
                                                                <Settings2 size={12} className="text-slate-400 shrink-0" />
                                                                <span>Pada Tahap (Saat)</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="before" className="text-xs font-medium">
                                                            <div className="flex items-center gap-1.5">
                                                                <CornerDownLeft size={12} className="text-amber-500 shrink-0" />
                                                                <span>Sebelum Tahap</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="after" className="text-xs font-medium">
                                                            <div className="flex items-center gap-1.5">
                                                                <ArrowRight size={12} className="text-emerald-500 shrink-0" />
                                                                <span>Setelah Tahap</span>
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* 2. Acuan Tahap: Tahap Saat Ini vs Tahap Spesifik */}
                                            <div className="w-40 sm:w-44">
                                                <Select
                                                    value={act.target_step_mode || 'current_step'}
                                                    onValueChange={(val) =>
                                                        updateAction(actIdx, {
                                                            target_step_mode: val as any,
                                                            target_step_id: val === 'specific_step' ? act.target_step_id || (steps[0]?.id ? String(steps[0].id) : undefined) : undefined,
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger className="h-7 py-1 px-2 rounded border-slate-200 bg-white text-[10.5px] font-medium dark:border-zinc-700 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-none">
                                                        <SelectValue placeholder="Acuan Tahap" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-lg border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                                                        <SelectItem value="current_step" className="text-xs font-medium">
                                                            <div className="flex items-center gap-1.5">
                                                                <Layers size={12} className="text-blue-500 shrink-0" />
                                                                <span>Tahap Saat Ini</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="specific_step" className="text-xs font-medium">
                                                            <div className="flex items-center gap-1.5">
                                                                <Target size={12} className="text-indigo-500 shrink-0" />
                                                                <span>Tahap Tertentu</span>
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* 3. Dropdown Pilih Tahap Spesifik */}
                                            {act.target_step_mode === 'specific_step' && (
                                                <div className="w-56 sm:w-64">
                                                    <Select
                                                        value={String(act.target_step_id || steps[0]?.id || '')}
                                                        onValueChange={(val) => updateAction(actIdx, { target_step_id: val })}
                                                    >
                                                        <SelectTrigger className="h-7 py-1 px-2 rounded border-slate-200 bg-white text-[10.5px] font-medium dark:border-zinc-700 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-none">
                                                            <SelectValue placeholder="Pilih Tahap Acuan" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-lg border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                                                            {steps.map((s: any, sIdx: number) => (
                                                                <SelectItem key={s.id} value={String(s.id)} className="text-xs font-medium">
                                                                    Tahap {s.step || sIdx + 1}: {s.label || s.name || s.description || `Langkah ${sIdx + 1}`}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Modal 1: Otoritas Akses Tombol (Siapa yang bisa melihat / mengeksekusi tombol) */}
            <Dialog open={!!editingAuthorityActionId} onOpenChange={(open) => { if (!open) setEditingAuthorityActionId(null); }}>
                <DialogContent className="sm:max-w-[96vw] w-[96vw] max-w-[96vw] h-[90vh] max-h-[90vh] border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 rounded-[12px] border p-0 shadow-2xl overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-700 bg-slate-800 text-white flex items-center justify-between rounded-t-[12px] shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 text-white border border-white/20 flex h-9 w-9 items-center justify-center rounded-lg">
                                <Key size={18} className="text-amber-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-sm font-bold tracking-tight text-white">
                                    Otoritas Akses Tombol — {currentEditingAuthorityAction?.alias || currentEditingAuthorityAction?.name || 'Aksi Kustom'}
                                </DialogTitle>
                                <DialogDescription className="text-white/80 text-xs font-medium mt-0.5">
                                    Tentukan pengguna/role/departemen yang berhak <strong>melihat dan mengklik tombol</strong> ini di detail kontrak.
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-white dark:bg-zinc-900 flex-1 overflow-y-auto space-y-4">
                        {currentEditingAuthorityAction && currentEditingAuthorityIndex >= 0 && (
                            <AuthorityTableManager
                                title={`Otoritas Akses Tombol: ${currentEditingAuthorityAction.alias || currentEditingAuthorityAction.name}`}
                                authorities={currentEditingAuthorityAction.authorities || []}
                                onChange={(vals) => updateAction(currentEditingAuthorityIndex, { authorities: vals })}
                                users={users}
                                roles={roles}
                                departments={departments}
                                divisions={divisions}
                                companyGroups={companyGroups}
                                companies={companies}
                                regions={regions}
                                showCustom={true}
                                showCombinations={true}
                                simulationContext={simulationContext}
                                onOpenSimulationModal={onOpenSimulationModal}
                            />
                        )}
                    </div>

                    <DialogFooter className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50 flex items-center justify-end">
                        <Button
                            type="button"
                            onClick={() => setEditingAuthorityActionId(null)}
                            className="cursor-pointer h-8.5 px-4 text-xs font-bold"
                        >
                            Selesai
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal 2: Tentukan Personil (Pool User yang bisa dipilih ketika aksi dijalankan) */}
            <Dialog open={!!editingPersonnelActionId} onOpenChange={(open) => { if (!open) setEditingPersonnelActionId(null); }}>
                <DialogContent className="sm:max-w-[96vw] w-[96vw] max-w-[96vw] h-[90vh] max-h-[90vh] border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 rounded-[12px] border p-0 shadow-2xl overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-primary/20 bg-primary text-white flex items-center justify-between rounded-t-[12px] shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 text-white border border-white/20 flex h-9 w-9 items-center justify-center rounded-lg">
                                <UsersIcon size={18} />
                            </div>
                            <div>
                                <DialogTitle className="text-sm font-bold tracking-tight text-white">
                                    Daftar Personil Yang Dapat Dipilih — {currentEditingPersonnelAction?.alias || currentEditingPersonnelAction?.name || 'Aksi Kustom'}
                                </DialogTitle>
                                <DialogDescription className="text-white/80 text-xs font-medium mt-0.5">
                                    Tentukan daftar pengguna/role/departemen yang <strong>bisa dipilih</strong> di dalam modal (misal: calon PIC, Penandatangan, atau Reviewer).
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-white dark:bg-zinc-900 flex-1 overflow-y-auto space-y-4">
                        {currentEditingPersonnelAction && currentEditingPersonnelIndex >= 0 && (
                            <AuthorityTableManager
                                title={`Daftar Personil Yang Dapat Dipilih: ${currentEditingPersonnelAction.alias || currentEditingPersonnelAction.name}`}
                                authorities={currentEditingPersonnelAction.eligible_personnel || []}
                                onChange={(vals) => updateAction(currentEditingPersonnelIndex, { eligible_personnel: vals })}
                                users={users}
                                roles={roles}
                                departments={departments}
                                divisions={divisions}
                                companyGroups={companyGroups}
                                companies={companies}
                                regions={regions}
                                showCustom={true}
                                showCombinations={true}
                                simulationContext={simulationContext}
                                onOpenSimulationModal={onOpenSimulationModal}
                            />
                        )}
                    </div>

                    <DialogFooter className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50 flex items-center justify-end">
                        <Button
                            type="button"
                            onClick={() => setEditingPersonnelActionId(null)}
                            className="cursor-pointer h-8.5 px-4 text-xs font-bold"
                        >
                            Selesai
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
