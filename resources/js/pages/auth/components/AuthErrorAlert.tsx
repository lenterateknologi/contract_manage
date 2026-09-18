import { AlertCircle } from 'lucide-react';

interface AuthErrorAlertProps {
    errors: Record<string, string | undefined>;
    title?: string;
}

export function AuthErrorAlert({ errors, title = 'Gagal Masuk' }: AuthErrorAlertProps) {
    const errorKeys = Object.keys(errors).filter((k) => !!errors[k]);
    if (errorKeys.length === 0) return null;

    const firstError = errors.email || errors.password || errors[errorKeys[0]];

    return (
        <div className="animate-in fade-in slide-in-from-top-2 rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/40 p-4 duration-300">
            <div className="flex gap-3">
                <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                    <AlertCircle size={13} className="shrink-0" />
                </div>
                <div>
                    <h3 className="mb-1 text-xs leading-none font-bold text-rose-900 dark:text-rose-200">{title}</h3>
                    <div className="text-[11px] font-medium text-rose-700/90 dark:text-rose-300/90">
                        {firstError}
                    </div>
                </div>
            </div>
        </div>
    );
}
