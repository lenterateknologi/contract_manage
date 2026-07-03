import { cn } from '@/lib/utils';
import { Image as ImageIcon } from 'lucide-react';
import React from 'react';
import { PlaceholderZone } from '../layouts/PlaceholderZone';

interface VisualFieldProps {
    field: any;
    previewData?: any;
}

export const ImageField: React.FC<VisualFieldProps> = ({ field }) => {
    const hasSource = !!(field.options?.logo_url || field.options?.url);
    const rawWidth = field.options?.width ?? field.width ?? 120;
    const widthStyle = rawWidth !== '' && !isNaN(Number(rawWidth)) ? `${rawWidth}px` : rawWidth || '120px';

    const rawHeight = field.options?.height ?? field.height;
    const heightStyle = rawHeight !== undefined && rawHeight !== ''
        ? (!isNaN(Number(rawHeight)) ? `${rawHeight}px` : rawHeight)
        : undefined;

    if (!hasSource) {
        return (
            <div
                className={cn(
                    'flex',
                    field.options?.alignment === 'center' ? 'justify-center' : field.options?.alignment === 'right' ? 'justify-end' : 'justify-start',
                )}
                style={{
                    width: '100%',
                    height: heightStyle || 'auto',
                }}
            >
                <PlaceholderZone
                    icon={ImageIcon}
                    label={field.label || 'Logo / Gambar'}
                    description="Upload gambar dari menu properti"
                    className="min-h-0 py-4 px-2 flex items-center justify-center flex-col h-full"
                    style={{
                        width: widthStyle,
                        height: heightStyle || '80px',
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
        >
            <img
                src={field.options?.logo_url || field.options?.url || '/storage/app/public/fr_logo.png'}
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
