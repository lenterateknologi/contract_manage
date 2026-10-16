import React, { useState } from 'react';
import { AtSign, Calendar, Camera, ImageIcon, Loader2, Mail, Upload, Verified } from 'lucide-react';
import { UserAvatar as Avatar } from '@/components/profile/UserAvatar';
import { cn } from '@/lib/utils';
import { UserProfile } from '../../types/profile.types';
import { CameraCaptureModal } from './CameraCaptureModal';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/selection/DropdownMenu';

interface ProfileHeaderProps {
    user: UserProfile;
    joinedDate: string;
    isPrivileged: boolean;
    previewUrl: string | null;
    isUploadingPhoto: boolean;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onCameraCapture: (file: File) => void;
    activeStats: Array<{ label: string; value: number; icon: any }>;
}

export function ProfileHeader({
    user,
    joinedDate,
    isPrivileged,
    previewUrl,
    isUploadingPhoto,
    fileInputRef,
    handlePhotoChange,
    onCameraCapture,
    activeStats,
}: ProfileHeaderProps) {
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

    return (
        <div className="w-full px-6 pt-10 pb-0">
            {/* Camera Capture Modal */}
            <CameraCaptureModal
                open={isCameraModalOpen}
                onOpenChange={setIsCameraModalOpen}
                onCapture={onCameraCapture}
            />

            {/* User info row */}
            <div className="mb-8 flex items-start justify-between gap-6">
                <div className="flex items-center gap-5">
                    {/* Avatar with Direct Upload & Camera Option */}
                    <div className="group relative shrink-0">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoChange}
                            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                            className="hidden"
                            disabled={isUploadingPhoto}
                        />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    disabled={isUploadingPhoto}
                                    className={cn(
                                        'dark:border-surface-border relative h-16 w-16 overflow-hidden rounded-full border border-gray-200 shadow-sm focus:outline-none',
                                        isUploadingPhoto ? 'cursor-wait opacity-80' : 'cursor-pointer',
                                    )}
                                    title="Ubah Foto Profil"
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
                                </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="start" className="w-48 rounded-xl p-1 shadow-lg">
                                <DropdownMenuItem
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs"
                                >
                                    <Upload size={14} className="text-primary" />
                                    <span>Unggah dari File</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setIsCameraModalOpen(true)}
                                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs"
                                >
                                    <Camera size={14} className="text-primary" />
                                    <span>Ambil Foto via Kamera</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Quick Camera Badge Trigger */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    disabled={isUploadingPhoto}
                                    className="bg-primary hover:bg-primary/90 absolute -right-1 -bottom-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-white shadow-sm transition-colors disabled:opacity-50"
                                    title="Pilihan Ubah Foto Profil"
                                >
                                    {isUploadingPhoto ? <Loader2 size={11} className="animate-spin" /> : <Camera size={12} />}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48 rounded-xl p-1 shadow-lg">
                                <DropdownMenuItem
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs"
                                >
                                    <Upload size={14} className="text-primary" />
                                    <span>Unggah dari File</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setIsCameraModalOpen(true)}
                                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs"
                                >
                                    <Camera size={14} className="text-primary" />
                                    <span>Ambil Foto via Kamera</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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
