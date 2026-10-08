import { useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo, useRef, useState } from 'react';
import { useToast } from '@/components/ui/feedback/Toast';
import { Clock, FileText, Zap } from 'lucide-react';
import { PasswordFormData, ProfileFormData, ProfileTabId, UserProfile } from '../types/profile.types';
import { profileService } from '../services/profileService';

export function useProfileForm(user: UserProfile) {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<ProfileTabId>('general');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const joinedDate = useMemo(() => {
        if (!user.created_at) return '—';
        try {
            const date = new Date(user.created_at);
            if (isNaN(date.getTime())) return user.created_at;
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
        } catch {
            return user.created_at;
        }
    }, [user.created_at]);

    const profileForm = useForm<ProfileFormData>({
        name: user.name || '',
        email: user.email || '',
        username: user.username || '',
        phone: user.phone || '',
        position: user.position || '',
        company: user.company || '',
        location: user.location || '',
        group: user.group || '',
        region: user.region || '',
        bio: user.bio || '',
    });

    const passwordForm = useForm<PasswordFormData>({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setIsUploadingPhoto(true);

        profileService.updatePhoto(file, profileForm.data, {
            onSuccess: () => {
                showToast('Foto profil berhasil diperbarui', 'success');
                setTimeout(() => setPreviewUrl(null), 1000);
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0] as string;
                showToast(firstError || 'Gagal mengunggah foto profil', 'danger');
                setPreviewUrl(null);
            },
            onFinish: () => {
                setIsUploadingPhoto(false);
            },
        });
    };

    const submitProfile: FormEventHandler = (e) => {
        e.preventDefault();
        profileForm.post(route('profile.update'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                showToast('Profil berhasil disimpan', 'success');
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0] as string;
                showToast(firstError || 'Gagal menyimpan profil', 'danger');
            },
        });
    };

    const submitPassword: FormEventHandler = (e) => {
        e.preventDefault();
        passwordForm.put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                showToast('Password berhasil diubah', 'success');
                passwordForm.reset();
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0] as string;
                showToast(firstError || 'Gagal mengubah password', 'danger');
            },
        });
    };

    const isPrivileged = user?.role === 'Admin' || user?.role === 'Super Admin' || !!user?.is_admin;

    const activeStats = useMemo(
        () =>
            [
                { label: 'Kontrak Dibuat', value: user?.stats?.total_created ?? 0, icon: FileText },
                { label: 'Menunggu Persetujuan', value: user?.stats?.pending_approvals ?? 0, icon: Clock },
                { label: 'Tugas Aktif', value: user?.stats?.assigned_active ?? 0, icon: Zap },
            ].filter((s) => s.value > 0),
        [user],
    );

    return {
        activeTab,
        setActiveTab,
        previewUrl,
        isUploadingPhoto,
        fileInputRef,
        handlePhotoChange,
        profileForm,
        passwordForm,
        submitProfile,
        submitPassword,
        isPrivileged,
        joinedDate,
        activeStats,
    };
}
