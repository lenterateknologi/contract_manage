import React from 'react';
import { getTypographyStyle } from '../../utils';

export const SignatureBoxField: React.FC<{ field: any; value: any }> = ({ field, value }) => {
    return (
        <div className="flex w-full max-w-[180px] flex-col gap-1 py-2">
            <div className="border-border bg-card ring-border/20 overflow-hidden rounded-lg border shadow-sm ring-1">
                <div className="bg-muted/50 border-border border-b px-3 py-1.5 text-center">
                    <span className="text-foreground/60 shrink-0 text-[10px] font-semibold" style={getTypographyStyle(field, 0.7, true)}>
                        {field.label || 'Upload Tanda Tangan'}
                    </span>
                </div>
                <div className="flex h-24 flex-col items-center justify-end p-3 text-center">
                    {value ? (
                        <div className="text-foreground mb-2 text-[12px] font-semibold tracking-tight" style={getTypographyStyle(field)}>
                            [{value}]
                        </div>
                    ) : (
                        <div className="border-border/30 mb-2 h-4 w-full border-b-2" />
                    )}
                </div>
                <div className="border-border bg-muted/20 text-muted-foreground flex justify-between border-t px-3 py-2 text-start text-[8px] font-semibold uppercase">
                    <span>TGL:</span>
                    <span>................</span>
                </div>
            </div>
        </div>
    );
};
