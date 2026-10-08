import React from 'react';
import DeleteUser from '@/components/profile/DeleteUser';
import SettingsLayout from '@/layouts/settings/layout';
import { ProfileHeader } from './ProfileHeader';
import { ProfileTabs } from './ProfileTabs';
import { GeneralTab } from './GeneralTab';
import { SecurityTab } from './SecurityTab';
import { ActivityTab } from './ActivityTab';
import { AppearanceTab } from './AppearanceTab';
import { RecentContract, UserProfile } from '../../types/profile.types';
import { useProfileForm } from '../../hooks/useProfileForm';

interface ProfileViewProps {
    user: UserProfile;
    department?: string;
    recentContracts?: RecentContract[];
}

export function ProfileView({ user, department, recentContracts = [] }: ProfileViewProps) {
    const {
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
    } = useProfileForm(user);

    return (
        <SettingsLayout>
            <div className="dark:bg-background min-h-full w-full bg-white pb-20 md:-m-[9px] md:w-[calc(100%+18px)]">
                {/* Header with user info & direct avatar upload */}
                <div className="dark:bg-surface-base border-surface-border border-b bg-white">
                    <ProfileHeader
                        user={user}
                        joinedDate={joinedDate}
                        isPrivileged={isPrivileged}
                        previewUrl={previewUrl}
                        isUploadingPhoto={isUploadingPhoto}
                        fileInputRef={fileInputRef}
                        handlePhotoChange={handlePhotoChange}
                        activeStats={activeStats}
                        activeTab={activeTab}
                        submitProfile={submitProfile}
                        submitPassword={submitPassword}
                        isProcessing={profileForm.processing || passwordForm.processing}
                    />

                    {/* Tabs navigation */}
                    <div className="w-full px-6">
                        <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />
                    </div>
                </div>

                {/* Content based on selected tab */}
                <div className="w-full px-6 py-10">
                    {activeTab === 'general' && (
                        <GeneralTab
                            user={user}
                            department={department}
                            profileData={profileForm.data}
                            errors={profileForm.errors as Record<string, string>}
                            onFieldChange={(field, value) => profileForm.setData(field, value)}
                        />
                    )}

                    {activeTab === 'security' && (
                        <SecurityTab
                            passwordData={passwordForm.data}
                            errors={passwordForm.errors as Record<string, string>}
                            onFieldChange={(field, value) => passwordForm.setData(field as any, value)}
                            onSubmit={submitPassword}
                            isProcessing={passwordForm.processing}
                        />
                    )}

                    {activeTab === 'activity' && <ActivityTab recentContracts={recentContracts} />}

                    {activeTab === 'appearance' && <AppearanceTab />}
                </div>

                {/* Footer */}
                <div className="border-surface-border/40 border-t px-6 py-6">
                    <div className="flex w-full items-center justify-between">
                        <p className="text-text-soft text-xs">Sistem Manajemen Kontrak · {new Date().getFullYear()}</p>
                        <DeleteUser className="text-danger hover:bg-danger/5 rounded-lg px-3 py-1.5 text-xs transition-colors" />
                    </div>
                </div>
            </div>
        </SettingsLayout>
    );
}
