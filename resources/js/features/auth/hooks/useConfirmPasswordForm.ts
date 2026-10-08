import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { ConfirmPasswordFormState } from '../types/auth.types';

export function useConfirmPasswordForm() {
    const { data, setData, post, processing, errors, reset } = useForm<ConfirmPasswordFormState>({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return {
        data,
        setData,
        errors,
        processing,
        submit,
    };
}
