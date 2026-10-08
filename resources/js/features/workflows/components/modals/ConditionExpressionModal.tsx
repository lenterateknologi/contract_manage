import { Button } from '@/components/ui/buttons/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialogs/Dialog';
import { FormInput } from '@/components/ui/inputs/FormInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/selection/Select';
import { cn } from '@/lib/utils';
import { GitBranch, Key } from 'lucide-react';

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
            <DialogContent className="overflow-hidden rounded-[8px] border border-slate-200/80 bg-white p-0 text-slate-800 shadow-2xl sm:max-w-[520px] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                <div className="border-primary/20 bg-primary flex items-center justify-between rounded-t-[8px] border-b px-6 py-4 text-white dark:border-zinc-700/80 dark:bg-zinc-800/90 dark:text-zinc-200">
                    <div className="z-10 flex items-center gap-3 pr-10">
                        <div className="dark:bg-primary/20 dark:text-primary dark:border-primary/30 flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/20 text-white">
                            <GitBranch size={18} />
                        </div>
                        <div>
                            <DialogTitle className="text-sm font-bold tracking-tight text-white dark:text-zinc-100">
                                Ekspresi Kondisi (Metadata)
                            </DialogTitle>
                            <DialogDescription className="mt-0.5 text-xs font-medium text-white/80 dark:text-zinc-400">
                                Atur kondisi dinamis agar langkah persetujuan ini hanya berjalan saat kriteria terpenuhi
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <div className="max-h-[75vh] space-y-5 overflow-y-auto bg-white p-6 dark:bg-zinc-900">
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
                        <div className="animate-in fade-in-50 space-y-4 duration-200">
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
                                <Select value={parsedCondition.operator} onValueChange={(v) => handleConditionChange({ operator: v })}>
                                    <SelectTrigger className="dark:bg-card h-10 rounded-xl border-slate-200 bg-slate-50/50 text-sm font-medium transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-black/50">
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
                            <div className="dark:bg-card/20 rounded-xl border border-dashed border-slate-200 bg-slate-50/20 p-3 dark:border-slate-800">
                                <p className="text-xs text-slate-500 dark:text-slate-400">Preview Ekspresi:</p>
                                <code className="mt-1 block rounded bg-slate-100 px-2 py-1 font-mono text-xs break-all text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                                    {step.condition_expression || '-'}
                                </code>
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
