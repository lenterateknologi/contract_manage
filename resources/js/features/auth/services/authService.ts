import { router } from '@inertiajs/react';

export const authService = {
    logout() {
        router.post(route('logout'));
    },
};
