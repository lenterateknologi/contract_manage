import { router } from '@inertiajs/react';
import { ProfileFormData } from '../types/profile.types';

export const profileService = {
    updatePhoto(
        file: File,
        profileData: Partial<ProfileFormData>,
        options?: {
            onSuccess?: () => void;
            onError?: (errors: any) => void;
            onFinish?: () => void;
        },
    ) {
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('name', profileData.name || '');
        formData.append('email', profileData.email || '');
        if (profileData.username) formData.append('username', profileData.username);
        if (profileData.phone) formData.append('phone', profileData.phone);
        if (profileData.position) formData.append('position', profileData.position);
        if (profileData.company) formData.append('company', profileData.company);
        if (profileData.location) formData.append('location', profileData.location);
        if (profileData.group) formData.append('group', profileData.group);
        if (profileData.region) formData.append('region', profileData.region);
        if (profileData.bio) formData.append('bio', profileData.bio);

        router.post(route('profile.update'), formData, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: options?.onSuccess,
            onError: options?.onError,
            onFinish: options?.onFinish,
        });
    },
};
