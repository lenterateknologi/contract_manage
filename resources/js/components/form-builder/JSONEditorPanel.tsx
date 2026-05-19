import { Button } from '@/components/ui/base/Button';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import React from 'react';

interface JSONEditorPanelProps {
    localJsonStr: string;
    onChange: (val: string) => void;
    onApply: () => void;
    jsonError: string | null;
}

export const JSONEditorPanel: React.FC<JSONEditorPanelProps> = ({ localJsonStr, onChange, onApply, jsonError }) => {
    return (
        <div className="animate-in fade-in slide-in-from-left-4 h-full space-y-4 duration-300">
            <div className="flex items-center justify-between">
                <h3 className="text-muted-foreground/30 font-sans text-[9px] font-semibold tracking-[0.3em] uppercase">Source Code</h3>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-primary border-primary/20 hover:bg-primary/5 h-7 px-3 font-sans text-[9px] font-semibold uppercase active:scale-95"
                    onClick={onApply}
                >
                    Apply Code
                </Button>
            </div>
            <div className="group/json relative">
                <textarea
                    value={localJsonStr}
                    onChange={(e) => onChange(e.target.value)}
                    className={cn(
                        'focus:ring-primary/20 min-h-[500px] w-full rounded-2xl border-none bg-slate-950 p-6 font-mono text-[10px] leading-relaxed text-blue-300/80 transition-all focus:ring-2',
                        jsonError && 'ring-destructive/50 text-destructive/80 ring-2',
                    )}
                    spellCheck={false}
                />
                <div className="text-muted-foreground/20 pointer-events-none absolute top-4 right-4 font-sans text-[8px] font-medium uppercase">
                    JSON
                </div>
            </div>
            {jsonError && (
                <div className="animate-in slide-in-from-bottom-2 bg-destructive/10 border-destructive/20 flex items-start gap-3 rounded-2xl border p-4 duration-300">
                    <AlertCircle size={14} className="text-destructive mt-0.5 shrink-0" />
                    <div className="space-y-1">
                        <p className="text-destructive font-sans text-[10px] font-semibold uppercase">Syntax Error</p>
                        <p className="text-destructive/70 font-mono text-[9px] leading-relaxed font-medium">{jsonError}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
