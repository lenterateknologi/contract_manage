import { Head } from '@inertiajs/react';
import React from 'react';
import { DivisionReportsView } from '../components/Divisions/DivisionReportsView';

export default function DivisionReportsPage() {
    return (
        <>
            <Head title="Laporan Rekapitulasi Pengajuan per Organization Group" />
            <DivisionReportsView />
        </>
    );
}
