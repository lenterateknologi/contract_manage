import { cn } from '@/lib/utils';
import { Scissors } from 'lucide-react';
import React from 'react';
import { getTypographyStyle } from '../utils';

interface VisualFieldProps {
    field: any;
    previewData?: any;
}

export const ImageField: React.FC<VisualFieldProps> = ({ field }) => {
    return (
        <div
            className={cn(
                'flex h-full w-full',
                field.options?.alignment === 'center' ? 'justify-center' : field.options?.alignment === 'right' ? 'justify-end' : 'justify-start',
                field.options?.v_alignment === 'middle' ? 'items-center' : field.options?.v_alignment === 'bottom' ? 'items-end' : 'items-start',
            )}
        >
            <img
                src={field.options?.logo_url || field.options?.url || '/storage/app/public/fr_logo.png'}
                width={field.options?.width || field.options?.size || field.options?.logo_size || 120}
                height={field.options?.height || undefined}
                style={{
                    width: field.options?.width ? `${field.options.width}px` : field.options?.size ? `${field.options.size}px` : field.options?.logo_size ? `${field.options.logo_size}px` : '120px',
                    height: field.options?.height ? `${field.options.height}px` : 'auto',
                }}
                alt="document logo"
            />
        </div>
    );
};

export const StaticTextField: React.FC<VisualFieldProps> = ({ field, previewData }) => {
    const replacedText = (field.label || '').replace(/\{\{(.*?)\}\}/g, (match: string, key: string) => {
        const trimmedKey = key.trim();
        const val = previewData?.[trimmedKey];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
            return String(val);
        }
        return '..........';
    });

    const showLegalPrefix = field.options?.list_type === 'legal' || (field.options?.list_type === 'number' && field.options?.number_format);
    const prefixMatch = field.options?.number_format?.match(/\{(.*?)\}/);
    const prefix = showLegalPrefix ? field.options.number_format.replace(prefixMatch ? prefixMatch[0] : '{n}', '') : '';

    return (
        <div
            className="w-full"
            style={{
                color: field.options?.color || 'var(--foreground)',
                whiteSpace: 'pre-wrap',
                lineHeight: field.options?.line_height || '1.1', // Tightened from 1.2
                letterSpacing: field.options?.letter_spacing || 'normal',
                backgroundColor: field.options?.background_color || undefined,
                borderStyle: (field.options?.border_style as any) || undefined,
                borderWidth: field.options?.border_width !== undefined ? `${field.options.border_width}px` : undefined,
                borderColor: field.options?.border_color || undefined,
                margin: 0, // Ensure no browser default margins
                padding: 0,
                ...getTypographyStyle(field),
            }}
        >
            {prefix && <span className="mr-2 font-bold tracking-widest uppercase">{prefix}</span>}
            {(replacedText || '').trim()}
        </div>
    );
};

export const SignatureBoxField: React.FC<{ field: any; value: any }> = ({ field, value }) => {
    return (
        <div className="flex w-full max-w-[180px] flex-col gap-1 py-2">
            <div className="border-border bg-card ring-border/20 overflow-hidden rounded-lg border shadow-sm ring-1">
                <div className="bg-muted/50 border-border border-b px-3 py-1.5 text-center">
                    <span
                        className="text-foreground/60 shrink-0 text-[10px] font-black tracking-widest uppercase"
                        style={getTypographyStyle(field, 0.7, true)}
                    >
                        {field.label || 'Tanda Tangan'}
                    </span>
                </div>
                <div className="flex h-24 flex-col items-center justify-end p-3 text-center">
                    {value ? (
                        <div className="text-foreground mb-2 text-[12px] font-black tracking-tight uppercase" style={getTypographyStyle(field)}>
                            [{value}]
                        </div>
                    ) : (
                        <div className="border-border/30 mb-2 h-4 w-full border-b-2" />
                    )}
                </div>
                <div className="border-border bg-muted/20 text-muted-foreground flex justify-between border-t px-3 py-2 text-start text-[8px] font-bold tracking-widest uppercase">
                    <span>TGL:</span>
                    <span>................</span>
                </div>
            </div>
        </div>
    );
};

export const PageBreakField: React.FC<{ isBuilder?: boolean }> = ({ isBuilder }) => {
    return (
        <div className={cn(
            "w-full my-4 print:my-0",
            isBuilder ? "relative py-4" : "h-0 overflow-hidden"
        )}>
            {isBuilder && (
                <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                    <div className="flex-1 border-t-2 border-dashed border-indigo-300" />
                    <div className="bg-indigo-600 text-white text-[9px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                        <Scissors size={10} />
                        Halaman Baru Mulai Di Sini
                    </div>
                    <div className="flex-1 border-t-2 border-dashed border-indigo-300" />
                </div>
            )}
            {!isBuilder && (
                <div style={{ pageBreakAfter: 'always', breakAfter: 'page' }} />
            )}
        </div>
    );
};
