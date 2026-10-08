import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { RegisterFormState } from '../types/auth.types';

export function useRegisterForm() {
    const { data, setData, post, processing, errors, reset, wasSuccessful } = useForm<RegisterFormState>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
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
