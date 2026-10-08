import React, { FormEventHandler } from 'react';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/buttons/Button';
import { Section } from './Section';
import { FormField } from './FormField';
import { PasswordFormData } from '../../types/profile.types';

interface SecurityTabProps {
    passwordData: PasswordFormData;
    errors: Record<string, string>;
    onFieldChange: (field: keyof PasswordFormData, value: string) => void;
    onSubmit: FormEventHandler;
    isProcessing: boolean;
}

export function SecurityTab({
    passwordData,
    errors,
    onFieldChange,
    onSubmit,
    isProcessing,
}: SecurityTabProps) {
    return (
        <div className="max-w-md">
            <Section title="Ubah Password" icon={Shield}>
                <form onSubmit={onSubmit} className="space-y-5">
                    <FormField
                        label="Password Saat Ini"
                        type="password"
                        value={passwordData.current_password}
                        onChange={(v) => onFieldChange('current_password', v)}
                        error={errors.current_password}
                    />
                    <div className="border-surface-border border-t" />
                    <FormField
                        label="Password Baru"
                        type="password"
                        value={passwordData.password}
                        onChange={(v) => onFieldChange('password', v)}
                        error={errors.password}
                    />
                    <FormField
                        label="Konfirmasi Password Baru"
                        type="password"
                        value={passwordData.password_confirmation}
                        onChange={(v) => onFieldChange('password_confirmation', v)}
                        error={errors.password_confirmation}
                    />
                    <Button disabled={isProcessing} variant="primary" className="h-9 rounded-lg px-5 text-sm">
                        {isProcessing ? 'Menyimpan...' : 'Simpan Password'}
                    </Button>
                </form>
            </Section>
        </div>
    );
}
