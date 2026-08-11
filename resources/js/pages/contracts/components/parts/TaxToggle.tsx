import { Checkbox } from '@/components/ui/selection/Checkbox';

interface TaxToggleProps {
    taxRequired: boolean;
    setTaxRequired: (val: boolean) => void;
}

export function TaxToggle({ taxRequired, setTaxRequired }: TaxToggleProps) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-slate-700 dark:text-zinc-200 text-[10.5px] font-extrabold uppercase">
                Penentuan Pajak
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface-muted/10 px-3 py-2.5">
                <Checkbox
                    id="tax_required_modal"
                    checked={taxRequired}
                    onCheckedChange={(c) => setTaxRequired(!!c)}
                />
                <label htmlFor="tax_required_modal" className="text-sm font-medium text-text-main cursor-pointer select-none">
                    Dikenakan Pajak (PPN/PPh)
                </label>
            </div>
        </div>
    );
}
