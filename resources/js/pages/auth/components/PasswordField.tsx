import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { FormInput } from '@/components/ui/inputs/FormInput';

interface PasswordFieldProps {
    id?: string;
    name?: string;
    label?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    error?: string;
    required?: boolean;
    autoComplete?: string;
    className?: string;
}

export function PasswordField({
    id = 'password',
    name = 'password',
    label = 'Kata Sandi',
    value,
    onChange,
    placeholder = 'Kata sandi Anda',
    error,
    required = true,
    autoComplete = 'current-password',
    className = 'rounded-xl',
}: PasswordFieldProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <FormInput
            id={id}
            name={name}
            label={label}
            type={showPassword ? 'text' : 'password'}
            required={required}
            autoComplete={autoComplete}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            error={error}
            className={className}
            rightAction={
                <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
            }
        />
    );
}
