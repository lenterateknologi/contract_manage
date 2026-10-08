import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { LoginFormState } from '../types/auth.types';

export function useLoginForm() {
    const { data, setData, post, processing, errors, reset, wasSuccessful } = useForm<LoginFormState>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
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
