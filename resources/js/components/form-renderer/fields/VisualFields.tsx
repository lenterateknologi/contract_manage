import { cn } from '@/lib/utils';
import { Scissors, Image as ImageIcon } from 'lucide-react';
import React from 'react';
import { getTypographyStyle, getPaddingStyle, getMarginStyle } from '../utils';
import { PlaceholderZone } from './LayoutFields';

interface VisualFieldProps {
    field: any;
    previewData?: any;
}

export const ImageField: React.FC<VisualFieldProps> = ({ field }) => {
    const hasSource = !!(field.options?.logo_url || field.options?.url);
    const paddingStyle = getPaddingStyle(field);
    const marginStyle = getMarginStyle(field);
    const width = field.options?.width || field.options?.size || field.options?.logo_size || 120;
    const widthStyle = typeof width === 'number' ? `${width}px` : width;

    const heightStyle = field.options?.height !== undefined && field.options?.height !== ''
        ? (typeof field.options.height === 'number' || !isNaN(Number(field.options.height)) ? `${field.options.height}px` : field.options.height)
        : undefined;

    if (!hasSource) {
        return (
            <div
                className={cn(
                    'flex w-full',
                    field.options?.alignment === 'center' ? 'justify-center' : field.options?.alignment === 'right' ? 'justify-end' : 'justify-start',
                )}
                style={{ ...paddingStyle, ...marginStyle }}
            >
                <PlaceholderZone
                    icon={ImageIcon}
                    label={field.label || 'Logo / Gambar'}
                    description="Pilih elemen ini untuk mengatur URL gambar"
                    style={{
                        width: widthStyle,
                        height: heightStyle || '100px',
                        aspectRatio: field.options?.aspect_ratio && field.options?.aspect_ratio !== 'auto' ? field.options?.aspect_ratio : undefined,
                    }}
                />
            </div>
        );
    }

    return (
        <div
            className={cn(
                'flex h-full w-full',
                field.options?.alignment === 'center' ? 'justify-center' : field.options?.alignment === 'right' ? 'justify-end' : 'justify-start',
                field.options?.v_alignment === 'middle' ? 'items-center' : field.options?.v_alignment === 'bottom' ? 'items-end' : 'items-start',
            )}
            style={{ ...paddingStyle, ...marginStyle }}
        >
            <img
                src={field.options?.logo_url || field.options?.url || '/storage/app/public/fr_logo.png'}
                width={width}
                height={field.options?.height || undefined}
                style={{
                    width: widthStyle,
                    height: heightStyle || 'auto',
                    aspectRatio: field.options?.aspect_ratio && field.options?.aspect_ratio !== 'auto' ? field.options?.aspect_ratio : undefined,
                    objectFit: (field.options?.object_fit as any) || 'contain',
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
            {prefix && <span className="mr-2 font-semibold uppercase">{prefix}</span>}
            {(replacedText || '').trim()}
        </div>
    );
};

export const SignatureBoxField: React.FC<{ field: any; value: any }> = ({ field, value }) => {
    return (
        <div className="flex w-full max-w-[180px] flex-col gap-1 py-2">
            <div className="border-border bg-card ring-border/20 overflow-hidden rounded-lg border shadow-sm ring-1">
                <div className="bg-muted/50 border-border border-b px-3 py-1.5 text-center">
                    <span className="text-foreground/60 shrink-0 text-[10px] font-semibold" style={getTypographyStyle(field, 0.7, true)}>
                        {field.label || 'Tanda Tangan'}
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

export const PageBreakField: React.FC<{ isBuilder?: boolean }> = ({ isBuilder }) => {
    return (
        <div className={cn('my-4 w-full print:my-0', isBuilder ? 'relative py-4' : 'h-0 overflow-hidden')}>
            {isBuilder && (
                <div className="flex items-center gap-3 opacity-60 transition-opacity hover:opacity-100">
                    <div className="flex-1 border-t-2 border-dashed border-indigo-300" />
                    <div className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1 text-[9px] font-semibold text-white uppercase shadow-sm">
                        <Scissors size={10} />
                        Halaman Baru Mulai Di Sini
                    </div>
                    <div className="flex-1 border-t-2 border-dashed border-indigo-300" />
                </div>
            )}
            {!isBuilder && <div style={{ pageBreakAfter: 'always', breakAfter: 'page' }} />}
        </div>
    );
};
