import { Head } from '@inertiajs/react';
import React from 'react';
import { AuditView } from '../components/Audit/AuditView';

export default function AuditPage() {
    return (
        <>
            <Head title="Jejak Audit Sistem" />
            <AuditView />
        </>
    );
}
