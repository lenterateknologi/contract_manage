import { Checkbox } from '@/components/ui/selection/Checkbox';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle } from 'lucide-react';

interface TaxToggleProps {
    taxRequired: boolean;
    setTaxRequired?: (val: boolean) => void;
    pkpStatus?: string;
    isAuto?: boolean;
    disabled?: boolean;
}

export function TaxToggle({ taxRequired, setTaxRequired, pkpStatus, isAuto, disabled }: TaxToggleProps) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
                <label className="text-slate-700 dark:text-zinc-200 text-[10.5px] font-extrabold uppercase">
                    Penentuan Pajak
                </label>
                {pkpStatus && pkpStatus !== '-' && (
                    <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded border",
                        taxRequired 
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                            : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"
                    )}>
                        Status PKP: {pkpStatus}
                    </span>
                )}
            </div>
            <div className={cn(
                "flex items-center justify-between rounded-lg border border-surface-border bg-surface-muted/10 px-3 py-2.5",
                disabled && "opacity-90 bg-muted/40 cursor-not-allowed"
            )}>
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="tax_required_modal"
                        checked={taxRequired}
                        disabled={disabled}
                        onCheckedChange={(c) => setTaxRequired?.(!!c)}
                    />
                    <label 
                        htmlFor="tax_required_modal" 
                        className={cn(
                            "text-sm font-medium text-text-main select-none",
                            disabled ? "cursor-not-allowed" : "cursor-pointer"
                        )}
                    >
                        Dikenakan Pajak (PPN/PPh)
                    </label>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                    {taxRequired ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={13} className="shrink-0" />
                            Kena Pajak
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                            <XCircle size={13} className="shrink-0" />
                            Bebas Pajak
                        </span>
                    )}
                </div>
            </div>
            {isAuto && (
                <p className="text-[10px] text-muted-foreground italic">
                    * Ditentukan otomatis dari status perpajakan Pihak Kedua / Vendor ({pkpStatus || 'Non-PKP'}).
                </p>
            )}
        </div>
    );
}

