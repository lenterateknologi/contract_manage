import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import { ProfileView } from '../components/Profile/ProfileView';
import { ProfilePageProps, UserProfile } from '../types/profile.types';

export default function Profile({ department, recentContracts = [], user: propUser }: ProfilePageProps) {
    const { auth } = usePage<any>().props;
    const user = (propUser || auth.user) as UserProfile;

    return (
        <>
            <Head title="Profil" />
            <ProfileView user={user} department={department} recentContracts={recentContracts} />
        </>
    );
}
