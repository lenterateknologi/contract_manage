import { cn } from '@/lib/utils';
import React from 'react';

interface TaxToggleProps {
    taxRequired: boolean;
    setTaxRequired: (val: boolean) => void;
}

export function TaxToggle({ taxRequired, setTaxRequired }: TaxToggleProps) {
    return (
        <div
            className={cn(
                'mb-4 rounded-xl border p-3 transition-all duration-300',
                taxRequired
                    ? 'bg-primary/5 border-primary/20'
                    : 'border-surface-border/50 bg-surface-muted/30',
            )}
        >
            <label className="flex cursor-pointer items-center justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                            taxRequired
                                ? 'bg-primary shadow-primary/20 text-white shadow-lg'
                                : 'bg-surface-muted text-text-soft/20',
                        )}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M4 10h12" />
                            <path d="M4 14h9" />
                            <path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2" />
                            <path d="M16 16l4-4-4-4" />
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <span
                            className={cn(
                                'text-[11px] font-semibold tracking-wider uppercase',
                                taxRequired ? 'text-primary' : 'text-text-soft/40',
                            )}
                        >
                            Ada Pajak
                        </span>
                        <span className="text-text-soft/30 text-[9px] font-medium">
                            Aktifkan jika kontrak dikenakan pajak (PPN/PPh)
                        </span>
                    </div>
                </div>
                <div
                    onClick={() => setTaxRequired(!taxRequired)}
                    className={cn(
                        'relative h-5 w-9 rounded-full transition-all duration-300',
                        taxRequired ? 'bg-primary shadow-inner shadow-black/10' : 'bg-surface-muted border-surface-border border',
                    )}
                >
                    <div
                        className={cn(
                            'absolute top-1 h-3 w-3 rounded-full bg-white shadow-sm transition-all duration-300',
                            taxRequired ? 'left-5' : 'left-1',
                        )}
                    />
                </div>
                <input
                    type="checkbox"
                    checked={taxRequired}
                    onChange={() => { }} // Controlled by div click for better feel
                    className="hidden"
                />
            </label>
        </div>
    );
}
