import React, { FormEventHandler } from 'react';
import { AtSign, Calendar, Camera, Loader2, Mail, Save, Verified } from 'lucide-react';
import { Button } from '@/components/ui/buttons/Button';
import { UserAvatar as Avatar } from '@/components/profile/UserAvatar';
import { cn } from '@/lib/utils';
import { ProfileTabId, UserProfile } from '../../types/profile.types';

interface ProfileHeaderProps {
    user: UserProfile;
    joinedDate: string;
    isPrivileged: boolean;
    previewUrl: string | null;
    isUploadingPhoto: boolean;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    activeStats: Array<{ label: string; value: number; icon: any }>;
    activeTab: ProfileTabId;
    submitProfile: FormEventHandler;
    submitPassword: FormEventHandler;
    isProcessing: boolean;
}

export function ProfileHeader({
    user,
    joinedDate,
    isPrivileged,
    previewUrl,
    isUploadingPhoto,
    fileInputRef,
    handlePhotoChange,
    activeStats,
    activeTab,
    submitProfile,
    submitPassword,
    isProcessing,
}: ProfileHeaderProps) {
    return (
        <div className="w-full px-6 pt-10 pb-0">
            {/* User info row */}
            <div className="mb-8 flex items-start justify-between gap-6">
                <div className="flex items-center gap-5">
                    {/* Avatar with Direct Upload */}
                    <div className="group relative shrink-0">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoChange}
                            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                            className="hidden"
                            disabled={isUploadingPhoto}
                        />
                        <div
                            onClick={() => !isUploadingPhoto && fileInputRef.current?.click()}
                            className={cn(
                                'dark:border-surface-border relative h-16 w-16 overflow-hidden rounded-full border border-gray-200 shadow-sm',
                                isUploadingPhoto ? 'cursor-wait opacity-80' : 'cursor-pointer',
                            )}
                        >
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                            ) : (
                                <Avatar user={user} size="xl" className="h-full w-full object-cover" />
                            )}

                            {isUploadingPhoto ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                                    <Loader2 size={20} className="animate-spin" />
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
                                    <Camera size={18} />
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => !isUploadingPhoto && fileInputRef.current?.click()}
                            disabled={isUploadingPhoto}
                            className="bg-primary hover:bg-primary/90 absolute -right-1 -bottom-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-white shadow-sm transition-colors disabled:opacity-50"
                            title="Ubah Foto Profil Langsung"
                        >
                            {isUploadingPhoto ? <Loader2 size={11} className="animate-spin" /> : <Camera size={12} />}
                        </button>
                    </div>

                    {/* Name & meta */}
                    <div>
                        <div className="mb-1 flex items-center gap-3">
                            <h1 className="text-text-main text-xl font-semibold">{user.name}</h1>
                            {isPrivileged && <Verified size={16} className="text-primary" />}
                            <span className="bg-surface-muted text-text-soft border-surface-border rounded border px-2 py-0.5 text-xs">
                                {user.role || 'Anggota'}
                            </span>
                        </div>
                        <div className="text-text-soft flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                            <span className="flex items-center gap-1.5">
                                <AtSign size={13} /> {user.username}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Mail size={13} /> {user.email}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Calendar size={13} /> Bergabung {joinedDate}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2">
                    <Button
                        variant="primary"
                        size="sm"
                        className="h-9 rounded-lg px-4 text-sm"
                        onClick={activeTab === 'general' ? submitProfile : activeTab === 'security' ? submitPassword : undefined}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <Loader2 size={14} className="mr-1.5 animate-spin" />
                        ) : (
                            <Save size={14} className="mr-1.5" />
                        )}
                        Simpan
                    </Button>
                </div>
            </div>

            {/* Stats */}
            {activeStats.length > 0 && (
                <div className="mb-6 flex items-center gap-6">
                    {activeStats.map((stat, i) => (
                        <div key={i} className="text-text-soft flex items-center gap-2 text-sm">
                            <stat.icon size={14} className="text-primary" />
                            <span className="text-text-main font-medium">{stat.value}</span>
                            <span>{stat.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
