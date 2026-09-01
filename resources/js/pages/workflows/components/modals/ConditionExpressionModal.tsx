import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialogs/Dialog';
import { Button } from '@/components/ui/buttons/Button';
import { FormInput } from '@/components/ui/inputs/FormInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/Select';
import { GitBranch, Key } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConditionExpressionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    step: any;
    idx: number;
    updateLocalStep: (idx: number, data: any) => void;
    parsedCondition: {
        key: string;
        operator: string;
        value: string;
    };
    handleConditionChange: (updates: Partial<{ key: string; operator: string; value: string }>) => void;
}

export function ConditionExpressionModal({
    open,
    onOpenChange,
    step,
    idx,
    updateLocalStep,
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
                    condition_key: 'METADATA_KEY',
                    condition_operator: 'truthy',
                    condition_value: '',
                },
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px] border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 overflow-hidden rounded-[8px] border p-0 shadow-2xl">
                <div className="px-6 py-4 border-b border-primary/20 dark:border-zinc-700/80 bg-primary dark:bg-zinc-800/90 text-white dark:text-zinc-200 flex items-center justify-between rounded-t-[8px]">
                    <div className="flex items-center gap-3 z-10 pr-10">
                        <div className="bg-white/20 text-white border border-white/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30 flex h-9 w-9 items-center justify-center rounded-lg">
                            <GitBranch size={18} />
                        </div>
                        <div>
                            <DialogTitle className="text-sm font-bold tracking-tight text-white dark:text-zinc-100">
                                Ekspresi Kondisi (Metadata)
                            </DialogTitle>
                            <DialogDescription className="text-white/80 dark:text-zinc-400 text-xs font-medium mt-0.5">
                                Atur kondisi dinamis agar langkah persetujuan ini hanya berjalan saat kriteria terpenuhi
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-5 bg-white dark:bg-zinc-900 max-h-[75vh] overflow-y-auto">
                    {/* Status Toggle */}
                    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/50 dark:bg-card">
                        <div className="space-y-0.5">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Status Kondisi</span>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Aktifkan untuk memproses langkah ini berdasarkan kondisi.</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleToggle}
                            className={cn(
                                'flex h-7 cursor-pointer items-center gap-2 rounded-full px-4 text-xs font-semibold uppercase tracking-wider transition-all',
                                isEnabled
                                    ? 'bg-primary text-white shadow-xs'
                                    : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500',
                            )}
                        >
                            {isEnabled ? 'AKTIF' : 'NON-AKTIF'}
                        </button>
                    </div>

                    {isEnabled ? (
                        <div className="space-y-4 animate-in fade-in-50 duration-200">
                            {/* Key Input */}
                            <FormInput
                                label={
                                    <span className="flex items-center gap-1">
                                        <Key className="h-3.5 w-3.5" />
                                        <span>Metadata Key</span>
                                    </span>
                                }
                                variant="filled"
                                size="sm"
                                value={parsedCondition.key}
                                onChange={(e) => handleConditionChange({ key: e.target.value })}
                                placeholder="Contoh: contract.has_tax"
                            />

                            {/* Operator Input */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Operator</label>
                                <Select
                                    value={parsedCondition.operator}
                                    onValueChange={(v) => handleConditionChange({ operator: v })}
                                >
                                    <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50/50 dark:bg-card text-sm font-medium transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-black/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="truthy" className="py-2 text-sm font-medium uppercase">
                                            TRUTHY
                                        </SelectItem>
                                        <SelectItem value="==" className="py-2 text-sm font-medium uppercase">
                                            == (SAMA)
                                        </SelectItem>
                                        <SelectItem value="!=" className="py-2 text-sm font-medium uppercase">
                                            != (BEDA)
                                        </SelectItem>
                                        <SelectItem value=">" className="py-2 text-sm font-medium uppercase">
                                            &gt; (LEBIH)
                                        </SelectItem>
                                        <SelectItem value="<" className="py-2 text-sm font-medium uppercase">
                                            &lt; (KURANG)
                                        </SelectItem>
                                        <SelectItem value="contains" className="py-2 text-sm font-medium uppercase">
                                            CONTAINS
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Expected Value Input */}
                            {parsedCondition.operator !== 'truthy' && (
                                <FormInput
                                    label="Expected Value"
                                    variant="filled"
                                    size="sm"
                                    value={parsedCondition.value}
                                    onChange={(e) => handleConditionChange({ value: e.target.value })}
                                    placeholder="Nilai yang diharapkan"
                                />
                            )}

                            {/* Live Preview */}
                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/20 p-3 dark:border-slate-800 dark:bg-card/20">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Preview Ekspresi:
                                </p>
                                <code className="mt-1 block rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-300 break-all">
                                    {step.condition_expression || '-'}
                                </code>
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-[100px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/30 dark:border-slate-800/50 dark:bg-black/10">
                            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                                Selalu Diproses (Tanpa Kondisi)
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex items-center justify-end gap-2 rounded-b-[8px]">
                    <Button variant="default" onClick={() => onOpenChange(false)} className="rounded-lg h-9 px-4 text-xs font-semibold bg-primary text-white hover:bg-primary/95 shadow-sm">
                        Selesai
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
