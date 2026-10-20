import React, { FormEventHandler, useMemo } from 'react';
import { Check, Shield, X } from 'lucide-react';
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
    const password = passwordData.password || '';
    const confirmation = passwordData.password_confirmation || '';
    const currentPassword = passwordData.current_password || '';

    // Requirement checklist validation on-type
    const checks = useMemo(() => {
        return {
            minLength: password.length >= 8,
            hasLetter: /[a-zA-Z]/.test(password),
            hasNumber: /[0-9]/.test(password),
        };
    }, [password]);

    const isMatch = confirmation.length > 0 && password === confirmation;
    const isMismatch = confirmation.length > 0 && password !== confirmation;

    // All conditions must be met to enable the button:
    // 1. Current password is not empty
    // 2. All password complexity checks pass (>= 8 chars, letter, number)
    // 3. New password matches confirmation
    const isValid =
        currentPassword.trim().length > 0 &&
        checks.minLength &&
        checks.hasLetter &&
        checks.hasNumber &&
        isMatch;

    return (
        <div className="max-w-xl">
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

                    <div className="space-y-2">
                        <FormField
                            label="Password Baru"
                            type="password"
                            value={passwordData.password}
                            onChange={(v) => onFieldChange('password', v)}
                            error={errors.password}
                        />

                        {/* Inline real-time validation feedback */}
                        <div className="rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                            <p className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">
                                Persyaratan Password:
                            </p>
                            <div className="mt-2 flex flex-col space-y-1.5">
                                <div
                                    className={`flex items-center gap-2 text-[11.5px] transition-colors ${
                                        checks.minLength
                                            ? 'font-medium text-emerald-600 dark:text-emerald-400'
                                            : 'text-slate-500 dark:text-zinc-400'
                                    }`}
                                >
                                    {checks.minLength ? (
                                        <Check className="size-3.5 shrink-0 stroke-[2.5]" />
                                    ) : (
                                        <span className="mx-1 size-1.5 shrink-0 rounded-full bg-slate-300 dark:bg-zinc-600" />
                                    )}
                                    <span>Minimal 8 karakter</span>
                                </div>

                                <div
                                    className={`flex items-center gap-2 text-[11.5px] transition-colors ${
                                        checks.hasLetter
                                            ? 'font-medium text-emerald-600 dark:text-emerald-400'
                                            : 'text-slate-500 dark:text-zinc-400'
                                    }`}
                                >
                                    {checks.hasLetter ? (
                                        <Check className="size-3.5 shrink-0 stroke-[2.5]" />
                                    ) : (
                                        <span className="mx-1 size-1.5 shrink-0 rounded-full bg-slate-300 dark:bg-zinc-600" />
                                    )}
                                    <span>Mengandung huruf</span>
                                </div>

                                <div
                                    className={`flex items-center gap-2 text-[11.5px] transition-colors ${
                                        checks.hasNumber
                                            ? 'font-medium text-emerald-600 dark:text-emerald-400'
                                            : 'text-slate-500 dark:text-zinc-400'
                                    }`}
                                >
                                    {checks.hasNumber ? (
                                        <Check className="size-3.5 shrink-0 stroke-[2.5]" />
                                    ) : (
                                        <span className="mx-1 size-1.5 shrink-0 rounded-full bg-slate-300 dark:bg-zinc-600" />
                                    )}
                                    <span>Mengandung angka</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <FormField
                            label="Konfirmasi Password Baru"
                            type="password"
                            value={passwordData.password_confirmation}
                            onChange={(v) => onFieldChange('password_confirmation', v)}
                            error={errors.password_confirmation}
                        />

                        {confirmation.length > 0 && (
                            <div className="flex items-center gap-1.5 px-0.5 text-[11.5px]">
                                {isMatch ? (
                                    <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                                        <Check className="size-3.5 stroke-[2.5]" /> Password cocok
                                    </span>
                                ) : isMismatch ? (
                                    <span className="flex items-center gap-1 font-medium text-rose-500 dark:text-rose-400">
                                        <X className="size-3.5 stroke-[2.5]" /> Password belum cocok
                                    </span>
                                ) : null}
                            </div>
                        )}
                    </div>

                    <div className="pt-1">
                        <Button
                            type="submit"
                            disabled={isProcessing || !isValid}
                            variant="primary"
                            className="h-9 rounded-lg px-5 text-sm"
                        >
                            {isProcessing ? 'Menyimpan...' : 'Simpan Password'}
                        </Button>
                    </div>
                </form>
            </Section>
        </div>
    );
}
