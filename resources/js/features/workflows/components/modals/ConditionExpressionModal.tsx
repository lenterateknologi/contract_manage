import { Button } from '@/components/ui/buttons/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialogs/Dialog';
import { FormInput } from '@/components/ui/inputs/FormInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/Select';
import { cn } from '@/lib/utils';
import { GitBranch, Key, PlusCircle, Trash2 } from 'lucide-react';
import { PRESET_METADATA_KEYS } from '../../utils/constants';

interface ConditionExpressionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    step: any;
    idx: number;
    updateLocalStep: (idx: number, data: any) => void;
    conditions?: Array<{ key: string; operator: string; value: string }>;
    conditionMatch?: 'any' | 'all';
    addCondition?: () => void;
    removeCondition?: (index: number) => void;
    updateConditionAt?: (index: number, updates: Partial<{ key: string; operator: string; value: string }>) => void;
    setConditionMatch?: (match: 'any' | 'all') => void;
    parsedCondition?: {
        key: string;
        operator: string;
        value: string;
    };
    handleConditionChange?: (updates: Partial<{ key: string; operator: string; value: string }>) => void;
}

export function ConditionExpressionModal({
    open,
    onOpenChange,
    step,
    idx,
    updateLocalStep,
    conditions = [],
    conditionMatch = 'all',
    addCondition,
    removeCondition,
    updateConditionAt,
    setConditionMatch,
    parsedCondition,
    handleConditionChange,
}: ConditionExpressionModalProps) {
    const isEnabled = step.condition_expression !== null;

    const handleToggle = () => {
        if (isEnabled) {
            updateLocalStep(idx, {
                condition_expression: null,
                meta: {
                    ...(step.meta || {}),
                    conditions: [],
                    condition_match: 'all',
                    condition_key: null,
                    condition_operator: null,
                    condition_value: null,
                },
            });
        } else {
            updateLocalStep(idx, {
                condition_expression: 'METADATA_KEY',
                meta: {
                    ...(step.meta || {}),
                    conditions: [{ key: 'METADATA_KEY', operator: 'truthy', value: '' }],
                    condition_match: 'all',
                    condition_key: 'METADATA_KEY',
                    condition_operator: 'truthy',
                    condition_value: '',
                },
            });
        }
    };

    const effectiveConditions =
        conditions.length > 0
            ? conditions
            : parsedCondition
              ? [parsedCondition]
              : [{ key: '', operator: 'truthy', value: '' }];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="overflow-hidden rounded-[8px] border border-slate-200/80 bg-white p-0 text-slate-800 shadow-2xl sm:max-w-[620px] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                <div className="border-primary/20 bg-primary flex items-center justify-between rounded-t-[8px] border-b px-6 py-4 text-white dark:border-zinc-700/80 dark:bg-zinc-800/90 dark:text-zinc-200">
                    <div className="z-10 flex items-center gap-3 pr-10">
                        <div className="dark:bg-primary/20 dark:text-primary dark:border-primary/30 flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/20 text-white">
                            <GitBranch size={18} />
                        </div>
                        <div>
                            <DialogTitle className="text-sm font-bold tracking-tight text-white dark:text-zinc-100">
                                Ekspresi Kondisi Langkah
                            </DialogTitle>
                            <DialogDescription className="mt-0.5 text-xs font-medium text-white/80 dark:text-zinc-400">
                                Atur kondisi dinamis agar langkah persetujuan ini hanya berjalan saat kriteria terpenuhi
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <div className="max-h-[75vh] space-y-4 overflow-y-auto bg-white p-6 dark:bg-zinc-900">
                    {/* Status Toggle */}
                    <div className="dark:bg-card flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/50">
                        <div className="space-y-0.5">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Status Kondisi</span>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Aktifkan untuk memproses langkah ini berdasarkan kondisi.</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleToggle}
                            className={cn(
                                'flex h-7 cursor-pointer items-center gap-2 rounded-full px-4 text-xs font-semibold tracking-wider uppercase transition-all',
                                isEnabled ? 'bg-primary text-white shadow-xs' : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500',
                            )}
                        >
                            {isEnabled ? 'AKTIF' : 'NON-AKTIF'}
                        </button>
                    </div>

                    {isEnabled ? (
                        <div className="animate-in fade-in-50 space-y-3.5 duration-200">
                            {/* Condition Rows List */}
                            <div className="space-y-2.5">
                                {effectiveConditions.map((cond, condIdx) => (
                                    <div
                                        key={condIdx}
                                        className="relative rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900"
                                    >
                                        <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-1.5 dark:border-zinc-800">
                                            <div className="flex items-center gap-1.5">
                                                <span className="bg-primary/10 text-primary flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold">
                                                    {condIdx + 1}
                                                </span>
                                                <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                                                    Syarat #{condIdx + 1}
                                                </span>
                                                {condIdx > 0 && (
                                                    <div className="flex items-center rounded-md border border-slate-200 bg-slate-100/90 p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateConditionAt?.(condIdx, { logic: 'AND' })}
                                                            className={cn(
                                                                'rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase transition-all',
                                                                (cond.logic || 'AND') === 'AND'
                                                                    ? 'bg-primary text-white shadow-2xs'
                                                                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400',
                                                            )}
                                                            title="Hubungkan dengan logika DAN (kedua syarat harus terpenuhi)"
                                                        >
                                                            DAN (&&)
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateConditionAt?.(condIdx, { logic: 'OR' })}
                                                            className={cn(
                                                                'rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase transition-all',
                                                                cond.logic === 'OR'
                                                                    ? 'bg-primary text-white shadow-2xs'
                                                                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400',
                                                            )}
                                                            title="Hubungkan dengan logika ATAU (salah satu syarat terpenuhi)"
                                                        >
                                                            ATAU (||)
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            {effectiveConditions.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeCondition?.(condIdx)}
                                                    className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors dark:hover:bg-rose-950/30"
                                                    title="Hapus Syarat Ini"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
                                            {/* Key Input */}
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                                        <Key className="h-3 w-3 text-slate-400" />
                                                        <span>Metadata Key</span>
                                                    </label>
                                                    <span className="text-[9.5px] text-slate-400 dark:text-zinc-500">Pilih / Ketik</span>
                                                </div>
                                                <div className="relative">
                                                    <FormInput
                                                        list={`modal-keys-${idx}-${condIdx}`}
                                                        variant="filled"
                                                        size="sm"
                                                        value={cond.key}
                                                        onChange={(e) =>
                                                            updateConditionAt
                                                                ? updateConditionAt(condIdx, { key: e.target.value })
                                                                : handleConditionChange?.({ key: e.target.value })
                                                        }
                                                        placeholder="cth: contract.has_tax"
                                                    />
                                                    <datalist id={`modal-keys-${idx}-${condIdx}`}>
                                                        {PRESET_METADATA_KEYS.map((preset) => (
                                                            <option key={preset.value} value={preset.value}>
                                                                {preset.label}
                                                            </option>
                                                        ))}
                                                    </datalist>
                                                </div>
                                            </div>

                                            {/* Operator Input */}
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Operator</label>
                                                <Select
                                                    value={cond.operator || 'truthy'}
                                                    onValueChange={(v) =>
                                                        updateConditionAt
                                                            ? updateConditionAt(condIdx, { operator: v })
                                                            : handleConditionChange?.({ operator: v })
                                                    }
                                                >
                                                    <SelectTrigger className="dark:bg-card h-9 rounded-lg border-slate-200 bg-slate-50/50 text-xs font-medium transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-black/50">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="truthy" className="py-1 text-xs font-medium uppercase">
                                                            TRUTHY (Ada / Benar)
                                                        </SelectItem>
                                                        <SelectItem value="==" className="py-1 text-xs font-medium uppercase">
                                                            == (SAMA)
                                                        </SelectItem>
                                                        <SelectItem value="!=" className="py-1 text-xs font-medium uppercase">
                                                            != (BEDA)
                                                        </SelectItem>
                                                        <SelectItem value=">" className="py-1 text-xs font-medium uppercase">
                                                            &gt; (LEBIH)
                                                        </SelectItem>
                                                        <SelectItem value="<" className="py-1 text-xs font-medium uppercase">
                                                            &lt; (KURANG)
                                                        </SelectItem>
                                                        <SelectItem value="contains" className="py-1 text-xs font-medium uppercase">
                                                            CONTAINS
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Expected Value Input */}
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Expected Value</label>
                                                {cond.operator !== 'truthy' ? (
                                                    <FormInput
                                                        variant="filled"
                                                        size="sm"
                                                        value={cond.value}
                                                        onChange={(e) =>
                                                            updateConditionAt
                                                                ? updateConditionAt(condIdx, { value: e.target.value })
                                                                : handleConditionChange?.({ value: e.target.value })
                                                        }
                                                        placeholder="Nilai yang diharapkan"
                                                    />
                                                ) : (
                                                    <div className="flex h-9 items-center rounded-lg border border-slate-200/60 bg-slate-100/60 px-3 text-xs font-medium text-slate-400 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-500">
                                                        Otomatis Truthy
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Add button & Live Preview */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={addCondition}
                                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                    <PlusCircle size={13} className="text-primary" />
                                    <span>Tambah Syarat Baru</span>
                                </button>

                                <div className="dark:bg-card/20 rounded-lg border border-dashed border-slate-200 bg-slate-50/20 px-3 py-1.5 dark:border-slate-800">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                        <span>Preview:</span>
                                        <code className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200 break-all">
                                            {step.condition_expression || '-'}
                                        </code>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-[100px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/30 dark:border-slate-800/50 dark:bg-black/10">
                            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">Selalu Diproses (Tanpa Kondisi)</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex items-center justify-end gap-2 rounded-b-[8px] border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <Button
                        variant="default"
                        onClick={() => onOpenChange(false)}
                        className="bg-primary hover:bg-primary/95 h-9 rounded-lg px-4 text-xs font-semibold text-white shadow-sm"
                    >
                        Selesai
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
