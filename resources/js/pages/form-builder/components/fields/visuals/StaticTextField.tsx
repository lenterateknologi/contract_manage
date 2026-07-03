import React from 'react';
import { getTypographyStyle } from '../../utils';

interface VisualFieldProps {
    field: any;
    previewData?: any;
}

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
                display: 'flex',
                flexDirection: 'column',
                justifyContent: field.options?.valign === 'bottom' ? 'flex-end' : field.options?.valign === 'middle' ? 'center' : 'flex-start',
                whiteSpace: 'pre-wrap',
                lineHeight: field.options?.line_height || '1.1',
                letterSpacing: field.options?.letter_spacing || 'normal',
                backgroundColor: field.options?.background_color || undefined,
                borderStyle: (field.options?.border_style as any) || undefined,
                borderWidth: field.options?.border_width !== undefined ? `${field.options.border_width}px` : undefined,
                borderColor: field.options?.border_color || undefined,
                margin: 0,
                padding: 0,
                minHeight: '100%',
                ...getTypographyStyle(field),
            }}
        >
            {prefix && <span className="mr-2 font-semibold uppercase">{prefix}</span>}
            {(replacedText || '').trim()}
        </div>
    );
};
