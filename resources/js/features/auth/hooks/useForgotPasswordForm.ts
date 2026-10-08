import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';
import { ForgotPasswordFormState } from '../types/auth.types';

const COOLDOWN_KEY = 'forgot_password_cooldown_until';
const COOLDOWN_SECONDS = 120;

function getRemainingCooldown(): number {
    if (typeof window === 'undefined') return 0;
    const stored = localStorage.getItem(COOLDOWN_KEY);
    if (!stored) return 0;

    const expiry = parseInt(stored, 10);
    const diff = Math.ceil((expiry - Date.now()) / 1000);
    if (diff > 0) {
        return diff;
    }
    localStorage.removeItem(COOLDOWN_KEY);
    return 0;
}

export function useForgotPasswordForm(status?: string) {
    const [countdown, setCountdown] = useState<number>(0);

    const { data, setData, post, processing, errors } = useForm<ForgotPasswordFormState>({
        email: '',
    });

    // Check existing cooldown on mount
    useEffect(() => {
        const remaining = getRemainingCooldown();
        if (remaining > 0) {
            setCountdown(remaining);
        }
    }, []);

    // Set cooldown when status arrives (email sent successfully)
    useEffect(() => {
        if (status) {
            const current = getRemainingCooldown();
            if (current === 0) {
                const target = Date.now() + COOLDOWN_SECONDS * 1000;
                localStorage.setItem(COOLDOWN_KEY, target.toString());
                setCountdown(COOLDOWN_SECONDS);
            }
        }
    }, [status]);

    // Interval ticker for countdown
    useEffect(() => {
        if (countdown <= 0) return;

        const timer = setInterval(() => {
            const remaining = getRemainingCooldown();
            setCountdown(remaining);
            if (remaining <= 0) {
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [countdown]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (countdown > 0) return;

        post(route('password.email'), {
            onSuccess: () => {
                const target = Date.now() + COOLDOWN_SECONDS * 1000;
                localStorage.setItem(COOLDOWN_KEY, target.toString());
                setCountdown(COOLDOWN_SECONDS);
            },
        });
    };

    return {
        data,
        setData,
        errors,
        processing,
        countdown,
        submit,
    };
}
