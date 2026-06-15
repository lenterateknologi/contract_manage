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
    const width = field.options?.width || field.options?.size || field.options?.logo_size || 120;
    const widthStyle = typeof width === 'number' ? `${width}px` : width;

    const heightStyle =
        field.options?.height !== undefined && field.options?.height !== ''
            ? typeof field.options.height === 'number' || !isNaN(Number(field.options.height))
                ? `${field.options.height}px`
                : field.options.height
            : undefined;

    if (!hasSource) {
        return (
            <div
                className={cn(
                    'flex w-full',
                    field.options?.alignment === 'center' ? 'justify-center' : field.options?.alignment === 'right' ? 'justify-end' : 'justify-start',
                )}
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
