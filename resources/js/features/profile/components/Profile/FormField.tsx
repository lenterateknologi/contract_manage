import React from 'react';
import { Label } from '@/components/ui/forms/Label';
import { Input } from '@/components/ui/inputs/Input';
import InputError from '@/components/ui/forms/InputError';
import { cn } from '@/lib/utils';

export function FormField({
    label,
    value,
    onChange,
    error,
    type = 'text',
    readOnly = false,
}: {
    label: string;
    value?: string | null;
    onChange?: (v: string) => void;
    error?: string;
    type?: string;
    readOnly?: boolean;
}) {
    return (
        <div className="space-y-1.5">
            <Label className="text-text-desc block text-xs font-medium">{label}</Label>
            <Input
                type={type}
                value={value ?? ''}
                readOnly={readOnly}
                onChange={(e) => onChange?.(e.target.value)}
                className={cn(
                    'border-surface-border h-9 rounded-lg text-sm transition-colors',
                    'focus:border-primary focus:ring-0',
                    readOnly && 'bg-surface-muted/30 cursor-not-allowed opacity-60',
                )}
            />
            {error && <InputError message={error} />}
        </div>
    );
}
