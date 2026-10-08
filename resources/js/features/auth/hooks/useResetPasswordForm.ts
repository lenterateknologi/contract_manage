import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { ResetPasswordFormState } from '../types/auth.types';

export function useResetPasswordForm(token: string, email: string) {
    const { data, setData, post, processing, errors, reset, wasSuccessful } = useForm<ResetPasswordFormState>({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return {
        data,
        setData,
        errors,
        processing,
        wasSuccessful,
        submit,
    };
}
