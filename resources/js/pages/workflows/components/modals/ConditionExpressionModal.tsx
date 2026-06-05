import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/overlays/Dialog';
import { Button } from '@/components/ui/base/Button';
import { FormInput } from '@/components/ui/forms/FormInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/Select';
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
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <GitBranch className="h-5 w-5 text-primary" />
                        <DialogTitle>Ekspresi Kondisi (Metadata)</DialogTitle>
                    </div>
                    <DialogDescription>
                        Atur kondisi dinamis agar langkah persetujuan ini hanya berjalan ketika kriteria metadata tertentu terpenuhi.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    {/* Status Toggle */}
                    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/50 dark:bg-card">
                        <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Status Kondisi</span>
                            <p className="text-[10px] text-slate-400">Aktifkan untuk memproses langkah ini berdasarkan kondisi.</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleToggle}
                            className={cn(
                                'flex h-7 cursor-pointer items-center gap-2 rounded-full px-4 text-[10px] font-bold uppercase transition-all',
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
                                    <>
                                        <Key size={10} /> Metadata Key
                                    </>
                                }
                                variant="filled"
                                size="sm"
                                value={parsedCondition.key}
                                onChange={(e) => handleConditionChange({ key: e.target.value })}
                                placeholder="Contoh: contract.has_tax"
                            />

                            {/* Operator Input */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-muted-foreground">Operator</label>
                                <Select
                                    value={parsedCondition.operator}
                                    onValueChange={(v) => handleConditionChange({ operator: v })}
                                >
                                    <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50/50 dark:bg-card text-xs font-bold transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-black/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="truthy" className="py-2 text-xs font-bold uppercase">
                                            TRUTHY
                                        </SelectItem>
                                        <SelectItem value="==" className="py-2 text-xs font-bold uppercase">
                                            == (SAMA)
                                        </SelectItem>
                                        <SelectItem value="!=" className="py-2 text-xs font-bold uppercase">
                                            != (BEDA)
                                        </SelectItem>
                                        <SelectItem value=">" className="py-2 text-xs font-bold uppercase">
                                            &gt; (LEBIH)
                                        </SelectItem>
                                        <SelectItem value="<" className="py-2 text-xs font-bold uppercase">
                                            &lt; (KURANG)
                                        </SelectItem>
                                        <SelectItem value="contains" className="py-2 text-xs font-bold uppercase">
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
                                <p className="text-[10px] text-slate-400">
                                    Preview Ekspresi:
                                </p>
                                <code className="mt-1 block rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-300 break-all">
                                    {step.condition_expression || '-'}
                                </code>
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-[100px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/30 dark:border-slate-800/50 dark:bg-black/10">
                            <p className="text-xs font-bold text-slate-400">
                                Selalu Diproses (Tanpa Kondisi)
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="default" onClick={() => onOpenChange(false)}>
                        Selesai
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
